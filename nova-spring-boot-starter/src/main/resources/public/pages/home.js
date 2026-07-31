// pages/home.js - 首页欢迎页组件（静态，不生成 tab）

;(function () {

window.HomePage = {
  name: 'HomePage',

  data() {
    return {
      // 品牌文字（index.json logoText，mountApp 时写入全局）
      homeLogText: window.__novaLogText
    }
  },

  template: `
<div class="home-wrap">
  <div class="home-header">
    <div class="home-logo">
      <iconify-icon icon="material-symbols:bolt" style="color:#fff;font-size:28px"></iconify-icon>
    </div>
    <div>
      <h1 class="home-title">欢迎使用 {{ homeLogText }}</h1>
      <p class="home-subtitle">简洁高效的后台管理系统</p>
    </div>
  </div>

  <div class="home-grid">
    <div class="home-card">
      <n-icon size="24" color="#2563eb"><iconify-icon icon="material-symbols:dashboard-outline"></iconify-icon></n-icon>
      <div class="home-card-title">模块化设计</div>
      <div class="home-card-desc">各功能模块独立，按需加载，易于扩展维护</div>
    </div>
    <div class="home-card">
      <n-icon size="24" color="#10b981"><iconify-icon icon="material-symbols:lock-outline"></iconify-icon></n-icon>
      <div class="home-card-title">权限控制</div>
      <div class="home-card-desc">基于角色和菜单的细粒度权限，灵活配置</div>
    </div>
    <div class="home-card">
      <n-icon size="24" color="#f59e0b"><iconify-icon icon="material-symbols:nightlight-outline"></iconify-icon></n-icon>
      <div class="home-card-title">日夜主题</div>
      <div class="home-card-desc">支持明亮与暗黑主题一键切换，舒适护眼</div>
    </div>
  </div>
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
