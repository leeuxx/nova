// dialog.js — 弹窗工具

window.msg = {
  confirm: function(type = "warning", title = "确认操作", content = "请确认是否要执行该操作？", onConfirm) {
    if (!window.$dialog) { onConfirm(); return }
    window.$dialog.create({
      type:                type,
      title:               title,
      content:             content,
      positiveText:        '确定',
      negativeText:        '取消',
      style:               'margin-top:80px',
      positiveButtonProps: { type: 'primary', size: 'medium' },
      negativeButtonProps: { size: 'medium' },
      onPositiveClick:     onConfirm
    })
  }
}
