import React, { Component } from 'react'
import ReactDOMServer from 'react-dom/server'
import semver from 'semver'
import Accessible from './Accessible'
import ActionIcon from './ActionIcon'
import showdown from 'showdown'
import Handlebars from 'handlebars'

const converter = new showdown.Converter()

class Action extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showDescription: false
    }
    this.toggleDescription = this.toggleDescription.bind(this)
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

  toggleDescription () {
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
      return ReactDOMServer.renderToStaticMarkup(
        <div className='subtask'>
          <ActionIcon
            className='action-icon'
            name={this.iconName(status)}
            color={this.iconColor(status)}
            title={this.hoverText(status)}
            width='18px'
            height='18px'
          />
          <span style={{ color: this.iconColor(status)}}>{msg}</span>
        </div>
      )
    }

    Handlebars.registerHelper('statusIcon', (key, msg) => {
      if (security[key] === 'ON') return
      return getIcon('suggested', msg)
    })

    Handlebars.registerHelper('okIcon', label => {
      return getIcon('done', label)
    })

    Handlebars.registerHelper('warnIcon', label => {
      return getIcon('critical', label)
    })

    Handlebars.registerHelper('requirement', (key, platform) => {
      const version = semver.coerce(policy[key][platform].ok)
      return `<div>
        Suggested version: <span class="suggested-value">${version}</span><br />
        Your version: <span class="suggested-value">${device[key]}</span>
      </div>`
    })
  }

  parseDirections() {
    const { security, device, action: { directions } } = this.props
    const html = converter.makeHtml(directions)
    const template = Handlebars.compile(html)
    return template({ ...security, ...device })
  }

  render () {
    const { action, type, status } = this.props
    let description = null

    if (this.state.showDescription) {
      description = (
        <div className='action-description'>
          <div className='more-info'>
            <div className='description'>
              {action.description}
              {this.props.children}
            </div>
            { action.details &&
              <pre className='description'>{action.details}</pre>
            }
            { action.link &&
              <a href={action.link} target='_blank'>More info</a>
            }
          </div>
          { action.directions && (
            <div
              className='instructions'
              dangerouslySetInnerHTML={{__html: this.parseDirections()}}
            />
          )}
        </div>
      )
    }

    return (
      <li className={type} ref={el => { this.el = el }}>
        <span className='title' onClick={this.toggleDescription}>
          <ActionIcon
            className='action-icon'
            name={this.iconName(type)}
            color={this.iconColor(type)}
            title={this.hoverText(type)}
            width='18px'
            height='18px'
          />
          {action.title[status] || action.title}
        </span>
        <Accessible label='Toggle action description' expanded={this.state.showDescription}>
          <a className={`toggleLink show-description ${this.state.showDescription ? 'open' : 'closed'}`} onClick={this.toggleDescription}>&#9660;</a>
        </Accessible>
        {description}
      </li>
    )
  }
}

export default Action
