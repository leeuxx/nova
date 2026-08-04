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
    theme: 'daytime'
  }

  var userCfg = (window.nova.config) || {}
  var themes = ['daytime', 'night']

  window.nova.config = {
    name: userCfg.name || DEFAULTS.name,
    desc: userCfg.desc || DEFAULTS.desc,
    copyrightTxt: userCfg.copyrightTxt || DEFAULTS.copyrightTxt,
    logo: userCfg.logo || DEFAULTS.logo,
    theme: themes.indexOf(userCfg.theme) !== -1 ? userCfg.theme : DEFAULTS.theme
  }
})()
