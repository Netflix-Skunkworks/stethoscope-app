import React, { Component } from 'react'
import ReactDOMServer from 'react-dom/server'
import Accessible from './Accessible'
import ActionIcon from './ActionIcon'
import showdown from 'showdown'

const converter = new showdown.Converter()

class Action extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showDescription: false
    }
    this.toggleDescription = this.toggleDescription.bind(this)
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

  parseDirections() {
    const { action, security } = this.props
    let { directions } = action
    const piped = Object.keys(security).join('|')
    const regex = new RegExp(`\\[-(${piped}):(${piped})\\]`, 'g')

    let matches = directions.match(regex)

    console.log(matches, regex)
    let targetStatus = 'ON'

    const reducer = (prev, [parentScope, key]) => {
      let status = 'done'

      if (security[key] !== targetStatus) {
         status = 'suggested'
      }

      const iconString = ReactDOMServer.renderToStaticMarkup(
        <ActionIcon
          className='action-icon'
          name={this.iconName(status)}
          color={this.iconColor(status)}
          title={this.hoverText(status)}
          width='18px'
          height='18px'
        />
      )

      return prev.replace(`[-${parentScope}:${key}]`, iconString)
    }

    let count = 20 // upper limit of replacements

    while (matches && count-- > 0) {
      matches.map(m => m.substring(1).split(':'))
      directions = matches.map(m => m.substring(1).split(':')).reduce(reducer, directions)
      matches = directions.match(regex)
    }

    return converter.makeHtml(directions)
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
