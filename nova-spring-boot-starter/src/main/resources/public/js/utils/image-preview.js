// image-preview.js — 图片预览组件（基于 Naive UI NImageGroup 封装）
// 挂载到 window.NovaImagePreview，页面脚本按需引用
// props: srcList(图片URL数组), width, height, objectFit, borderRadius,
//        showDelete(是否渲染红色删除按钮，位于预览工具栏"下载"之后)
// emits: delete({ index, url, list }) 删除后回调，父组件自行更新数据
;(function () {
  if (window.NovaImagePreview) return
  var Vue = window.Vue
  var naive = window.naive
  var defineComponent = Vue.defineComponent
  var ref = Vue.ref
  var watch = Vue.watch
  var h = Vue.h
  var NImageGroup = naive.NImageGroup

  var NovaImagePreview = defineComponent({
    name: 'NovaImagePreview',
    props: {
      srcList: { type: Array, default: function () { return [] } },
      width: { type: [Number, String], default: 20 },
      height: { type: [Number, String], default: 20 },
      objectFit: { type: String, default: 'cover' },
      borderRadius: { type: String, default: '2px' },
      showDelete: { type: Boolean, default: false }
    },
    emits: ['delete'],
    setup: function (props, ctx) {
      var emit = ctx.emit
      var list = ref((props.srcList || []).slice())
      watch(function () { return props.srcList }, function (v) { list.value = (v || []).slice() })

      var previewShow = ref(false)
      var current = ref(0)

      var openAt = function (i) { current.value = i; previewShow.value = true }
      var updateShow = function (s) { previewShow.value = s }
      var updateCurrent = function (i) { current.value = i }
      // 删除当前图：跳到下一张，删空则关闭
      var handleDelete = function () {
        var idx = current.value
        var url = list.value[idx]
        list.value.splice(idx, 1)
        emit('delete', { index: idx, url: url, list: list.value.slice() })
        if (list.value.length === 0) {
          previewShow.value = false
        } else if (idx >= list.value.length) {
          current.value = list.value.length - 1
        }
      }
      return { list: list, previewShow: previewShow, current: current, openAt: openAt, updateShow: updateShow, updateCurrent: updateCurrent, handleDelete: handleDelete }
    },
    render: function () {
      var t = this
      var imgStyle = {
        width: typeof t.width === 'number' ? t.width + 'px' : t.width,
        height: typeof t.height === 'number' ? t.height + 'px' : t.height,
        objectFit: t.objectFit,
        borderRadius: t.borderRadius,
        display: 'block'
      }
      var multi = t.list.length > 1
      var renderToolbar = function (slot) {
        var nodes = slot.nodes
        var parts = multi
          ? [
              nodes.prev,
              h('span', { style: 'font-size:13px;color:#fff;min-width:40px;text-align:center' }, String(t.current + 1) + ' / ' + t.list.length),
              nodes.next,
              h('span', { style: 'width:1px;height:18px;background:rgba(255,255,255,.25);margin:0 2px' })
            ]
          : [ h('span', { style: 'font-size:13px;color:#fff;min-width:40px;text-align:center' }, '1 / 1') ]
        parts.push(nodes.rotateCounterclockwise, nodes.rotateClockwise, nodes.originalSize, nodes.zoomOut, nodes.zoomIn, nodes.download)
        if (t.showDelete) {
          parts.push(h('button', {
            style: 'display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:50%;background:#d03050;color:#fff;cursor:pointer;padding:0',
            title: '删除',
            onClick: t.handleDelete
          }, [ h('iconify-icon', { icon: 'mdi:delete-outline', style: 'font-size:16px;line-height:1' }) ]))
        }
        parts.push(nodes.close)
        return h('div', { style: 'display:flex;align-items:center;gap:6px' }, parts)
      }
      return h('span', { style: 'display:inline-flex;align-items:center;gap:4px' }, [
        t.list.length ? h('span', { style: 'cursor:pointer', onClick: function () { t.openAt(0) } }, [
          h('img', { src: t.list[0], style: imgStyle })
        ]) : null,
        multi ? h('span', {
          style: 'flex-shrink:0;cursor:pointer;font-size:12px;color:#888;padding:2px 6px;background:rgba(128,128,128,0.1);border-radius:3px',
          onClick: function () { t.openAt(0) }
        }, '+' + (t.list.length - 1)) : null,
        h(NImageGroup, {
          srcList: t.list,
          show: t.previewShow,
          current: t.current,
          'onUpdate:show': t.updateShow,
          'onUpdate:current': t.updateCurrent,
          renderToolbar: renderToolbar
        })
      ])
    }
  })

  window.NovaImagePreview = NovaImagePreview
})()
