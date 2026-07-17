// js/json-loader.js — 统一 JSON 配置加载工具
;(function () {
  window.loadJSON = function (url, callback) {
    fetch(url, { method: 'GET' })
      .then(function (r) { return r.json() })
      .then(function (json) { callback(json) })
      .catch(function () { callback({}) })
  }
})()
