// pages/login.js - 登录页面组件

;(function () {

window.LoginPage = {
  name: 'LoginPage',

  created() {
    this.loadRememberedAccount()
    this.checkTokenAndRedirect()
  },

  data() {
    return {
      loading: false,
      rememberMe: false,
      formData: {
        username: '',
        password: ''
      },
      formRules: {
        username: {
          required: true,
          message: '请输入账号',
          trigger: 'blur'
        },
        password: {
          required: true,
          message: '请输入密码',
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
          // token 有效，直接进入主页
          window.location.hash = '#/home'
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
            if (window.$message) window.$message.success('登录成功，欢迎 ' + resp.data.name)
            // 登录成功后重新加载页面以拉取菜单
            window.location.hash = '#/home'
            window.location.reload()
          } else {
            if (window.$message) window.$message.error(resp.message || '登录失败，请检查账号密码')
          }
        }).catch(() => {
          if (window.$message) window.$message.error('网络错误，请稍后重试')
        }).finally(() => {
          this.loading = false
        })
      }).catch(() => {})
    },

    handleKeyPress(e) {
      if (e.key === 'Enter') {
        this.handleLogin()
      }
    }
  },

  template: `
<div class="login-container" style="height:100vh;overflow:hidden;display:flex;justify-content:center;align-items:flex-start;position:relative;padding:80px 80px 0;">
  <!-- 动态光晕背景 -->
  <div class="blur-orb orb-1"></div>
  <div class="blur-orb orb-2"></div>
  <div class="blur-orb orb-3"></div>
  <div class="blur-orb orb-4"></div>
  <div class="blur-orb orb-5"></div>

  <!-- 登录卡片 -->
  <div style="width:400px;max-width:90vw;position:relative;z-index:1">
    <div style="text-align:center;margin-bottom:40px">
      <h1 class="login-title">Nova Admin</h1>
      <p class="login-subtitle">简洁高效的后台管理系统</p>
    </div>

    <n-card class="login-card" :bordered="false" content-style="min-height:380px;padding:48px 32px;display:flex;flex-direction:column;justify-content:center;">
      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-placement="left"
        :label-width="60"
        size="large"
      >
        <n-form-item label="账号" path="username">
          <n-input
            v-model:value="formData.username"
            placeholder="请输入账号"
            clearable
            @keyup.enter="handleKeyPress"
            :bordered="true"
          >
            <template #prefix>
              <n-icon color="#2563eb"><iconify-icon icon="lucide:user"></iconify-icon></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
            @keyup.enter="handleKeyPress"
            :bordered="true"
          >
            <template #prefix>
              <n-icon color="#2563eb"><iconify-icon icon="lucide:lock"></iconify-icon></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item :show-label="false" style="margin-top:-20px;margin-bottom:-20px">
          <div style="display:flex;align-items:center;gap:6px;margin-left:12px">
            <n-checkbox v-model:checked="rememberMe" size="small" />
            <span class="login-remember-text" @click="rememberMe=!rememberMe">记住账号</span>
          </div>
        </n-form-item>

        <n-form-item :show-label="false" style="margin-top:2px">
          <n-button
            type="primary"
            size="large"
            style="width:100%"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 底部版权信息 -->
    <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:12px">
      © 2026 Nova Admin. All Rights Reserved.
    </div>
  </div>
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
