import React from 'react'
import './DeprecationNotice.css'

export default function Footer (props) {
  const { config, onHandleOpenExternal } = props
  const { heading, subHeading, linkUrl, linkText } =
    config.deprecationNotice || {}

  return (
    <div>
      {config.deprecationNotice && (
        <div className='deprecation-notice'>
          <p>{heading}</p>
          <p>{subHeading}</p>
          <p>
            <a onClick={onHandleOpenExternal} href={linkUrl}>
              {linkText}
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
