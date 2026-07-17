// fetch.js — 统一 fetch 工具，自动带上本地 token，统一 POST + JSON
;(function () {

window.fetchApi = {
  // 普通请求（POST + JSON）
  post: function (url, data, headers) {
    data  = data  || {}
    headers = headers || {}
    var token = localStorage.getItem('nova_token') || ''
    var allHeaders = Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { 'token': token } : {},
      headers
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
    return fetch(url, {
      method: 'POST',
      headers: token ? { 'token': token } : {},
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
      window.msg.confirm('warning', '系统提示', '登录状态已过期，您可以继续留在该页面，或者重新登录', () => {
          localStorage.removeItem('nova_token')
          localStorage.removeItem('nova_user')
          localStorage.removeItem('nova_alias')
          localStorage.removeItem('nova_avatar')
          window.location.hash = '#/login'
          window.location.reload()
      })
      return true
    }
    // 接口异常
    if (resp.code === 500) {
        if (window.$message) {
            window.$message.error(resp.msg || '服务器异常')
        }
        return true
    }
    return false
}

})()
