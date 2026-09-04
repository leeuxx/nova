// config-loader.js — 读取开发手写的 config.js，缺失字段填充默认值，输出完整的 window.nova.config
//
// 国际化字段（name / desc / tools[].name）支持两种写法：
//   1) string:   name: 'xxx'                          —— 直接返回
//   2) locale map: name: { zh: 'xx', en: 'xx', ... }  —— 按当前 locale 解析
// 框架不知道这些字段的业务含义，只负责"是字符串就返回、是 locale map 就按 locale 解析"。
// 解析时机：i18n.js 比本文件晚加载，所以用 getter 延迟到访问时才取 __appLocale.value。
;(function () {
  var DEFAULTS = {
    // 系统名称
    name: 'Nova UI Admin',
    // 系统描述
    desc: '全栈式后台协议框架',
    // 版权信息
    copyrightTxt: '© 2026 Nova UI Admin. All Rights Reserved.',
    // logo 图片
    logo: 'logo.png',
    // 默认主题：daytime / night
    theme: 'daytime',
    // 用户行为配置
    user: {
        // 是否允许注册
        register: false,
        // 是否允许修改
        edit: false
    },
    // 右上角用户自定义项：{ type（fold（下拉菜单内）/ button（铃铛左侧图标按钮，悬浮展示 name））, name, icon, click }
    tools: [],
    // 国际化配置
    i18n: {
        // 支持语言列表 zh=中文 en=英语 ja=日语 ko=韩语
        languages: ['zh', 'en', 'ja', 'ko'],
        // 默认语言
        locale: "zh"
    }
  }

  var userCfg = (window.nova.config) || {}
  var themes = ['daytime', 'night']
  // 应用未写 user 配置时兜底，避免 userCfg.user.xxx 抛错
  var userCfgUser = userCfg.user || {}

  // 解析 i18n 字段值：
  //   string     → 原样返回（包括空字符串；空时由 getter 兜底 DEFAULTS）
  //   object     → 按当前 locale 取对应 key；当前 locale 没 key 则返回 ''（不兜底）
  //   其他/null  → 返回 ''
  function pickLocale(value) {
    if (typeof value === 'string') return value
    if (!value || typeof value !== 'object') return ''
    var locale = (window.__appLocale && window.__appLocale.value) || DEFAULTS.i18n.locale
    return value[locale] || ''
  }

  // 解析 tools：每项的 name 可能是 string 或 locale map；其他字段（icon/type/click）原样透传
  function resolveTools() {
    var src = userCfg.tools
    if (!src || !Array.isArray(src) || src.length === 0) return DEFAULTS.tools
    return src.map(function (t) {
      if (!t || typeof t !== 'object') return t
      var out = {}
      for (var k in t) {
        if (Object.prototype.hasOwnProperty.call(t, k)) {
          out[k] = (k === 'name') ? pickLocale(t[k]) : t[k]
        }
      }
      return out
    })
  }

  // 配置项：name / desc / tools 是延迟求值的 getter，单独 Object.defineProperty 定义
  window.nova.config = {
    copyrightTxt: userCfg.copyrightTxt || DEFAULTS.copyrightTxt,
    logo: userCfg.logo || DEFAULTS.logo,
    theme: themes.indexOf(userCfg.theme) !== -1 ? userCfg.theme : DEFAULTS.theme,
    user: {
        register: userCfgUser.register || DEFAULTS.user.register,
        edit: userCfgUser.edit || DEFAULTS.user.edit
    },
    i18n: userCfg.i18n || DEFAULTS.i18n
  }

  // name：未配置 → DEFAULTS；string 空 → DEFAULTS；object 匹配不到 → ''
  Object.defineProperty(window.nova.config, 'name', {
    configurable: true,
    enumerable: true,
    get: function () {
      var v = userCfg.name
      if (v == null) return DEFAULTS.name
      if (typeof v === 'object') return pickLocale(v)
      return v || DEFAULTS.name
    }
  })

  // desc：未配置 → DEFAULTS；string 空 → DEFAULTS；object 匹配不到 → ''
  Object.defineProperty(window.nova.config, 'desc', {
    configurable: true,
    enumerable: true,
    get: function () {
      var v = userCfg.desc
      if (v == null) return DEFAULTS.desc
      if (typeof v === 'object') return pickLocale(v)
      return v || DEFAULTS.desc
    }
  })

  // tools：数组，每项的 name 解析为 string
  Object.defineProperty(window.nova.config, 'tools', {
    configurable: true,
    enumerable: true,
    get: function () {
      return resolveTools()
    }
  })

  // 生命周期回调 { startup(route) 页面加载完成后回调 }
  window.nova.event = window.nova.event || {}
})()