import React from 'react'
import classNames from 'classnames'
import './Loader.css'

const TOO_SLOW = 30000
let timeout

export default class Loader extends React.Component {
  state = { startLoading: 0, slowLoad: false }

  componentDidMount() {
    timeout = setTimeout(() => {
      this.setState({ slowLoad: true })
    }, TOO_SLOW)
  }

  componentWillUnmount() {
    clearTimeout(timeout)
  }

  render() {
    const { slowLoad } = this.state
    const {
      recentHang,
      onRestart,
      remoteScan,
      remoteLabel
    } = this.props

    let msg = remoteScan
      ? `${remoteLabel} is reading your device settings...`
      : 'Gathering device settings...'

    if (slowLoad) {
      msg = (
        <span>
          This{slowLoad ? ' still' : ''} seems to be taking a while...<br />
          <div className="loadingMessage">
            <span role="img" aria-label="Thinking face">🤔</span>
          </div>
          <div className='loaderAdditionalContent'>
          {recentHang ? (
            <div>
              <span>There seems to be a problem, contact support?</span>
              {this.props.children}
              <pre>
                <code>
                  {`Version: ${this.props.version}
                  Platform: ${this.props.platform}
                  Recent Logs:
                  ${this.props.recentLogs}`}
                </code>
              </pre>
            </div>
          ) : (
            <div>
              Sometimes restarting Stethoscope can resolve slow loading issues.<br />
              <button onClick={onRestart}>Restart Application</button>
            </div>
          )}
          </div>
        </span>
      )
    }

    return (
      <div className={classNames('loader-wrapper', { recentHang })}>
        <div className='loader' />
        {msg}
      </div>
    )
  }
}
