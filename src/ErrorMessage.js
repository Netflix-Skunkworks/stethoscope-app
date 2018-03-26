import React, { Component } from 'react'
import config from './config.json'
import './ErrorMessage.css'

let clipboard
try {
  clipboard = window.require('electron').clipboard
} catch(e) {}

export default class ErrorMessage extends Component {
  copyToClipboard = event => {
    clipboard.writeText(this.props.message)
    window.alert('Copied!')
  }

  render() {
    return (
      <div className="error">
        <h1>Oh no!</h1>
        <p>Something went wrong. Here's what we know:</p>
        <pre>{this.props.message}</pre>
        <button onClick={this.copyToClipboard}>Copy Error to Clipboard</button>
        <div id="helpBubble">
          <strong>Need some help?</strong>
          {config.menu.help.map(({ label, link }) => (
            <a key={link} className='helpLink' href={link}>{label}</a>
          ))}
        </div>
        <div id="giraffe"><img alt='Stethoscope Giraffe' src="./favicon.png" /></div>
      </div>
    )
  }
}

ErrorMessage.defaultProps = {
  message: 'Unknown error :('
}
