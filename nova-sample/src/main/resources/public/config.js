window.nova.config = {
  name: 'Nova UI Admin',
  desc: '简洁高效的后台管理系统',
  copyrightTxt: '© 2026 Nova UI Admin. All Rights Reserved.',
  logo: 'logo.png',
  theme: 'daytime',
  user: {
    register: true,
    edit: true
  },
  tools: [
    {
      type: 'fold',
      name: 'Nova 官网',
      icon: 'material-symbols:home-outline',
      click: function () {
        alert('点击触发函数')
      }
    },
    {
      type: 'button',
      name: 'Nova 官网',
      icon: 'material-symbols:electric-meter-outline-rounded',
      click: function () {
        alert('点击触发函数')
      }
    },
    {
      type: 'button',
      name: '智能货柜云平台',
      icon: 'material-symbols:elevator',
      click: function () {
        alert('点击触发函数')
      }
    }
  ],
  // 默认语言
  i18n: {
      // zh=中文 en=英语 ja=日语 ko=韩语
      locale: "ja"
  }
}

// 生命周期回调：页面加载完成后触发（首屏 loading 淡出后），url 为当前路由路径（如 /home）
window.nova.event = {
  startup: function (route) {
    console.log('Nova startup--------------------:', route)
  }
}
