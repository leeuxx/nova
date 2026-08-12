// pages/table-ref.js — referenceForm（引用详情，只读表单式反显）Vue 子组件
;(function () {

var NovaRefForm = {
  name: 'NovaRefForm',

  components: {
    NovaImagePreview: window.NovaImagePreview
  },

  props: {
    refNovaName:        { type: String, required: true },
    sourceFormData:     { type: Object, default: function() { return {} } },
    sourceReferenceMap: { type: Object, default: function() { return {} } },
    sourceRawDetailRow: { type: Object, default: function() { return {} } },
    loadingStyle:       { type: String, default: 'spinner' }
  },

  data: function() {
    return {
      viewData: null,
      editFields: [],
      editLayout: 'DEFAULT',
      choiceMap: {},
      dateMap: {},
      attachmentMap: {},
      referenceMap: {}
    }
  },

  computed: {
    // 按 group 值分组：同组字段归入一个面板，未分组字段归入无标题面板，面板按首次出现顺序排列
    sections: function() {
      var seen  = {}
      var order = []
      var map   = {}
      ;(this.editFields || []).forEach(function(f) {
        var g = (f && f.group) || ''
        if (!seen[g]) {
          seen[g] = true
          order.push(g)
          map[g] = []
        }
        map[g].push(f)
      })
      var self = this
      return order.map(function(g) {
        return { key: g || '__ungrouped__', title: g || '', items: map[g] }
      }).filter(function(sec) {
        return sec.items.some(function(f) { return self.fieldVisible(f) })
      })
    },
    gridStyle: function() {
      return 'display:grid;gap:20px 24px;' + (this.editLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')
    }
  },

  mounted: function() {
    this.loadData()
  },

  methods: {
    loadData: function() {
      var self = this

      // 获取引用表的 thisForm 字段配置及类型元信息
      window.fetchApi.post('/nova/table/build', { novaName: this.refNovaName }, window.__novaMenuCode(this.refNovaName)).then(function(resp) {
        if (resp.data) {
          self.editFields = (resp.data.edit || []).filter(function(e) { return e.tapType === 'thisForm' }).reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
          self.editLayout = (resp.data.layout || {}).editLayout || 'DEFAULT'
          self.choiceMap     = resp.data.choice     || {}
          self.dateMap       = resp.data.date       || {}
          self.attachmentMap = resp.data.attachment  || {}
          self.referenceMap  = resp.data.reference   || {}
        }
      })

      // 获取引用详情数据（反显）
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
    },

    // ── 字段动态显示判断 ──────────────────────────────
    fieldVisible: function(f) {
      if (!f.showByExpr) return true
      return window.evalShowExpr(f.showByExpr, this.viewData || {})
    },

    // ── 取值 ────────────────────────────────────────
    _getVal: function(col, row) {
      var v = row[col.field]
      return v != null ? v : ''
    },

    formatText: function(col, row) {
      var val = this._getVal(col, row)
      if (val === null || val === undefined || val === '') return ''

      // REFERENCE
      if (col.type === 'REFERENCE') {
        var displayVal = row[col.field + '_display']
        if (displayVal !== null && displayVal !== undefined && displayVal !== '') return String(displayVal)
        if (val && typeof val === 'object') {
          var refInfo = (this.referenceMap || {})[col.field] || {}
          if (refInfo.displayField && val[refInfo.displayField] != null) return String(val[refInfo.displayField])
          return ''
        }
        return val != null ? String(val) : ''
      }

      var s = String(val)
      if (!s) return ''

      // BOOLEAN
      if (col.type === 'BOOLEAN') {
        return s.toLowerCase() === 'true' ? '是' : '否'
      }

      // CHOICE
      if (col.type === 'CHOICE') {
        var choice = this.choiceMap[col.field]
        if (choice && choice.values) {
          // values 可能是对象 {key: label} 或数组 [{value, label}, ...]
          var valMap = {}
          if (Array.isArray(choice.values)) {
            choice.values.forEach(function(item) {
              if (item && item.value !== undefined) valMap[String(item.value)] = item.label || String(item.value)
            })
          } else {
            for (var k in choice.values) valMap[k] = choice.values[k]
          }
          if (choice.selectType === 'MULTI') {
            return s.split(',').map(function(v) {
              return valMap[v.trim()] || v.trim()
            }).filter(Boolean).join('、')
          }
          return valMap[s] || s
        }
        return s
      }

      // TAG
      if (col.type === 'TAG') {
        return s.split(',').map(function(t) { return t.trim() }).filter(Boolean).join('、')
      }

      // DATE
      if (col.type === 'DATE') {
        var ts = Number(val)
        if (!isNaN(ts)) {
          var dateInfo = this.dateMap[col.field]
          return this._formatDateTs(ts, dateInfo && dateInfo.type)
        }
      }

      return s
    },

    // BOOLEAN
    formatBoolean: function(col, row) {
      var val = row[col.field]
      if (val === null || val === undefined || val === '') return ''
      return String(val).toLowerCase() === 'true' ? '是' : '否'
    },

    // BOOLEAN 禁用开关取值
    booleanValue: function(f) {
      var v = this._getVal(f, this.viewData)
      if (v === true || v === 1) return true
      if (v === false || v === 0) return false
      return String(v).toLowerCase() === 'true'
    },


    // 统一取展示文本（空值由模板以 '-' 占位）
    displayText: function(f) {
      if (f.type === 'BOOLEAN') return this.formatBoolean(f, this.viewData)
      return this.formatText(f, this.viewData)
    },

    // ATTACHMENT IMAGE 判断
    isImageAttach: function(col) {
      var attInfo = this.attachmentMap[col.field]
      return attInfo && attInfo.tableShowType === 'IMAGE'
    },

    // 获取附件 URL 列表
    getAttachUrls: function(col, row) {
      var val = row[col.field]
      if (!val) return []
      return String(val).split(',').map(function(u) { return u.trim() }).filter(Boolean)
    },

    // CHOICE 颜色
    getChoiceColor: function(col, row) {
      var val = row[col.field]
      if (!val) return null
      var s = String(val)
      var choice = this.choiceMap[col.field]
      if (choice && choice._colors && choice._colors[s]) return choice._colors[s]
      return null
    },

    // HTML 检测
    containsHtml: function(str) {
      return /<[a-z]+[\s>]/i.test(String(str))
    },

    // 日期格式化
    _formatDateTs: function(ts, type) {
      var d = new Date(ts)
      var p = function(n) { return String(n).padStart(2, '0') }
      if (type === 'YEAR')       return String(d.getFullYear())
      if (type === 'MONTH')      return d.getFullYear() + '-' + p(d.getMonth() + 1)
      if (type === 'DATE')       return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
      if (type === 'TIME')       return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
    }
  },

  template: `
<div class="ref-detail">
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
  <div v-else>
    <n-card v-for="sec in sections" :key="sec.key" class="form-panel" size="small" :bordered="true">
      <template v-if="sec.title" #header>
        <span>{{ sec.title }}</span>
      </template>
      <div :style="gridStyle">
        <template v-for="f in sec.items" :key="f.field">
          <n-divider v-if="f.type === 'DIVIDE' && editLayout !== 'FULL_LINE'" style="grid-column:1/-1;margin:0">{{ f.title }}</n-divider>
          <div v-else-if="f.type === 'EMPTY' && editLayout !== 'FULL_LINE'"></div>
          <div v-else-if="f.type !== 'DIVIDE' && f.type !== 'EMPTY' && f.type !== 'BUTTON'"
            :style="'display:flex;align-items:' + (f.type === 'BOOLEAN' ? 'center' : 'baseline') + ';gap:8px;min-width:0;overflow:hidden' + (f.type === 'TEXTAREA' ? ';grid-column:1/-1' : '')">
            <span class="ref-desc-label">{{ f.title }}</span>
            <n-button-group v-if="f.type === 'BOOLEAN' && displayText(f) !== ''" size="small">
              <n-button :type="booleanValue(f) ? 'primary' : 'default'" disabled>是</n-button>
              <n-button :type="!booleanValue(f) ? 'primary' : 'default'" disabled>否</n-button>
            </n-button-group>
            <div v-else-if="f.type === 'ATTACHMENT' && isImageAttach(f) && getAttachUrls(f, viewData).length > 0" class="ref-attach-wrap">
              <NovaImagePreview :src-list="getAttachUrls(f, viewData)" :width="36" :height="36" show-all />
            </div>
            <div v-else class="ref-desc-value">
              <n-ellipsis v-if="f.type === 'ATTACHMENT' && getAttachUrls(f, viewData).length > 0" class="ref-form-value">{{ getAttachUrls(f, viewData).join(', ') }}</n-ellipsis>
              <span v-else-if="containsHtml(displayText(f))" class="ref-form-html" v-html="displayText(f)"></span>
              <n-ellipsis v-else-if="displayText(f) !== ''" class="ref-form-value"
                :style="getChoiceColor(f, viewData) ? { color: getChoiceColor(f, viewData) } : {}">{{ displayText(f) }}</n-ellipsis>
              <span v-else class="ref-form-value">-</span>
            </div>
          </div>
        </template>
      </div>
    </n-card>
  </div>
</div>`
}

window.NovaRefForm = NovaRefForm

if (window.NovaTable) {
  window.NovaTable.components = Object.assign(
    window.NovaTable.components || {},
    { NovaRefForm: NovaRefForm }
  )
}

})()
