// login-entry.js — 无登录态时的统一跳转出口
// 配置了 config.login.page 就整页跳转到自定义登录页并返回 true；
// 未配置返回 false，由调用方回落到内置 #/login
;(function () {
  window.__novaGoLogin = function () {
    var cfg = window.nova && window.nova.config && window.nova.config.login
    var page = cfg && cfg.page
    if (!page) return false
    window.location.replace(page)
    return true
  }
})()
