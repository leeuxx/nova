// pages/table-emb.js — appendagesTable（内嵌子表）Vue 子组件

;(function () {

window.NovaAppendagesTable = {
  name: 'NovaAppendagesTable',

  components: { NovaTable: window.NovaTable },

  props: {
    appNovaName:    { type: String,  required: true },
    parentNovaName: { type: String,  default: '' },
    visible:        { type: Boolean, default: false },
    embedKey:       { type: String,  default: '' },
    isEmbTab:       { type: Boolean, default: false },
    sourceFields:       { type: Object,  default: function() { return {} } },
    refReferenceFields: { type: Object,  default: function() { return {} } }
  },

  template: `
<div :style="'display:flex;flex-direction:column;overflow:hidden;height:' + (isEmbTab ? 'calc(100vh - 240px)' : '460px')">
  <nova-table
    v-if="visible"
    :key="embedKey"
    :embedded-mode="true"
    :nova-name-prop="appNovaName"
    :source-nova-name-prop="parentNovaName"
    :source-fields-prop="sourceFields"
    :ref-reference-fields-prop="refReferenceFields"
  />
</div>
  `
}

})()

// 自注册到 NovaTable 的 components
if (window.NovaTable) {
  window.NovaTable.components = Object.assign(
    window.NovaTable.components || {},
    { NovaAppendagesTable: window.NovaAppendagesTable }
  )
}
