// qrcode-helper.js — 文本 → 二维码 PNG data URL
//
// 用法：
//   var dataURL = window.NovaQRCode.toDataURL(text, size)   // 同步返回 'data:image/png;base64,...'
//   var dataURL = window.NovaQRCode.toDataURL(text)         // 默认 size=200
//
// 设计：
//   - 依赖 davidshimjs/qrcodejs（window.QRCode），在 index.html 中先于本文件加载
//   - 内部缓存（text+size → dataURL），同一文本/尺寸不重复生成
//   - 离屏 DOM 节点渲染后立刻销毁，不污染页面
;(function () {
  if (window.NovaQRCode) return

  var cache = new Map()
  var host = null

  function ensureHost() {
    if (host && host.isConnected) return host
    host = document.createElement('div')
    host.style.cssText = 'position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;visibility:hidden'
    document.body.appendChild(host)
    return host
  }

  function toDataURL(text, size) {
    size = size || 200
    var key = (text || '') + '|' + size
    var cached = cache.get(key)
    if (cached) return cached

    if (!window.QRCode) {
      console.warn('[qrcode-helper] window.QRCode 未加载')
      return null
    }

    var container = ensureHost()
    container.innerHTML = ''

    var qr = new window.QRCode(container, {
      text: text || '',
      width: size,
      height: size,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.L
    })

    var canvas = container.querySelector('canvas')
    var dataURL = canvas ? canvas.toDataURL('image/png') : null

    if (qr && typeof qr.clear === 'function') {
      try { qr.clear() } catch (e) {}
    }
    container.innerHTML = ''

    if (dataURL) cache.set(key, dataURL)
    return dataURL
  }

  window.NovaQRCode = { toDataURL: toDataURL }
})()
