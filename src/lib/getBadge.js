module.exports = function getBadge(n) {
  var canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  var ctx = canvas.getContext("2d")
  var w = canvas.width
  var x = w / 2
  var y = w / 2
  ctx.beginPath()
  ctx.fillStyle = "rgb(200,0,0)"
  ctx.arc(x, y, w/2, 0, 2 * Math.PI, false)
  ctx.fill()

  ctx = canvas.getContext("2d")
  ctx.font = '7pt Arial'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(n, x, y+3)
  return canvas.toDataURL()
}
