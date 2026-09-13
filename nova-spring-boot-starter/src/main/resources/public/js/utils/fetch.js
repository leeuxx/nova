// fetch.js — 统一 fetch 工具，自动带上本地 token + 当前 locale，统一 POST + JSON
;(function () {

  // 从 window.__appLocale 读当前语言，固定覆盖 Accept-Language（后端 LocaleContextHolder.getLocale 依赖此 header）
  function currentLocaleHeader() {
    var loc = (window.__appLocale && window.__appLocale.value) || 'zh'
    return { 'Accept-Language': loc }
  }

  // 顶部加载条：调用 __novaPageLoading，它内部用 ref 计数（app.js 定义）
  // 写操作默认开启；个别调用方传 { withLoading: false } 关闭（如键入触发的 promptSearch、认证流程）
  // build 接口（/nova/table/build）耗时短（百毫秒级），native-ui 加载条 0.3s 入场淡入还没完成就被 finish，
  // 视觉上像"没出现"，对用户体验无价值，统一跳过
  function shouldShowLoading(url) {
    if (url && url.indexOf('/nova/table/build') !== -1) return false
    return true
  }
  function startLoading(url) {
    if (window.__novaPageLoading && shouldShowLoading(url)) window.__novaPageLoading.start()
  }
  function finishLoading(url) {
    if (window.__novaPageLoading && shouldShowLoading(url)) window.__novaPageLoading.finish()
  }

window.fetchApi = {
  // 普通请求（POST + JSON）
  // options.withLoading = false 关闭顶部加载条，默认开启
  post: function (url, data, headers, options) {
    data  = data  || {}
    headers = headers || {}
    options = options || {}
    var useLoading = options.withLoading !== false
    var token = localStorage.getItem('nova_token') || ''
    var allHeaders = Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { 'token': token } : {},
      headers,
      currentLocaleHeader()  // 固定覆盖 Accept-Language，放最后确保不被调用方覆盖
    )
    if (useLoading) startLoading(url)
    return fetch(url, {
      method:  'POST',
      headers: allHeaders,
      body:    JSON.stringify(data)
    }).then(function (resp) { return resp.json() })
      .then(function (resp) {
        var errorResult = errorHandle(resp)
        if (errorResult) {
           return Promise.reject({ code: resp.code, message: resp.msg })
        }
        return resp
      })
      .catch(function (e) {
        // 网络层错误（fetch 抛 TypeError/AbortError 等）；响应层错误由 errorHandle 处理，不重复提示
        if (e && !e.code && window.$message) {
          window.$message.error(window.__t('common.request_failed'))
        }
        return Promise.reject(e)
      })
      .then(
        function (v) { if (useLoading) finishLoading(url); return v },
        function (e) { if (useLoading) finishLoading(url); throw e }
      )
  },
  // 文件上传（FormData）
  upload: function (url, formData, options) {
    options = options || {}
    var useLoading = options.withLoading !== false
    var token = localStorage.getItem('nova_token') || ''
    var allHeaders = Object.assign(
      token ? { 'token': token } : {},
      currentLocaleHeader()
    )
    if (useLoading) startLoading(url)
    return fetch(url, {
      method: 'POST',
      headers: allHeaders,
      body: formData
    }).then(function (resp) { return resp.json() })
      .then(function (resp) {
        var errorResult = errorHandle(resp)
        if (errorResult) {
           return Promise.reject({ code: resp.code, message: resp.msg })
        }
        return resp
      })
      .catch(function (e) {
        if (e && !e.code && window.$message) {
          window.$message.error(window.__t('common.request_failed'))
        }
        return Promise.reject(e)
      })
      .then(
        function (v) { if (useLoading) finishLoading(url); return v },
        function (e) { if (useLoading) finishLoading(url); throw e }
      )
  }
}

function errorHandle(resp) {
    // token无效，清空本地并跳登录页
    if (resp.code === 520) {
      window.modal.confirm(window.__t('dialog.token_expired'), {
        title: window.__t('dialog.system_tip'),
        positiveText: window.__t('dialog.token_expired_action'),
        onConfirm: () => {
          localStorage.removeItem('nova_token')
          localStorage.removeItem('nova_user')
          localStorage.removeItem('nova_alias')
          localStorage.removeItem('nova_avatar')
          // replaceState 改 hash 不触发 SPA 导航，避免跳登录页时先闪页面元素再出动画
          history.replaceState(null, '', '#/login')
          window.location.reload()
        }
      })
      return true
    }
    // 用户权限校验未通过
    if (resp.code === 521) {
        history.replaceState(null, '', '#/404')
        window.location.reload()
    }
    // 接口异常
    if (resp.code === 500) {
        if (window.$message) {
            window.$message.error(resp.msg || window.__t('dialog.server_error'))
        }
        return true
    }
    return false
}

})()
