// pages/table-ref.js — referenceForm（引用详情，只读表单式反显）Vue 子组件
;(function () {

var NovaRefForm = {
  name: 'NovaRefForm',

  components: {
    NovaImagePreview: window.NovaImagePreview,
    NTooltip: naive.NTooltip
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
        var items = map[g]
        var visibleIndex = 0
        return {
          key: g || '__ungrouped__',
          title: g || '',
          items: items.map(function(f) {
            return { field: f, rowIndex: visibleIndex++ }
          })
        }
      }).filter(function(sec) {
        return sec.items.some(function(it) { return self.fieldVisible(it.field) })
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

    // CHOICE 标签渲染
    getChoiceTags: function(col, row) {
      var val = row[col.field]
      if (!val) return []
      var choice = this.choiceMap[col.field]
      if (!choice || !choice.values) return []

      var valMap = {}
      var colorMap = {}
      if (Array.isArray(choice.values)) {
        choice.values.forEach(function(item) {
          if (item && item.value !== undefined) {
            valMap[String(item.value)] = item.label || String(item.value)
            if (item.color) {
              colorMap[String(item.value)] = item.color
            }
          }
        })
      } else {
        for (var k in choice.values) {
          valMap[k] = choice.values[k]
        }
      }

      var isMulti = choice.selectType === 'MULTI'
      var rawLabels = isMulti ? String(val).split(',').map(function(s) { return s.trim() }).filter(Boolean) : [String(val)]

      return rawLabels.map(function(rawVal, i) {
        var label = valMap[rawVal] || rawVal
        var color = colorMap[rawVal] || null
        return { label: label, color: color }
      })
    },

    // 深化颜色（用于标签文本）
    darkenHex: function(hex, amount) {
      if (!hex) return 'inherit'
      var num = parseInt(hex.replace('#', ''), 16)
      var r = Math.max(0, (num >> 16) - Math.round(255 * amount))
      var g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount))
      var b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount))
      return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
    },

    // 获取 CHOICE 多余数量
    getChoiceRest: function(col, row) {
      var tags = this.getChoiceTags(col, row)
      return tags.length > 2 ? tags.length - 2 : 0
    },

    // 获取 CHOICE 多余标签
    getChoiceRestTags: function(col, row) {
      var tags = this.getChoiceTags(col, row)
      return tags.slice(2)
    },

    // TAG 标签渲染
    getTagTags: function(col, row) {
      var val = row[col.field]
      if (!val) return []
      var tags = String(val).split(',').map(function(t) { return t.trim() }).filter(Boolean)
      return tags.map(function(tag) {
        return { label: tag }
      })
    },

    // 获取 TAG 多余数量
    getTagRest: function(col, row) {
      var tags = this.getTagTags(col, row)
      return tags.length > 2 ? tags.length - 2 : 0
    },

    // 获取 TAG 多余标签
    getTagRestTags: function(col, row) {
      var tags = this.getTagTags(col, row)
      return tags.slice(2)
    },

    // 获取附件多余数量
    getAttachmentRest: function(col, row) {
      var urls = this.getAttachUrls(col, row)
      return urls.length > 2 ? urls.length - 2 : 0
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
        <template v-for="(item, idx) in sec.items" :key="item.field.field">
          <n-divider v-if="item.field.type === 'DIVIDE' && editLayout !== 'FULL_LINE'" style="grid-column:1/-1;margin:0">{{ item.field.title }}</n-divider>
          <div v-else-if="item.field.type === 'EMPTY' && editLayout !== 'FULL_LINE'"></div>
          <div v-else-if="item.field.type !== 'DIVIDE' && item.field.type !== 'EMPTY' && item.field.type !== 'BUTTON'"
            :style="'display:flex;align-items:' + (item.field.type === 'BOOLEAN' ? 'center' : 'baseline') + ';gap:8px;min-width:0;overflow:hidden;padding:6px;border-radius:4px' + (item.field.type === 'TEXTAREA' ? ';grid-column:1/-1' : '')">
            <span class="ref-desc-label">{{ item.field.title }}:</span>
            <n-button-group v-if="item.field.type === 'BOOLEAN' && displayText(item.field) !== ''" size="small" style="pointer-events:none">
              <n-button :type="booleanValue(item.field) ? 'primary' : 'default'">是</n-button>
              <n-button :type="!booleanValue(item.field) ? 'primary' : 'default'">否</n-button>
            </n-button-group>
            <div v-else-if="item.field.type === 'ATTACHMENT' && isImageAttach(item.field) && getAttachUrls(item.field, viewData).length > 0" class="ref-attach-wrap" style="display:inline-flex;gap:6px;align-items:center">
              <NovaImagePreview :src-list="getAttachUrls(item.field, viewData)" :width="36" :height="36" :showAll="true" />
            </div>
            <div v-else class="ref-desc-value" :style="item.field.type === 'TEXTAREA' ? 'display:block;width:100%;min-width:0' : ''">
              <div v-if="item.field.type === 'TEXTAREA'" class="ref-textarea-box" style="background:rgba(0,0,0,0.02);border-left:3px solid #2563eb;padding:8px 12px;border-radius:4px;font-family:monospace;font-size:13px;white-space:pre-wrap;word-break:break-word;line-height:1.6;max-height:150px;overflow-y:auto">{{ displayText(item.field) || '-' }}</div>
              <div v-else-if="item.field.type === 'CHOICE' && getChoiceTags(item.field, viewData).length > 0" style="display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center">
                <template v-for="(tag, idx) in getChoiceTags(item.field, viewData).slice(0, 2)" :key="idx">
                  <span :style="'display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;background:' + (tag.color ? tag.color + '20' : 'rgba(128,128,128,0.1)') + ';color:' + (tag.color ? darkenHex(tag.color, 0.35) : 'inherit')">{{ tag.label }}</span>
                </template>
                <n-tooltip v-if="getChoiceRest(item.field, viewData) > 0" trigger="hover" placement="top">
                  <template #trigger>
                    <span style="flex-shrink:0;cursor:default;font-size:12px;color:#888;padding:2px 8px;background:rgba(128,128,128,0.1);border-radius:4px">+{{ getChoiceRest(item.field, viewData) }}</span>
                  </template>
                  <div style="max-width:400px">
                    <div v-for="(tag, idx) in getChoiceRestTags(item.field, viewData)" :key="idx" style="padding:4px 0">{{ tag.label }}</div>
                  </div>
                </n-tooltip>
              </div>
              <div v-else-if="item.field.type === 'TAG' && getTagTags(item.field, viewData).length > 0" style="display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center">
                <template v-for="(tag, idx) in getTagTags(item.field, viewData).slice(0, 2)" :key="idx">
                  <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;background:rgba(37,99,235,0.08);color:#2563eb">{{ tag.label }}</span>
                </template>
                <n-tooltip v-if="getTagRest(item.field, viewData) > 0" trigger="hover" placement="top">
                  <template #trigger>
                    <span style="flex-shrink:0;cursor:default;font-size:12px;color:#888;padding:2px 8px;background:rgba(128,128,128,0.1);border-radius:4px">+{{ getTagRest(item.field, viewData) }}</span>
                  </template>
                  <div style="max-width:400px">
                    <div v-for="(tag, idx) in getTagRestTags(item.field, viewData)" :key="idx" style="padding:4px 0">{{ tag.label }}</div>
                  </div>
                </n-tooltip>
              </div>
              <n-ellipsis v-else-if="item.field.type === 'ATTACHMENT' && getAttachUrls(item.field, viewData).length > 0" class="ref-form-value">{{ getAttachUrls(item.field, viewData).join(', ') }}</n-ellipsis>
              <span v-else-if="containsHtml(displayText(item.field))" class="ref-form-html" v-html="displayText(item.field)"></span>
              <n-ellipsis v-else-if="displayText(item.field) !== ''" class="ref-form-value"
                :style="item.field.type === 'CHOICE' ? {} : {}">{{ displayText(item.field) }}</n-ellipsis>
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
