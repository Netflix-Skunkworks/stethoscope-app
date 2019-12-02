import React from 'react'
import prettyBytes from './lib/prettyBytes'

export default function DownloadProgress ({ progress }) {
  const { transferred, total, percent } = progress
  return (
    <div id='downloadProgress'>
      <p>Downloading update ({prettyBytes(transferred)} of {prettyBytes(total)})</p>
      <progress max='100' value={percent} />
    </div>
  )
}
