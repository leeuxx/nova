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
      + '.nova-ai-mask{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.22);z-index:98;animation:naiMaskFadeIn .3s ease}'
      + '.nova-ai-mask.is-closing{animation:naiMaskFadeOut .3s ease forwards}'
      + '@keyframes naiMaskFadeIn{from{opacity:0}to{opacity:1}}'
      + '@keyframes naiMaskFadeOut{from{opacity:1}to{opacity:0}}'
      + '.dark .nova-ai-mask{background:rgba(0,0,0,.35)}'
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
      + '.nova-ai-floating-wrap{position:absolute;right:0;top:50%;width:64px;height:72px;margin-top:-36px;padding-top:20px;z-index:9998;cursor:pointer;overflow:hidden;animation:naiFabPopIn .3s cubic-bezier(.22,.61,.36,1)}'
      + '@keyframes naiFabPopIn{from{transform:scale(0)}to{transform:scale(1)}}'
      /* ── AI 头像（移植自 demo.html，橘黄色系） ── */
      + '.nova-ai-avatar-visual{--size:52px;position:absolute;top:20px;right:calc(var(--size) * -0.33);width:var(--size);height:var(--size);pointer-events:none;transition:right .35s cubic-bezier(.34,1.56,.64,1)}'
      + '.nova-ai-floating-wrap.active .nova-ai-avatar-visual{right:calc(var(--size) * 0.05)}'
      + '.nova-ai-ai-inner{width:100%;height:100%;transform-origin:right center;transform:rotate(-18deg) scale(.9);transition:transform .35s cubic-bezier(.34,1.56,.64,1);position:relative;animation:naiWiggle 2.4s ease-in-out infinite}'
      + '.nova-ai-floating-wrap.active .nova-ai-ai-inner{transform:rotate(0deg) scale(1);animation:none}'
      + '@keyframes naiWiggle{0%,100%{transform:rotate(-18deg) scale(.9) translateY(0)}25%{transform:rotate(-14deg) scale(.92) translateY(-2px)}50%{transform:rotate(-18deg) scale(.9) translateY(0)}75%{transform:rotate(-22deg) scale(.92) translateY(-2px)}}'
      + '.nova-ai-avatar-face{width:100%;height:100%;background:radial-gradient(circle at 30% 25%,#fff4e6,#ffd9b5);border-radius:50%;border:3px solid #ffffffd0;box-shadow:inset 0 -6px 8px rgba(180,120,70,.1),0 0 0 3px #ffe1c6;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}'
      + '.nova-ai-face-features{position:relative;display:flex;flex-direction:column;align-items:center;margin-top:3px}'
      + '.nova-ai-eyes{display:flex;gap:10px;margin-bottom:3px}'
      + '.nova-ai-eye-wrap{width:8px;height:10px;position:relative;animation:naiBlink 5s infinite;transform-origin:center}'
      + '.nova-ai-eye{width:100%;height:100%;background:#4f3a2b;border-radius:50% 50% 40% 40%;position:relative;transition:transform .2s}'
      + '.nova-ai-eye::after{content:"";position:absolute;top:2px;left:2px;width:3px;height:3px;background:#fff9f0;border-radius:50%}'
      + '@keyframes naiBlink{0%,94%{transform:scaleY(1)}95.5%,96.5%{transform:scaleY(.05)}98%,100%{transform:scaleY(1)}}'
      + '.nova-ai-ai-inner .nova-ai-eye{transform:translateX(2px) scaleY(.9)}'
      + '.nova-ai-floating-wrap.active .nova-ai-eye{transform:translateX(0) scaleY(1)}'
      + '.nova-ai-mouth{width:6px;height:1.5px;background:#b35e2e;border-radius:1px;margin-top:3px;transition:opacity .2s}'
      + '.nova-ai-ai-inner .nova-ai-mouth{opacity:.8}'
      + '.nova-ai-floating-wrap.active .nova-ai-mouth{opacity:1;background:#d46b3a}'
      + '.nova-ai-blush{position:absolute;top:60%;left:9%;width:8px;height:5px;background:#ffb6b6;border-radius:50%;opacity:.5;filter:blur(1.5px);transition:opacity .3s,transform .3s}'
      + '.nova-ai-blush.right{left:auto;right:9%}'
      + '.nova-ai-floating-wrap.active .nova-ai-blush{opacity:.9;transform:scale(1.2)}'
      /* 睡帽 */
      + '.nova-ai-nightcap{position:absolute;top:-15px;left:50%;transform:translateX(-50%);width:50px;height:24px;pointer-events:none;z-index:2;transition:transform .4s cubic-bezier(.34,1.56,.64,1)}'
      + '.nova-ai-nightcap .nova-ai-cap-body{position:absolute;bottom:0;left:50%;transform:translateX(-50%) rotate(-10deg);transform-origin:bottom center;width:46px;height:19px;background:linear-gradient(160deg,#ffe9d4 0%,#ffd0a8 60%,#ffbe8c 100%);border:2px solid #ffffffd0;border-radius:50% 50% 35% 35% / 90% 90% 25% 25%;box-shadow:inset -2px -2px 4px rgba(200,130,80,.18),inset 2px 2px 3px rgba(255,255,255,.7);transition:transform .4s cubic-bezier(.34,1.56,.64,1)}'
      + '.nova-ai-nightcap .nova-ai-cap-brim{position:absolute;bottom:-2px;left:50%;transform:translateX(-50%) rotate(-10deg);transform-origin:bottom center;width:48px;height:8px;background:linear-gradient(160deg,#ffd9b5,#ffc79b);border:2px solid #ffffffd0;border-radius:50%;box-shadow:0 2px 3px rgba(200,130,80,.18);transition:transform .4s cubic-bezier(.34,1.56,.64,1)}'
      + '.nova-ai-floating-wrap.active .nova-ai-nightcap{transform:translateX(-50%) translateY(-2px)}'
      + '.nova-ai-floating-wrap.active .nova-ai-cap-body,.nova-ai-floating-wrap.active .nova-ai-cap-brim{transform:translateX(-50%) rotate(0deg)}'
      /* 蝴蝶结 */
      + '.nova-ai-bow{position:absolute;top:7px;left:-2px;width:13px;height:9px;pointer-events:none;z-index:3;transition:transform .4s cubic-bezier(.34,1.56,.64,1)}'
      + '.nova-ai-bow::before,.nova-ai-bow::after{content:"";position:absolute;top:0;width:7px;height:9px;background:radial-gradient(circle at 30% 30%,#ffb0c0,#ff7a9a);border:1px solid #ffffffd0}'
      + '.nova-ai-bow::before{left:0;border-radius:60% 40% 50% 50% / 50% 50% 50% 50%;transform:rotate(-8deg)}'
      + '.nova-ai-bow::after{right:0;border-radius:40% 60% 50% 50% / 50% 50% 50% 50%;transform:rotate(8deg)}'
      + '.nova-ai-bow .nova-ai-knot{position:absolute;top:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;background:#ff5a7a;border-radius:50%;border:1px solid #ffffffd0;z-index:1}'
      + '.nova-ai-floating-wrap.active .nova-ai-bow{transform:scale(1.12) rotate(5deg)}'
      /* 气泡（仅失败时显示） */
      + '.nova-ai-bubble{position:absolute;top:-26px;left:50%;transform:translateX(-50%);width:21px;height:17px;background:#fff;border:2px solid #ffb888;border-radius:50% 50% 50% 50% / 55% 55% 45% 45%;box-shadow:0 3px 8px rgba(200,130,80,.2);pointer-events:none;z-index:4;animation:naiBubbleFloat 1.8s ease-in-out infinite;transition:opacity .3s ease}'
      + '.nova-ai-bubble .nova-ai-tail-down{position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:6px solid #ffb888}'
      + '.nova-ai-bubble .nova-ai-tail-down::after{content:"";position:absolute;top:-6px;left:-3px;width:0;height:0;border-left:3px solid transparent;border-right:3px solid transparent;border-top:4px solid #fff}'
      + '.nova-ai-bubble .nova-ai-dots{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;gap:2px}'
      + '.nova-ai-bubble .nova-ai-dots span{width:3px;height:3px;background:#ff8c5a;border-radius:50%;display:block;animation:naiDotBounce 1.4s ease-in-out infinite}'
      + '.nova-ai-bubble .nova-ai-dots span:nth-child(2){animation-delay:.2s}'
      + '.nova-ai-bubble .nova-ai-dots span:nth-child(3){animation-delay:.4s}'
      + '@keyframes naiDotBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-3px)}}'
      + '@keyframes naiBubbleFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-3px)}}'
      + '.nova-ai-floating-wrap.active .nova-ai-bubble{opacity:0}'
      /* badge */
      + '.nova-ai-floating-badge{position:absolute;top:-2px;left:-2px;min-width:16px;height:16px;border-radius:8px;background:#fff;color:#faad14;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 6px rgba(0,0,0,.18);border:2px solid #faad14;line-height:1;pointer-events:none;box-sizing:border-box;z-index:5}'
      + '.dark .nova-ai-floating-badge{background:#18181c;color:#ffc53d;border-color:#ffc53d}'
      /* 暗色模式：保持暖白调，稍微压暗 */
      + '.dark .nova-ai-avatar-face{background:radial-gradient(circle at 30% 25%,#e8d8c8,#d4bea8);border-color:rgba(255,255,255,.25);box-shadow:inset 0 -4px 6px rgba(120,80,50,.12),0 0 0 3px #d0b8a0}'
      + '.dark .nova-ai-eye{background:#3f3024}'
      + '.dark .nova-ai-eye::after{background:#f0ece4}'
      + '.dark .nova-ai-mouth{background:#9a5028}'
      + '.dark .nova-ai-floating-wrap.active .nova-ai-mouth{background:#b0602e}'
      + '.dark .nova-ai-blush{background:#d89898;opacity:.45}'
      + '.dark .nova-ai-floating-wrap.active .nova-ai-blush{opacity:.8}'
      + '.dark .nova-ai-nightcap .nova-ai-cap-body{background:linear-gradient(160deg,#d8c8b0 0%,#c8a888 60%,#b89878 100%);border-color:rgba(255,255,255,.2);box-shadow:inset -2px -2px 4px rgba(160,100,60,.15),inset 2px 2px 3px rgba(255,255,255,.4)}'
      + '.dark .nova-ai-nightcap .nova-ai-cap-brim{background:linear-gradient(160deg,#c8b098,#b89878);border-color:rgba(255,255,255,.2);box-shadow:0 2px 3px rgba(160,100,60,.15)}'
      + '.dark .nova-ai-bow::before,.dark .nova-ai-bow::after{background:radial-gradient(circle at 30% 30%,#d09898,#b06878);border-color:rgba(255,255,255,.2)}'
      + '.dark .nova-ai-bow .nova-ai-knot{background:#c05868;border-color:rgba(255,255,255,.2)}'
      + '.dark .nova-ai-bubble{background:#e8e0d8;border-color:#c89878;box-shadow:0 3px 8px rgba(0,0,0,.25)}'
      + '.dark .nova-ai-bubble .nova-ai-tail-down{border-top-color:#c89878}'
      + '.dark .nova-ai-bubble .nova-ai-tail-down::after{border-top-color:#e8e0d8}'
      + '.dark .nova-ai-bubble .nova-ai-dots span{background:#e87858}'
      + '.nova-ai-floating-tooltip{position:fixed;white-space:nowrap;padding:6px 10px;background:rgba(50,50,54,.96);color:#fff;font-size:12px;font-weight:400;line-height:1.5;border-radius:6px;opacity:0;pointer-events:none;transition:opacity .2s ease;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB",sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.25)}'
      + '.nova-ai-floating-tooltip.is-show{opacity:1}'
      + '.nova-ai-floating-tooltip::after{content:"";position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid rgba(50,50,54,.96)}'
      + '.dark .nova-ai-floating-tooltip{background:rgba(255,255,255,.9);color:#333;box-shadow:0 4px 16px rgba(0,0,0,.3)}'
      + '.dark .nova-ai-floating-tooltip::after{border-top-color:rgba(255,255,255,.9)}'
    document.head.appendChild(styleEl)
  }

  // ── 模块级状态 ─────────────────────────────────────────────────
  var registry      = Object.create(null)
  var inflight      = Object.create(null)
  var lastCallAt    = Object.create(null)
  var currentCtrl   = null
  var currentClose  = null
  var floatingBtn   = null
  var floatingTip   = null
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
    if (floatingTip && floatingTip.parentNode) {
      floatingTip.parentNode.removeChild(floatingTip)
    }
    floatingTip = null
    if (floatingBtn && floatingBtn.parentNode) {
      floatingBtn.parentNode.removeChild(floatingBtn)
    }
    floatingBtn = null
  }

  function showFloatingTooltip(btn, text) {
    if (!floatingTip) {
      floatingTip = document.createElement('div')
      floatingTip.className = 'nova-ai-floating-tooltip'
      document.body.appendChild(floatingTip)
    }
    floatingTip.textContent = text
    // 先显示以便测量尺寸
    floatingTip.style.visibility = 'hidden'
    floatingTip.classList.add('is-show')
    var btnRect = btn.getBoundingClientRect()
    var tipW = floatingTip.offsetWidth
    var tipH = floatingTip.offsetHeight
    var tipLeft = btnRect.left + btnRect.width / 2 - tipW / 2
    var tipTop = btnRect.top - tipH - 10
    floatingTip.style.left = tipLeft + 'px'
    floatingTip.style.top = tipTop + 'px'
    floatingTip.style.visibility = ''
  }

  function hideFloatingTooltip() {
    if (floatingTip) {
      floatingTip.classList.remove('is-show')
    }
  }

  function showFloatingBtn(items, failedCount) {
    hideFloatingBtn()
    var wrap = document.createElement('div')
    wrap.className = 'nova-ai-floating-wrap'
    var tipText = failedCount > 0
      ? '上次 AI 审查有 ' + failedCount + ' 个建议，点击查看'
      : '上次 AI 审查通过，点击查看'

    // 构建头像 HTML（移植自 demo.html）
    var avatarHtml = '<div class="nova-ai-avatar-visual">'
      + '<div class="nova-ai-ai-inner">'
      + '<div class="nova-ai-avatar-face">'
      // 气泡（仅失败时）
      + (failedCount > 0
          ? '<div class="nova-ai-bubble"><div class="nova-ai-dots"><span></span><span></span><span></span></div><div class="nova-ai-tail-down"></div></div>'
          : '')
      // 睡帽
      + '<div class="nova-ai-nightcap"><div class="nova-ai-cap-body"></div><div class="nova-ai-cap-brim"></div></div>'
      // 蝴蝶结
      + '<div class="nova-ai-bow"><div class="nova-ai-knot"></div></div>'
      // 五官
      + '<div class="nova-ai-face-features">'
      + '<div class="nova-ai-eyes">'
      + '<div class="nova-ai-eye-wrap"><div class="nova-ai-eye"></div></div>'
      + '<div class="nova-ai-eye-wrap"><div class="nova-ai-eye"></div></div>'
      + '</div>'
      + '<div class="nova-ai-mouth"></div>'
      + '</div>'
      + '<div class="nova-ai-blush left"></div>'
      + '<div class="nova-ai-blush right"></div>'
      // badge（仅失败时）
      + (failedCount > 0
          ? '<span class="nova-ai-floating-badge">' + failedCount + '</span>'
          : '')
      + '</div></div></div>'

    wrap.innerHTML = avatarHtml
    wrap.addEventListener('click', reopenDrawer)
    wrap.addEventListener('mouseenter', function () {
      wrap.classList.add('active')
      // 延迟显示 tooltip，等头像滑出动画走一会
      setTimeout(function () {
        if (wrap.classList.contains('active')) {
          showFloatingTooltip(wrap, tipText)
        }
      }, 200)
    })
    wrap.addEventListener('mouseleave', function () {
      wrap.classList.remove('active')
      hideFloatingTooltip()
    })
    // 随机眨眼周期
    var eyeWraps = wrap.querySelectorAll('.nova-ai-eye-wrap')
    var dur = (4 + Math.random() * 2.5).toFixed(1)
    for (var i = 0; i < eyeWraps.length; i++) {
      eyeWraps[i].style.animationDuration = dur + 's'
    }
    var host = document.querySelector('.n-modal') || document.body
    host.appendChild(wrap)
    floatingBtn = wrap
  }

  function reopenDrawer() {
    if (!lastResult) return
    hideFloatingBtn()
    runDrawer({
      mode:                'replay',
      preloadedItems:      lastResult.items,
      preloadedFailedCount: lastResult.failedCount,
      onResolve:           lastResult.onResolve,
      onAfterClose:        function (state) {
        lastResult = {
            items:       state.itemsSnapshot.slice(),
            failedCount: state.failedCount,
            onResolve:   lastResult.onResolve
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

    // 构建字段值映射表（主表 + 附表），AI 返回的 name 直接查表取值
    var valueMap = {}
    if (payload && payload.formInfo) {
      for (var i = 0; i < payload.formInfo.length; i++) {
        var fi = payload.formInfo[i]
        if (fi.field) valueMap[fi.field] = fi.value
      }
    }
    if (payload && payload.appendageFormInfo) {
      for (var subNovaName in payload.appendageFormInfo) {
        if (!Object.prototype.hasOwnProperty.call(payload.appendageFormInfo, subNovaName)) continue
        var subList = payload.appendageFormInfo[subNovaName]
        for (var j = 0; j < subList.length; j++) {
          var sf = subList[j]
          if (sf.field) valueMap[subNovaName + '.' + sf.field] = sf.value
        }
      }
    }

    return new Promise(function (resolve) {
      runDrawer({
        mode:           'fresh',
        novaName:       novaName,
        payload:        payload,
        valueMap:       valueMap,
        onResolve:      resolve,
        onAfterClose: function (state) {
          lastResult = {
              items:       state.itemsSnapshot.slice(),
              failedCount: state.failedCount,
              onResolve:   resolve
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

    var mask = document.createElement('div')
    mask.className = 'nova-ai-mask'
    var drawer = document.createElement('div')
    drawer.className = 'nova-ai-drawer'
    drawer.innerHTML = ''
      + '<div class="nova-ai-drawer-header">'
      +   '<span class="nova-ai-drawer-title">'
      +     '<span class="nova-ai-drawer-title-icon">AI</span>'
      +     '数据质量审查'
      +   '</span>'
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
    host.appendChild(mask)
    host.appendChild(drawer)
    state.drawer = drawer

    state.listEl         = drawer.querySelector('.nova-ai-drawer-list')
    state.loaderWrapEl   = drawer.querySelector('.nova-ai-drawer-loader-wrap')
    state.statusLoaderEl = drawer.querySelector('.nova-ai-drawer-status-loader')
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
      if (mask.parentNode) mask.parentNode.removeChild(mask)
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

    function softClose() {
      if (state.resolved) return
      state.acted = false
      if (state.novaName) inflight[state.novaName] = false
      if (state.timer) { clearTimeout(state.timer); state.timer = null }
      if (state.ctrl)  { try { state.ctrl.abort() } catch (e) {} state.ctrl = null }
      currentClose = null
      if (mask.parentNode) mask.parentNode.removeChild(mask)
      if (drawer.parentNode) drawer.parentNode.removeChild(drawer)
      if (state.onAfterClose) state.onAfterClose(state)
    }

    function animateClose(kind, proceed) {
      if (state.resolved) return
      state.acted = true
      mask.classList.add('is-closing')
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
    function onEditBack() {
      if (state.acted) return
      state.acted = true
      mask.classList.add('is-closing')
      drawer.classList.add('is-closing')
      setTimeout(function () {
        softClose()
      }, CLOSE_DURATION)
    }
    function onClose()       { if (state.acted) return; animateClose('cancelled', false) }
    function forceClose()    { softClose() }

    currentClose = forceClose

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
        console.warn('[ai-check] 无响应，自动放行')
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
                    // AI 不再返回 value，从本地 valueMap 按 name 查表取值
                    var lookedUpValue = (opts.valueMap && obj.name) ? opts.valueMap[obj.name] : ''
                    enqueueRender({
                      ok:    !!obj.ok,
                      value: lookedUpValue || '',
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