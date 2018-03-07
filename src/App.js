import React, { Component } from 'react'
import Stethoscope from './lib/Stethoscope'
import Device from './Device'
import Loader from './Loader'
import openSocket from 'socket.io-client'
import moment from 'moment'
import { HOST } from './constants'
import './App.css'

const socket = openSocket(HOST)

let platform = 'darwin'
let shell;
// CRA doesn't like importing native node modules, have to use window.require AFAICT
try {
  const os = window.require('os')
  shell = window.require('electron').shell
  platform = os.platform()
} catch (e) {
  // browser
}

class App extends Component {
  state = {
    device: {},
    policy: {},
    result: {},
    instructions: {},
    loading: false,
    remoteScan: false,
    scannedBy: 'Stethoscope',
    lastScanTime: Date.now(),
    focused: true,
  }

  componentWillMount() {
    this.loadPractices()

    window.addEventListener('focus', () => this.setState({
      focused: true,
    }), false)

    window.addEventListener('blur', () => this.setState({
      focused: false,
    }), false)

    socket.on('scan:init', ({ remote }) => {
      this.setState({
        loading: true,
        remoteScan: remote,
        scannedBy: remote ? 'Meechum' : 'Stethoscope'
      })
    })

    // setup a socket io listener to refresh the app when a scan is performed
    socket.on('scan:complete', ({ variables, remote, result, policy: appPolicy, showNotification }) => {
      const { data: { policy }} = Object(result)

      let newState = {
        result: policy.validateWithDetails,
        loading: false,
        remoteScan: remote,
        scannedBy: remote ? 'Meechum' : 'Stethoscope'
      }

      // handle old-style requests, policy.validate should not be used anymore
      // TODO remove this logic
      if (!policy.validateWithDetails) {
        const lastScanTime = Date.now()
        newState = {
          result: {
            status: policy.validate
          },
          lastScanTime,
          policy: appPolicy.policy
        }
      }

      this.setState(newState, () => {
        if (this.state.result.status !== 'PASS' && showNotification) {
          new Notification('Security recommendation', {
            body: 'You can improve the security settings on this device. Click for more information.'
          })
        }
      })
    })

    socket.on('rescan', () => {
      this.loadPractices()
    })
  }

  handleResponseError = (err) => {
    this.setState({ error: err })
  }

  loadPractices = () => {
    this.setState({ loading: true }, () => {
      Promise.all([
        fetch(`${HOST}/config`).then(d => d.json()).catch(this.handleResponseError),
        fetch(`${HOST}/policy`).then(d => d.json()).catch(this.handleResponseError),
        fetch(`${HOST}/instructions`).then(d => d.json()).catch(this.handleResponseError)
      ]).then(([config, policy, instructions]) => {
        this.setState({ config, policy, instructions }, () => this.scan())
      }).catch(this.handleResponseError)
    })
  }

  loadRemote = (url) => {
    this.loadPractices(url)
  }

  openExternal = event => {
    event.preventDefault()
    if (event.target.getAttribute('href')) {
      shell.openExternal(event.target.getAttribute('href'))
    }
  }

  scan = () => {
    Stethoscope.validate(this.state.policy).then(({ device, result }) => {
      const lastScanTime = Date.now()
      this.setState({
        device,
        result,
        lastScanTime,
        scannedBy: 'Stethoscope',
        loading: false
      })
    }).catch(this.handleResponseError)
  }

  render() {
    const {
      device, policy, result,
      scannedBy, lastScanTime,
      instructions, loading, error
    } = this.state

    const secInfo = Stethoscope.partitionSecurityInfo(policy, result, device, instructions.practices, platform)
    const decoratedDevice = Object.assign({}, device, secInfo, { lastScanTime })
    const lastScanFriendly = moment(this.state.lastScanTime).fromNow()

    if (error) {
      return (
        <div className="error">
          Error loading content {error.message}
        </div>
      )
    }

    return (
      <div className={`App ${loading ? 'loading' : ''}`}>
        {loading ? (
          <Loader remoteScan={this.state.remoteScan} />
        ) : (
          <div>
            <Device {...decoratedDevice}
              org={instructions.organization}
              scanResult={result}
              policy={policy}
              lastScanTime={lastScanFriendly}
              scannedBy={scannedBy}
            />
            <footer className="toolbar toolbar-footer">
              <div className="buttonRow">
                <button className="btn btn-default" onClick={this.scan}>
                  <span className="icon icon-arrows-ccw"></span>rescan
                </button>

                <button
                  className="btn btn-primary pull-right"
                  href='https://stethoscope.prod.netflix.net/'
                  onClick={this.openExternal}
                >
                  <span className="icon icon-monitor white"></span>view all devices
                </button>
              </div>
            </footer>
          </div>
        )}
      </div>
    )
  }
}

export default App
