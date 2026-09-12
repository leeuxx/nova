// pages/register.js - 注册页面组件
// 设计参考 public/test.html（与 login 同构）；暗色模式与全局 nova-theme 联动

;(function () {

const { h } = Vue
const { NIcon } = naive
const mi = (icon) => () => h(NIcon, { size: 16 }, { default: () => h('iconify-icon', { icon }) })

// 语言切换（与主页一致）
const LOCALE_LABELS = {
  zh: { label: '中文',    icon: 'circle-flags:cn' },
  en: { label: 'English', icon: 'circle-flags:us' },
  ja: { label: '日本語',  icon: 'circle-flags:jp' },
  ko: { label: '한국어',  icon: 'circle-flags:kr' }
}

// 左侧插画 SVG（与 login 一致）
const ILLUSTRATION_SVG = `
<svg viewBox="0 0 600 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#eaf0fc" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="circleGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a8c0ff"/>
      <stop offset="100%" stop-color="#c8b6ff"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a8c0ff" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#a8c0ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gradPink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd6e8"/>
      <stop offset="100%" stop-color="#e0c8ff"/>
    </linearGradient>
    <linearGradient id="gradSecondary" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#b8d4ff"/>
      <stop offset="100%" stop-color="#dcc8ff"/>
    </linearGradient>
  </defs>

  <circle class="pulse-soft" cx="300" cy="260" r="220" fill="url(#halo)"/>

  <g class="float-slow" style="transform-origin: 300px 260px;">
    <circle cx="300" cy="260" r="200" fill="none" stroke="#a8c0ff" stroke-width="1"
            opacity="0.28" stroke-dasharray="4 14"/>
  </g>

  <g class="card-stack">
    <rect x="200" y="190" width="150" height="160" rx="22"
          fill="url(#cardGrad)" opacity="0.4"
          transform="rotate(-6, 275, 270)"/>
    <rect x="210" y="185" width="150" height="160" rx="22"
          fill="url(#cardGrad)" opacity="0.7"
          transform="rotate(-2, 285, 265)"/>
    <g transform="rotate(2, 295, 260)">
      <rect x="220" y="180" width="150" height="160" rx="22"
            fill="url(#cardGrad)" stroke="#ffffff" stroke-width="1.2"/>
      <rect x="238" y="204" width="60" height="8" rx="4" fill="#a8c0ff" opacity="0.55"/>
      <rect x="238" y="224" width="100" height="6" rx="3" fill="#c8d6f5" opacity="0.7"/>
      <rect x="238" y="240" width="80" height="6" rx="3" fill="#c8d6f5" opacity="0.6"/>
      <rect x="238" y="256" width="110" height="6" rx="3" fill="#c8d6f5" opacity="0.5"/>
      <circle cx="340" cy="300" r="6" fill="#a8c0ff" opacity="0.6"/>
      <circle cx="356" cy="300" r="6" fill="#c8b6ff" opacity="0.5"/>
      <circle cx="372" cy="300" r="6" fill="#c8d6f5" opacity="0.4"/>
    </g>
  </g>

  <g class="arc-system" style="transform-origin: 380px 280px;">
    <circle cx="380" cy="280" r="72" fill="none" stroke="url(#circleGrad)" stroke-width="1" opacity="0.18"/>
    <path class="arc-spin" d="M 380 208 A 72 72 0 0 1 452 280"
          fill="none" stroke="url(#circleGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <path class="arc-spin-rev" d="M 308 280 A 72 72 0 0 0 380 352"
          fill="none" stroke="#c8b6ff" stroke-width="1.8" stroke-linecap="round" opacity="0.75"/>
    <path class="arc-spin-slow" d="M 380 232 A 48 48 0 0 1 428 280 A 48 48 0 0 1 380 328"
          fill="none" stroke="#a8c0ff" stroke-width="1.2" stroke-linecap="round" opacity="0.55" stroke-dasharray="4 7"/>
    <path class="arc-spin-rev" d="M 344 280 A 36 36 0 0 1 380 244"
          fill="none" stroke="#b8d4ff" stroke-width="1" stroke-linecap="round" opacity="0.65"/>
    <circle class="core-pulse" cx="380" cy="280" r="9" fill="url(#circleGrad)"/>
    <circle cx="380" cy="280" r="9" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.7"/>
    <circle cx="377" cy="277" r="3.5" fill="#ffffff" opacity="0.85"/>
  </g>

  <g class="float-fast" style="transform-origin: 140px 160px;">
    <rect x="120" y="140" width="40" height="40" rx="11"
          fill="url(#gradPink)" opacity="0.9"
          transform="rotate(-22, 140, 160)"/>
    <rect x="120" y="140" width="40" height="40" rx="11"
          fill="none" stroke="#ffffff" stroke-width="1.3" opacity="0.85"
          transform="rotate(-22, 140, 160)"/>
  </g>

  <g class="float-slow" style="transform-origin: 470px 150px;">
    <circle cx="470" cy="150" r="38" fill="url(#circleGrad)" opacity="0.85"/>
    <circle cx="470" cy="150" r="38" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.7"/>
    <circle cx="470" cy="150" r="15" fill="#ffffff" opacity="0.7"/>
  </g>

  <circle class="pulse-soft" cx="130" cy="380" r="5" fill="#c8b6ff" opacity="0.7"/>

  <g class="float-slow-rev" style="transform-origin: 460px 400px;">
    <rect x="440" y="380" width="40" height="40" rx="11"
          fill="url(#gradSecondary)" opacity="0.9"
          transform="rotate(28, 460, 400)"/>
    <rect x="440" y="380" width="40" height="40" rx="11"
          fill="none" stroke="#ffffff" stroke-width="1.3" opacity="0.8"
          transform="rotate(28, 460, 400)"/>
  </g>

  <circle class="pulse-soft" cx="220" cy="120" r="6" fill="#a8c0ff" opacity="0.75"/>
  <circle class="pulse-soft" cx="420" cy="110" r="5" fill="#c8b6ff" opacity="0.75"/>
  <circle class="pulse-soft" cx="510" cy="300" r="5" fill="#ffb8d4" opacity="0.7"/>
  <circle class="pulse-soft" cx="90" cy="300" r="4" fill="#b8d4ff" opacity="0.75"/>
  <circle class="pulse-soft" cx="380" cy="470" r="5" fill="#a8c0ff" opacity="0.75"/>
  <circle class="pulse-soft" cx="180" cy="480" r="4" fill="#c8b6ff" opacity="0.75"/>

  <g class="float-slow" style="transform-origin: 520px 240px;" opacity="0.65">
    <path d="M520 232 v16 M512 240 h16" stroke="#a8c0ff" stroke-width="2.4" stroke-linecap="round"/>
  </g>
  <g class="float-med" style="transform-origin: 80px 220px;" opacity="0.55">
    <path d="M80 212 v16 M72 220 h16" stroke="#c8b6ff" stroke-width="2.4" stroke-linecap="round"/>
  </g>

  <path class="float-slow" d="M420 460 Q 480 420 540 460"
        fill="none" stroke="#a8c0ff" stroke-width="1.8" stroke-linecap="round" opacity="0.55" stroke-dasharray="1 8"/>
  <path class="float-slow-rev" d="M60 140 Q 100 100 140 140"
        fill="none" stroke="#c8b6ff" stroke-width="1.8" stroke-linecap="round" opacity="0.55" stroke-dasharray="1 8"/>
</svg>
`

window.RegisterPage = {
  name: 'RegisterPage',

  created() {
    this.checkTokenAndRedirect()
    if (window.__appDarkMode) {
      this.syncDarkClass(window.__appDarkMode.value)
      this._unwatchDark = this.$watch(
        () => window.__appDarkMode && window.__appDarkMode.value,
        (val) => this.syncDarkClass(val)
      )
    }
  },

  beforeUnmount() {
    if (this._unwatchDark) this._unwatchDark()
  },

  data() {
    const cfg = window.nova.config
    return {
      loading: false,
      isDark: false,
      registerTitle: cfg.name,
      slogan: cfg.desc,
      logo: cfg.logo,
      copyrightTxt: cfg.copyrightTxt,
      supportedLocales: (cfg.i18n && cfg.i18n.languages) || ['zh', 'en', 'ja', 'ko'],
      currentLocale: (window.__appLocale && window.__appLocale.value) || 'zh',
      formData: {
        username: '',
        password: '',
        name: '',
        alias: ''
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
        },
        name: {
          required: true,
          message: window.__t('register.name_placeholder'),
          trigger: 'blur'
        }
      }
    }
  },

  computed: {
    illustrationSvg() { return ILLUSTRATION_SVG },

    localeDropdown() {
      return this.supportedLocales
        .filter((k) => LOCALE_LABELS[k])
        .map((k) => ({ label: LOCALE_LABELS[k].label, key: k, icon: mi(LOCALE_LABELS[k].icon) }))
    }
  },

  methods: {
    syncDarkClass(val) {
      this.isDark = !!val
    },

    toggleTheme() {
      if (window.__appDarkMode) {
        window.__appDarkMode.value = !window.__appDarkMode.value
      }
    },

    handleLocaleSelect(key) {
      if (!key || key === this.currentLocale) return
      if (window.__i18n && typeof window.__i18n.setLocale === 'function') {
        window.__i18n.setLocale(key)
      }
    },

    localeNodeProps(rawNode) {
      if (rawNode && rawNode.key === this.currentLocale) {
        return { style: 'background:rgba(24,160,88,0.12)' }
      }
      return {}
    },

    checkTokenAndRedirect() {
      if (!localStorage.getItem('nova_token')) return
      window.fetchApi.post('/nova/authority/checkToken').then((resp) => {
        if (resp.data === true) {
          history.replaceState(null, '', '#/home')
          window.location.reload()
        } else {
          this.clearAuth()
        }
      }).catch(() => {})
    },

    clearAuth() {
      localStorage.removeItem('nova_token')
      localStorage.removeItem('nova_user')
      localStorage.removeItem('nova_alias')
      localStorage.removeItem('nova_avatar')
    },

    handleRegister() {
      this.$refs.formRef?.validate().then(() => {
        this.loading = true
        window.fetchApi.post('/nova/authority/register', this.formData).then((resp) => {
          const data = resp.data
          if (data && data.token) {
            localStorage.setItem('nova_token', data.token || '')
            localStorage.setItem('nova_user', data.name || '')
            localStorage.setItem('nova_alias', data.alias || '')
            localStorage.setItem('nova_avatar', data.avatar || '')
            if (window.$message) window.$message.success(window.__t('register.success', { name: data.name || '' }))
            history.replaceState(null, '', '#/home')
            window.location.reload()
          } else {
            if (window.$message) window.$message.warning(resp.message || window.__t('register.invalid_response'))
            this.$router.push('/login')
          }
        }).finally(() => {
          this.loading = false
        })
      }).catch(() => {})
    },

    handleKeyPress(e) {
      if (e.key === 'Enter') {
        this.handleRegister()
      }
    },

    goLogin() {
      this.$router.push('/login')
    }
  },

  template: `
<div class="login" :class="{ dark: isDark }">
  <!-- 柔光背景 -->
  <div class="glow-bg" aria-hidden="true">
    <div class="glow glow-1"></div>
    <div class="glow glow-2"></div>
    <div class="glow glow-3"></div>
  </div>

  <!-- 语言切换按钮 -->
  <n-dropdown
    :options="localeDropdown"
    trigger="hover"
    @select="handleLocaleSelect"
    key-field="key"
    :node-props="localeNodeProps"
    placement="bottom-end"
  >
    <button class="lang-toggle" type="button" aria-label="切换语言">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/>
        <path d="M3 12h18"/>
        <path d="M12 3a14 14 0 0 1 0 18"/>
        <path d="M12 3a14 14 0 0 0 0 18"/>
      </svg>
    </button>
  </n-dropdown>

  <!-- 主题切换按钮 -->
  <n-tooltip placement="bottom" :show-arrow="true">
    <template #trigger>
      <button class="theme-toggle" type="button"
              @click="toggleTheme"
              aria-label="切换主题">
        <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/>
          <path d="M12 20v2"/>
          <path d="M4.93 4.93l1.41 1.41"/>
          <path d="M17.66 17.66l1.41 1.41"/>
          <path d="M2 12h2"/>
          <path d="M20 12h2"/>
          <path d="M6.34 17.66l-1.41 1.41"/>
          <path d="M19.07 4.93l-1.41 1.41"/>
        </svg>
      </button>
    </template>
    {{ isDark ? __t('common.theme_light') : __t('common.theme_dark') }}
  </n-tooltip>

  <!-- 主布局 -->
  <div class="layout">

    <!-- 左侧插画面板 -->
    <div class="left-panel">
      <div class="left-inner">
        <div class="illustration" aria-hidden="true" v-html="illustrationSvg"></div>
        <div class="left-caption">
          <p class="caption-desc">{{ slogan }}</p>
        </div>
      </div>
    </div>

    <!-- 右侧全高面板 -->
    <div class="right-panel">
      <div class="panel-inner">

        <div class="panel-content">

          <div class="panel-header">
            <div class="panel-brand">
              <div class="panel-brand-logo" :class="{ 'has-logo': !!logo }">
                <img v-if="logo" :src="logo" alt="" />
                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z"/>
                  <path d="M12 22V12"/>
                  <path d="M12 12l8-5"/>
                  <path d="M12 12L4 7"/>
                </svg>
              </div>
              <div class="panel-brand-name">{{ registerTitle }}</div>
            </div>
          </div>

          <div class="panel-form-wrap">

            <p class="panel-subtitle">{{ __t('register.subtitle') }}</p>

            <n-form
              ref="formRef"
              class="login-form"
              :model="formData"
              :rules="formRules"
              label-placement="top"
              @keyup.enter="handleKeyPress"
            >
              <n-form-item :show-label="false" path="username">
                <div class="input-group">
                  <div class="input-wrap">
                    <svg class="input-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 21v-2a6 6 0 0 1 12 0v2"/>
                    </svg>
                    <input
                      class="form-input"
                      type="text"
                      v-model="formData.username"
                      :placeholder="__t('login.username_placeholder')"
                      autocomplete="username"
                    />
                  </div>
                </div>
              </n-form-item>

              <n-form-item :show-label="false" path="password">
                <div class="input-group">
                  <div class="input-wrap">
                    <svg class="input-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="10" rx="2"/>
                      <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
                    </svg>
                    <input
                      class="form-input"
                      type="password"
                      v-model="formData.password"
                      :placeholder="__t('login.password_placeholder')"
                      autocomplete="new-password"
                    />
                  </div>
                </div>
              </n-form-item>

              <n-form-item :show-label="false" path="name">
                <div class="input-group">
                  <div class="input-wrap">
                    <svg class="input-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="2" y="5" width="20" height="14" rx="2"/>
                      <circle cx="8" cy="12" r="2.2"/>
                      <path d="M14 10h6"/>
                      <path d="M14 14h6"/>
                    </svg>
                    <input
                      class="form-input"
                      type="text"
                      v-model="formData.name"
                      :placeholder="__t('register.name_placeholder')"
                    />
                  </div>
                </div>
              </n-form-item>

              <n-form-item :show-label="false">
                <div class="input-group">
                  <div class="input-wrap">
                    <svg class="input-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                      <circle cx="7" cy="7" r="1.5"/>
                    </svg>
                    <input
                      class="form-input"
                      type="text"
                      v-model="formData.alias"
                      :placeholder="__t('register.alias_placeholder')"
                    />
                  </div>
                </div>
              </n-form-item>

              <button
                type="button"
                class="login-btn"
                :disabled="loading"
                @click="handleRegister"
              >
                <template v-if="loading">{{ __t('login.submitting') }}</template>
                <template v-else>{{ __t('register.submit') }}</template>
              </button>
            </n-form>

            <div class="panel-bottom">
              <span>{{ __t('register.has_account') }}</span>
              <a @click="goLogin">{{ __t('register.go_login') }}</a>
            </div>
          </div>
        </div>

        <div class="panel-copyright">{{ copyrightTxt }}</div>
      </div>
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
    { RegisterPage: window.RegisterPage }
  )
}