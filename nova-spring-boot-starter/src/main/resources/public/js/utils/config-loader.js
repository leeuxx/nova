// config-loader.js — 读取开发手写的 config.js，缺失字段填充默认值，输出完整的 window.nova.config
;(function () {
  var DEFAULTS = {
    // 系统名称
    name: 'Nova UI Admin',
    // 登录页描述
    desc: '简洁高效的后台管理系统',
    // 登录页版权信息
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
    // 右上角用户下拉自定义项：{ type（fold（下拉菜单内）/ button（铃铛左侧图标按钮，悬浮展示 name））, name, icon, click }
    tools: []
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
    tools: userCfg.tools || DEFAULTS.tools
  }

  // 生命周期回调 { startup(route) 页面加载完成后回调 }
  window.nova.event = window.nova.event || {}
})()
