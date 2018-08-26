import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import ErrorBoundary from './ErrorBoundary'

const node = document.getElementById('root')

ReactDOM.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
, node)
