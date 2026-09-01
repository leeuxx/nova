// js/utils/i18n.js — 前端 UI 外壳国际化
//
// 用法：
//   __t('button.save')                       // 取当前 locale 文本
//   __t('login.success', { name: 'xx' })     // 占位符 {name}
//   await __i18n.ready                       // 等字典加载完成（app.js 启动时调用）
//
// 设计：
//   - 一文件一语言：public/i18n/{lang}.json
//   - 启动时异步 fetch 当前 locale 字典，加载完通过 __i18n.ready resolve
//   - window.__appLocale：当前 locale（响应式 ref），切换时整页刷新
//   - 缺 key 时原样返回 key（方便排错，不静默失败）
;(function () {
  if (window.__t) return

  // ─── 决定当前 locale ───────────────────────────────────────
  function resolveLocale() {
    var saved
    try { saved = localStorage.getItem('nova_locale') } catch (e) {}
    if (saved === 'zh' || saved === 'en' || saved === 'ja' || saved === 'ko') return saved
    var nav = (navigator && navigator.language) || ''
    var lang = String(nav).toLowerCase().split('-')[0]
    if (lang === 'en' || lang === 'ja' || lang === 'ko') return lang
    var cfg = window.nova && window.nova.config && window.nova.config.i18n && window.nova.config.i18n.locale
    if (cfg === 'zh' || cfg === 'en' || cfg === 'ja' || cfg === 'ko') return cfg
    return 'zh'
  }

  var currentLocale = resolveLocale()
  var dict = {}
  var readyResolve, readyReject
  var readyPromise = new Promise(function (resolve, reject) {
    readyResolve = resolve
    readyReject = reject
  })

  // 暴露给 app.js 等同步等待
  window.__i18nReady = readyPromise

  // ─── 异步加载当前 locale 字典 ─────────────────────────────
  function loadLocale(locale) {
    return fetch('/i18n/' + locale + '.json', { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : {} })
      .then(function (d) {
        dict = d || {}
        window.__i18nDict = dict
        if (readyResolve) { readyResolve(dict); readyResolve = null }
        return dict
      })
      .catch(function (err) {
        // 加载失败：留空字典，按 key 显示（不静默吞错）
        console.warn('[i18n] load locale failed:', locale, err)
        dict = {}
        if (readyResolve) { readyResolve(dict); readyResolve = null }
        return dict
      })
  }

  // ─── 翻译函数 ───────────────────────────────────────────
  function _t(key) {
    if (!key) return ''
    var v = dict[key]
    if (v === undefined || v === null) return key
    // 占位符：__t('msg.x', { name: 'a' }) → 把 {name} 替换
    if (arguments.length > 1) {
      var params = arguments[1]
      if (params && typeof params === 'object') {
        return String(v).replace(/\{(\w+)\}/g, function (_, k) {
          return params[k] !== undefined ? String(params[k]) : '{' + k + '}'
        })
      }
    }
    return String(v)
  }

  // ─── 当前 locale（响应式 ref）──
  var localeRef
  try {
    localeRef = Vue.ref(currentLocale)
  } catch (e) {
    localeRef = { value: currentLocale }
  }
  window.__appLocale = localeRef

  window.__t = _t
  window.__i18n = {
    locale: localeRef,
    load: loadLocale,
    ready: readyPromise,
    getDict: function () { return dict },
    // 切换 locale：写入 localStorage + 刷新页面（按方案：切换语言整页刷新）
    setLocale: function (locale) {
      try { localStorage.setItem('nova_locale', locale) } catch (e) {}
      window.location.reload()
    }
  }

  // 立刻发起加载
  loadLocale(currentLocale)
})()