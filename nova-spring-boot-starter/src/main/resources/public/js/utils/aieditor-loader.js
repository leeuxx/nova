;(function () {
  var loadingPromise = null

  function ensureLoaded() {
    if (window.AiEditor && window.AiEditor.AiEditor) return Promise.resolve(window.AiEditor.AiEditor)
    if (loadingPromise) return loadingPromise
    loadingPromise = window
      .loadResources(['js/lib/aieditor-1.4.2.js', 'js/lib/aieditor-1.4.2.css'])
      .then(function () {
        return window.AiEditor && window.AiEditor.AiEditor
      })
    return loadingPromise
  }

  function createEditor(hostEl, html, onChange) {
    return ensureLoaded().then(function (AiEditor) {
      var initialContent = html || ''
      var editor = new AiEditor({
        element: hostEl,
        content: initialContent,
        placeholder: '请输入内容...',
        contentRetention: false,
        onChange: function (aiEditor) {
          if (onChange) {
            try { onChange(aiEditor.getHtml()) } catch (e) {}
          }
        }
      })
      return editor
    })
  }

  function setContent(editor, html) {
    if (!editor || editor.isDestroyed && editor.isDestroyed()) return
    try {
      editor.setContent(html || '')
    } catch (e) {}
  }

  function destroy(editor) {
    if (!editor) return
    try {
      if (editor.isDestroyed && editor.isDestroyed()) return
      editor.destroy()
    } catch (e) {}
    var host = editor && editor.container
    if (host && host.parentNode) {
      host.parentNode.innerHTML = ''
    }
  }

  window.NovaAiEditor = {
    ensureLoaded: ensureLoaded,
    createEditor: createEditor,
    setContent: setContent,
    destroy: destroy
  }
})()