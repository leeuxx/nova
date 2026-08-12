// pages/table-ref.js — referenceForm（引用详情）Vue 子组件
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
      refColumns: [],
      choiceMap: {},
      dateMap: {},
      booleanMap: {},
      attachmentMap: {},
      appendageMap: {},
      appendageData: {}
    }
  },

  mounted: function() {
    this.loadData()
  },

  methods: {
    loadData: function() {
      var self = this

      // 获取引用表的列定义及类型元信息
      window.fetchApi.post('/nova/table/build', { novaName: this.refNovaName }, window.__novaMenuCode(this.refNovaName)).then(function(resp) {
        if (resp.data) {
          if (resp.data.tableColumns) {
            self.refColumns = resp.data.tableColumns.filter(function(col) {
              return col.field && col.field.indexOf('__') !== 0
            })
          }
          self.choiceMap     = resp.data.choice     || {}
          self.dateMap       = resp.data.date       || {}
          self.booleanMap    = resp.data.booleanInfo || {}
          self.attachmentMap = resp.data.attachment  || {}
          self.appendageMap  = resp.data.appendage   || {}
          console.log('[ref] build response nova=' + self.refNovaName, 'choiceKeys=', Object.keys(self.choiceMap))
        }
      })

      // 获取引用详情数据
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
        self.$nextTick(function() { self._loadAppendageDetails() })
      })
    },

    // 懒加载所有 APPENDAGE 字段的详情
    _loadAppendageDetails: function() {
      var self = this
      if (!this.viewData || !this.appendageMap) return
      var loaded = {}
      this.refColumns.forEach(function(col) {
        if (col.type !== 'APPENDAGE') return
        var dotIdx = col.field.indexOf('.')
        var base = dotIdx > -1 ? col.field.slice(0, dotIdx) : col.field
        if (loaded[base]) return
        loaded[base] = true
        var appInfo = self.appendageMap[base]
        if (!appInfo || !appInfo.referenceName) return
        var fkValue = appInfo.storageField ? self.viewData[appInfo.storageField] : null
        if (!fkValue) return
        window.fetchApi.post('/nova/table/details', {
          novaName: appInfo.referenceName,
          storageFieldValue: String(fkValue)
        }).then(function(resp) {
          if (!resp.data) return
          var newData = Object.assign({}, self.appendageData)
          newData[base] = resp.data
          self.appendageData = newData
        })
      })
    },

    // 从行数据中取值，支持嵌套字段名（如 "manager.name"）
    _getVal: function(col, row) {
      var dotIdx = col.field.indexOf('.')
      if (dotIdx > -1) {
        var base = col.field.slice(0, dotIdx)
        var prop = col.field.slice(dotIdx + 1)
        // APPENDAGE：从独立加载的 appendageData 中取值
        if (col.type === 'APPENDAGE') {
          var appData = this.appendageData[base]
          if (appData) return String(appData[prop] != null ? appData[prop] : '')
          return ''
        }
        // REFERENCE 等：从行数据的嵌套对象中取值
        var nested = row[base]
        if (nested && typeof nested === 'object') return String(nested[prop] != null ? nested[prop] : '')
        return ''
      }
      var v = row[col.field]
      return v != null ? v : ''
    },

    formatText: function(col, row) {
      var val = this._getVal(col, row)
      if (val === null || val === undefined || val === '') return ''

      // REFERENCE
      if (col.type === 'REFERENCE') {
        return row[col.field + '_display'] || String(val)
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
      if (val === null || val === undefined) return ''
      return String(val).toLowerCase() === 'true' ? '是' : '否'
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
<div class="ref-descriptions-wrapper">
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
  <table v-else class="ref-descriptions-table" cellspacing="0" cellpadding="0">
    <tbody>
      <tr v-for="col in refColumns" :key="col.field">
        <th class="ref-desc-label" :title="col.title">{{ col.title }}</th>
        <td class="ref-desc-value">

          <!-- BOOLEAN -->
          <span v-if="col.type === 'BOOLEAN'" class="ref-boolean-pill"
            :class="formatBoolean(col, viewData) === '是' ? 'ref-boolean-true' : 'ref-boolean-false'">{{ formatBoolean(col, viewData) }}</span>

          <!-- CHOICE -->
          <span v-else-if="col.type === 'CHOICE'"
            :style="getChoiceColor(col, viewData) ? { background: getChoiceColor(col, viewData) + '20', color: getChoiceColor(col, viewData) } : {}">{{ formatText(col, viewData) }}</span>

          <!-- ATTACHMENT IMAGE：复用表格行图片预览组件 -->
          <div v-else-if="col.type === 'ATTACHMENT' && isImageAttach(col)" class="ref-attach-wrap">
            <NovaImagePreview :src-list="getAttachUrls(col, viewData)" :width="36" :height="36" show-all />
          </div>

          <!-- ATTACHMENT BASE -->
          <span v-else-if="col.type === 'ATTACHMENT'">{{ getAttachUrls(col, viewData).join(', ') }}</span>

          <!-- HTML -->
          <span v-else-if="containsHtml(formatText(col, viewData))" v-html="formatText(col, viewData)"></span>

          <!-- 纯文本 -->
          <span v-else :title="formatText(col, viewData)">{{ formatText(col, viewData) }}</span>

        </td>
      </tr>
    </tbody>
  </table>
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
