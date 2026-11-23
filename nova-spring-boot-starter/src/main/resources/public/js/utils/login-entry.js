// login-entry.js — 无登录态时的统一跳转出口
// 配置了 config.login.page 就整页跳转到自定义登录页并返回 true；
// 未配置返回 false，由调用方回落到内置 #/login
// 跳转时附带框架当前的主题（night/daytime）和语言，跨域登录页可通过 query 读取
;(function () {
  window.__novaGoLogin = function () {
    var cfg = window.nova && window.nova.config && window.nova.config.login
    var page = cfg && cfg.page
    if (!page) return false
    var url = new URL(page, location.href)
    url.searchParams.set('theme', localStorage.getItem('nova-theme') || window.nova.config.theme || 'daytime')
    url.searchParams.set('locale', (window.__appLocale && window.__appLocale.value) || 'zh')
    window.location.replace(url.href)
    return true
  }
})()
