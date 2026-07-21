// pages/table-ref.js — referenceForm（引用详情）Vue 子组件
;(function () {

var NovaRefForm = {
  name: 'NovaRefForm',

  components: {
    NovaTable: window.NovaTable
  },

  props: {
    refNovaName:        { type: String, required: true },
    sourceFormData:     { type: Object, default: function() { return {} } },
    sourceReferenceMap: { type: Object, default: function() { return {} } },
    sourceRawDetailRow: { type: Object, default: function() { return {} } },
    loadingStyle:       { type: String, default: 'spinner' }
  },

  data: function() {
    return { viewData: null }
  },

  mounted: function() {
    this.loadData()
  },

  methods: {
    loadData: function() {
      var self = this
      var fkValue = window.NovaTableJQ_ref.findFkValue(
        this.sourceReferenceMap,
        this.sourceFormData,
        this.sourceRawDetailRow,
        this.refNovaName
      )
      if (!fkValue) {
        this.viewData = {}
        return
      }
      window.NovaTableJQ_ref.fetchRefDetails(this.refNovaName, fkValue, function(data) {
        self.viewData = data
      })
    }
  },

  template: `
<div>
  <div v-if="viewData === null" style="display:flex;align-items:center;justify-content:center;padding:60px">
    <n-spin v-if="loadingStyle === 'spinner'" size="small" />
    <div v-else-if="loadingStyle === 'wave'" class="custom-loading loading-wave" style="padding:0">
      <span class="wave-bars">
        <span class="bar b1"></span>
        <span class="bar b2"></span>
        <span class="bar b3"></span>
        <span class="bar b4"></span>
        <span class="bar b5"></span>
      </span>
    </div>
    <div v-else-if="loadingStyle === 'dots'" class="custom-loading loading-dots" style="padding:0">
      <span class="dots-wrap">
        <span class="dot d1"></span>
        <span class="dot d2"></span>
        <span class="dot d3"></span>
      </span>
    </div>
  </div>
  <nova-table v-else
    :view-mode="true"
    :nova-name-prop="refNovaName"
    :view-row="viewData"
  />
</div>`
}

window.NovaRefForm = NovaRefForm

// 注册到 NovaTable 的 components 中，使其 template 中的 <nova-ref-form> 可解析
if (window.NovaTable) {
  window.NovaTable.components = Object.assign(
    window.NovaTable.components || {},
    { NovaRefForm: NovaRefForm }
  )
}

})()
