// js/json-loader.js — 统一 JSON 配置加载工具
;(function () {
  window.loadJSON = function (url, callback) {
    $.ajax({ url: url, method: 'GET', dataType: 'json', success: callback })
  }
})()
