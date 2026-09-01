// pages/login.js - 登录页面组件

;(function () {

window.LoginPage = {
  name: 'LoginPage',

  created() {
    this.loadRememberedAccount()
    this.checkTokenAndRedirect()
  },

  data() {
    const cfg = window.nova.config
    return {
      loading: false,
      rememberMe: false,
      loginTitle:    cfg.name,
      loginDesc:     cfg.desc,
      copyrightTxt:  cfg.copyrightTxt,
      registerEnabled: cfg.user.register,
      logoImg: cfg.logo,
      formData: {
        username: '',
        password: ''
      },
      formRules: {
        username: {
          required: true,
          message: window.__t('login.username_placeholder'),
          trigger: 'blur'
        },
        password: {
          required: true,
          message: window.__t('login.password_placeholder'),
          trigger: 'blur'
        }
      }
    }
  },

  methods: {
    // 检查本地 token 是否有效
    checkTokenAndRedirect() {
      if (!localStorage.getItem('nova_token')) return
      window.fetchApi.post('/nova/authority/checkToken').then((resp) => {
        if (resp.data === true) {
          // token 有效，直接进入主页（replaceState 改 hash 不触发 SPA 导航，避免先闪主页元素再出动画）
          history.replaceState(null, '', '#/home')
          window.location.reload()
        } else {
          // token 无效，清除本地
          this.clearAuth()
        }
      }).catch(() => {
        // 网络错误时不清除，让用户手动登录
      })
    },

    clearAuth() {
      localStorage.removeItem('nova_token')
      localStorage.removeItem('nova_user')
      localStorage.removeItem('nova_alias')
      localStorage.removeItem('nova_avatar')
    },

    // 页面加载时读取记住的账号
    loadRememberedAccount() {
      const saved = localStorage.getItem('nova_remember_user')
      if (saved) {
        this.formData.username = saved
        this.rememberMe = true
      }
    },

    handleLogin() {
      // 验证表单
      this.$refs.formRef?.validate().then(() => {
        // 记住账号逻辑
        if (this.rememberMe) {
          localStorage.setItem('nova_remember_user', this.formData.username)
        } else {
          localStorage.removeItem('nova_remember_user')
        }

        this.loading = true
        window.fetchApi.post('/nova/authority/login', this.formData).then((resp) => {
          if (resp.data) {
            // 完整保存登录态
            localStorage.setItem('nova_token', resp.data.token || '')
            localStorage.setItem('nova_user', resp.data.name)
            localStorage.setItem('nova_alias', resp.data.alias || '')
            localStorage.setItem('nova_avatar', resp.data.avatar || '')
            if (window.$message) window.$message.success(window.__t('login.success', { name: resp.data.name }))
            // 登录成功后重新加载页面以拉取菜单（replaceState 改 hash 不触发 SPA 导航，避免先闪主页元素再出动画）
            history.replaceState(null, '', '#/home')
            window.location.reload()
          } else {
            if (window.$message) window.$message.error(resp.message || window.__t('login.failed'))
          }
        }).catch(() => {
        }).finally(() => {
          this.loading = false
        })
      }).catch(() => {})
    },

    handleKeyPress(e) {
      if (e.key === 'Enter') {
        this.handleLogin()
      }
    },

    goRegister() {
      if (this.registerEnabled) {
        this.$router.push('/register')
      } else {
        if (window.$message) window.$message.warning(window.__t('login.register_disabled'))
      }
    }
  },

  template: `
<div class="login-container">
  <!-- 动态光晕背景 -->
  <div class="blur-orb orb-1"></div>
  <div class="blur-orb orb-2"></div>
  <div class="blur-orb orb-3"></div>
  <div class="blur-orb orb-4"></div>
  <div class="blur-orb orb-5"></div>

  <!-- 品牌区 -->
  <div class="login-brand">
    <img v-if="logoImg" :src="logoImg" class="login-logo" alt="logo" />
    <h1 class="login-title">{{ loginTitle }}</h1>
    <p class="login-subtitle">{{ loginDesc }}</p>
  </div>

  <!-- 右栏表单区 -->
  <div class="login-form-area">
    <div style="width:400px;max-width:90vw">

    <n-card class="login-card" :bordered="false" content-style="padding:40px 32px 24px;">
      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-placement="top"
        :show-feedback="false"
        size="large"
        style="position:relative"
      >
        <n-form-item :show-label="false" path="username" style="margin-bottom:20px">
          <n-input
            v-model:value="formData.username"
            :placeholder="__t('login.username_placeholder')"
            clearable
            @keyup.enter="handleKeyPress"
            :bordered="true"
          >
            <template #prefix>
              <n-icon color="#2563eb"><iconify-icon icon="lucide:user"></iconify-icon></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item :show-label="false" path="password" style="margin-bottom:20px">
          <n-input
            v-model:value="formData.password"
            type="password"
            :placeholder="__t('login.password_placeholder')"
            show-password-on="click"
            @keyup.enter="handleKeyPress"
            :bordered="true"
          >
            <template #prefix>
              <n-icon color="#2563eb"><iconify-icon icon="lucide:lock"></iconify-icon></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item :show-label="false" style="margin-bottom:6px;margin-top:-12px">
          <div style="display:flex;align-items:center;gap:6px;margin-left:12px">
            <n-checkbox v-model:checked="rememberMe" size="small" />
            <span class="login-remember-text" @click="rememberMe=!rememberMe">{{ __t('login.remember') }}</span>
          </div>
        </n-form-item>

        <n-form-item :show-label="false">
          <n-button
            type="primary"
            size="large"
            style="width:100%"
            :loading="loading"
            @click="handleLogin"
          >
            {{ __t('login.submit') }}
          </n-button>
        </n-form-item>

        <!-- 注册入口：flow 布局，由 padding-bottom 给卡片底部留白 -->
        <n-form-item :show-label="false" style="margin-top:20px">
          <div style="width:100%;text-align:center;font-size:13px">
            <span style="color:#94a3b8">{{ __t('login.no_account') }}</span>
            <span class="login-remember-text" style="color:#2563eb" @click="goRegister">{{ __t('login.go_register') }}</span>
          </div>
        </n-form-item>
      </n-form>
    </n-card>
    </div>
  </div>

  <!-- 版权信息 -->
  <div class="login-copyright">{{ copyrightTxt }}</div>
</div>
`
}

})()

// 自注册
if (window.NovaUI) {
  window.NovaUI.components = Object.assign(
    window.NovaUI.components || {},
    { LoginPage: window.LoginPage }
  )
}
