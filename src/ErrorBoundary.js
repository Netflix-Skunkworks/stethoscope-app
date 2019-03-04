import React from 'react'
import serializeError from 'serialize-error'

let log = console
let remote

try {
  remote = window.require('electron').remote
  log = remote.getGlobal('log')
} catch (e) {
  // browser context
}

export default class ErrorBoundary extends React.Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch (error, info) {
    this.setState({ hasError: true, error: serializeError(error) })
    log.error(JSON.stringify(serializeError(error)))
  }

  render () {
    if (this.state.hasError) {
      return (
        <React.Fragment>
          <h1>Something went wrong.</h1>
          <pre>
            {JSON.stringify(this.state.error, null, 3)}
          </pre>
        </React.Fragment>
      )
    }
    return this.props.children
  }
}
