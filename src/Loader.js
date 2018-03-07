import React from 'react'
import './Loader.css'

export default (props) => (
  <div className='loader-wrapper'>
    <div className='loader'></div>
    {props.remoteScan ? 'Meechum is reading your device info' : 'Loading...'}
  </div>
)
