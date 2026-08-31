// file-list.js — 文件 URL 列表组件（基于 Naive UI NList 封装）
// 挂载到 window.NovaFileList，页面脚本按需引用
// props: fileList(URL数组), showDelete(是否渲染删除按钮), showCopy(是否渲染复制按钮)
// emits: delete({ index, url, list }) 删除后回调，父组件自行更新数据
;(function () {
  if (window.NovaFileList) return
  // NListItem 的 main 区没有 min-width:0，超长 URL 会把它撑开顶出弹窗，这里强制收缩+裁剪让省略号生效
  try {
    var _ls = document.createElement('style')
    _ls.textContent = '.n-list-item__main{flex:1;min-width:0;overflow:hidden}.n-message-container{z-index:10000!important}'
    document.head.appendChild(_ls)
  } catch (e) {}
  var Vue = window.Vue
  var naive = window.naive
  var defineComponent = Vue.defineComponent
  var ref = Vue.ref
  var watch = Vue.watch
  var h = Vue.h

  var fallbackCopy = function (text) {
    var input = document.createElement('textarea')
    input.value = text
    document.body.appendChild(input)
    input.select()
    try { document.execCommand('copy') } catch (e) {}
    document.body.removeChild(input)
  }

  var NovaFileList = defineComponent({
    name: 'NovaFileList',
    props: {
      fileList: { type: Array, default: function () { return [] } },
      showDelete: { type: Boolean, default: false },
      showCopy: { type: Boolean, default: true }
    },
    emits: ['delete'],
    setup: function (props, ctx) {
      var emit = ctx.emit
      var list = ref((props.fileList || []).slice())
      watch(function () { return props.fileList }, function (v) { list.value = (v || []).slice() }, { deep: true })

      var copy = function (text) {
        var done = function () { if (window.$message) window.$message.success(window.__t('common.copy_success')) }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done() })
        } else {
          fallbackCopy(text)
          done()
        }
      }
      var handleDelete = function (i) {
        var url = list.value[i]
        list.value.splice(i, 1)
        emit('delete', { index: i, url: url, list: list.value.slice() })
      }
      return { list: list, copy: copy, handleDelete: handleDelete }
    },
    render: function () {
      var t = this
      if (!t.list.length) {
        return h('div', { style: 'padding:20px 0;color:var(--n-text-color-3);text-align:center;font-size:13px' }, window.__t('table.no_file'))
      }
      var NList = naive.NList
      var NListItem = naive.NListItem
      var NButton = naive.NButton
      return h(NList, { bordered: true, style: 'border-radius:8px' }, {
        default: function () {
          return t.list.map(function (url, idx) {
            var suffix = []
            if (t.showCopy) {
              suffix.push(h(NButton, { size: 'tiny', onClick: function () { t.copy(url) } }, { default: function () { return window.__t('common.copy') } }))
            }
            if (t.showDelete) {
              suffix.push(h(NButton, { size: 'tiny', type: 'error', onClick: function () { t.handleDelete(idx) } }, { default: function () { return window.__t('common.delete') } }))
            }
            return h(NListItem, { key: idx }, {
              prefix: function () { return h('iconify-icon', { icon: 'mdi:file-outline', style: 'font-size:18px;color:#888' }) },
              default: function () { return h('div', { style: 'font-size:13px;color:var(--n-text-color-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%', title: url }, url) },
              suffix: function () { return h('div', { style: 'display:flex;align-items:center;gap:8px;flex-shrink:0' }, suffix) }
            })
          })
        }
      })
    }
  })

  window.NovaFileList = NovaFileList
})()
