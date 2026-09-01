// fetch.js — 统一 fetch 工具，自动带上本地 token + 当前 locale，统一 POST + JSON
;(function () {

  // 从 window.__appLocale 读当前语言，固定覆盖 Accept-Language（后端 LocaleContextHolder.getLocale 依赖此 header）
  function currentLocaleHeader() {
    var loc = (window.__appLocale && window.__appLocale.value) || 'zh'
    return { 'Accept-Language': loc }
  }

window.fetchApi = {
  // 普通请求（POST + JSON）
  post: function (url, data, headers) {
    data  = data  || {}
    headers = headers || {}
    var token = localStorage.getItem('nova_token') || ''
    var allHeaders = Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { 'token': token } : {},
      headers,
      currentLocaleHeader()  // 固定覆盖 Accept-Language，放最后确保不被调用方覆盖
    )
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
  },
  // 文件上传（FormData）
  upload: function (url, formData) {
    var token = localStorage.getItem('nova_token') || ''
    var allHeaders = Object.assign(
      token ? { 'token': token } : {},
      currentLocaleHeader()
    )
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
