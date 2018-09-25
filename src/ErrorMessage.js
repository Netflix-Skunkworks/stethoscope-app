import React, { Component } from 'react'
import './ErrorMessage.css'

let clipboard
let ipcRenderer

try {
  ipcRenderer = window.require('electron').ipcRenderer
  clipboard = window.require('electron').clipboard
} catch (e) {}

export default class ErrorMessage extends Component {
  copyToClipboard = event => {
    clipboard.writeText(this.props.message + '\n' + this.props.stack)
    window.alert('Copied!')
  }

  render () {
    const { config } = this.props

    return (
      <div className='error'>
        <h1>Oh no!</h1>
        <p>Something went wrong. Here's what we know:</p>
        <pre>Stethoscope version: {this.props.version}</pre>
        <pre>{this.props.message + ''}</pre>
        {this.props.showStack ? <pre>{this.props.stack}</pre> : null}
        <button onClick={this.copyToClipboard}>Copy Error to Clipboard</button>
        <button onClick={() => ipcRenderer.send('app:restart')}>Restart App</button>
        <div id='helpBubble'>
          <strong>Need some help?</strong>
          {config.menu.help.map(({ label, link }) => (
            <a key={link} className='helpLink' href={link}>{label}</a>
          ))}
        </div>
        <div id='giraffe'>
          <img alt='Stethoscope Giraffe' src='./favicon.png' />
        </div>
      </div>
    )
  }
}

ErrorMessage.defaultProps = {
  message: 'Unknown error :('
}
