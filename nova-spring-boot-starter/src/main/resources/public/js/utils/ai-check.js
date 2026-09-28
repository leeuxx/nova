// ai-check.js — 新增表单 AI 数据质量门禁（右侧抽屉 + 关闭后浮动图标回看）
// 挂到 window.NovaAiCheck
//
// 用法：
//   NovaAiCheck.registerNova('userNova', true)
//   const result = await NovaAiCheck.gate({novaName, formInfo, appendageFormInfo})
//   // result: { proceed, kind }
//   //   kind: 'pass' | 'stillSubmit' | 'cancelled' | 'editBack' | 'timeout' | 'error'
//   NovaAiCheck.cancelCurrent()
//
// 关闭后行为：drawer 关闭动画结束后在屏幕右侧居中位置显示一个圆形 AI 图标。
//   - 全部通过：绿色图标
//   - 有失败：红色图标 + 右上角数字 badge
//   点击浮动图标可点击弹回查看上次审查的完整内容（无打字机效果）。
// 每次 gate() 调用前会清空浮动图标 + 上次结果缓存。
;(function () {
  if (window.NovaAiCheck) return

  // ── 样式注入 ────────────────────────────
  if (!document.getElementById('__nova_ai_check_css__')) {
    var styleEl = document.createElement('style')
    styleEl.id = '__nova_ai_check_css__'
    styleEl.textContent = ''
      + '.nova-ai-drawer{position:absolute;top:0;right:0;bottom:0;width:380px;background:#fff;border-top-right-radius:12px;border-bottom-right-radius:12px;box-shadow:-8px 0 32px rgba(0,0,0,.12);z-index:99;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB",sans-serif;transform-origin:right center;animation:nadExpand .3s cubic-bezier(.22,.61,.36,1);overflow:hidden}'
      + '.dark .nova-ai-drawer{background:#18181c;box-shadow:-8px 0 32px rgba(0,0,0,.5)}'
      + '@keyframes nadExpand{from{transform:scaleX(0)}to{transform:scaleX(1)}}'
      + '.nova-ai-drawer.is-closing{animation:nadCollapse .3s cubic-bezier(.22,.61,.36,1) forwards}'
      + '@keyframes nadCollapse{from{transform:scaleX(1)}to{transform:scaleX(0)}}'
      + '.nova-ai-drawer-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #eee;flex-shrink:0}'
      + '.dark .nova-ai-drawer-header{border-bottom-color:rgba(255,255,255,.06)}'
      + '.nova-ai-drawer-title{display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:#333}'
      + '.dark .nova-ai-drawer-title{color:#e0e0e0}'
      + '.nova-ai-drawer-title-icon{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#18a058 0%,#36ad6a 100%);color:#fff;font-size:11px;font-weight:700;letter-spacing:.5px;box-shadow:0 2px 6px rgba(24,160,88,.35)}'
      + '.nova-ai-drawer-close{background:none;border:none;font-size:22px;line-height:1;color:#999;cursor:pointer;padding:0 4px;transition:color .15s}'
      + '.nova-ai-drawer-close:hover{color:#333}'
      + '.dark .nova-ai-drawer-close{color:#888}'
      + '.dark .nova-ai-drawer-close:hover{color:#ddd}'
      + '.nova-ai-drawer-body{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0}'
      + '.nova-ai-drawer-loader-wrap{flex:1;display:flex;align-items:center;justify-content:center;min-height:0}'
      + '.nova-ai-drawer-loader-wrap.is-hidden{display:none}'
      + '.nova-ai-drawer-status-loader{display:inline-flex;--primary:150 67% 36%}'
      + '.nova-ai-drawer-list{flex:1;overflow-y:auto;padding:12px 22px;font-size:13px;line-height:1.7;scrollbar-width:thin;min-height:0}'
      + '.nova-ai-drawer-list::-webkit-scrollbar{width:6px;height:6px}'
      + '.nova-ai-drawer-list::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:3px}'
      + '.dark .nova-ai-drawer-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18)}'
      + '.nova-ai-drawer-item{position:relative;display:block;padding:11px 18px;margin:4px 0;border-radius:8px;background:rgba(24,160,88,.04)}'
      + '.nova-ai-drawer-item:first-child{margin-top:0}'
      + '.nova-ai-drawer-item.fail{background:rgba(250,173,20,.06)}'
      + '.dark .nova-ai-drawer-item{background:rgba(24,160,88,.08)}'
      + '.dark .nova-ai-drawer-item.fail{background:rgba(250,173,20,.12)}'
      + '.nova-ai-drawer-item-bar{position:absolute;left:4px;top:9px;bottom:9px;width:3px;border-radius:2px;background:#18a058}'
      + '.nova-ai-drawer-item.fail .nova-ai-drawer-item-bar{background:#faad14}'
      + '.nova-ai-drawer-item .icon{display:inline-block;width:18px;vertical-align:baseline}'
      + '.nova-ai-drawer-item .value{color:#222;font-size:13px;letter-spacing:.2px;word-break:break-all;line-height:1.5}'
      + '.dark .nova-ai-drawer-item .value{color:#ececec}'
      + '.nova-ai-drawer-item .msg{display:block;margin:4px 0 0 18px;color:#999;font-size:12.5px;line-height:1.7;word-break:break-all}'
      + '.dark .nova-ai-drawer-item .msg{color:#aaa}'
      + '.nova-ai-drawer-item.fail .msg{color:#d48806}'
      + '.dark .nova-ai-drawer-item.fail .msg{color:#ffc53d}'
      + '.dot-pass{display:inline-block;width:8px;height:8px;border-radius:50%;background:#18a058}'
      + '.tri-warn{display:inline-block;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid #faad14}'
      + '.typing::after{content:"▋";margin-left:2px;animation:naiCaretBlink 1s steps(1) infinite;color:#999;display:inline-block}'
      + '@keyframes naiCaretBlink{50%{opacity:0}}'
      + '.nova-ai-drawer-footer{padding:14px 22px;min-height:56px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex-shrink:0}'
      + '.nova-ai-drawer-footer[hidden]{display:none}'
      + '.dark .nova-ai-drawer-footer{border-top-color:rgba(255,255,255,.06)}'
      + '.nova-ai-drawer-spinner-wrap{display:flex;align-items:center;justify-content:center;width:100%}'
      + '.nova-ai-drawer-spinner-wrap[hidden]{display:none}'
      + '.nova-ai-drawer-spinner{width:18px;height:18px;border:2px solid #e0e0e0;border-top-color:#18a058;border-radius:50%;animation:naiSpinner .7s linear infinite}'
      + '.dark .nova-ai-drawer-spinner{border-color:#333;border-top-color:#36ad6a}'
      + '@keyframes naiSpinner{to{transform:rotate(360deg)}}'
      + '.nova-ai-drawer-pass{display:flex;align-items:center;width:100%}'
      + '.nova-ai-drawer-pass[hidden]{display:none}'
      + '.nova-ai-drawer-pass-bar{flex:1;height:4px;background:#e8f5ee;border-radius:2px;overflow:hidden}'
      + '.dark .nova-ai-drawer-pass-bar{background:rgba(24,160,88,.15)}'
      + '.nova-ai-drawer-pass-bar-fill{height:100%;width:0%;background:#18a058;border-radius:2px;transition:width 1s linear}'
      + '.dark .nova-ai-drawer-pass-bar-fill{background:#36ad6a}'
      + '.nova-ai-drawer-actions{display:flex;gap:10px;width:100%;justify-content:flex-end}'
      + '.nova-ai-drawer-actions[hidden]{display:none}'
      + '.nova-ai-drawer-btn-primary{padding:7px 18px;border:none;border-radius:4px;background:#faad14;color:#fff;font-size:13px;font-weight:500;cursor:pointer;transition:box-shadow .2s ease,filter .2s ease;box-shadow:0 2px 6px rgba(250,173,20,.25)}'
      + '.nova-ai-drawer-btn-primary:hover{box-shadow:0 4px 12px rgba(250,173,20,.35);filter:brightness(1.05)}'
      + '.nova-ai-drawer-btn-secondary{padding:7px 18px;border:1px solid #dcdfe6;background:#fff;border-radius:4px;color:#333;font-size:13px;cursor:pointer;transition:border-color .15s,color .15s,box-shadow .2s ease}'
      + '.nova-ai-drawer-btn-secondary:hover{border-color:#2563eb;color:#2563eb;box-shadow:0 2px 8px rgba(37,99,235,.12)}'
      + '.dark .nova-ai-drawer-btn-secondary{background:#18181c;border-color:#2a2a2e;color:#d0d0d0}'
      + '.dark .nova-ai-drawer-btn-secondary:hover{border-color:#3b82f6;color:#3b82f6;box-shadow:0 2px 8px rgba(59,130,246,.15)}'
      + '.nova-ai-floating-btn{position:absolute;right:6px;top:50%;margin-top:-22px;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#18a058 0%,#36ad6a 100%);border:none;cursor:pointer;box-shadow:0 6px 20px rgba(24,160,88,.35);z-index:9998;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;letter-spacing:.5px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB",sans-serif;animation:naiFabPopIn .3s cubic-bezier(.22,.61,.36,1);transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease}'
      + '.nova-ai-floating-btn:hover{transform:translateY(-2px) scale(1.08);box-shadow:0 10px 28px rgba(24,160,88,.45),0 0 0 6px rgba(24,160,88,.12)}'
      + '.nova-ai-floating-btn:active{transform:translateY(0) scale(.96);box-shadow:0 4px 14px rgba(24,160,88,.4)}'
      + '.nova-ai-floating-btn.has-fail{background:linear-gradient(135deg,#faad14 0%,#ffc53d 100%);box-shadow:0 6px 20px rgba(250,173,20,.4)}'
      + '.nova-ai-floating-btn.has-fail:hover{transform:scale(1.05);box-shadow:0 10px 28px rgba(250,173,20,.5),0 0 0 6px rgba(250,173,20,.15)}'
      + '@keyframes naiFabPopIn{from{transform:scale(0)}to{transform:scale(1)}}'
      + '.nova-ai-floating-icon{line-height:1;display:block;pointer-events:none}'
      + '.nova-ai-floating-badge{position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;border-radius:9px;background:#fff;color:#faad14;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px;box-shadow:0 2px 6px rgba(0,0,0,.18);border:2px solid #faad14;line-height:1;pointer-events:none}'
      + '.dark .nova-ai-floating-badge{background:#18181c;color:#ffc53d;border-color:#ffc53d}'
      + '.nova-ai-floating-tooltip{position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%);white-space:nowrap;padding:6px 10px;background:rgba(50,50,54,.96);color:#fff;font-size:12px;font-weight:400;line-height:1.5;border-radius:6px;opacity:0;pointer-events:none;transition:opacity .2s ease;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB",sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.25)}'
      + '.nova-ai-floating-tooltip::after{content:"";position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:6px solid rgba(50,50,54,.96)}'
      + '.nova-ai-floating-btn:hover .nova-ai-floating-tooltip{opacity:1}'
      + '.dark .nova-ai-floating-tooltip{background:rgba(255,255,255,.9);color:#333;box-shadow:0 4px 16px rgba(0,0,0,.3)}'
      + '.dark .nova-ai-floating-tooltip::after{border-bottom-color:rgba(255,255,255,.9)}'
    document.head.appendChild(styleEl)
  }

  // ── 模块级状态 ─────────────────────────────────────────────────
  var registry      = Object.create(null)
  var inflight      = Object.create(null)
  var lastCallAt    = Object.create(null)
  var currentCtrl   = null
  var currentClose  = null
  var floatingBtn   = null
  var lastResult    = null    // { items: [...], failedCount: N }

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

  // ── 浮动 AI 图标 ───────────────────────────────────────────────
  function hideFloatingBtn() {
    if (floatingBtn && floatingBtn.parentNode) {
      floatingBtn.parentNode.removeChild(floatingBtn)
    }
    floatingBtn = null
  }

  function showFloatingBtn(items, failedCount) {
    hideFloatingBtn()
    var btn = document.createElement('button')
    btn.className = 'nova-ai-floating-btn' + (failedCount > 0 ? ' has-fail' : '')
    btn.type = 'button'
    var tipText = failedCount > 0
      ? '上次 AI 审查有 ' + failedCount + ' 个建议，点击查看'
      : '上次 AI 审查通过，点击查看'
    btn.innerHTML = '<span class="nova-ai-floating-icon">AI</span>'
      + (failedCount > 0
          ? '<span class="nova-ai-floating-badge">' + failedCount + '</span>'
          : '')
      + '<span class="nova-ai-floating-tooltip">' + tipText + '</span>'
    btn.addEventListener('click', reopenDrawer)
    var host = document.querySelector('.n-modal') || document.body
    host.appendChild(btn)
    floatingBtn = btn
  }

  function reopenDrawer() {
    if (!lastResult) return
    hideFloatingBtn()
    runDrawer({
      mode:                'replay',
      preloadedItems:      lastResult.items,
      preloadedFailedCount: lastResult.failedCount,
      onResolve:           function () {},
      onAfterClose:        function (state) {
        lastResult = {
            items:       state.itemsSnapshot.slice(),
            failedCount: state.failedCount
        }
        showFloatingBtn(lastResult.items, lastResult.failedCount)
      }
    })
  }

  // ── gate 主入口 ────────────────────────────────────────────────
  function gate(payload, opts) {
    cancelCurrent()
    hideFloatingBtn()
    lastResult = null

    opts = opts || {}
    var novaName = payload && payload.novaName
    if (novaName) {
      inflight[novaName]   = true
      lastCallAt[novaName] = Date.now()
    }

    return new Promise(function (resolve) {
      runDrawer({
        mode:        'fresh',
        novaName:    novaName,
        payload:     payload,
        onResolve:   resolve,
        onAfterClose: function (state) {
          lastResult = {
              items:       state.itemsSnapshot.slice(),
              failedCount: state.failedCount
          }
          showFloatingBtn(lastResult.items, lastResult.failedCount)
        }
      })
    })
  }

  // ── drawer 核心（fresh / replay 共用） ──────────────────────────
  function runDrawer(opts) {
    var TYPE_SPEED = 3
    var CLOSE_DURATION = 300
    var isReplay = opts.mode === 'replay'

    var state = {
      resolved:       false,
      acted:          false,
      ctrl:           null,
      timer:          null,
      queue:          [],
      isRendering:    false,
      firstItemSeen:  false,
      failedCount:    opts.preloadedFailedCount || 0,
      itemsSnapshot:  [],
      drawer:          null,
      listEl:          null,
      loaderWrapEl:    null,
      statusLoaderEl:  null,
      closeBtn:        null,
      footerEl:        null,
      spinnerWrapEl:   null,
      passWrapEl:      null,
      passFillEl:      null,
      actionsEl:       null,
      editBtn:         null,
      stillBtn:        null,
      novaName:        opts.novaName,
      onResolve:       opts.onResolve,
      onAfterClose:    opts.onAfterClose
    }

    var drawer = document.createElement('div')
    drawer.className = 'nova-ai-drawer'
    drawer.innerHTML = ''
      + '<div class="nova-ai-drawer-header">'
      +   '<span class="nova-ai-drawer-title">'
      +     '<span class="nova-ai-drawer-title-icon">AI</span>'
      +     '数据质量审查'
      +   '</span>'
      +   '<button class="nova-ai-drawer-close" type="button" aria-label="close">×</button>'
      + '</div>'
      + '<div class="nova-ai-drawer-body">'
      +   '<div class="nova-ai-drawer-loader-wrap">'
      +     '<span class="nova-ai-drawer-status-loader"></span>'
      +   '</div>'
      +   '<div class="nova-ai-drawer-list"></div>'
      + '</div>'
      + '<div class="nova-ai-drawer-footer">'
      +   '<div class="nova-ai-drawer-spinner-wrap">'
      +     '<span class="nova-ai-drawer-spinner"></span>'
      +   '</div>'
      +   '<div class="nova-ai-drawer-pass" hidden>'
      +     '<div class="nova-ai-drawer-pass-bar"><div class="nova-ai-drawer-pass-bar-fill"></div></div>'
      +   '</div>'
      +   '<div class="nova-ai-drawer-actions" hidden>'
      +     '<button class="nova-ai-drawer-btn-secondary nova-ai-drawer-btn-edit" type="button">返回修改</button>'
      +     '<button class="nova-ai-drawer-btn-primary nova-ai-drawer-btn-still" type="button">仍要提交</button>'
      +   '</div>'
      + '</div>'
    var host = document.querySelector('.n-modal') || document.body
    host.appendChild(drawer)
    state.drawer = drawer

    state.listEl         = drawer.querySelector('.nova-ai-drawer-list')
    state.loaderWrapEl   = drawer.querySelector('.nova-ai-drawer-loader-wrap')
    state.statusLoaderEl = drawer.querySelector('.nova-ai-drawer-status-loader')
    state.closeBtn       = drawer.querySelector('.nova-ai-drawer-close')
    state.footerEl       = drawer.querySelector('.nova-ai-drawer-footer')
    state.spinnerWrapEl  = drawer.querySelector('.nova-ai-drawer-spinner-wrap')
    state.passWrapEl     = drawer.querySelector('.nova-ai-drawer-pass')
    state.passFillEl     = drawer.querySelector('.nova-ai-drawer-pass-bar-fill')
    state.actionsEl      = drawer.querySelector('.nova-ai-drawer-actions')
    state.editBtn        = drawer.querySelector('.nova-ai-drawer-btn-edit')
    state.stillBtn       = drawer.querySelector('.nova-ai-drawer-btn-still')

    if (window.NovaLoading && window.NovaLoading.html) {
      state.statusLoaderEl.innerHTML = window.NovaLoading.html()
    }

    function scrollList() { state.listEl.scrollTop = state.listEl.scrollHeight }

    function typewrite(el, content, speed, done) {
      if (!content) { if (done) done(); return }
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
      row.className = 'nova-ai-drawer-item' + (item.ok ? '' : ' fail')

      var bar = document.createElement('span')
      bar.className = 'nova-ai-drawer-item-bar'

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
      state.listEl.appendChild(row)
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
      if (state.isRendering) return
      var item = state.queue.shift()
      if (!item) { state.isRendering = false; return }
      if (!state.firstItemSeen) {
        state.firstItemSeen = true
        state.loaderWrapEl.classList.add('is-hidden')
      }
      state.isRendering = true
      typeItemRow(item, function () {
        state.isRendering = false
        pumpQueue()
      })
    }

    function enqueueRender(item) {
      state.queue.push(item)
      state.itemsSnapshot.push(item)
      pumpQueue()
    }

    function cleanup() {
      if (state.timer) { clearTimeout(state.timer); state.timer = null }
      if (state.ctrl)  { try { state.ctrl.abort() } catch (e) {} state.ctrl = null }
      if (currentCtrl === state.ctrl) currentCtrl = null
      currentClose = null
      if (drawer.parentNode) drawer.parentNode.removeChild(drawer)
    }

    function finish(result) {
      if (state.resolved) return
      state.resolved = true
      if (state.novaName) inflight[state.novaName] = false
      cleanup()
      if (state.onResolve) state.onResolve(result)
      if (state.onAfterClose) state.onAfterClose(state)
    }

    function animateClose(kind, proceed) {
      if (state.resolved) return
      state.acted = true
      drawer.classList.add('is-closing')
      setTimeout(function () {
        finish({ proceed: proceed, kind: kind })
      }, CLOSE_DURATION)
    }

    function endStream() {
      if (state.timer) { clearTimeout(state.timer); state.timer = null }
      function checkFinish() {
        if (state.resolved) return
        if (state.isRendering || state.queue.length > 0) {
          setTimeout(checkFinish, 50)
          return
        }
        if (state.failedCount > 0) {
          state.spinnerWrapEl.hidden = true
          state.actionsEl.hidden = false
          currentCtrl = null
        } else {
          state.spinnerWrapEl.hidden = true
          state.passWrapEl.hidden = false
          setTimeout(function () { state.passFillEl.style.width = '100%' }, 10)
          setTimeout(function () {
            animateClose('pass', true)
          }, 1500)
        }
      }
      checkFinish()
    }

    function onStillSubmit() { if (state.acted) return; animateClose('stillSubmit', true) }
    function onEditBack()    { if (state.acted) return; animateClose('editBack', false) }
    function onClose()       { if (state.acted) return; animateClose('cancelled', false) }
    function forceClose()    { finish({ proceed: false, kind: 'cancelled' }) }

    currentClose = forceClose

    state.closeBtn.addEventListener('click', onClose)
    state.editBtn.addEventListener('click', onEditBack)
    state.stillBtn.addEventListener('click', onStillSubmit)

    if (isReplay) {
      // 回看模式：直接渲染预加载的 items（无打字机效果），根据 failedCount 显示 footer
      var preloaded = opts.preloadedItems || []
      var frag = document.createDocumentFragment()
      for (var i = 0; i < preloaded.length; i++) {
        var it = preloaded[i]
        state.itemsSnapshot.push(it)
        var row = document.createElement('div')
        row.className = 'nova-ai-drawer-item' + (it.ok ? '' : ' fail')
        var bar = document.createElement('span')
        bar.className = 'nova-ai-drawer-item-bar'
        var icon = document.createElement('span')
        icon.className = 'icon'
        icon.innerHTML = it.ok
          ? '<span class="dot-pass"></span>'
          : '<span class="tri-warn"></span>'
        var value = document.createElement('span')
        value.className = 'value'
        value.textContent = it.value || ''
        var msg = document.createElement('span')
        msg.className = 'msg'
        msg.textContent = it.ok ? '' : (it.msg || '')
        row.appendChild(bar)
        row.appendChild(icon)
        row.appendChild(value)
        row.appendChild(msg)
        frag.appendChild(row)
      }
      state.listEl.appendChild(frag)
      state.loaderWrapEl.classList.add('is-hidden')
      scrollList()
      state.firstItemSeen = true

      if (state.failedCount > 0) {
        state.spinnerWrapEl.hidden = true
        state.actionsEl.hidden = false
        currentCtrl = null
      } else {
        // 全部通过：显示倒计时进度条，2秒后自动关闭
        state.spinnerWrapEl.hidden = true
        state.passWrapEl.hidden = false
        setTimeout(function () { state.passFillEl.style.width = '100%' }, 10)
        setTimeout(function () {
          if (!state.resolved) animateClose('pass', true)
        }, 1000)
      }
    } else {
      // fresh 模式：启动 fetch + SSE
      state.ctrl = new AbortController()
      currentCtrl = state.ctrl

      state.timer = setTimeout(function () {
        if (state.resolved) return
        console.warn('[ai-check] 5s 无响应，自动放行')
        animateClose('timeout', true)
      }, 5000)

      fetch('/nova/ai/addSseEmitter', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(opts.payload),
        signal:  state.ctrl.signal
      }).then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status)
        if (state.timer) { clearTimeout(state.timer); state.timer = null }
        var reader = resp.body.getReader()
        var decoder = new TextDecoder('utf-8')
        var buf = ''

        function readChunk() {
          return reader.read().then(function (r) {
            if (r.done) return null
            buf += decoder.decode(r.value, { stream: true })
            var lines = buf.split('\n')
            buf = lines.pop()
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i]
              if (line.indexOf('data:') === 0) {
                var data = line.slice(5).trim()
                if (!data || data === '[DONE]') continue
                try {
                  var obj = JSON.parse(data)
                  if (obj.type === 'item') {
                    if (!obj.ok) state.failedCount++
                    enqueueRender({
                      ok:    !!obj.ok,
                      value: obj.value || '',
                      msg:   obj.msg || ''
                    })
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
        if (state.resolved) return
        if (e && e.name === 'AbortError') {
          finish({ proceed: false, kind: 'cancelled' })
          return
        }
        console.warn('[ai-check] 请求失败，自动放行', e)
        animateClose('error', true)
      })
    }
  }

  window.NovaAiCheck = {
    registerNova:   registerNova,
    shouldCheck:    shouldCheck,
    shouldThrottle: shouldThrottle,
    gate:           gate,
    cancelCurrent:  cancelCurrent
  }
})()