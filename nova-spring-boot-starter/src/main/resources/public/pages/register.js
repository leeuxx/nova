// pages/register.js - 注册页面组件

;(function () {

window.RegisterPage = {
  name: 'RegisterPage',

  data() {
    const cfg = window.nova.config
    return {
      loading: false,
      registerTitle: cfg.name,
      loginDesc:     cfg.desc,
      copyrightTxt:  cfg.copyrightTxt,
      logoImg: cfg.logo,
      formData: {
        username: '',
        password: '',
        name: '',
        alias: ''
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
        },
        name: {
          required: true,
          message: '请输入名称',
          trigger: 'blur'
        }
      }
    }
  },

  methods: {
    handleRegister() {
      this.$refs.formRef?.validate().then(() => {
        this.loading = true
        window.fetchApi.post('/nova/authority/register', this.formData).then((resp) => {
          const data = resp.data
          if (data && data.token) {
            // 完整保存登录态，直接进入首页
            localStorage.setItem('nova_token', data.token || '')
            localStorage.setItem('nova_user', data.name || '')
            localStorage.setItem('nova_alias', data.alias || '')
            localStorage.setItem('nova_avatar', data.avatar || '')
            if (window.$message) window.$message.success('注册成功，欢迎 ' + (data.name || ''))
            history.replaceState(null, '', '#/home')
            window.location.reload()
          } else {
            // 返回为空或 token 为空：跳转登录页
            if (window.$message) window.$message.warning(resp.message || '注册未返回有效登录信息，请前往登录')
            this.$router.push('/login')
          }
        }).finally(() => {
          this.loading = false
        })
      }).catch(() => {})
    },

    goLogin() {
      this.$router.push('/login')
    },

    handleKeyPress(e) {
      if (e.key === 'Enter') {
        this.handleRegister()
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
    <h1 class="login-title">{{ registerTitle }}</h1>
    <p class="login-subtitle">{{ loginDesc }}</p>
  </div>

  <!-- 右栏表单区 -->
  <div class="login-form-area">
    <div style="width:400px;max-width:90vw">
      <n-card class="login-card" :bordered="false" content-style="min-height:500px;padding:40px 32px 60px;display:flex;flex-direction:column;justify-content:center;position:relative;">
      <n-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-placement="left"
        :label-width="60"
        size="large"
        style="position:relative"
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

        <n-form-item label="名称" path="name">
          <n-input
            v-model:value="formData.name"
            placeholder="请输入名称"
            clearable
            @keyup.enter="handleKeyPress"
            :bordered="true"
          >
            <template #prefix>
              <n-icon color="#2563eb"><iconify-icon icon="lucide:id-card"></iconify-icon></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item label="别名" path="alias">
          <n-input
            v-model:value="formData.alias"
            placeholder="请输入别名（可选）"
            clearable
            @keyup.enter="handleKeyPress"
            :bordered="true"
          >
            <template #prefix>
              <n-icon color="#2563eb"><iconify-icon icon="lucide:tag"></iconify-icon></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item :show-label="false" style="margin-top:2px">
          <n-button
            type="primary"
            size="large"
            style="width:100%"
            :loading="loading"
            @click="handleRegister"
          >
            注 册
          </n-button>
        </n-form-item>

        <!-- 返回登录：相对 n-form 绝对定位，从注册按钮下方开始，不占文档流，注册信息保持垂直居中 -->
        <n-form-item :show-label="false" style="position:absolute;top:100%;left:0;right:0;margin:0">
          <div style="width:100%;text-align:center;font-size:13px;margin-top:6px">
            <span style="color:#94a3b8">已有账号？</span>
            <span class="login-remember-text" style="color:#2563eb" @click="goLogin">返回登录</span>
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
    { RegisterPage: window.RegisterPage }
  )
}
