// dialog.js — 弹窗工具

// ── 消息弹窗（window.modal）──
;(function () {
  // 通用弹窗入口：所有方法都从这里创建，保证内部实现一致
  function openDialog(opts) {
    // $dialog 不可用时，若配置了确认回调则直接执行
    if (!window.$dialog) { if (opts.onPositiveClick) opts.onPositiveClick(); return }

    // 从全局 z-index 管理器取层级
    var zIndexVal = (window.NovaZIndex && window.NovaZIndex.acquire()) || 3000
    var released = false
    function releaseZ() {
      if (!released && zIndexVal && window.NovaZIndex) {
        released = true
        window.NovaZIndex.release(zIndexVal)
      }
    }

    var mergedOpts = Object.assign({}, opts, { zIndex: zIndexVal })

    // 各个关闭路径都包一下，确保无论怎么关都能归还
    var origPositive = mergedOpts.onPositiveClick
    mergedOpts.onPositiveClick = function () {
      releaseZ()
      if (origPositive) return origPositive.apply(this, arguments)
    }
    var origNegative = mergedOpts.onNegativeClick
    mergedOpts.onNegativeClick = function () {
      releaseZ()
      if (origNegative) return origNegative.apply(this, arguments)
    }
    var origClose = mergedOpts.onClose
    mergedOpts.onClose = function () {
      releaseZ()
      if (origClose) return origClose.apply(this, arguments)
    }

    window.$dialog.create(mergedOpts)
  }

  window.modal = {
      success: function (content, options) {
        options = options || {}
        openDialog({
          type: 'success',
          title: options.title,
          content,
          negativeText: options.negativeText || window.__t('common.close'),
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
          negativeText: options.negativeText || window.__t('common.close'),
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
          negativeText: options.negativeText || window.__t('common.close'),
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
          negativeText: options.negativeText || window.__t('common.close'),
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
          positiveText: options.positiveText || window.__t('common.confirm'),
          negativeText: options.negativeText || window.__t('common.close'),
          style: 'margin-top:80px',
          positiveButtonProps: { type: 'primary', size: 'medium' },
          negativeButtonProps: { size: 'medium' },
          onPositiveClick: options.onConfirm
        })
      },
      // 代码纯预览弹窗（只读 CodeMirror）
      //   window.modal.code({ title, value, language })
      code: function (opts) {
        opts = opts || {}
        var language = opts.language || 'json'
        var hostEl = null
        var editor = null
        var enterDone = false
        var langReady = false
        var langError = null

        function mountIfReady() {
          if (!langReady || !enterDone || !hostEl || editor) return
          hostEl.textContent = ''
          editor = window.NovaJsonEditor.create(hostEl, opts.value == null ? '' : String(opts.value), {
            language: language,
            dark: !!(window.__appDarkMode && window.__appDarkMode.value),
            readOnly: true
          })
        }

        function cleanup() {
          if (editor && window.NovaJsonEditor) {
            window.NovaJsonEditor.destroy(editor)
            editor = null
          }
        }

        if (!window.NovaJsonEditor) {
          var noEditor = 'NovaJsonEditor 未加载，无法打开代码预览'
          console.error(noEditor)
          if (window.$message) window.$message.error(noEditor)
          return
        }

        var content = function () {
          return window.Vue.h('div', {
            class: 'nova-code-preview',
            ref: function (el) { hostEl = el }
          }, window.__t('common.loading'))
        }

        openDialog({
          title: opts.title || '',
          content: content,
          icon: function () { return null },
          style: 'margin-top:80px;width:900px;max-width:92vw',
          onAfterEnter: function () {
            enterDone = true
            if (langError) {
              hostEl.textContent = langError
              return
            }
            mountIfReady()
          },
          onClose: cleanup,
          onNegativeClick: cleanup,
          onAfterLeave: cleanup
        })

        window.NovaJsonEditor.ensureLanguage(language).then(function () {
          langReady = true
          mountIfReady()
        }).catch(function (err) {
          langError = err && err.message ? err.message : String(err)
          if (hostEl) hostEl.textContent = langError
          if (window.$message) window.$message.error(langError)
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
