;(function () {
  var WE_VERSION = '5.1.23'
  var CDN_BASE = 'https://unpkg.com/@wangeditor/editor@' + WE_VERSION + '/dist'
  var loadingPromise = null

  function ensureLoaded() {
    if (window.wangEditor) return Promise.resolve(window.wangEditor)
    if (loadingPromise) return loadingPromise
    loadingPromise = window
      .loadResources([CDN_BASE + '/css/style.css', CDN_BASE + '/index.js'])
      .then(function () {
        return window.wangEditor
      })
    return loadingPromise
  }

  function createEditor(container, options) {
    return ensureLoaded().then(function (wEditor) {
      return wEditor.createEditor(
        Object.assign({ selector: container }, options || {})
      )
    })
  }

  // 同时创建 editor + toolbar，返回 Promise<{ editor, toolbar }>
  // 默认隐藏全屏按钮；可通过 options.toolbarConfig 追加 excludeKeys
  function createEditorWithToolbar(hostEl, toolbarEl, options) {
    return ensureLoaded().then(function (wEditor) {
      var opts = options || {}
      var editor = wEditor.createEditor(
        Object.assign({ selector: hostEl }, opts)
      )
      var userToolbarConfig = opts.toolbarConfig || {}
      var toolbarConfig = Object.assign(
        { excludeKeys: ['fullScreen'] },
        userToolbarConfig,
        { excludeKeys: (userToolbarConfig.excludeKeys || ['fullScreen']).slice() }
      )
      var toolbar = wEditor.createToolbar({
        editor: editor,
        selector: toolbarEl,
        config: toolbarConfig
      })
      return { editor: editor, toolbar: toolbar }
    })
  }

  function destroy(editor) {
    if (editor && typeof editor.destroy === 'function') {
      try {
        editor.destroy()
      } catch (e) {}
    }
  }

  window.NovaWangEditor = {
    ensureLoaded: ensureLoaded,
    createEditor: createEditor,
    createEditorWithToolbar: createEditorWithToolbar,
    destroy: destroy
  }
})()
