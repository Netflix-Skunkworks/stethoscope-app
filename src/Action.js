import React, { Component } from 'react'
import ReactDOMServer from 'react-dom/server'
import Accessible from './Accessible'
import ActionIcon from './ActionIcon'
import Handlebars from 'handlebars'
import semver from 'semver'
import showdown from 'showdown'

const converter = new showdown.Converter()

class Action extends Component {
  state = {
    showDescription: false
  }

  constructor (props) {
    super(props)
    this.registerHelpers(props)
  }

  hoverText (type) {
    var hoverTextLabels = {
      critical: 'Highly recommended action',
      suggested: 'Suggested action',
      done: 'Completed action'
    }
    return hoverTextLabels[type]
  }

  iconName (type) {
    if (type === 'critical' || type === 'suggested') {
      return 'blocked'
    } else if (type === 'done') {
      return 'checkmark'
    }
  }

  iconColor (type) {
    if (type === 'critical') {
      return '#a94442'
    } else if (type === 'done') {
      return '#bbd8ca'
    } else if (type === 'suggested') {
      return '#bfa058'
    }
  }

  toggleDescription = () => {
    if (!this.state.showDescription && this.props.status === 'FAIL') {
      this.props.onExpandPolicyViolation()
    }
    this.setState({
      showDescription: !this.state.showDescription
    }, () => {
      window.scrollTo(0, this.el.offsetTop - 5)
    })
  }

  registerHelpers = ({ security, policy, device }) => {
    const getIcon = (status, msg) => {
      return new Handlebars.SafeString(
        ReactDOMServer.renderToStaticMarkup(
          <div className='subtask'>
            <ActionIcon
              className='action-icon'
              name={this.iconName(status)}
              color={this.iconColor(status)}
              title={this.hoverText(status)}
              width='18px'
              height='18px'
            />
            <strong style={{ color: this.iconColor(status) }}>{msg}</strong>
          </div>
        )
      )
    }

    Handlebars.registerHelper('statusIcon', (status, altMessage) => {
      if (status === 'ON') {
        return getIcon('done', altMessage)
      }
      return getIcon('suggested', altMessage)
    })

    Handlebars.registerHelper('okIcon', label => {
      return getIcon('done', label)
    })

    Handlebars.registerHelper('warnIcon', label => {
      return getIcon('critical', label)
    })

    Handlebars.registerHelper('securitySetting', (key) => {
      return new Handlebars.SafeString(
        ReactDOMServer.renderToStaticMarkup(
          <table style={{ width: 'auto' }}>
            <tbody>
              <tr>
                <td>Suggested setting:</td>
                <td>
                  <span className='suggested-value'>{String(policy[key])}</span>
                </td>
              </tr>
            </tbody>
          </table>
        )
      )
    })

    Handlebars.registerHelper('requirement', (key, platform) => {
      const version = semver.coerce(policy[key][platform].ok)
      return new Handlebars.SafeString(
        ReactDOMServer.renderToStaticMarkup(
          <table style={{ width: 'auto' }}>
            <tbody>
              <tr>
                <td>Suggested version:</td>
                <td>
                  <span className='suggested-value'>{String(version)}</span>
                </td>
              </tr>
              <tr>
                <td>Your version:</td>
                <td>
                  <span className='suggested-value'>{String(device[key])}</span>
                </td>
              </tr>
            </tbody>
          </table>
        )
      )
    })
  }

  getPlatformAndVersionSpecificFlags (device) {
    return {
      mojave: (
        device.platform === 'darwin' && semver.satisfies(device.osVersion, '>=10.14.0')
      )
    }
  }

  parseDirections () {
    const { security, device, action: { status, directions } } = this.props
    const html = converter.makeHtml(directions)
    const passing = status === 'PASS'
    const template = Handlebars.compile(html)
    const platformOverrides = this.getPlatformAndVersionSpecificFlags(device)
    return template({ ...security, ...device, ...platformOverrides, passing })
  }

  parseTitle () {
    const { action: { status, title } } = this.props
    const template = Handlebars.compile(title)
    const passing = status === 'PASS'
    return template({ passing })
  }

  render () {
    const { action, type } = this.props
    let description = null

    if (this.state.showDescription) {
      description = (
        <div className='action-description'>
          <div className='more-info'>
            <div className='description'>
              {action.description}
            </div>
            { action.details &&
              <pre className='description'>{action.details}</pre>
            }
            { action.link &&
              <a href={action.link} target='_blank' rel='noopener noreferrer'>More info</a>
            }
          </div>
          { action.directions && (
            <div
              className='instructions'
              dangerouslySetInnerHTML={{ __html: this.parseDirections() }}
            />
          )}
          {this.props.children}
        </div>
      )
    }

    return (
      <li className={type} key={action.title} ref={el => { this.el = el }}>
        <span className='title' onClick={this.toggleDescription}>
          <ActionIcon
            className='action-icon'
            name={this.iconName(type)}
            color={this.iconColor(type)}
            title={this.hoverText(type)}
            width='18px'
            height='18px'
          />
          {this.parseTitle()}
        </span>
        <Accessible label='Toggle action description' expanded={this.state.showDescription}>
          <a href='#toggle' className={`toggleLink show-description ${this.state.showDescription ? 'open' : 'closed'}`} onClick={this.toggleDescription}>&#9660;</a>
        </Accessible>
        {description}
      </li>
    )
  }
}

export default Action
