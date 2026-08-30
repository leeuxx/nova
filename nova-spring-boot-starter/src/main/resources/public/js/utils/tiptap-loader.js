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
        Placeholder: mod.Placeholder,
        TextAlign: mod.TextAlign
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
    { dropdown: true,
      icon: 'mdi:format-align-left',
      title: '',
      currentIcon: function (e) {
        if (e.isActive({ textAlign: 'center' }))  return 'mdi:format-align-center'
        if (e.isActive({ textAlign: 'right' }))   return 'mdi:format-align-right'
        if (e.isActive({ textAlign: 'justify' })) return 'mdi:format-align-justify'
        return 'mdi:format-align-left'
      },
      isActive: function (e) { return e.isActive('textAlign') },
      items: [
        { icon: 'mdi:format-align-left',    title: '左对齐',   run: function (e) { e.chain().focus().setTextAlign('left').run() },    isActive: function (e) { return e.isActive({ textAlign: 'left' }) } },
        { icon: 'mdi:format-align-center',  title: '居中',     run: function (e) { e.chain().focus().setTextAlign('center').run() },  isActive: function (e) { return e.isActive({ textAlign: 'center' }) } },
        { icon: 'mdi:format-align-right',   title: '右对齐',   run: function (e) { e.chain().focus().setTextAlign('right').run() },   isActive: function (e) { return e.isActive({ textAlign: 'right' }) } },
        { icon: 'mdi:format-align-justify', title: '两端对齐', run: function (e) { e.chain().focus().setTextAlign('justify').run() }, isActive: function (e) { return e.isActive({ textAlign: 'justify' }) } }
      ]
    },
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

  var tooltipEl = null
  var tooltipTimer = null

  function showTooltip(target, text) {
    if (!text) return
    if (tooltipTimer) { clearTimeout(tooltipTimer); tooltipTimer = null }
    tooltipTimer = setTimeout(function () {
      if (!target.isConnected) return
      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.className = 'nova-tiptap-tooltip'
        document.body.appendChild(tooltipEl)
      }
      tooltipEl.textContent = text
      var rect = target.getBoundingClientRect()
      tooltipEl.style.visibility = 'hidden'
      tooltipEl.classList.add('show')
      var tipRect = tooltipEl.getBoundingClientRect()
      var top = window.scrollY + rect.top - tipRect.height - 8
      var left = window.scrollX + rect.left + (rect.width - tipRect.width) / 2
      tooltipEl.style.top = top + 'px'
      tooltipEl.style.left = left + 'px'
      tooltipEl.style.visibility = 'visible'
    }, 200)
  }

  function hideTooltip() {
    if (tooltipTimer) { clearTimeout(tooltipTimer); tooltipTimer = null }
    if (tooltipEl) { tooltipEl.remove(); tooltipEl = null }
  }

  function buildToolbar(container, editor) {
    container.innerHTML = ''
    container.className = 'nova-tiptap-toolbar'
    var btns = []

    function makeBtn(def) {
      var b = document.createElement('button')
      b.type = 'button'
      b.className = 'nova-tiptap-toolbar-btn'
      b.innerHTML = '<iconify-icon icon="' + def.icon + '" width="16"></iconify-icon>'
      b.addEventListener('mousedown', function (e) { e.preventDefault() })
      b.addEventListener('mouseenter', function () { showTooltip(b, def.title) })
      b.addEventListener('mouseleave', hideTooltip)
      b.addEventListener('click', function () { hideTooltip() })
      b.addEventListener('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        try {
          def.run(editor)
        } catch (err) {
          console.error('[NovaTiptap] toolbar action failed:', def.title, err)
        }
      })
      return b
    }

    TOOLBAR.forEach(function (def) {
      if (def.sep) {
        var s = document.createElement('span')
        s.className = 'nova-tiptap-toolbar-sep'
        container.appendChild(s)
        return
      }

      if (def.dropdown) {
        var wrap = document.createElement('div')
        wrap.className = 'nova-tiptap-toolbar-dropdown'

        var trigger = makeBtn({
          title: def.title,
          icon: def.icon,
          run: function () { wrap.classList.toggle('open') }
        })
        trigger.classList.add('nova-tiptap-toolbar-dropdown-trigger')

        var menu = document.createElement('div')
        menu.className = 'nova-tiptap-toolbar-dropdown-menu'
        var itemRefs = []
        def.items.forEach(function (it) {
          var ib = document.createElement('button')
          ib.type = 'button'
          ib.className = 'nova-tiptap-toolbar-btn nova-tiptap-toolbar-menu-item'
          ib.innerHTML = '<iconify-icon icon="' + it.icon + '" width="16"></iconify-icon><span>' + it.title + '</span>'
          ib.addEventListener('mousedown', function (e) { e.preventDefault() })
          ib.addEventListener('click', function (e) {
            e.preventDefault()
            e.stopPropagation()
            try { it.run(editor) } catch (err) {
              console.error('[NovaTiptap] toolbar action failed:', it.title, err)
            }
            wrap.classList.remove('open')
          })
          menu.appendChild(ib)
          itemRefs.push({ b: ib, def: it })
        })

        wrap.appendChild(trigger)
        wrap.appendChild(menu)
        container.appendChild(wrap)

        btns.push({
          b: trigger,
          def: def,
          items: itemRefs,
          updateIcon: function () {
            var ico = def.currentIcon ? def.currentIcon(editor) : def.icon
            var ic = trigger.querySelector('iconify-icon')
            if (ic) ic.setAttribute('icon', ico)
          }
        })
        return
      }

      var btn = makeBtn(def)
      container.appendChild(btn)
      btns.push({ b: btn, def: def })
    })

    function refresh() {
      btns.forEach(function (it) {
        var active = false
        try {
          active = !!(it.def.isActive && it.def.isActive(editor))
        } catch (err) {}
        it.b.classList.toggle('is-active', active)
        if (typeof it.updateIcon === 'function') it.updateIcon()
        if (it.items) {
          it.items.forEach(function (sub) {
            var a = false
            try { a = !!(sub.def.isActive && sub.def.isActive(editor)) } catch (err) {}
            sub.b.classList.toggle('is-active', a)
          })
        }
      })
    }
    editor.on('selectionUpdate', refresh)
    editor.on('transaction', refresh)

    function onDocClick(e) {
      btns.forEach(function (it) {
        if (it.def.dropdown && it.b.parentNode && !it.b.parentNode.contains(e.target)) {
          it.b.parentNode.classList.remove('open')
        }
      })
    }
    document.addEventListener('click', onDocClick)

    return function destroyToolbar() {
      editor.off('selectionUpdate', refresh)
      editor.off('transaction', refresh)
      document.removeEventListener('click', onDocClick)
      hideTooltip()
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
          api.TextAlign.configure({
            types: ['heading', 'paragraph']
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