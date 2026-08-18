// dialog.js — 弹窗工具

// ── 消息弹窗（window.modal）──
;(function () {
  // 通用弹窗入口：所有方法都从这里创建，保证内部实现一致
  function openDialog(opts) {
    // $dialog 不可用时，若配置了确认回调则直接执行
    if (!window.$dialog) { if (opts.onPositiveClick) opts.onPositiveClick(); return }
    window.$dialog.create(opts)
  }

  window.modal = {
      success: function (content, options) {
        options = options || {}
        openDialog({
          type: 'success',
          title: options.title,
          content,
          negativeText: options.negativeText || '关闭',
          style: 'margin-top:80px',
          negativeButtonProps: { size: 'medium' }
        })
      },
      error: function (content, options) {
        options = options || {}
        openDialog({
          type: 'error',
          title: options.title,
          content,
          negativeText: options.negativeText || '关闭',
          style: 'margin-top:80px',
          negativeButtonProps: { size: 'medium' }
        })
      },
      info: function (content, options) {
        options = options || {}
        openDialog({
          type: 'info',
          title: options.title,
          content,
          negativeText: options.negativeText || '关闭',
          style: 'margin-top:80px',
          negativeButtonProps: { size: 'medium' }
        })
      },
      warning: function (content, options) {
        options = options || {}
        openDialog({
          type: 'warning',
          title: options.title,
          content,
          negativeText: options.negativeText || '关闭',
          style: 'margin-top:80px',
          negativeButtonProps: { size: 'medium' }
        })
      },
      confirm: function (content, options) {
        options = options || {}
        openDialog({
          type: "warning",
          title: options.title,
          content,
          positiveText: options.positiveText || '确定',
          negativeText: options.negativeText || '关闭',
          style: 'margin-top:80px',
          positiveButtonProps: { type: 'primary', size: 'medium' },
          negativeButtonProps: { size: 'medium' },
          onPositiveClick: options.onConfirm
        })
      }
    }
})()

// ── 消息通知（window.msg）──
;(function () {
  function normalizeOptions(options) {
    options = options || {}
    var opts = {}
    // 显示时长,毫秒
    if (options.duration) {
      opts.duration = options.duration
    }
    // 鼠标悬浮不消失
    if (options.keepAliveOnHover !== undefined) {
      opts.keepAliveOnHover = !!options.keepAliveOnHover
    }
    return opts
  }

  var loadingSeq = 0
  var loadingMap = {}

  window.msg = {
    success: function (content, options) {
      if (window.$message) window.$message.success(content, normalizeOptions(options))
    },
    error: function (content, options) {
      if (window.$message) window.$message.error(content, normalizeOptions(options))
    },
    info: function (content, options) {
      if (window.$message) window.$message.info(content, normalizeOptions(options))
    },
    warning: function (content, options) {
      if (window.$message) window.$message.warning(content, normalizeOptions(options))
    },
    // loading 特殊：返回 index 标识，用 close 关闭
    loading: function (content, options) {
      if (!window.$message) return null
      var opts = normalizeOptions(options)
      // Naive UI duration 为 0 时不启动自动关闭定时器，即不主动关闭则一直存在
      if (!opts.duration) opts.duration = 0
      var msg = window.$message.loading(content, opts)
      var index = ++loadingSeq
      loadingMap[index] = msg
      return index
    },
    close: function (index) {
      var msg = loadingMap[index]
      if (msg && msg.destroy) msg.destroy()
      delete loadingMap[index]
    }
  }
})()
