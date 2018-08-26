import React from 'react'

let log = console
let remote

try {
  remote = window.require('electron').remote
  log = remote.getGlobal('log')
} catch(e) {
  // browser context
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true });
    log.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
