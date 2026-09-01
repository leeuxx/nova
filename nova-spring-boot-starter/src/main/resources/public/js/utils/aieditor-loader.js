;(function () {
  function getClass() {
    return window.AiEditor && window.AiEditor.AiEditor
  }

  function detectTheme() {
    return document.body.classList.contains('dark') ? 'dark' : 'light'
  }

  function detectLang() {
    if (window.__appLocale && window.__appLocale.value) return window.__appLocale.value
    return 'zh'
  }

  function uploadFile(file, novaName) {
    return new Promise(function (resolve) {
      if (!window.fetchApi || !window.fetchApi.upload) {
        resolve({ errorCode: 1, message: window.__t('common.fetch_api_not_ready') })
        return
      }
      var formData = new FormData()
      formData.append('novaName', novaName || '')
      formData.append('files', file)
      window.fetchApi.upload('/nova/attachment/upload', formData).then(function (resp) {
        if (resp && resp.data && resp.data.length) {
          resolve({ errorCode: 0, data: { src: resp.data[0] } })
        } else {
          resolve({ errorCode: 1, message: window.__t('common.upload_failed') })
        }
      }).catch(function () {
        resolve({ errorCode: 1, message: window.__t('common.request_failed') })
      })
    })
  }

  function createEditor(hostEl, html, onChange, options) {
    var AiEditor = getClass()
    if (!AiEditor) throw new Error(window.__t('common.aieditor_not_loaded'))
    var opts = options || {}
    var initialContent = html || ''
    return new AiEditor({
      element: hostEl,
      content: initialContent,
      placeholder: window.__t('common.input_content'),
      contentRetention: false,
      theme: opts.theme || detectTheme(),
      lang: opts.lang || detectLang(),
      editable: opts.editable !== false,
      image: {
        defaultSize: 120,
        uploadFormName: 'image',
        uploader: function (file, uploadUrl, headers, formName) {
          return uploadFile(file, opts.uploadNovaName)
        }
      },
      video: {
        uploadFormName: 'video',
        uploader: function (file, uploadUrl, headers, formName) {
          return uploadFile(file, opts.uploadNovaName)
        }
      },
      attachment: {
        uploadFormName: 'attachment',
        uploader: function (file, uploadUrl, headers, formName) {
          return uploadFile(file, opts.uploadNovaName)
        },
        uploaderEvent: {
            onSuccess: (file, response) => {
                return {
                    errorCode: response.errorCode,
                    data: {
                        href: response.data.src
                    }
                };
            }
        }
      },
      onChange: function (aiEditor) {
        if (onChange) {
          try { onChange(aiEditor.getHtml()) } catch (e) {}
        }
      },
      /*ai: {
          models: {
              openai: {
                  endpoint: "https://api.deepseek.com",
                  model: "deepseek-v4-flash",
                  apiKey: "",
              }
          }
      }*/
    })
  }

  function changeTheme(editor, theme) {
    if (!editor || typeof editor.changeTheme !== 'function') return
    try { editor.changeTheme(theme || detectTheme()) } catch (e) {}
  }

  function changeLang(editor, lang) {
    if (!editor || typeof editor.changeLang !== 'function') return
    try { editor.changeLang(lang || detectLang()) } catch (e) {}
  }

  function setEditable(editor, editable) {
    if (!editor || typeof editor.setEditable !== 'function') return
    try { editor.setEditable(editable !== false) } catch (e) {}
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
    changeLang: changeLang,
    setEditable: setEditable,
    setContent: setContent,
    destroy: destroy
  }
})()