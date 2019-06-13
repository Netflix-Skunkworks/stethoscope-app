import React, { Component, Fragment } from 'react'
import Accessible from './Accessible'
import Action from './Action'
import ActionIcon from './ActionIcon'
import semver from './lib/patchedSemver'
import './Device.css'

const deviceMessages = {
  ok (msg) {
    return (
      <span>
        <ActionIcon className='action-icon' width='35px' height='35px' name='checkmark' color='#bbd8ca' />
        <span>{msg}</span>
      </span>
    )
  },
  warning (msg) {
    return (
      <span>
        <span>{msg}</span>
      </span>
    )
  },
  critical (msg) {
    return (
      <span>
        <span>{msg}</span>
      </span>
    )
  }
}

class Device extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showInfo: false
    }
    this.toggleInfo = this.toggleInfo.bind(this)
  }

  renderAppVersionSuggestion = (installed, suggested) => {
    return (
      <table style={{ width: 'auto' }}>
        <tbody>
          <tr>
            <td>Suggested version:</td>
            <td>
              <span className='suggested-value'>{String(suggested)}</span>
            </td>
          </tr>
          <tr>
            <td>Your version:</td>
            <td>
              <span className='suggested-value'>{String(installed)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  applicationStateMessage = ({ state, version, installed, policy = {} }) => {
    if (state === 'INVALID_INSTALL_STATE' && !installed) {
      const installPrompt = policy.installFrom ? (
        <p>
          {' '}
          Install from{' '}
          <a href={policy.installFrom} target='_blank'>
            here
          </a>
        </p>
      ) : null
      return <p>You must have this application installed.{installPrompt}</p>
    } else if (state === 'INVALID_INSTALL_STATE' && installed) {
      return <p>You must not have this application installed</p>
    } else if (state === 'INVALID_VERSION') {
      return (
        <Fragment>
          <p>You need to update this application.</p>{' '}
          {this.renderAppVersionSuggestion(version, semver.coerce(policy.version))}
        </Fragment>
      )
    }
    return null
  }

  actions (actions, type, device) {
    const status = type === 'done' ? 'PASS' : 'FAIL'

    return actions.map((action, index) => {
      const actionProps = {
        action,
        device,
        status,
        type,
        key: action.title[status],
        onExpandPolicyViolation: this.props.onExpandPolicyViolation,
        platform: this.props.platform,
        policy: this.props.policy,
        security: this.props.security,
        expandedByDefault: type === 'critical' && index === 0
      }

      const hasResults = Array.isArray(action.results)
      let results = action.results

      if (hasResults && action.name.endsWith('applications')) {
        results = results.map((result, index) => {
          if (action.name in this.props.policy && Array.isArray(this.props.policy[action.name])) {
            const target = this.props.policy[action.name][index]
            if (target) {
              result.policy = target
            }
          }
          return result
        })
      }

      if (hasResults) {
        return (
          <Action {...actionProps} key={`action-container-${action.name}`}>
            <ul className='result-list' key={`action-ul-${action.name}`}>
              {results.map((data, index) => {
                const { name, status, policy = {} } = data
                const { description } = policy
                const iconProps =
                  status === 'PASS' ? { name: 'checkmark', color: '#bbd8ca' } : { name: 'blocked', color: '#a94442' }

                return (
                  <li className='result-list-item' key={`action-li-${name}`}>
                    <div className='result-heading'>
                      <strong>
                        <ActionIcon className='action-icon' width='15px' height='15px' {...iconProps} /> {name}
                      </strong>{' '}
                    </div>
                    <div>
                      {description ? <p>{description}</p> : null}
                      {this.applicationStateMessage(data)}
                      {index !== results.length - 1 ? <hr /> : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Action>
        )
      } else {
        return <Action {...actionProps} key={`action-container-${action.name}`} />
      }
    })
  }

  process (device) {
    let d = Object.assign({}, device)
    d.friendlyName = d.friendlyName || 'Unknown device'
    d.identifier = d.deviceName || d.hardwareSerial || (d.macAddresses || []).join(' ')

    return d
  }

  toggleInfo () {
    this.setState({
      showInfo: !this.state.showInfo
    })
  }

  render () {
    if (!this.props.stethoscopeVersion) return null

    const device = Object.assign({}, this.props, this.process(this.props))
    const { org, scanResult } = this.props

    let deviceInfo = null

    if (this.state.showInfo) {
      deviceInfo = (
        <div className='deviceInfo'>
          <dl className='device-info'>
            <dt>Type</dt>
            <dd>{device.hardwareModel}&nbsp;</dd>
            <dt>Manufacturer</dt>
            <dd>{device.platformName}&nbsp;</dd>
            <dt>Model</dt>
            <dd>{device.hardwareModel}&nbsp;</dd>
            <dt>Platform</dt>
            <dd>{device.platform}&nbsp;</dd>
            <dt>OS Version</dt>
            <dd>{device.osVersion}&nbsp;</dd>
            <dt>Name</dt>
            <dd>{device.deviceName}&nbsp;</dd>
            <dt>Serial</dt>
            <dd>{device.hardwareSerial}&nbsp;</dd>
            <dt>UDID</dt>
            <dd>{device.deviceId}&nbsp;</dd>
            <dt>Status</dt>
            <dd>{scanResult.status}&nbsp;</dd>
          </dl>
        </div>
      )
    }

    let deviceClass = 'ok'

    if (scanResult.status !== 'PASS') {
      deviceClass = scanResult.status === 'NUDGE' ? 'warning' : 'critical'
    }

    return (
      <div className='device-wrapper'>
        <div className={`panel device ${deviceClass}`}>
          <header>
            <div className='device-name'>{device.friendlyName}</div>
            <div className='device-identifier'>{device.identifier}&nbsp;</div>
            <Accessible
              expanded={this.state.showInfo}
              label={`Toggle and review ${device.deviceRating} device information for ${device.friendlyName}`}
            >
              <a
                href='#toggle'
                className={`device-info-toggle ${this.state.showInfo ? 'open' : 'closed'}`}
                onClick={this.toggleInfo}
              >
                &#9660;
              </a>
            </Accessible>
          </header>

          {deviceInfo}

          <div className={`panel device-summary ${deviceClass}`}>
            {deviceMessages[deviceClass](this.props.strings[deviceClass])}
          </div>

          <h4>
            {org} {this.props.strings.policyDescription}
          </h4>

          <div className='action-list'>
            <ul key='action-list-main-ul'>
              {this.actions(device.critical, 'critical', device)}
              {this.actions(device.suggested, 'suggested', device)}
              {this.actions(device.done, 'done', device)}
            </ul>
          </div>

          <div className='last-updated'>
            {this.props.strings.lastScan} {this.props.scannedBy} {this.props.lastScanTime} (
            {Math.round(this.props.lastScanDuration * 100) / 100} seconds)
          </div>
        </div>
      </div>
    )
  }
}

Device.defaultProps = {
  macAddresses: [],
  ipAddresses: [],
  critical: [],
  suggested: [],
  messages: {},
  done: []
}

export default Device
