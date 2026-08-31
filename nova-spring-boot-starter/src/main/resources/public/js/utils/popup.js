// popup.js — 弹窗 / 抽屉工具（与自定义按钮 tpl 弹窗一字不差）
// 挂载到 window.popup
//
// 每个 popup = 一个独立的 Vue app，模板逐字复制 tpl（page/table.js 4786 / 4791）。
// 通过 internal-appear="true" 强制首次挂载播放 fade-in-scale-up 动画。
// 弹窗独立挂在 body 下，外层 n-config-provider 的 theme context 传不进来，
// 所以自带一层 n-config-provider，根据 window.__appDarkMode 跟随全局暗色模式。
//
// 用法：
//   const id = popup.modal('https://example.com', {
//     title:    '标题',
//     width:    '50%',
//     height:   '50%',
//     onClose:  function () {}
//   })
//   const id = popup.drawer('https://example.com', {
//     title:    '标题',
//     placement:'right',        // 'right' | 'left' | 'top' | 'bottom'
//     size:     '50%',
//     onClose:  function () {}
//   })
//   popup.close(id)
//   popup.closeAll()
;(function () {
  if (window.popup) return

  var Vue = window.Vue
  var naive = window.naive
  var createApp = Vue.createApp
  var ref = Vue.ref
  var watch = Vue.watch
  var nextTick = Vue.nextTick
  var computed = Vue.computed

  function uid() {
    return 'pop_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36)
  }
  function pctToVh(value) {
    if (!value) return value
    value = String(value).trim()
    if (value.endsWith('%')) return value.replace('%', 'vh')
    return value
  }

  // modal 模板：与 page/table.js line 4786 逐字相同，仅 show 绑到 ref；
  // 外层包 n-config-provider 以注入暗色 theme。
  function modalTemplate() {
    return (
      '<n-config-provider :theme="theme">' +
        '<n-modal' +
          ' v-model:show="show"' +
          ' display-directive="if"' +
          ' preset="card"' +
          ' :title="payload.title || window.__t(\'common.no_title\')"' +
          ' :style="modalStyle"' +
          ' :content-style="{padding:\'0\',overflow:\'hidden\',flex:\'1\',minHeight:\'0\'}"' +
          ' :header-style="{paddingBottom:\'8px\'}"' +
          ' :internal-appear="true"' +
          ' :close-on-esc="true"' +
        '>' +
          '<iframe v-if="payload.path" :src="payload.path" style="width:100%;height:100%;border:none;flex:1"></iframe>' +
        '</n-modal>' +
      '</n-config-provider>'
    )
  }

  // drawer 模板：与 page/table.js line 4791 逐字相同
  function drawerTemplate() {
    return (
      '<n-config-provider :theme="theme">' +
        '<n-drawer' +
          ' v-model:show="show"' +
          ' :placement="payload.placement || \'right\'"' +
          ' display-directive="if"' +
          ' :style="drawerStyle"' +
          ' :internal-appear="true"' +
          ' :close-on-esc="true"' +
        '>' +
          '<n-drawer-content' +
            ' :title="payload.title || window.__t(\'common.no_title\')"' +
            ' :header-style="{borderBottom:\'none\'}"' +
            ' :body-content-style="{padding:\'0\',overflow:\'hidden\',display:\'flex\',flexDirection:\'column\'}"' +
          '>' +
            '<iframe v-if="payload.path" :src="payload.path" style="width:100%;height:100%;border:none;flex:1"></iframe>' +
          '</n-drawer-content>' +
        '</n-drawer>' +
      '</n-config-provider>'
    )
  }

  var openedPopups = {}

  // 通用挂载流程
  function mountPopup(path, opts, template) {
    if (!path) {
      console.warn('[popup] path is required')
      return null
    }
    opts = opts || {}

    var id = uid()
    var showRef = ref(false)
    var payloadRef = Vue.reactive(Object.assign({ path: path }, opts))
    var onCloseCb = opts.onClose

    // 挂载容器
    var el = document.createElement('div')
    el.id = '__nova_popup_' + id
    el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none'
    document.body.appendChild(el)

    var app = createApp({
      setup: function () {
        // 跟随全局暗色模式：app.js 暴露 window.__appDarkMode（ref）
        var themeRef = computed(function () {
          var dark = window.__appDarkMode && window.__appDarkMode.value
          return dark ? naive.darkTheme : null
        })
        return { show: showRef, payload: payloadRef, theme: themeRef }
      },
      computed: {
        modalStyle: function () {
          var w  = this.payload.width || '50%'
          var h  = pctToVh(this.payload.height) || '50vh'
          return 'width:' + w + ';height:' + h + ';margin-top:60px;display:flex;flex-direction:column'
        },
        drawerStyle: function () {
          var p = this.payload
          var placement = p.placement || 'right'
          var size = p.size || '40%'
          return (placement === 'top' || placement === 'bottom')
            ? 'height:' + pctToVh(size)
            : 'width:' + size
        }
      },
      template: template
    })

    if (naive && typeof app.use === 'function') app.use(naive)

    // 监听 show：false 时（关闭动画结束后）卸载
    watch(showRef, function (newVal) {
      if (!newVal) {
        setTimeout(function () {
          if (openedPopups[id]) {
            try { app.unmount() } catch (e) {}
            if (el.parentNode) el.parentNode.removeChild(el)
            delete openedPopups[id]
            if (typeof onCloseCb === 'function') {
              try { onCloseCb() } catch (e) { console.error('[popup] onClose error:', e) }
            }
          }
        }, 300)
      }
    })

    app.mount(el)

    openedPopups[id] = { app: app, el: el, showRef: showRef }

    // 下一帧触发 show=true，让 NModal 从 hidden → visible 走完整的 enter 动画
    nextTick(function () { showRef.value = true })

    return id
  }

  function modal(path, opts) {
    return mountPopup(path, opts, modalTemplate())
  }

  function drawer(path, opts) {
    return mountPopup(path, opts, drawerTemplate())
  }

  function close(id) {
    var p = openedPopups[id]
    if (p && p.showRef) p.showRef.value = false
  }

  function closeAll() {
    Object.keys(openedPopups).forEach(function (id) {
      var p = openedPopups[id]
      if (p && p.showRef) p.showRef.value = false
    })
  }

  window.popup = {
    modal: modal,
    drawer: drawer,
    close: close,
    closeAll: closeAll
  }
})()