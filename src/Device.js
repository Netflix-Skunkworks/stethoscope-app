import React, { Component } from 'react'
import Accessible from './Accessible'
import Action from './Action'
import './Device.css'

class Device extends Component {

  constructor (props) {
    super(props)
    this.state = {
      showInfo: false
    }
    this.toggleInfo = this.toggleInfo.bind(this)
  }

  actions (actions, type) {
    return actions.map((a) => {
      if (a.results) {
        return (
          <Action key={a.title} type={type} action={a}>
            <ul className="result-list">{a.results.map(i => <li key={i.name}>{i.name}</li>)}</ul>
          </Action>
        )
      } else {
        return <Action key={a.title} type={type} action={a} />
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
            <dt>MAC addresses</dt>
            <dd>
              <ul className='mac-addresses'>
                {
                  device.macAddresses.filter(({mac}) => mac !== '00:00:00:00:00:00').map(({mac}, i) => (
                      <li key={i}>{mac}</li>
                  ))
                }
              </ul>
            </dd>
            <dt>Serial</dt><dd>{device.hardwareSerial}&nbsp;</dd>
            <dt>UDID</dt><dd>{device.deviceId}&nbsp;</dd>
            <dt>Status</dt><dd>{device.status}&nbsp;</dd>
          </dl>
        </div>
      )
    }

    return (
      <div className='device-wrapper'>
        <div className={`panel device ${scanResult.status === 'PASS' ? 'ok' : 'critical'}`}>
          <header>
            <div className='device-name'>{device.friendlyName}</div>
            <div className='device-identifier'>{device.identifier}&nbsp;</div>
            <Accessible expanded={this.state.showInfo} label={`Toggle and review ${device.deviceRating} device information for ${device.friendlyName}`}>
              <a className={`device-info-toggle ${this.state.showInfo ? 'open' : 'closed'}`} onClick={this.toggleInfo}>&#9660;</a>
            </Accessible>
          </header>

          <h4>{org} baseline policy</h4>

          {deviceInfo}

          <div className='action-list'>
            <ul>
              { this.actions(device.critical, 'critical') }
              { this.actions(device.suggested, 'suggested') }
              { this.actions(device.done, 'done') }
            </ul>
          </div>

          <div className='last-updated'>
            Last scan {this.props.lastScanTime} by {this.props.scannedBy}
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
  done: [],
}

export default Device
