window.nova.config = {
  name: 'Nova UI Admin111',
  desc: '简洁高效的后台管理系统',
  copyrightTxt: '© 2026 Nova UI Admin. All Rights Reserved.',
  logo: 'logo.png',
  theme: 'daytime',
  userTools: [
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
  ]
}
