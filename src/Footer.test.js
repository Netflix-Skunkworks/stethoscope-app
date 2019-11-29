/* global it */
import React from 'react'
import ReactDOM from 'react-dom'
import Footer from './Footer'

const mockProps = {
  highlightRescan: true,
  result: { status: 'PASS' },
  instructions: { strings: { rescanButton: 'rescan' } },
  webScopeLink: 'test',
  onRescan: () => {},
  onClickOpen: () => {}
}

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<Footer {...mockProps} />, div)
})
