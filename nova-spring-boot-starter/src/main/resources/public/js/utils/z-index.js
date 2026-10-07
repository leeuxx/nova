// z-index.js — 全局弹窗层级管理器
// 挂到 window.NovaZIndex
//
// 用法：
//   const z = NovaZIndex.acquire()   // 取一个 z-index，自动递增
//   NovaZIndex.release(z)            // 归还，可被复用
//   NovaZIndex.peek()                // 查看当前最高值（不取）
//
// 设计：
//   - 基础值 3000（高于 naive-ui 默认 modal ~2000）
//   - 每次 acquire 递增 100，预留中间值空间
//   - release 归还到可用池，优先复用已归还的
;(function () {
  if (window.NovaZIndex) return

  var BASE = 3000
  var STEP = 100
  var current = BASE
  var pool = []  // 已归还的 z-index，优先复用

  window.NovaZIndex = {
    acquire: function () {
      if (pool.length > 0) {
        return pool.pop()
      }
      var z = current
      current += STEP
      return z
    },
    release: function (z) {
      if (typeof z !== 'number' || z < BASE) return
      pool.push(z)
    },
    peek: function () {
      return current
    }
  }
})()
