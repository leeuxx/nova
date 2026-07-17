// pages/not-found.js - 404 页面组件

;(function () {

window.NotFoundPage = {
  name: 'NotFoundPage',

  template: `
<div style="height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative;background:#fff;padding:60px 80px;">
  <div class="blur-orb orb-1"></div>
  <div class="blur-orb orb-2"></div>
  <div class="blur-orb orb-3"></div>
  <div class="blur-orb orb-4"></div>
  <div class="blur-orb orb-5"></div>

  <div style="text-align:center;position:relative;z-index:1;margin-top:-15%">
      <div style="font-size:120px;font-weight:700;color:#2563eb;line-height:1;margin-bottom:8px;opacity:0.15">404</div>
      <h1 style="font-size:28px;font-weight:600;color:#1e293b;margin:0 0 12px 0">页面未找到</h1>
      <p style="font-size:14px;color:#94a3b8;margin:0 0 32px 0">抱歉，您访问的页面不存在或已被移除</p>
    </div>
</div>
`
}

})()
