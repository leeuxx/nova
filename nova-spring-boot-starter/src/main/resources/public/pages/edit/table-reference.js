// pages/table-ref.js — referenceForm（引用详情）Vue 子组件
;(function () {

var NovaRefForm = {
  name: 'NovaRefForm',

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
      attachmentMap: {}
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
      })
    },

    // 获取格式化后的文本值
    formatText: function(col, row) {
      var val = row[col.field]
      if (val === null || val === undefined) return ''

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

    // 点击附件图片预览
    previewAttach: function(col) {
      var urls = this.getAttachUrls(col, this.viewData)
      this.$emit('preview-attach', {
        field: { field: col.field, title: col.title },
        urls: urls,
        type: 'IMAGE'
      })
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

          <!-- ATTACHMENT IMAGE -->
          <div v-else-if="col.type === 'ATTACHMENT' && isImageAttach(col)" class="ref-attach-wrap">
            <img v-for="(url, idx) in getAttachUrls(col, viewData)" :key="idx"
              :src="url" class="ref-attach-thumb"
              @click="previewAttach(col)" />
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
