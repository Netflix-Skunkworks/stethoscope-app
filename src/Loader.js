import React from 'react'
import './Loader.css'

let timeout

export default class Loader extends React.Component {
  state = { startLoading: 0, slowLoad: false }

  componentDidMount() {
    timeout = setTimeout(() => {
      this.setState({
        slowLoad: true
      })
    }, 20000)
  }

  componentWillUnmount() {
    clearTimeout(timeout)
  }

  render() {
    const { props, state } = this
    let msg = props.remoteScan
      ? `${props.remoteLabel} is reading your device settings...`
      : 'Gathering device settings...'

    if (state.slowLoad) {
      msg = (
        <span>
          This seems to be taking a while...<br />
          <div style={{fontSize: '2rem'}}>🤔</div>
        </span>
      )
    }

    return (
      <div className='loader-wrapper'>
        <div className='loader' />
        {msg}
      </div>
    )
  }
}
