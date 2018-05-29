import React from 'react'
import './Loader.css'

export default (props) => (
  <div className='loader-wrapper'>
    <div className='loader' />
    {props.remoteScan ? `${props.remoteLabel} is reading your device settings` : 'Gathering device settings...'}
  </div>
)
