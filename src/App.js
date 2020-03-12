/* global Notification */
import React, { Component } from 'react'
import Stethoscope from './lib/Stethoscope'
import Device from './Device'
import Loader from './Loader'
import Footer from './Footer'
import DownloadProgress from './DownloadProgress'
import openSocket from 'socket.io-client'
import moment from 'moment'
import classNames from 'classnames'
import serializeError from 'serialize-error'
import { HOST } from './constants'
import appConfig from './config.json'
import pkg from '../package.json'
import ErrorMessage from './ErrorMessage'
import yaml from 'js-yaml'
import './App.css'
const socket = openSocket(HOST)

// CRA doesn't like importing native node modules
// have to use window.require AFAICT
const os = window.require('os')
const glob = window.require('glob')
const { readFileSync } = window.require('fs')
const path = window.require('path')
const { shell, remote, ipcRenderer } = window.require('electron')
const settings = window.require('electron-settings')
const log = remote.getGlobal('log')
const platform = os.platform()

class App extends Component {
  state = {
    device: {},
    policy: {},
    result: {},
    instructions: {},
    scanIsRunning: false,
    loading: true,
    lastScanDuration: 0,
    // determines loading screen wording
    remoteScan: false,
    // surface which app performed the most recent scan
    scannedBy: 'Stethoscope',
    lastScanTime: Date.now(),
    // whether app currently has focus
    focused: true,
    // progress object from updater process { percent, total, transferred }
    downloadProgress: null,
    // whether rescan button should be highlighted
    highlightRescan: false
  }

  componentWillUnmount = () => this.setState({ scanIsRunning: false })

  async componentDidMount () {
    // append app version to title
    document.querySelector('title').textContent += ` (v${pkg.version})`
    this.setState({ recentHang: settings.get('recentHang', 0) > 1 })
    ipcRenderer.send('scan:init')
    // perform the initial policy load & scan
    try {
      await this.loadPractices()
    } catch (e) {
      console.error('Unable to load practices')
    }
    // flag ensures the download:start event isn't sent multiple times
    this.downloadStartSent = false
    // handle context menu
    window.addEventListener('contextmenu', () => ipcRenderer.send('contextmenu'))
    // handle App update download progress
    ipcRenderer.on('download:progress', this.onDownloadProgress)
    // handles any errors that occur when updating (restores window size, etc.)
    ipcRenderer.on('download:error', this.onDownloadError)
    // trigger scan from main process
    ipcRenderer.on('autoscan:start', (args = {}) => {
      // const { notificationOnViolation = false } = args
      if (!this.state.scanIsRunning) {
        ipcRenderer.send('scan:init')
        if (Object.keys(this.state.policy).length) {
          this.handleScan()
        } else {
          this.loadPractices()
        }
      }
    })
    // the server emits this event when a remote scan begins
    socket.on('scan:init', this.onScanInit)
    // setup a socket io listener to refresh the app when a scan is performed
    socket.on('scan:complete', this.onScanComplete)
    socket.on('scan:error', this.onScanError)
    // the focus/blur handlers are used to update the last scanned time
    window.addEventListener('focus', () => this.setState({ focused: true }))
    window.addEventListener('blur', () => this.setState({ focused: false }))
    document.addEventListener('dragover', event => event.preventDefault())
    document.addEventListener('drop', event => event.preventDefault())
  }

  onDownloadProgress = (event, downloadProgress) => {
    // trigger the app resize first time through
    if (!this.downloadStartSent) {
      ipcRenderer.send('download:start')
      this.downloadStartSent = true
    }

    if (downloadProgress && downloadProgress.percent >= 99) {
      ipcRenderer.send('download:complete')
    } else {
      this.setState({ downloadProgress })
    }
  }

  onDownloadError = (event, error) => {
    ipcRenderer.send('download:complete', { resize: true })
    const msg = `Error downloading app update: ${error}`
    log.error(msg)
    this.setState({
      downloadProgress: null,
      error: msg
    }, () => {
      // reset this so downloading can start again
      this.downloadStartSent = false
    })
  }

  onScanError = ({ error }) => {
    this.errorThrown = true
    log.error('Scan error', error)
    throw new Error(error)
  }

  onScanInit = ({ remote, remoteLabel }) => {
    ipcRenderer.send('scan:init')
    this.setState({
      loading: true,
      remoteScan: remote,
      scannedBy: remote ? remoteLabel : 'Stethoscope'
    })
  }

  onScanComplete = payload => {
    const { noResults = false } = payload
    // device only scan with no policy completed
    if (noResults) {
      return this.setState({ loading: false, scannedBy: 'Stethoscope' })
    }

    const {
      errors = [],
      remote: remoteScan,
      remoteLabel,
      result,
      policy: appPolicy,
      showNotification
    } = payload

    const lastScanTime = Date.now()

    if (errors && errors.length) {
      log.error(JSON.stringify({
        level: 'error',
        message: 'Error scanning',
        policy: appPolicy
      }))

      return this.setState({
        loading: false,
        lastScanTime,
        errors: errors.map(({ message }) => message)
      })
    }

    const { data: { policy = {} } } = Object(result)
    const scannedBy = remote ? remoteLabel : 'Stethoscope'

    const newState = {
      result: policy.validate,
      loading: false,
      lastScanTime,
      remoteScan,
      scannedBy
    }

    this.setState(newState, () => {
      ipcRenderer.send('app:loaded')
      if (this.state.result.status !== 'PASS' && showNotification) {
        const note = new Notification('Security recommendation', {
          body: 'You can improve the security settings on this device. Click for more information.'
        })
        note.onerror = err => console.error(err)
      }
    })
  }

