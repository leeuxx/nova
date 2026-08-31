;(function () {
  function getClass() {
    return window.AiEditor && window.AiEditor.AiEditor
  }

  function detectTheme() {
    return document.body.classList.contains('dark') ? 'dark' : 'light'
  }

  function createEditor(hostEl, html, onChange, theme) {
    var AiEditor = getClass()
    if (!AiEditor) throw new Error('AiEditor 未加载')
    var initialContent = html || ''
    return new AiEditor({
      element: hostEl,
      content: initialContent,
      placeholder: '请输入内容...',
      contentRetention: false,
      theme: theme || detectTheme(),
      onChange: function (aiEditor) {
        if (onChange) {
          try { onChange(aiEditor.getHtml()) } catch (e) {}
        }
      }
    })
  }

  function changeTheme(editor, theme) {
    if (!editor || typeof editor.changeTheme !== 'function') return
    try { editor.changeTheme(theme || detectTheme()) } catch (e) {}
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
    createEditor: createEditor,
    changeTheme: changeTheme,
    setContent: setContent,
    destroy: destroy
  }
})()
