// pages/not-found.js - 404 页面组件

;(function () {

window._404_TEMPLATE = [
  '<div class="login-container">',
  '<div class="blur-orb orb-1"></div><div class="blur-orb orb-2"></div><div class="blur-orb orb-3"></div><div class="blur-orb orb-4"></div><div class="blur-orb orb-5"></div>',
  '<div class="notfound-wrap">',
  '<img class="notfound-img" src="images/404.png" />',
  '<div class="notfound-content">',
  '<div class="notfound-code">404</div>',
  '<h1 class="notfound-title">' + window.__t('notfound.title') + '</h1>',
  '<p class="notfound-desc">' + window.__t('notfound.desc') + '</p>',
  '<div class="notfound-actions">',
  '<n-button type="primary" size="large" onclick="history.replaceState(null, \'\', \'#/home\');window.location.reload()">' + window.__t('notfound.back_home') + '</n-button>',
  '</div>',
  '</div>',
  '</div></div>'
].join('')

window.NotFoundPage = {
  name: 'NotFoundPage',
  template: window._404_TEMPLATE
}

})()
