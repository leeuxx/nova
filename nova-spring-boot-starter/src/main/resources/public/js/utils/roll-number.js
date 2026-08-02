// roll-number.js — NUMBER 列"加载时滚动动画"组件（count-up 递增）
// 挂载到 window.NovaRollNumber，供表格 NUMBER 列 roll=true 时渲染。
// 挂载时从 0 缓动递增到目标值；value 变化（翻页/刷新等重新加载）时重新滚动。
// 虚拟滚动下视口内新建的行挂载时同样触发动画。
;(function () {
  if (window.NovaRollNumber) return
  var Vue = window.Vue
  var h = Vue.h

  var NovaRollNumber = Vue.defineComponent({
    name: 'NovaRollNumber',
    props: {
      value:    { type: [Number, String], default: 0 },
      decimals: { type: Number, default: 0 },
      duration: { type: Number, default: 1000 }
    },
    setup: function (props) {
      var display = Vue.ref(0)
      var raf = null

      function target() {
        var n = Number(props.value)
        return isNaN(n) ? 0 : n
      }

      function play() {
        if (raf) cancelAnimationFrame(raf)
        var to = target()
        var duration = props.duration || 1000
        if (to === 0) { display.value = 0; return }
        var start = null
        function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }
        function step(ts) {
          if (start === null) start = ts
          var p = Math.min((ts - start) / duration, 1)
          display.value = to * easeOutCubic(p)
          if (p < 1) {
            raf = requestAnimationFrame(step)
          } else {
            display.value = to
          }
        }
        raf = requestAnimationFrame(step)
      }

      Vue.onMounted(play)
      Vue.onBeforeUnmount(function () { if (raf) cancelAnimationFrame(raf) })
      Vue.watch(function () { return props.value }, function () { play() })

      return function () {
        return h('span', { style: 'font-variant-numeric:tabular-nums;display:inline-block' },
          String(Number(display.value).toFixed(props.decimals)))
      }
    }
  })

  window.NovaRollNumber = NovaRollNumber
})()
