// pages/not-found.js - 404 页面组件

;(function () {

window.NotFoundPage = {
  name: 'NotFoundPage',
  data() {
    return {
      title: '',
      desc: '',
      backHome: ''
    }
  },
  async created() {
    await window.__i18nReady
    this.title = window.__t('notfound.title')
    this.desc = window.__t('notfound.desc')
    this.backHome = window.__t('notfound.back_home')
  },
  template: `
<div class="login-container">
  <div class="blur-orb orb-1"></div><div class="blur-orb orb-2"></div><div class="blur-orb orb-3"></div><div class="blur-orb orb-4"></div><div class="blur-orb orb-5"></div>
  <div class="notfound-wrap">
    <img class="notfound-img" src="images/404.png" />
    <div class="notfound-content">
      <div class="notfound-code">404</div>
      <h1 class="notfound-title">{{ title }}</h1>
      <p class="notfound-desc">{{ desc }}</p>
      <div class="notfound-actions">
        <n-button type="primary" size="large" @click="goHome">{{ backHome }}</n-button>
      </div>
    </div>
  </div>
</div>`,
  methods: {
    goHome() {
      history.replaceState(null, '', '#/home')
      window.location.reload()
    }
  }
}

})()
