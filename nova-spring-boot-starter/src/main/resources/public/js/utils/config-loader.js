// config-loader.js — 读取开发手写的 config.js，缺失字段填充默认值，输出完整的 window.nova.config
;(function () {
  var DEFAULTS = {
    // 系统名称
    name: 'Nova UI Admin',
    // 描述（延迟求值：读取时才调 __t，因为本文件加载早于 i18n.js）
    desc: function () { return window.__t('app.system_desc') },
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

  // 配置项
  window.nova.config = {
    name: userCfg.name || DEFAULTS.name,
    desc: userCfg.desc || DEFAULTS.desc,
    copyrightTxt: userCfg.copyrightTxt || DEFAULTS.copyrightTxt,
    logo: userCfg.logo || DEFAULTS.logo,
    theme: themes.indexOf(userCfg.theme) !== -1 ? userCfg.theme : DEFAULTS.theme,
    user: {
        register: userCfgUser.register || DEFAULTS.user.register,
        edit: userCfgUser.edit || DEFAULTS.user.edit
    },
    tools: userCfg.tools || DEFAULTS.tools,
    i18n: userCfg.i18n || DEFAULTS.i18n
  }

  // 把 desc 暴露为 getter，访问时才执行默认函数（此时 __t 已就绪）
  Object.defineProperty(window.nova.config, 'desc', {
    configurable: true,
    enumerable: true,
    get: function () {
      var v = userCfg.desc
      if (v !== undefined && v !== null && v !== '') return v
      return DEFAULTS.desc()
    }
  })

  // 生命周期回调 { startup(route) 页面加载完成后回调 }
  window.nova.event = window.nova.event || {}
})()
