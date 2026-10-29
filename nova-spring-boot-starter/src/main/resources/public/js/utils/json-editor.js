;(function () {
  var BASE = 'js/lib/codemirror/'
  var THEME_LIGHT = 'nova-light'
  var THEME_DARK = 'nova-dark'

  // 宿主页需先加载：codemirror.min.js、foldcode、brace-fold、foldgutter、closebrackets、matchbrackets
  var LANGUAGES = {
    json: {
      mime: 'application/json',
      lint: true,
      files: ['mode/javascript.min.js', 'addon/lint/lint.min.js', 'jsonlint.js', 'addon/lint/json-lint.min.js']
    },
    sql: { mime: 'text/x-sql', files: ['mode/sql.min.js'] },
    xml: { mime: 'application/xml', files: ['mode/xml.min.js', 'addon/fold/xml-fold.min.js'] },
    html: { mime: 'text/html', files: ['mode/xml.min.js', 'addon/fold/xml-fold.min.js'] },
    yaml: { mime: 'text/x-yaml', files: ['mode/yaml.min.js', 'addon/fold/indent-fold.min.js'] },
    css: { mime: 'text/css', files: ['mode/css.min.js'] },
    java: { mime: 'text/x-java', files: ['mode/clike.min.js'] },
    shell: { mime: 'text/x-sh', files: ['mode/shell.min.js'] },
    markdown: { mime: 'text/x-markdown', files: ['mode/markdown.min.js', 'addon/fold/markdown-fold.min.js'] },
    properties: { mime: 'text/x-properties', files: ['mode/properties.min.js'] }
  }

  // 基础资源：宿主页首次使用编辑器时懒加载，加载顺序固定（addon 依赖 CodeMirror 全局）
  var BASE_SCRIPTS = [
    'codemirror.min.js',
    'addon/edit/closebrackets.min.js',
    'addon/edit/matchbrackets.min.js',
    'addon/fold/foldcode.min.js',
    'addon/fold/brace-fold.min.js',
    'addon/fold/foldgutter.min.js'
  ]
  var BASE_CSS = [
    BASE + 'codemirror.min.css',
    BASE + 'addon/lint/lint.min.css',
    BASE + 'addon/fold/foldgutter.min.css',
    'css/json-editor.css'
  ]

  var scriptCache = {}
  var languageReady = {}
  var languageLoaded = {}
  var baseReady = null

  function loadScript(path) {
    if (scriptCache[path]) return scriptCache[path]
    scriptCache[path] = new Promise(function (resolve, reject) {
      var script = document.createElement('script')
      script.src = BASE + path
      script.onload = function () { resolve() }
      script.onerror = function () { reject(new Error('脚本加载失败: ' + script.src)) }
      document.head.appendChild(script)
    })
    return scriptCache[path]
  }

  function loadCss(href) {
    var links = document.querySelectorAll('link[rel="stylesheet"]')
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('href') === href) return
    }
    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }

  function ensureBase() {
    if (baseReady) return baseReady
    BASE_CSS.forEach(loadCss)
    baseReady = BASE_SCRIPTS.reduce(function (p, path) {
      return p.then(function () { return loadScript(path) })
    }, Promise.resolve()).then(function () {
      return true
    })
    return baseReady
  }

  function normalizeLanguage(language) {
    var key = String(language || 'json').toLowerCase()
    return key === 'yml' ? 'yaml' : key
  }

  function getSpec(language) {
    var key = normalizeLanguage(language)
    return { key: key, spec: LANGUAGES[key] }
  }

  function ensureLanguage(language) {
    var entry = getSpec(language)
    var key = entry.key
    var spec = entry.spec
    if (!spec) return Promise.reject(new Error('不支持的代码语言: ' + language))
    if (languageReady[key]) return languageReady[key]
    languageReady[key] = ensureBase().then(function () {
      return Promise.all(spec.files.map(loadScript))
    }).then(function () {
      languageLoaded[key] = true
      return key
    })
    return languageReady[key]
  }

  function isLoaded(key) {
    return !!languageLoaded[key]
  }

  function create(el, value, options) {
    var opts = options || {}
    var entry = getSpec(opts.language)
    if (!entry.spec) throw new Error('不支持的代码语言: ' + opts.language)
    if (!isLoaded(entry.key)) {
      throw new Error('语言 "' + entry.key + '" 尚未加载，请先 await NovaJsonEditor.ensureLanguage("' + entry.key + '")')
    }
    var editor = CodeMirror(el, {
      value: value == null ? '' : String(value),
      mode: entry.spec.mime,
      theme: opts.dark ? THEME_DARK : THEME_LIGHT,
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      lineWrapping: !!opts.lineWrapping,
      readOnly: !!opts.readOnly,
      gutters: ['CodeMirror-lint-markers', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      lint: !!entry.spec.lint,
      matchBrackets: true,
      autoCloseBrackets: true,
      foldGutter: true
    })
    if (opts.onChange) {
      editor.on('change', function () {
        opts.onChange(editor.getValue())
      })
    }
    return editor
  }

  function setLanguage(editor, language) {
    var entry = getSpec(language)
    if (!entry.spec) throw new Error('不支持的代码语言: ' + language)
    if (!isLoaded(entry.key)) {
      throw new Error('语言 "' + entry.key + '" 尚未加载，请先 await NovaJsonEditor.ensureLanguage("' + entry.key + '")')
    }
    editor.setOption('mode', entry.spec.mime)
    editor.setOption('lint', !!entry.spec.lint)
  }

  function getValue(editor) {
    return editor.getValue()
  }

  function setValue(editor, value) {
    editor.setValue(value == null ? '' : String(value))
  }

  function format(editor) {
    editor.setValue(JSON.stringify(JSON.parse(editor.getValue()), null, 2))
  }

  function minify(editor) {
    editor.setValue(JSON.stringify(JSON.parse(editor.getValue())))
  }

  function validate(value) {
    try {
      JSON.parse(value)
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e.message }
    }
  }

  function changeTheme(editor, dark) {
    editor.setOption('theme', dark ? THEME_DARK : THEME_LIGHT)
  }

  function destroy(editor) {
    var wrap = editor.getWrapperElement()
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap)
  }

  window.NovaJsonEditor = {
    ensureBase: ensureBase,
    ensureLanguage: ensureLanguage,
    create: create,
    setLanguage: setLanguage,
    getValue: getValue,
    setValue: setValue,
    format: format,
    minify: minify,
    validate: validate,
    changeTheme: changeTheme,
    destroy: destroy
  }
})()
