;(function () {
  var TT_VERSION = '2.10.3'
  var ESM = 'https://esm.sh/'
  var loadingPromise = null
  var loaded = null

  function ensureLoaded() {
    if (loaded) return Promise.resolve(loaded)
    if (loadingPromise) return loadingPromise
    loadingPromise = (async function () {
      var core = await import(ESM + '@tiptap/core@' + TT_VERSION)
      var sk = await import(ESM + '@tiptap/starter-kit@' + TT_VERSION)
      var ul = await import(ESM + '@tiptap/extension-underline@' + TT_VERSION)
      var lk = await import(ESM + '@tiptap/extension-link@' + TT_VERSION)
      var ph = await import(ESM + '@tiptap/extension-placeholder@' + TT_VERSION)
      loaded = {
        Editor: core.Editor,
        StarterKit: sk.StarterKit || sk.default,
        Underline: ul.Underline || ul.default,
        Link: lk.Link || lk.default,
        Placeholder: ph.Placeholder || ph.default
      }
      return loaded
    })()
    return loadingPromise
  }

  var TOOLBAR = [
    { cmd: 'toggleBold',       icon: 'mdi:format-bold',              title: '粗体',     mark: 'bold' },
    { cmd: 'toggleItalic',     icon: 'mdi:format-italic',            title: '斜体',     mark: 'italic' },
    { cmd: 'toggleUnderline',  icon: 'mdi:format-underline',         title: '下划线',   mark: 'underline' },
    { cmd: 'toggleStrike',     icon: 'mdi:format-strikethrough',     title: '删除线',   mark: 'strike' },
    { sep: true },
    { cmd: 'toggleHeading',    icon: 'mdi:format-header-1',          title: '一级标题', attrs: { level: 1 } },
    { cmd: 'toggleHeading',    icon: 'mdi:format-header-2',          title: '二级标题', attrs: { level: 2 } },
    { cmd: 'toggleHeading',    icon: 'mdi:format-header-3',          title: '三级标题', attrs: { level: 3 } },
    { cmd: 'setParagraph',     icon: 'mdi:format-paragraph',         title: '正文' },
    { sep: true },
    { cmd: 'toggleBulletList', icon: 'mdi:format-list-bulleted',     title: '无序列表' },
    { cmd: 'toggleOrderedList',icon: 'mdi:format-list-numbered',     title: '有序列表' },
    { cmd: 'toggleBlockquote', icon: 'mdi:format-quote-close',       title: '引用' },
    { cmd: 'toggleCodeBlock',  icon: 'mdi:code-tags',                title: '代码块' },
    { sep: true },
    { cmd: 'setLink',          icon: 'mdi:link-variant',             title: '链接' },
    { cmd: 'unsetLink',        icon: 'mdi:link-variant-off',         title: '取消链接' },
    { sep: true },
    { cmd: 'undo',             icon: 'mdi:undo',                     title: '撤销' },
    { cmd: 'redo',             icon: 'mdi:redo',                     title: '重做' },
    { sep: true },
    { cmd: 'clearFormatting',  icon: 'mdi:format-clear',             title: '清除格式' }
  ]

  function buildToolbar(container, editor) {
    container.innerHTML = ''
    container.className = 'nova-tiptap-toolbar'
    var btns = []

    TOOLBAR.forEach(function (def) {
      if (def.sep) {
        var s = document.createElement('span')
        s.className = 'nova-tiptap-toolbar-sep'
        container.appendChild(s)
        return
      }
      var b = document.createElement('button')
      b.type = 'button'
      b.className = 'nova-tiptap-toolbar-btn'
      b.title = def.title
      b.innerHTML = '<iconify-icon icon="' + def.icon + '" width="16"></iconify-icon>'

      b.addEventListener('mousedown', function (e) { e.preventDefault() })

      b.addEventListener('click', function (e) {
        e.preventDefault()
        if (def.cmd === 'setLink') {
          var prev = editor.getAttributes('link').href || ''
          var url = window.prompt('链接地址（留空清除）', prev)
          if (url === null) return
          if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run()
          else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          return
        }
        var chain = editor.chain().focus()
        if (def.cmd === 'toggleHeading') chain = chain.toggleHeading({ level: def.attrs.level })
        else chain = chain[def.cmd]()
        chain.run()
      })

      container.appendChild(b)
      btns.push({ b: b, def: def })
    })

    function refresh() {
      btns.forEach(function (it) {
        var d = it.def
        var active = false
        if (d.mark) active = editor.isActive(d.mark)
        else if (d.attrs && d.attrs.level != null) active = editor.isActive('heading', d.attrs)
        else if (d.cmd === 'setParagraph') active = editor.isActive('paragraph')
        it.b.classList.toggle('is-active', !!active)
      })
    }
    editor.on('selectionUpdate', refresh)
    editor.on('transaction', refresh)

    return function destroyToolbar() {
      editor.off('selectionUpdate', refresh)
      editor.off('transaction', refresh)
    }
  }

  function createEditor(hostEl, toolbarEl, options) {
    return ensureLoaded().then(function (api) {
      var opts = options || {}
      var editor = new api.Editor({
        element: hostEl,
        extensions: [
          api.StarterKit.configure({
            heading: { levels: [1, 2, 3] }
          }),
          api.Underline,
          api.Link.configure({
            openOnClick: false,
            autolink: true,
            HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' }
          }),
          api.Placeholder.configure({
            placeholder: opts.placeholder || '请输入内容...'
          })
        ],
        content: opts.html || '',
        onUpdate: function (ctx) {
          if (typeof opts.onChange === 'function') opts.onChange(ctx.editor.getHTML())
        }
      })

      var dt = buildToolbar(toolbarEl, editor)

      return {
        editor: editor,
        destroy: function () {
          dt()
          try { editor.destroy() } catch (e) {}
        }
      }
    })
  }

  function destroy(rec) {
    if (rec && typeof rec.destroy === 'function') {
      try { rec.destroy() } catch (e) {}
    }
  }

  window.NovaTiptap = {
    ensureLoaded: ensureLoaded,
    createEditor: createEditor,
    destroy: destroy
  }
})()