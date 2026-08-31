// pages/home.js - 首页欢迎页组件（静态，不生成 tab）

;(function () {

window.HomePage = {
  name: 'HomePage',

  data() {
    const cfg = window.nova.config
    return {
      // 品牌文字（index.json logoText，mountApp 时写入全局）
      homeLogText: window.__novaLogText,
      homeDesc:    cfg.desc
    }
  },

  template: `
<div class="home-wrap">
  <img class="home-img" src="images/home.png" />
  <p class="home-title">{{ __t('home.welcome', { name: homeLogText }) }}</p>
  <p class="home-subtitle">{{ homeDesc }}</p>
</div>
`
}

// 自注册
if (window.NovaUI) {
  window.NovaUI.components = Object.assign(
    window.NovaUI.components || {},
    { HomePage: window.HomePage }
  )
}

})()