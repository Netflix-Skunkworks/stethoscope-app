import React from 'react'
import classNames from 'classnames'

export default function Footer (props) {
  const {
    highlightRescan, result, instructions, webScopeLink,
    onClick, onScan
  } = props

  return (
    <footer className='toolbar toolbar-footer'>
      <div className='buttonRow'>
        <button
          className={classNames('btn btn-default', {
            'btn-primary': highlightRescan && result.status !== 'PASS'
          })}
          onClick={onScan}
        >
          <span className='icon icon-arrows-ccw' />
          {instructions.strings.rescanButton}
        </button>
        {webScopeLink && (
          <button
            className='btn pull-right'
            href={webScopeLink}
            onClick={onClick}
          >
            <span className='icon icon-monitor white' />view all devices
          </button>
        )}
      </div>
    </footer>
  )
}
