// pages/edit/table-link.js — linkForm（中间表嵌入式表格 / linkTree 树）Vue 子组件

;(function () {

window.NovaLinkForm = {
  name: 'NovaLinkForm',

  components: { NovaTable: window.NovaTable },

  props: {
    linkNovaName:  { type: String,  required: true },
    novaName:      { type: String,  default: '' },
    tapTitle:      { type: String,  default: '' },
    visible:       { type: Boolean, default: false },
    embedKey:      { type: String,  default: '' },
    isEmbTab:      { type: Boolean, default: false },
    sourceFields:  { type: Object,  default: function() { return {} } },

    // 父级响应式数据（全量对象，组件内部按 linkNovaName 索引）
    linkTabBuild:           { type: Object, default: function() { return {} } },
    linkTreeData:           { type: Object, default: function() { return {} } },
    linkTreeFilteredData:   { type: Object, default: function() { return {} } },
    linkTreeDefaultExpandedKeys: { type: Object, default: function() { return {} } },
    linkTreeExpandedKeys:   { type: Object, default: function() { return {} } },
    linkTreeDisplayKeys:    { type: Object, default: function() { return {} } },
    linkTreeLoading:        { type: Object, default: function() { return {} } },
    linkTreeSearchKeyword:  { type: Object, default: function() { return {} } },
    loadingStyle:           { type: String, default: 'spinner' },
  },

  emits: ['init', 'link-add', 'tree-check', 'tree-search', 'save-tree'],

  data: function() {
    return {
      // LINK 树加载动画：与首屏/普通表一致的跳跃方块（NovaLoading.html）
      novaLoadingHtml: (window.NovaLoading && window.NovaLoading.html) ? window.NovaLoading.html() : ''
    }
  },

  mounted() {
    this.$emit('init', this.linkNovaName)
  },

  computed: {
    hasAddPermission() {
      return window.__hasButton(this.linkNovaName, 'add')
    }
  },
  methods: {
    linkTreeSearchPlaceholder() {
      const config = (this.linkTabBuild[this.linkNovaName] || {}).linkTreeTargetConfig
      if (!config) return '搜索...'
      const cols = config.tableColumns || []
      const searchField = config.treeSearchField
      for (var i = 0; i < cols.length; i++) {
        if (cols[i].field === searchField) {
          return '请输入' + (cols[i].title || searchField)
        }
      }
      return '请输入' + searchField
    },

    linkTreeRenderLabel() {
      var self = this
      var novaName = this.linkNovaName
      return function(info) {
        var node = info.option
        var config = (self.linkTabBuild[novaName] || {}).linkTreeTargetConfig
        var label = config ? (node[config.treeSearchField] || '') : ''
        var keyword = (self.linkTreeSearchKeyword[novaName] || '').trim()
        if (!keyword || !label) return label
        var lower = label.toLowerCase()
        var kw = keyword.toLowerCase()
        var parts = []
        var last = 0
        var idx = lower.indexOf(kw)
        while (idx !== -1) {
          if (idx > last) parts.push(Vue.h('span', {}, label.slice(last, idx)))
          parts.push(Vue.h('span', { style: { color: '#d03050' } }, label.slice(idx, idx + kw.length)))
          last = idx + kw.length
          idx = lower.indexOf(kw, last)
        }
        if (last < label.length) parts.push(Vue.h('span', {}, label.slice(last)))
        return parts.length > 0 ? Vue.h('span', {}, parts) : label
      }
    },

    onSearchUpdate(val) {
      this.$emit('tree-search', this.linkNovaName, val)
    },

    onTreeCheck(keys) {
      this.$emit('tree-check', this.linkNovaName, keys)
    },

    onSave() {
      this.$emit('save-tree', this.linkNovaName)
    },

    onLinkAdd() {
      this.$emit('link-add', this.linkNovaName, this.tapTitle)
    }
  },

  template: `
<div v-if="visible"
  :style="'display:flex;flex-direction:column;overflow:hidden;' + (linkTreeData[linkNovaName] ? 'max-height:500px' : 'height:' + (isEmbTab ? 'calc(100vh - 240px)' : '460px'))">
  <!-- 加载中：跳跃方块动画 -->
  <div v-if="linkTreeLoading[linkNovaName] && !linkTabBuild[linkNovaName]"
    style="display:flex;align-items:center;justify-content:center;padding:60px">
    <div v-html="novaLoadingHtml"></div>
  </div>
  <!-- 树模式（含加载遮罩）：build 返回后立即占据树区域，避免空白 -->
  <div v-else-if="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig"
    style="position:relative;display:flex;flex-direction:column;max-height:500px;min-height:200px">
    <!-- 树数据加载遮罩：跳跃方块动画 -->
    <div v-if="linkTreeLoading[linkNovaName]"
      style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none">
      <div v-html="novaLoadingHtml"></div>
    </div>
    <template v-if="linkTreeData[linkNovaName]">
      <div v-if="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.treeSearchField" style="flex-shrink:0;padding:12px 0 8px 0">
        <n-input
          :value="linkTreeSearchKeyword[linkNovaName]"
          :placeholder="linkTreeSearchPlaceholder()"
          clearable
          @update:value="onSearchUpdate"
          style="width:100%" />
      </div>
      <div class="link-tree-scroll" style="flex:1;overflow:auto;padding:0 0 12px 0">
        <n-tree v-if="!linkTreeFilteredData[linkNovaName] && linkTreeData[linkNovaName]"
          :default-expanded-keys="linkTreeDefaultExpandedKeys[linkNovaName] || []"
          :data="linkTreeData[linkNovaName]"
          :checked-keys="linkTreeDisplayKeys[linkNovaName]"
          :cascade="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.treeCascade !== false"
          :key-field="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.novaIdFieldName"
          :label-field="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.treeSearchField"
          checkable block-line
          @update:checked-keys="onTreeCheck"
        />
        <n-tree v-if="linkTreeFilteredData[linkNovaName]"
          :key="'linkTreeSearch_' + linkNovaName + '_' + (linkTreeSearchKeyword[linkNovaName] || '')"
          :data="linkTreeFilteredData[linkNovaName]"
          :checked-keys="linkTreeDisplayKeys[linkNovaName]"
          :expanded-keys="linkTreeExpandedKeys[linkNovaName] || []"
          :cascade="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.treeCascade !== false"
          :key-field="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.novaIdFieldName"
          :label-field="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.treeSearchField"
          :render-label="linkTreeRenderLabel()"
          checkable block-line
          @update:checked-keys="onTreeCheck"
        />
      </div>
      <div style="flex-shrink:0;padding:8px 0;display:flex;justify-content:flex-end;border-top:1px solid #eee">
        <n-button v-if="hasAddPermission" type="primary" @click="onSave">保 存</n-button>
      </div>
    </template>
  </div>
  <!-- 普通模式：内嵌中间表 -->
  <nova-table v-else-if="linkTabBuild[linkNovaName] && !linkTreeLoading[linkNovaName]"
    :key="embedKey"
    :embedded-mode="true"
    :link-mode="true"
    :nova-name-prop="linkNovaName"
    :source-nova-name-prop="novaName"
    :source-fields-prop="sourceFields"
    @link-add="onLinkAdd"
  />
</div>
  `
}

})()

// 自注册到 NovaTable 的 components
if (window.NovaTable) {
  window.NovaTable.components = Object.assign(
    window.NovaTable.components || {},
    { NovaLinkForm: window.NovaLinkForm }
  )
}
