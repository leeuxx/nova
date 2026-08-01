// loading.js — 跳跃方块 loading 动画，样式与 DOM 统一在此维护
;(function () {
  var CSS_ID = 'nova-loading-jump-css'

  var css = [
    '.nova-jump-box{display:flex;flex-direction:column;align-items:center}',
    '.nova-jump-loader{height:48px;position:relative;width:48px}',
    '.nova-jump-loader:before{animation:nova-jump-shadow .5s linear infinite;background:rgba(37,99,235,.5);background:hsl(var(--primary,221 83% 53%)/50%);border-radius:50%;height:5px;top:60px;width:48px}',
    '.nova-jump-loader:after,.nova-jump-loader:before{content:"";left:0;position:absolute}',
    '.nova-jump-loader:after{animation:nova-jump-ani .5s linear infinite;background:#2563eb;background:hsl(var(--primary,221 83% 53%));border-radius:4px;height:100%;top:0;width:100%}',
    '@keyframes nova-jump-ani{15%{border-bottom-right-radius:3px}25%{transform:translateY(9px) rotate(22.5deg)}50%{border-bottom-right-radius:40px;transform:translateY(18px) scaleY(.9) rotate(45deg)}75%{transform:translateY(9px) rotate(67.5deg)}to{transform:translateY(0) rotate(90deg)}}',
    '@keyframes nova-jump-shadow{0%,to{transform:scale(1)}50%{transform:scaleX(1.2)}}',
    '.nova-jump-title{color:rgba(0,0,0,.85);font-size:28px;font-weight:600;margin-top:66px;text-align:center;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6}',
    '.dark .nova-jump-title{color:#fff}'
  ].join('\n')

  function ensureCss() {
    if (document.getElementById(CSS_ID)) return
    var style = document.createElement('style')
    style.id = CSS_ID
    style.textContent = css
    document.head.appendChild(style)
  }

  function jumpHtml(text) {
    var title = text ? '<div class="nova-jump-title" style="font-family:system-ui,-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;line-height:1.6">' + text + '</div>' : ''
    return '<div class="nova-jump-box"><div class="nova-jump-loader"></div>' + title + '</div>'
  }

  window.NovaLoading = {
    // 各场景加载动画最短展示时长（ms）：接口再快也完整播放，避免闪烁
    minDuration: {
      boot: 500,      // 首屏全屏加载动画
      build: 500,     // 普通表格 buildLoading 遮罩
      linkTree: 500   // LINK 树 / 双表右表树
    },
    // 返回跳跃方块动画的 HTML，text 为自定义文本，空则不显示，配合 v-html 使用
    html: function (text) {
      ensureCss()
      return jumpHtml(text)
    },
    // 将跳跃方块动画挂载到指定元素，text 为自定义文本，空则不显示
    mount: function (el, text) {
      ensureCss()
      el.innerHTML = jumpHtml(text)
    }
  }

  ensureCss()
})()
