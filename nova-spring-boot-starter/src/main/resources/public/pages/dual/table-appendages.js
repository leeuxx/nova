// pages/dual/table-appendages.js — 双表视图 APPENDAGES 子表渲染组件

;(function () {

window.DualAppendagesTable = {
  name: 'DualAppendagesTable',

  components: { NovaTable: window.NovaTable },

  props: {
    novaName:       { type: String,  required: true },
    parentNovaName: { type: String,  default: '' },
    sourceFields:   { type: Object,  default: function() { return {} } },
    embedKey:       { type: String,  default: '' }
  },

  data: function() {
    return { _dualReloading: false }
  },

  computed: {
    _vmKey: function() {
      return this.$refs.innerTable ? this.$refs.innerTable._vmKey : ''
    }
  },

  methods: {
    reloadDual: function(novaName, sourceFields) {
      var inner = this.$refs.innerTable
      if (inner && inner.reloadDual) inner.reloadDual(novaName, sourceFields)
    }
  },

  // 在父组件 props 更新前将 _dualReloading 同步到内层 <nova-table>
  // 确保内层的 sourceFieldsProp watcher 能正确识别手动 reload
  beforeUpdate: function() {
    var inner = this.$refs.innerTable
    if (inner) inner._dualReloading = this._dualReloading
  },

  template: `
<div style="display:flex;flex-direction:column;overflow:hidden;height:100%">
  <nova-table ref="innerTable"
    :key="'app_' + novaName + '_' + embedKey"
    :dual-mode="true"
    :nova-name-prop="novaName"
    :source-nova-name-prop="parentNovaName"
    :source-fields-prop="sourceFields"
  />
</div>`
}

})()

// 自注册
if (window.NovaTable) {
  window.NovaTable.components = Object.assign(
    window.NovaTable.components || {},
    { DualAppendagesTable: window.DualAppendagesTable }
  )
}
