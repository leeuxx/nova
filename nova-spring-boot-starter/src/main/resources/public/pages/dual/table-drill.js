// pages/dual/table-drill.js — 双表视图 DRILL 子表渲染组件
// 纯展示：无增删改按钮、无行操作列，仅按 joinColumn 过滤显示关联数据

;(function () {

window.DualDrillTable = {
  name: 'DualDrillTable',

  components: { NovaTable: window.NovaTable },

  props: {
    novaName:       { type: String,  required: true },
    parentNovaName: { type: String,  default: '' },
    sourceFields:   { type: Object,  default: function() { return {} } },
    embedKey:       { type: String,  default: '' },
    // drill 配置：{ column, joinColumn, dualTableTitle, linkNovaName }
    drillInfo:      { type: Object,  default: function() { return {} } }
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
  beforeUpdate: function() {
    var inner = this.$refs.innerTable
    if (inner) inner._dualReloading = this._dualReloading
  },

  template: `
<div style="display:flex;flex-direction:column;overflow:hidden;height:100%">
  <nova-table ref="innerTable"
    :key="'drill_' + novaName + '_' + embedKey"
    :dual-mode="true"
    :readonly="true"
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
    { DualDrillTable: window.DualDrillTable }
  )
}
