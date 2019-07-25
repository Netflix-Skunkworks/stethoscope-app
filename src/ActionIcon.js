import React, { Component } from 'react'

const DEFAULT_SIZE = '20px';

const LABELS = {
  BLOCK: 'Highly recommended action',
  SUGGEST: 'Suggested action',
  PASS: 'Completed action'
}

export const VARIANT_COLORS = {
  PASS: '#bbd8ca',
  BLOCK: '#a94442',
  SUGGEST: '#bfa058',
}

export const VARIANTS = {
  PASS: 'PASS',
  BLOCK: 'BLOCK',
  SUGGEST: 'SUGGEST'
}

export default class ActionIcon extends Component {
  constructor (props) {
    super(props)

    const {
      color,
      variant = VARIANTS.PASS,
      size = DEFAULT_SIZE,
    } = props;

    const styleProps = {
      color: color || VARIANT_COLORS[variant],
      width: size,
      height: size
    }
    const style = Object.assign(
      {},
      { pointerEvents: 'none', display: 'block', width: '100%', height: '100%' },
      styleProps
    )
    this.icons = {
      PASS: <svg viewBox='0 0 64 64' preserveAspectRatio='xMidYMid meet' style={style}><path fill={style.color} d='M54 8l-30 30-14-14-10 10 24 24 40-40z' /></svg>,
      BLOCK: <svg viewBox='0 0 64 64' preserveAspectRatio='xMidYMid meet' style={style}><path fill={style.color} d='M54.627 9.373c-6.044-6.044-14.080-9.373-22.628-9.373s-16.583 3.329-22.628 9.373c-6.044 6.044-9.373 14.080-9.373 22.627s3.329 16.583 9.373 22.627c6.044 6.044 14.080 9.373 22.628 9.373s16.583-3.329 22.628-9.373c6.044-6.044 9.373-14.080 9.373-22.628s-3.329-16.583-9.373-22.628zM56 32c0 5.176-1.647 9.974-4.444 13.899l-33.454-33.454c3.925-2.797 8.723-4.444 13.899-4.444 13.234 0 24 10.766 24 24zM8 32c0-5.176 1.647-9.974 4.444-13.899l33.454 33.454c-3.925 2.797-8.723 4.444-13.899 4.444-13.234 0-24-10.766-24-24z' /></svg>,
      SUGGEST: <svg viewBox='0 0 72 72' preserveAspectRatio='xMidYMid meet' style={style}><path fill={style.color} d='M26,64l12,0c1.105,0 2,-0.895 2,-2l0,-9c0,-1.105 -0.895,-2 -2,-2l-12,0c-1.105,0 -2,0.895 -2,2l0,9c0,1.105 0.895,2 2,2Z' /><path fill={style.color} d='M26,46l12,0c1.105,0 2,-0.895 2,-2l0,-42c0,-1.105 -0.895,-2 -2,-2l-12,0c-1.105,0 -2,0.895 -2,2l0,42c0,1.105 0.895,2 2,2Z' /></svg>
    }
  }

  render () {

    const {
      variant = VARIANTS.PASS,
      title,
    } = this.props;

    return (
      <span className='action-icon' title={title || LABELS[variant]}>
        {this.icons[variant]}
      </span>
    )
  }
}
