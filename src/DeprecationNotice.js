import React from 'react'
import './DeprecationNotice.css'

export default function Footer(props) {
  const { config, handleOpenExternal } = props
  const { heading, subHeading, linkUrl, linkText } =
    config.deprecationNotice || {}

  return (
    <div className='deprecation-notice'>
      <p>{heading}</p>
      <p>{subHeading}</p>
      <p>
        <a onClick={handleOpenExternal} href={linkUrl}>
          {linkText}
        </a>
      </p>
    </div>
  )
}
