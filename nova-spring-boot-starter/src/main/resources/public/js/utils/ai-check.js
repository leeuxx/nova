// ai-check.js — 新增表单 AI 数据质量门禁
// 挂到 window.NovaAiCheck
//
// 用法：
//   NovaAiCheck.registerNova('userNova', true)   // buildVo.ai.review === true 才注册
//   NovaAiCheck.shouldCheck('userNova')           // → boolean
//   NovaAiCheck.shouldThrottle('userNova')       // 1s 内重复调用返回 true
//   const result = await NovaAiCheck.gate({novaName, formInfo, appendageFormInfo})
//   // result: { proceed, kind, warnings? }
//   //   kind: 'pass' | 'fail' | 'timeout' | 'error' | 'cancelled' | 'editBack' | 'stillSubmit'
//   NovaAiCheck.cancelCurrent()                  // showForm=false 时 watcher 调
;(function () {
  if (window.NovaAiCheck) return

  // ── 样式注入（沿用 demo 配色，仅挂一次） ────────────────────────────
  if (!document.getElementById('__nova_ai_check_css__')) {
    var styleEl = document.createElement('style')
    styleEl.id = '__nova_ai_check_css__'
    styleEl.textContent = ''
      + '.nova-ai-check-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;animation:naiFadeIn .2s ease}'
      + '@keyframes naiFadeIn{from{opacity:0}to{opacity:1}}'
      + '.nova-ai-check-card{width:680px;max-width:92vw;max-height:84vh;background:#fff;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;animation:naiScaleIn .25s cubic-bezier(.22,.61,.36,1)}'
      + '.dark .nova-ai-check-card{background:#18181c;box-shadow:0 12px 40px rgba(0,0,0,.6)}'
      + '@keyframes naiScaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}'
      + '.nova-ai-check-header{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;}'
      + '.nova-ai-check-title{display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:#333}'
      + '.dark .nova-ai-check-title{color:#e0e0e0}'
      + '.nova-ai-check-title-icon{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#18a058 0%,#36ad6a 100%);color:#fff;font-size:11px;font-weight:700;letter-spacing:.5px;box-shadow:0 2px 6px rgba(24,160,88,.35)}'
      + '.nova-ai-check-close{background:none;border:none;font-size:22px;line-height:1;color:#999;cursor:pointer;padding:0 4px;transition:color .15s}'
      + '.nova-ai-check-close:hover{color:#333}'
      + '.dark .nova-ai-check-close{color:#888}'
      + '.dark .nova-ai-check-close:hover{color:#ddd}'
      + '.nova-ai-check-body{display:flex;flex-direction:column;padding:5px 20px 5px 20px;min-height:340px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB",sans-serif}'
      + '.nova-ai-check-loader-wrap{flex:1;display:flex;align-items:center;justify-content:center}'
      + '.nova-ai-check-loader-wrap.is-hidden{display:none}'
      + '.nova-ai-check-status-loader{display:inline-flex;--primary:150 67% 36%}'
      + '.nova-ai-check-list{display:flex;flex-direction:column;gap:2px;max-height:480px;overflow-y:auto;font-size:13px;line-height:1.7;scrollbar-width:thin;padding:6px 8px 6px 4px}'
      + '.nova-ai-check-list::-webkit-scrollbar{width:6px;height:6px}'
      + '.nova-ai-check-list::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:3px}'
      + '.dark .nova-ai-check-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18)}'
      + '.nova-ai-check-item{position:relative;display:block;padding:11px 18px 11px 18px;margin:4px 0;border-radius:8px;background:rgba(24,160,88,.04)}'
      + '.nova-ai-check-item:first-child{margin-top:0}'
      + '.nova-ai-check-item.fail{background:rgba(208,48,80,.05)}'
      + '.dark .nova-ai-check-item{background:rgba(24,160,88,.08)}'
      + '.dark .nova-ai-check-item.fail{background:rgba(208,48,80,.1)}'
      + '.nova-ai-check-item-bar{position:absolute;left:4px;top:9px;bottom:9px;width:3px;border-radius:2px;background:#18a058}'
      + '.nova-ai-check-item.fail .nova-ai-check-item-bar{background:#d03050}'
      + '.nova-ai-check-item .icon{display:inline-block;width:18px;vertical-align:baseline}'
      + '.nova-ai-check-item .value{color:#222;font-size:13px;letter-spacing:.2px;word-break:break-all;line-height:1.5}'
      + '.dark .nova-ai-check-item .value{color:#ececec}'
      + '.nova-ai-check-item .msg{display:block;margin:4px 0 0 18px;color:#999;font-size:12.5px;line-height:1.7;word-break:break-all}'
      + '.dark .nova-ai-check-item .msg{color:#aaa}'
      + '.nova-ai-check-item.fail .msg{color:#d03050}'
      + '.dark .nova-ai-check-item.fail .msg{color:#ff6b85}'
      + '.dot-pass{display:inline-block;width:8px;height:8px;border-radius:50%;background:#18a058}'
      + '.tri-warn{display:inline-block;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid #faad14}'
      + '.typing::after{content:"▋";margin-left:2px;animation:naiCaretBlink 1s steps(1) infinite;color:#999;display:inline-block}'
      + '@keyframes naiCaretBlink{50%{opacity:0}}'
      + '.nova-ai-check-footer{padding:16px 28px;min-height:56px;box-sizing:border-box;display:flex;align-items:center}'
      + '.dark .nova-ai-check-footer{border-top-color:rgba(255,255,255,.06)}'
      + '.nova-ai-check-progress{flex:1;height:4px;background:#ececec;border-radius:2px;overflow:hidden}'
      + '.dark .nova-ai-check-progress{background:#2a2a2e}'
      + '.nova-ai-check-progress-bar{height:100%;background:#18a058;width:0%;transition:width 1s ease;border-radius:2px}'
      + '.nova-ai-check-actions{display:flex;gap:10px;width:100%;justify-content:flex-end}'
      + '.nova-ai-check-btn-primary{padding:7px 18px;border:none;border-radius:4px;background:#faad14;color:#fff;font-size:13px;font-weight:500;cursor:pointer;transition:opacity .15s,transform .15s;box-shadow:0 2px 6px rgba(250,173,20,.25)}'
      + '.nova-ai-check-btn-primary:hover{opacity:.92}'
      + '.nova-ai-check-btn-primary:active{transform:scale(.97)}'
      + '.nova-ai-check-btn-secondary{padding:7px 18px;border:1px solid #dcdfe6;background:#fff;border-radius:4px;color:#333;font-size:13px;cursor:pointer;transition:border-color .15s,color .15s}'
      + '.nova-ai-check-btn-secondary:hover{border-color:#18a058;color:#18a058}'
      + '.dark .nova-ai-check-btn-secondary{background:#18181c;border-color:#2a2a2e;color:#d0d0d0}'
      + '.dark .nova-ai-check-btn-secondary:hover{border-color:#36ad6a;color:#36ad6a}'
    document.head.appendChild(styleEl)
  }

  // ── 注册 / 查询 ────────────────────────────────────────────────
  var registry   = Object.create(null)
  var inflight   = Object.create(null)
  var lastCallAt = Object.create(null)
  var currentCtrl  = null
  var currentClose = null

  function registerNova(name, review) { registry[name] = !!review }
  function shouldCheck(name)           { return !!registry[name] }
  function shouldThrottle(name, ms) {
    ms = ms || 1000
    if (inflight[name]) return true
    var last = lastCallAt[name] || 0
    if (Date.now() - last < ms) return true
    return false
  }

  // ── 当前 gate 句柄（供 watcher 取消用） ──────────────────────────
  function cancelCurrent() {
    if (currentCtrl) {
      try { currentCtrl.abort() } catch (e) {}
      currentCtrl = null
    }
    if (currentClose) {
      var c = currentClose
      currentClose = null
      try { c() } catch (e) {}
    }
  }

  // ── gate()：纯命令式，按 demo 模式逐字打字 ───────────────────────
  function gate(payload, opts) {
    opts = opts || {}
    var novaName = payload && payload.novaName
    if (novaName) {
      inflight[novaName]   = true
      lastCallAt[novaName] = Date.now()
    }

    var TYPE_SPEED = 3

    return new Promise(function (resolve) {
      var resolved   = false
      var acted      = false
      var ctrl       = null
      var timer      = null
      var queue      = []
      var isRendering = false
      var firstItemSeen = false
      var failedCount = 0
      var finalError  = null

      // ── 构造 DOM（一次成型） ──────────────────────────────
      var backdrop = document.createElement('div')
      backdrop.className = 'nova-ai-check-backdrop'
      backdrop.innerHTML = ''
        + '<div class="nova-ai-check-card">'
        +   '<div class="nova-ai-check-header">'
        +     '<span class="nova-ai-check-title">'
        +       '<span class="nova-ai-check-title-icon">AI</span>'
        +       '数据质量审查'
        +     '</span>'
        +     '<button class="nova-ai-check-close" type="button" aria-label="close">×</button>'
        +   '</div>'
        +   '<div class="nova-ai-check-body">'
        +     '<div class="nova-ai-check-loader-wrap">'
        +       '<span class="nova-ai-check-status-loader"></span>'
        +     '</div>'
        +     '<div class="nova-ai-check-list"></div>'
        +   '</div>'
        +   '<div class="nova-ai-check-footer">'
        +     '<div class="nova-ai-check-progress"><div class="nova-ai-check-progress-bar"></div></div>'
        +     '<div class="nova-ai-check-actions" hidden>'
        +       '<button class="nova-ai-check-btn-secondary nova-ai-check-btn-edit" type="button">返回修改</button>'
        +       '<button class="nova-ai-check-btn-primary nova-ai-check-btn-still" type="button">仍要提交</button>'
        +     '</div>'
        +   '</div>'
        + '</div>'
      document.body.appendChild(backdrop)

      var listEl        = backdrop.querySelector('.nova-ai-check-list')
      var loaderWrapEl  = backdrop.querySelector('.nova-ai-check-loader-wrap')
      var statusLoaderEl = backdrop.querySelector('.nova-ai-check-status-loader')
      var closeBtn      = backdrop.querySelector('.nova-ai-check-close')
      var progressEl    = backdrop.querySelector('.nova-ai-check-progress')
      var progressBarEl = backdrop.querySelector('.nova-ai-check-progress-bar')
      var actionsEl     = backdrop.querySelector('.nova-ai-check-actions')
      var editBtn       = backdrop.querySelector('.nova-ai-check-btn-edit')
      var stillBtn      = backdrop.querySelector('.nova-ai-check-btn-still')

      // 挂载跳方块动画（复用 NovaLoading）
      if (window.NovaLoading && window.NovaLoading.html) {
        statusLoaderEl.innerHTML = window.NovaLoading.html()
      }

      function scrollList() {
        listEl.scrollTop = listEl.scrollHeight
      }

      // ── demo 同款 typewrite：直接 DOM appendChild textNode ──
      function typewrite(el, content, speed, done) {
        el.classList.add('typing')
        var i = 0
        function step() {
          if (i >= content.length) {
            el.classList.remove('typing')
            if (done) done()
            return
          }
          el.appendChild(document.createTextNode(content.charAt(i)))
          i++
          scrollList()
          setTimeout(step, speed)
        }
        step()
      }

      function typeItemRow(item, done) {
        var row = document.createElement('div')
        row.className = 'nova-ai-check-item' + (item.ok ? '' : ' fail')

        var bar = document.createElement('span')
        bar.className = 'nova-ai-check-item-bar'

        var icon = document.createElement('span')
        icon.className = 'icon'
        icon.innerHTML = item.ok
          ? '<span class="dot-pass"></span>'
          : '<span class="tri-warn"></span>'

        var value = document.createElement('span')
        value.className = 'value'

        var msg = document.createElement('span')
        msg.className = 'msg'

        row.appendChild(bar)
        row.appendChild(icon)
        row.appendChild(value)
        row.appendChild(msg)
        listEl.appendChild(row)
        scrollList()

        var tail = item.ok ? '' : (item.msg || '')

        function afterValue() {
          if (tail) typewrite(msg, tail, TYPE_SPEED, done)
          else done()
        }

        if (item.value) typewrite(value, item.value, TYPE_SPEED, afterValue)
        else afterValue()
      }

      function pumpQueue() {
        if (isRendering) return
        var item = queue.shift()
        if (!item) { isRendering = false; return }
        if (!firstItemSeen) {
          firstItemSeen = true
          loaderWrapEl.classList.add('is-hidden')
        }
        isRendering = true
        typeItemRow(item, function () {
          isRendering = false
          pumpQueue()
        })
      }

      function enqueueRender(item) {
        queue.push(item)
        pumpQueue()
      }

      function cleanup() {
        if (timer) { clearTimeout(timer); timer = null }
        if (ctrl)  { try { ctrl.abort() } catch (e) {} ctrl = null }
        if (currentCtrl === ctrl) currentCtrl = null
        currentClose = null
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop)
      }

      function finish(result) {
        if (resolved) return
        resolved = true
        if (novaName) inflight[novaName] = false
        cleanup()
        resolve(result)
      }

      function endStream() {
        if (timer) { clearTimeout(timer); timer = null }
        // 等队列里所有 item 打完再判定
        function checkFinish() {
          if (resolved) return
          if (isRendering || queue.length > 0) {
            setTimeout(checkFinish, 50)
            return
          }
          var failed = failedCount > 0 || !!finalError
          if (failed) {
            progressEl.hidden = true
            actionsEl.hidden = false
            // 进入决策阶段，watcher 再触发 cancelCurrent 也只调 close()，不会再 abort（fetch 已结束）
            currentCtrl = null
          } else {
            setTimeout(function () {
              finish({ proceed: true, kind: 'pass' })
            }, 1100)
          }
        }
        checkFinish()
      }

      function onStillSubmit() {
        if (acted) return
        acted = true
        finish({ proceed: true, kind: 'stillSubmit' })
      }

      function onEditBack() {
        if (acted) return
        acted = true
        finish({ proceed: false, kind: 'editBack' })
      }

      function onClose() {
        if (acted) return
        acted = true
        finish({ proceed: false, kind: 'cancelled' })
      }

      currentClose = onClose

      // ── 事件绑定 ─────────────────────────────────────────
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) onClose()
      })
      closeBtn.addEventListener('click', onClose)
      editBtn.addEventListener('click', onEditBack)
      stillBtn.addEventListener('click', onStillSubmit)

      // ── 启动 fetch ─────────────────────────────────────────
      ctrl = new AbortController()
      currentCtrl = ctrl

      // 5s 零字节超时 → 自动放行
      timer = setTimeout(function () {
        if (resolved) return
        console.warn('[ai-check] 5s 无响应，自动放行')
        setTimeout(function () {
          finish({ proceed: true, kind: 'timeout' })
        }, 700)
      }, 5000)

      fetch('/nova/ai/addSseEmitter', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  ctrl.signal
      }).then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status)
        if (timer) { clearTimeout(timer); timer = null }
        var reader = resp.body.getReader()
        var decoder = new TextDecoder('utf-8')
        var buf = ''
        var pendingEvent = 'message'

        function readChunk() {
          return reader.read().then(function (r) {
            if (r.done) return null
            buf += decoder.decode(r.value, { stream: true })
            var lines = buf.split('\n')
            buf = lines.pop()
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i]
              if (line.indexOf('event:') === 0) {
                pendingEvent = line.slice(6).trim()
              } else if (line.indexOf('data:') === 0) {
                var data = line.slice(5).trim()
                if (!data || data === '[DONE]') continue
                try {
                  var obj = JSON.parse(data)
                  if (obj.type === 'item') {
                    if (!obj.ok) failedCount++
                    enqueueRender({
                      ok:    !!obj.ok,
                      value: obj.value || '',
                      msg:   obj.msg || ''
                    })
                  } else if (obj.type === 'error') {
                    finalError = obj.message || '未知错误'
                  } else if (obj.type === 'result' && !obj.ok) {
                    finalError = finalError || ''
                  }
                } catch (e) {
                  console.warn('[ai-check] 解析失败:', data, e)
                }
              }
            }
            return readChunk()
          })
        }
        return readChunk().then(function () { endStream() })
      }).catch(function (e) {
        if (resolved) return
        if (e && e.name === 'AbortError') {
          finish({ proceed: false, kind: 'cancelled' })
          return
        }
        console.warn('[ai-check] 请求失败，自动放行', e)
        setTimeout(function () {
          finish({ proceed: true, kind: 'error', error: (e && e.message) || '请求失败' })
        }, 700)
      })
    })
  }

  window.NovaAiCheck = {
    registerNova:   registerNova,
    shouldCheck:    shouldCheck,
    shouldThrottle: shouldThrottle,
    gate:           gate,
    cancelCurrent:  cancelCurrent
  }
})()