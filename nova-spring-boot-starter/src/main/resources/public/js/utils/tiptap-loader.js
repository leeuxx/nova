;(function () {
  var BUNDLE_URL = '/js/lib/tiptap.mjs'
  var loadingPromise = null
  var loaded = null

  function ensureLoaded() {
    if (loaded) return Promise.resolve(loaded)
    if (loadingPromise) return loadingPromise
    loadingPromise = (async function () {
      var mod = await import(BUNDLE_URL)
      loaded = {
        Editor: mod.Editor,
        StarterKit: mod.StarterKit,
        Underline: mod.Underline,
        Link: mod.Link,
        Placeholder: mod.Placeholder
      }
      return loaded
    })()
    return loadingPromise
  }

  var TOOLBAR = [
    { sep: true },
    { icon: 'mdi:format-bold',          title: '粗体',     run: function (e) { e.chain().focus().toggleBold().run() },       isActive: function (e) { return e.isActive('bold') } },
    { icon: 'mdi:format-italic',        title: '斜体',     run: function (e) { e.chain().focus().toggleItalic().run() },     isActive: function (e) { return e.isActive('italic') } },
    { icon: 'mdi:format-underline',     title: '下划线',   run: function (e) { e.chain().focus().toggleUnderline().run() },  isActive: function (e) { return e.isActive('underline') } },
    { icon: 'mdi:format-strikethrough', title: '删除线',   run: function (e) { e.chain().focus().toggleStrike().run() },     isActive: function (e) { return e.isActive('strike') } },
    { sep: true },
    { icon: 'mdi:format-header-1',      title: '一级标题', run: function (e) { e.chain().focus().toggleHeading({ level: 1 }).run() }, isActive: function (e) { return e.isActive('heading', { level: 1 }) } },
    { icon: 'mdi:format-header-2',      title: '二级标题', run: function (e) { e.chain().focus().toggleHeading({ level: 2 }).run() }, isActive: function (e) { return e.isActive('heading', { level: 2 }) } },
    { icon: 'mdi:format-header-3',      title: '三级标题', run: function (e) { e.chain().focus().toggleHeading({ level: 3 }).run() }, isActive: function (e) { return e.isActive('heading', { level: 3 }) } },
    { icon: 'mdi:format-paragraph',     title: '正文',     run: function (e) { e.chain().focus().setParagraph().run() },    isActive: function (e) { return e.isActive('paragraph') } },
    { sep: true },
    { icon: 'mdi:format-list-bulleted', title: '无序列表', run: function (e) { e.chain().focus().toggleBulletList().run() },  isActive: function (e) { return e.isActive('bulletList') } },
    { icon: 'mdi:format-list-numbered', title: '有序列表', run: function (e) { e.chain().focus().toggleOrderedList().run() }, isActive: function (e) { return e.isActive('orderedList') } },
    { icon: 'mdi:format-quote-close',   title: '引用',     run: function (e) { e.chain().focus().toggleBlockquote().run() },  isActive: function (e) { return e.isActive('blockquote') } },
    { icon: 'mdi:code-tags',            title: '代码块',   run: function (e) { e.chain().focus().toggleCodeBlock().run() },   isActive: function (e) { return e.isActive('codeBlock') } },
    { sep: true },
    { icon: 'mdi:link-variant',         title: '链接',
      run: function (e) {
        var prev = e.getAttributes('link').href || ''
        var url = window.prompt('链接地址（留空清除）', prev)
        if (url === null) return
        if (url === '') e.chain().focus().extendMarkRange('link').unsetLink().run()
        else e.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      },
      isActive: function (e) { return e.isActive('link') } },
    { icon: 'mdi:link-variant-off',     title: '取消链接',
      run: function (e) { e.chain().focus().unsetLink().run() },
      isActive: function () { return false } },
    { sep: true },
    { icon: 'mdi:undo',                 title: '撤销',     run: function (e) { e.chain().focus().undo().run() },             isActive: function () { return false } },
    { icon: 'mdi:redo',                 title: '重做',     run: function (e) { e.chain().focus().redo().run() },             isActive: function () { return false } },
    { sep: true },
    { icon: 'mdi:format-clear',         title: '清除格式', run: function (e) { e.chain().focus().unsetAllMarks().clearNodes().run() }, isActive: function () { return false } }
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
        try {
          def.run(editor)
        } catch (err) {
          console.error('[NovaTiptap] toolbar action failed:', def.title, err)
        }
      })

      container.appendChild(b)
      btns.push({ b: b, def: def })
    })

    function refresh() {
      btns.forEach(function (it) {
        var active = false
        try {
          active = !!(it.def.isActive && it.def.isActive(editor))
        } catch (err) {}
        it.b.classList.toggle('is-active', active)
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