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
    async checkTokenAndRedirect() {
      var token = localStorage.getItem('nova_token')
      if (!token) return
      try {
        var resp = await fetch('/nova/authority/checkToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          }
        }).then(r => r.json())
        if (resp.code === 200 && resp.data === true) {
          // token 有效，直接进入主页
          window.location.hash = '#/home'
          window.location.reload()
        } else {
          // token 无效，清除本地
          this.clearAuth()
        }
      } catch (e) {
        // 网络错误时不清除，让用户手动登录
      }
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

    async handleLogin() {
      // 验证表单
      const valid = await this.$refs.formRef?.validate().catch(() => false)
      if (!valid) return

      // 记住账号逻辑
      if (this.rememberMe) {
        localStorage.setItem('nova_remember_user', this.formData.username)
      } else {
        localStorage.removeItem('nova_remember_user')
      }

      this.loading = true
      try {
        const resp = await fetch('/nova/authority/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.formData)
        }).then(r => r.json())

        if (resp.code === 200 && resp.data) {
          // 完整保存登录态
          localStorage.setItem('nova_token', resp.data.token || '')
          localStorage.setItem('nova_user', resp.data.name || this.formData.username)
          localStorage.setItem('nova_alias', resp.data.alias || '')
          localStorage.setItem('nova_avatar', resp.data.avatar || '')
          if (window.$message) window.$message.success('登录成功，欢迎 ' + (resp.data.alias || resp.data.name))
          // 登录成功后重新加载页面以拉取菜单
          window.location.hash = '#/home'
          window.location.reload()
        } else {
          if (window.$message) window.$message.error(resp.message || '登录失败，请检查账号密码')
        }
      } catch (e) {
        if (window.$message) window.$message.error('网络错误，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    handleKeyPress(e) {
      if (e.key === 'Enter') {
        this.handleLogin()
      }
    }
  },

  template: `
<div style="height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative;background:#fff;padding:60px 80px;">
  <!-- 动态光晕背景 -->
  <div class="blur-orb orb-1"></div>
  <div class="blur-orb orb-2"></div>
  <div class="blur-orb orb-3"></div>
  <div class="blur-orb orb-4"></div>
  <div class="blur-orb orb-5"></div>

  <!-- 登录卡片 -->
  <div style="width:400px;max-width:90vw;position:relative;z-index:1;margin-top:-10%">
    <div style="text-align:center;margin-bottom:40px">
      <h1 style="font-size:32px;font-weight:600;color:#1e293b;margin:0 0 12px 0;letter-spacing:1px">Nova Admin</h1>
      <p style="font-size:14px;color:#94a3b8;margin:0">简洁高效的后台管理系统</p>
    </div>

    <n-card :bordered="false" style="background:rgba(255,255,255,0.85);backdrop-filter:blur(10px);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.06);min-height:380px;" content-style="min-height:380px;padding:48px 32px;display:flex;flex-direction:column;justify-content:center;">
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
          <div style="display:flex;align-items:center;gap:6px">
            <n-checkbox v-model:checked="rememberMe" size="small" />
            <span style="font-size:13px;color:#64748b;cursor:pointer" @click="rememberMe=!rememberMe">记住账号</span>
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