  handleErrorYAML = (err = { message: 'Error requesting config information' }) => {
    log.error('App:YAML error', err)
    this.setState({ error: err, loading: false })
  }

  handleErrorGraphQL = (err = { message: 'Error in GraphQL request' }) => {
    log.error(`App:GraphQL error ${JSON.stringify(serializeError(err))}`)
    this.setState({ error: err, loading: false })
  }

  /**
   * loads config, policy, and instructions and initializes a scan
   * using them
   */
  loadPractices = () => {
    return new Promise((resolve, reject) =>
      this.setState({ loading: true }, () => {
        const process = remote.process
        const dev = process.env.STETHOSCOPE_ENV === 'development'
        const basePath = `${dev ? '.' : process.resourcesPath}/src/practices`

        glob(`${basePath}/*.yaml`, (err, files) => {
          if (err || !files.length) {
            reject(err)
          }
          const configs = {}
          files.forEach(filePath => {
            const parts = path.parse(filePath)
            const handle = readFileSync(filePath, 'utf8')
            configs[parts.name.split('.').shift()] = yaml.safeLoad(handle)
          })

          this.setState({ ...configs, loading: false }, () => {
            if (!this.state.scanIsRunning) {
              this.handleScan()
            }
          })

          resolve()
        })
      })
    )
  }

  /**
   * Opens a link in the native default browser
   */
  handleOpenExternal = event => {
    event.preventDefault()
    if (event.target.getAttribute('href')) {
      shell.openExternal(event.target.getAttribute('href'))
    }
  }

  handleRestartFromLoader = event => {
    settings.set('recentHang', settings.get('recentHang', 0) + 1)
    ipcRenderer.send('app:restart')
  }

  /**
   * Performs a scan by passing the current policy to the graphql server
   */
  handleScan = () => {
    const { policy } = this.state
    this.setState({ loading: true, scanIsRunning: true }, () => {
      Stethoscope.validate(policy).then(({ device, result, timing }) => {
        const lastScanTime = Date.now()
        this.setState({
          device,
          result,
          lastScanTime,
          lastScanDuration: timing.total / 1000,
          scanIsRunning: false,
          scannedBy: 'Stethoscope',
          loading: false
        }, () => {
          ipcRenderer.send('app:loaded')
        })
      }).catch(err => {
        console.log(err)
        log.error(JSON.stringify(err))
        let message = new Error(err.message)
        if (err.errors) message = new Error(JSON.stringify(err.errors))
        this.handleErrorGraphQL({ message })
      })
    })
  }

  handleHighlightRescanButton = event => this.setState({ highlightRescan: true })

  render () {
    const {
      device, policy, result, downloadProgress,
      scannedBy, lastScanTime, lastScanDuration, error,
      instructions, loading, highlightRescan,
      recentHang, remoteScan, recentLogs
    } = this.state

    const isDev = process.env.STETHOSCOPE_ENV === 'development'

    let content = null

    // don't want to render entire app, partition device info, etc. if downloading an update
    if (downloadProgress !== null) {
      content = <DownloadProgress progress={downloadProgress} />
    }

    const helpOptions = appConfig.menu.help.map(({ label, link }) => (
      <a key={link} className='helpLink' href={link}>{label}</a>
    ))

    if (error) {
      content = (
        <ErrorMessage
          version={pkg.version}
          showStack={isDev}
          message={error.message}
          stack={error.stack}
        >
          {helpOptions}
        </ErrorMessage>
      )
    }

    if (loading) {
      content = (
        <Loader
          onRestart={this.handleRestartFromLoader}
          recentHang={recentHang}
          remoteScan={remoteScan}
          remoteLabel={scannedBy}
          recentLogs={recentLogs}
          platform={platform}
          version={pkg.version}
        >
          {helpOptions}
        </Loader>
      )
    }

    // if none of the overriding content has been added
    // assume no errors and loaded state
    if (!content) {
      const args = [policy, result, device, instructions.practices, platform]
      try {
        const secInfo = Stethoscope.partitionSecurityInfo(...args)
        const decoratedDevice = Object.assign({}, device, secInfo, { lastScanTime })
        const lastScanFriendly = moment(lastScanTime).fromNow()

        content = (
          <div>
            <Device
              {...decoratedDevice}
              org={instructions.organization}
              scanResult={result}
              strings={instructions.strings}
              policy={policy}
              lastScanTime={lastScanFriendly}
              lastScanDuration={lastScanDuration}
              scannedBy={scannedBy}
              onExpandPolicyViolation={this.handleHighlightRescanButton}
            />
            <Footer
              highlightRescan={highlightRescan}
              result={result}
              instructions={instructions}
              webScopeLink={appConfig.stethoscopeWebURI}
              onClickOpen={this.handleOpenExternal}
              onRescan={this.handleScan}
            />
          </div>
        )
      } catch (e) {
        throw new Error(`Unable to partition data: ${e.message}\n${args.join(', ')}`)
      }
    }

    return (
      <div className={classNames('App', { loading })}>
        {content}
      </div>
    )
  }
}

export default App
