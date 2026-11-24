// pages/home.js - 首页欢迎页组件（静态，不生成 tab）

;(function () {

window.HomePage = {
  name: 'HomePage',

  data() {
    const cfg = window.nova.config
    return {
      // 品牌文字（index.json logoText，mountApp 时写入全局）
      homeLogText: window.__novaLogText,
      homeDesc:    cfg.desc,
      // 自定义首页地址（本地 public 或远程 URL），空 = 内置欢迎页
      homePage:    (cfg.home && cfg.home.page) || '',
      // 主题取访问时的快照，切换主题后不热更新（iframe 重载体验差）
      theme:       window.__appDarkMode.value ? 'night' : 'daytime'
    }
  },

  computed: {
    iframeUrl() {
      const url = this.homePage
      if (!url) return ''
      const token = localStorage.getItem('nova_token') || ''
      const sep = url.indexOf('?') > -1 ? '&' : '?'
      return url + sep
        + 'token=' + encodeURIComponent(token)
        + '&theme=' + this.theme
        + '&locale=' + ((window.__appLocale && window.__appLocale.value) || 'zh')
    }
  },

  template: `
<div :style="homePage ? 'height:100%' : ''">
  <div v-if="!homePage" class="home-wrap">
    <img class="home-img" src="images/home.png" />
    <p class="home-title">{{ __t('home.welcome', { name: homeLogText }) }}</p>
    <p class="home-subtitle">{{ homeDesc }}</p>
  </div>
  <iframe v-else :src="iframeUrl" style="width:100%;height:100%;border:none;display:block"></iframe>
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