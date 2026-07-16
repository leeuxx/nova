// pages/dual/table-link.js — 双表视图 LINK 渲染组件
// 处理树模式（n-tree 搜索/勾选/保存）和非树模式（内嵌 nova-table link-mode）

;(function () {

window.DualLinkTable = {
  name: 'DualLinkTable',

  components: { NovaTable: window.NovaTable },

  props: {
    novaName:       { type: String,  required: true },
    parentNovaName: { type: String,  default: '' },
    sourceFields:   { type: Object,  default: function() { return {} } },
    embedKey:       { type: String,  default: '' },
    label:          { type: String,  default: '' },

    // 树数据（__dual__ 索引，由父级传入具体值）
    linkTabBuild:              { type: Object, default: function() { return {} } },
    linkTreeLoading:           { type: Boolean, default: false },
    linkTreeData:              { type: Array,  default: null },
    linkTreeFilteredData:      { type: Array,  default: null },
    linkTreeDefaultExpandedKeys: { type: Array, default: function() { return [] } },
    linkTreeExpandedKeys:      { type: Array, default: function() { return [] } },
    linkTreeDisplayKeys:       { type: Array, default: function() { return [] } },
    linkTreeSearchKeyword:     { type: String, default: '' }
  },

  emits: ['tree-search', 'tree-check', 'save-tree', 'link-add'],

  data: function() {
    return { _dualReloading: false }
  },

  computed: {
    // 非树模式下代理内嵌 nova-table 的 _vmKey
    _vmKey: function() {
      return this.$refs.innerTable ? this.$refs.innerTable._vmKey : ''
    },
    // 非树模式下代理内嵌 nova-table 的 linkTargetInfo
    linkTargetInfo: function() {
      var inner = this.$refs.innerTable
      return inner ? (inner.linkTargetInfo || {}) : {}
    },
    linkTreeTargetConfig: function() {
      return (this.linkTabBuild || {}).linkTreeTargetConfig || null
    }
  },

  methods: {
    linkTreeSearchPlaceholder: function() {
      var config = this.linkTreeTargetConfig
      if (!config) return '搜索...'
      var cols = config.tableColumns || []
      var searchField = config.treeSearchField
      for (var i = 0; i < cols.length; i++) {
        if (cols[i].field === searchField) {
          return '请输入' + (cols[i].title || searchField)
        }
      }
      return '请输入' + searchField
    },

    onSearchUpdate: function(val) {
      this.$emit('tree-search', val)
    },

    onTreeCheck: function(keys) {
      this.$emit('tree-check', keys)
    },

    onSave: function() {
      this.$emit('save-tree')
    },

    onLinkAdd: function() {
      this.$emit('link-add')
    },

    // 供父级调用的 reload 代理
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
  <!-- 树模式加载中 -->
  <div v-if="linkTreeLoading" style="padding:40px;text-align:center;color:#999">加载中...</div>
  <!-- 树模式已加载 -->
  <template v-else-if="linkTreeData">
    <!-- 搜索条件卡 -->
    <n-card v-if="linkTreeTargetConfig && linkTreeTargetConfig.treeSearchField"
      :bordered="false" class="page-card filter-card" style="flex-shrink:0;min-height:0">
      <div class="filter-grid" style="display:grid;grid-template-columns:1fr;gap:8px">
        <n-input
          :value="linkTreeSearchKeyword"
          :placeholder="linkTreeSearchPlaceholder()"
          clearable
          @update:value="onSearchUpdate"
          style="width:100%" />
      </div>
    </n-card>
    <!-- 树表格卡 -->
    <n-card :bordered="false" class="page-card table-card"
      style="flex:1;min-height:0;display:flex;flex-direction:column"
      content-style="display:flex;flex-direction:column;overflow:hidden;flex:1">
      <div class="table-card-header" style="flex-shrink:0;padding:0 16px">
        <span style="font-size:16px;font-weight:500">数据节点</span>
        <div style="display:flex;gap:8px">
          <n-button type="primary" @click="onSave">保 存</n-button>
        </div>
      </div>
      <div class="link-tree-scroll" style="flex:1;overflow:auto;min-height:0;padding:0 12px 8px">
        <n-tree v-if="!linkTreeFilteredData && linkTreeData"
          :default-expanded-keys="linkTreeDefaultExpandedKeys"
          :data="linkTreeData"
          :checked-keys="linkTreeDisplayKeys"
          :cascade="linkTreeTargetConfig ? linkTreeTargetConfig.treeCascade !== false : true"
          :key-field="linkTreeTargetConfig ? linkTreeTargetConfig.novaIdFieldName : 'id'"
          :label-field="linkTreeTargetConfig ? linkTreeTargetConfig.treeSearchField : 'name'"
          checkable block-line
          @update:checked-keys="onTreeCheck"
        />
        <n-tree v-if="linkTreeFilteredData"
          :key="'dualTreeSearch_' + (linkTreeSearchKeyword || '')"
          :data="linkTreeFilteredData"
          :checked-keys="linkTreeDisplayKeys"
          :expanded-keys="linkTreeExpandedKeys"
          :cascade="linkTreeTargetConfig ? linkTreeTargetConfig.treeCascade !== false : true"
          :key-field="linkTreeTargetConfig ? linkTreeTargetConfig.novaIdFieldName : 'id'"
          :label-field="linkTreeTargetConfig ? linkTreeTargetConfig.treeSearchField : 'name'"
          checkable block-line
          @update:checked-keys="onTreeCheck"
        />
      </div>
    </n-card>
  </template>
  <!-- LINK 非树模式：内嵌中间表表格 -->
  <nova-table v-else
    ref="innerTable"
    :key="embedKey"
    :dual-mode="true"
    link-mode
    :nova-name-prop="novaName"
    :source-nova-name-prop="parentNovaName"
    :source-fields-prop="sourceFields"
    @link-add="onLinkAdd"
  />
</div>`
}

})()

// 自注册
if (window.NovaTable) {
  window.NovaTable.components = Object.assign(
    window.NovaTable.components || {},
    { DualLinkTable: window.DualLinkTable }
  )
}
