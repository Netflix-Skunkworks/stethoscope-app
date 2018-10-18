import React, { Component } from 'react'
import Accessible from './Accessible'
import Action from './Action'
import ActionIcon from './ActionIcon'
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

  actions (actions, type, device) {
    const status = type === 'done' ? 'PASS' : 'FAIL'

    return actions.map((action) => {
      const actionProps = {
        action,
        device,
        status,
        type,
        key: action.title[status],
        onExpandPolicyViolation: this.props.onExpandPolicyViolation,
        platform: this.props.platform,
        policy: this.props.policy,
        security: this.props.security
      }

      const hasResults = Array.isArray(action.results)
      let results = action.results

      if (hasResults && action.name.endsWith('Applications')) {
        results = results.map(result => {
          if (action.name in this.props.policy && Array.isArray(this.props.policy[action.name])) {
            const target = this.props.policy[action.name].find(app => app.name === result.name)
            if (target) {
              return Object.assign({}, result, target)
            }
          }
          return result
        })
      }

      if (hasResults) {
        return (
          <Action {...actionProps}>
            <ul className='result-list'>
              {results.map(({ name, url, status, description }) => {
                const iconProps = status === 'PASS'
                  ? { name: 'checkmark', color: '#bbd8ca' }
                  : { name: 'blocked', color: '#a94442' }
                return (
                  <li
                    className='result-list-item'
                    key={name}
                  >
                    <div className='result-heading'>
                      <strong>
                        <ActionIcon
                          className='action-icon'
                          width='15px'
                          height='15px'
                          {...iconProps}
                        /> {name}
                      </strong>{' '}
                      {status !== 'PASS' && url ? (
                        <a href={`link://${url}`}>Download Application</a>
                      ) : null}
                    </div>
                    <div>
                      {description ? <p>{description}<hr /></p> : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Action>
        )
      } else {
        return (
          <Action {...actionProps} />
        )
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
            <dt>Type</dt><dd>{device.hardwareModel}&nbsp;</dd>
            <dt>Manufacturer</dt><dd>{device.platformName}&nbsp;</dd>
            <dt>Model</dt><dd>{device.hardwareModel}&nbsp;</dd>
            <dt>Platform</dt><dd>{device.platform}&nbsp;</dd>
            <dt>OS Version</dt><dd>{device.osVersion}&nbsp;</dd>
            <dt>Name</dt><dd>{device.deviceName}&nbsp;</dd>
            <dt>Serial</dt><dd>{device.hardwareSerial}&nbsp;</dd>
            <dt>UDID</dt><dd>{device.deviceId}&nbsp;</dd>
            <dt>Status</dt><dd>{scanResult.status}&nbsp;</dd>
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
            <Accessible expanded={this.state.showInfo} label={`Toggle and review ${device.deviceRating} device information for ${device.friendlyName}`}>
              <a className={`device-info-toggle ${this.state.showInfo ? 'open' : 'closed'}`} onClick={this.toggleInfo}>&#9660;</a>
            </Accessible>
          </header>

          {deviceInfo}

          <div className={`panel device-summary ${deviceClass}`}>
            {deviceMessages[deviceClass](this.props.strings[deviceClass])}
          </div>

          <h4>{org} {this.props.strings.policyDescription}</h4>

          <div className='action-list'>
            <ul>
              { this.actions(device.critical, 'critical', device) }
              { this.actions(device.suggested, 'suggested', device) }
              { this.actions(device.done, 'done', device) }
            </ul>
          </div>

          <div className='last-updated'>
            {this.props.strings.lastScan} {this.props.scannedBy} {this.props.lastScanTime} ({Math.round(this.props.lastScanDuration * 100) / 100} seconds)
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
