import React from 'react'
import classNames from 'classnames'

export default function Footer (props) {
  const {
    highlightRescan, result, instructions, webScopeLink,
    onClickOpen, onRescan
  } = props

  return (
    <footer className='toolbar toolbar-footer'>
      <div className='buttonRow'>
        <button
          className={classNames('btn btn-default', {
            'btn-primary': highlightRescan && result.status !== 'PASS'
          })}
          onClick={onRescan}
        >
          <span className='icon icon-arrows-ccw' />
          {instructions && instructions.strings && instructions.strings.rescanButton}
        </button>
        {webScopeLink && (
          <button
            className='btn pull-right'
            href={webScopeLink}
            onClick={onClickOpen}
          >
            <span className='icon icon-monitor white' />view all devices
          </button>
        )}
      </div>
    </footer>
  )
}
