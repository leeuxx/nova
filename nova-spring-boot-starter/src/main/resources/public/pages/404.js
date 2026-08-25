// pages/not-found.js - 404 页面组件

;(function () {

window._404_TEMPLATE = [
  '<div class="login-container">',
  '<div class="blur-orb orb-1"></div><div class="blur-orb orb-2"></div><div class="blur-orb orb-3"></div><div class="blur-orb orb-4"></div><div class="blur-orb orb-5"></div>',
  '<div class="notfound-wrap">',
  '<div class="notfound-code">404</div>',
  '<h1 class="notfound-title">页面未找到</h1>',
  '<p class="notfound-desc">抱歉，您访问的页面不存在或已被移除</p>',
  '<div class="notfound-actions">',
  '<n-button type="primary" size="large" onclick="history.replaceState(null, \'\', \'#/home\');window.location.reload()">返回首页</n-button>',
  '<n-button size="large" onclick="history.length > 1 ? history.back() : (history.replaceState(null, \'\', \'#/home\'), window.location.reload())">返回上页</n-button>',
  '</div>',
  '</div></div>'
].join('')

window.NotFoundPage = {
  name: 'NotFoundPage',
  template: window._404_TEMPLATE
}

})()
