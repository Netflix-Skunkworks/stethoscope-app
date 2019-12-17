import React, { Component } from 'react'
import ReactDOMServer from 'react-dom/server'
import Accessible from './Accessible'
import ActionIcon, { VARIANTS, VARIANT_COLORS } from './ActionIcon'
import semver from './lib/patchedSemver'
import getRecommendedVersion from './lib/getRecommendedVersion'
import showdown from 'showdown'
import Handlebars from 'handlebars/dist/handlebars.min.js'

const converter = new showdown.Converter()

class Action extends Component {
  state = {
    showDescription: this.props.expandedByDefault
  }

  constructor (props) {
    super(props)
    this.registerHelpers(props)
  }

  getIconVariant (type) {
    if (type === 'critical') {
      return VARIANTS.BLOCK
    } else if (type === 'done') {
      return VARIANTS.PASS
    } else if (type === 'suggested') {
      return VARIANTS.SUGGEST
    }
  }

  handleToggleDescription = () => {
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
              variant={this.getIconVariant(status)}
            />
            <strong style={{ color: VARIANT_COLORS[this.getIconVariant(status)] }}>{msg}</strong>
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

    Handlebars.registerHelper('okIcon', label => getIcon('done', label))
    Handlebars.registerHelper('warnIcon', label => getIcon('critical', label))
    Handlebars.registerHelper('securitySetting', key => {
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
      // display the highest minimum version
      // if advanced semver requirement is passed (e.g. >1.2.3 || < 3.0.0)
      const { ok } = policy[key][platform]
      const recommended = getRecommendedVersion(ok)

      return new Handlebars.SafeString(
        ReactDOMServer.renderToStaticMarkup(
          <table style={{ width: 'auto' }}>
            <tbody>
              <tr>
                <td>Suggested version:</td>
                <td>
                  <span className='suggested-value'>{String(recommended)}</span>
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

  /**
   * Provides variables to use in the instructions template. The returned keys
   * can be used in conditionals in instructions.yml
   * e.g. {{#if mojaveOrLater}}
   * @param  {String} platform  destructed off of Device
   * @param  {String} osVersion destructed off of Device
   * @return {Object}
   */
  getPlatformAndVersionSpecificFlags ({ platform, osVersion }) {
    return {
      mojaveOrLater: (
        platform === 'darwin' && semver.satisfies(osVersion, '>=10.14.0')
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
            {action.details &&
              <pre className='description'>{action.details}</pre>}
            {action.link &&
              <a href={action.link} target='_blank' rel='noopener noreferrer'>More info</a>}
          </div>
          {action.directions && (
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
      <li
        className={type}
        key={String(action.title).replace(/[^a-zA-Z]+/g, '')}
        ref={el => { this.el = el }}
      >
        <span className='title' onClick={this.handleToggleDescription}>
          <ActionIcon
            className='action-icon'
            variant={this.getIconVariant(type)}
          />
          {this.parseTitle()}
        </span>
        <Accessible label='Toggle action description' expanded={this.state.showDescription}>
          <a href='#toggle' className={`toggleLink show-description ${this.state.showDescription ? 'open' : 'closed'}`} onClick={this.handleToggleDescription}>&#9660;</a>
        </Accessible>
        {description}
      </li>
    )
  }
}

export default Action
