// pages/table.js — 通用表格页 Vue 组件，所有表格菜单共用此模板
;(function () {
const { h } = Vue
const { NPopconfirm, NSpace, NTooltip, NTag } = naive

// 解析列宽：百分比返回浮点数（0~100），像素返回负数表示固定像素
function parseWidthPct(w) {
  if (!w) return 10  // 默认 10%
  if (String(w).endsWith('%')) return parseFloat(w)
  return -(parseInt(w) || 150)  // 负数 = 固定像素
}

// 将 hex 颜色加深：factor 为加深比例（0~1），返回加深后的 hex
function darkenHex(hex, factor) {
  var c = hex.replace('#', '')
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2]
  var r = Math.max(0, Math.round(parseInt(c.slice(0,2),16) * (1 - factor)))
  var g = Math.max(0, Math.round(parseInt(c.slice(2,4),16) * (1 - factor)))
  var b = Math.max(0, Math.round(parseInt(c.slice(4,6),16) * (1 - factor)))
  return '#' + [r,g,b].map(function(v){ return v.toString(16).padStart(2,'0') }).join('')
}

const NovaTable = {
  name: 'NovaTable',

  data() {
    return {
      choiceMap:      {},
      tagMap:         {},
      dateMap:        {},
      numberMap:      {},
      booleanMap:     {},
      attachmentMap:  {},
      tableWrapperWidth: 0,
      novaName:       '',
      pkFieldName:    'id',
      tableRowColors: [],
      tableData:      [],
      rawTableData:   [],
      tableColumns:   [],
      sortStates:     {},
      filterExpanded: false,
      checkedRowKeys: [],
      searchFields:   [],
      filterForm:     {},
      showForm:       false,
      formMode:       'add',
      currentRow:     null,
      formData:       {},
      editFields:     [],
      editLayout:     'DEFAULT',
      formErrors:     {},
      striped:        true,
      tableSize:      'medium',
      pageSize:       10,
      pageSizes:      [10, 20, 50, 100],
      loading:          false,
      previewModalShow: false,
      previewField:     null,
      previewIndex:     0,
      slideDirection:  'right',
      attachmentDropdownKey: null,
      paginationConfig: {
        page:            1,
        itemCount:       0,
        pageSize:        10,
        showSizePicker:  true,
        pageSizes:       [10, 20, 50, 100].map(n => ({ label: n + ' 条/页', value: n })),
        showQuickJumper: true
      }
    }
  },

  computed: {
    // 固定列像素：checkbox 50 + 操作列 140
    colPixels() {
      const fixedPx = 50 + 140
      const available = (this.tableWrapperWidth || 1200) - fixedPx
      // 各列宽度（百分比转像素 or 固定像素）
      return this.tableColumns.map(col => {
        const w = parseWidthPct(col.width)
        return w < 0 ? -w : Math.round(w / 100 * available)
      })
    },

    scrollX() {
      if (!this.tableColumns.length) return undefined
      const fixedPx = 50 + 140
      const total = fixedPx + this.colPixels.reduce((s, w) => s + w, 0)
      const container = this.tableWrapperWidth || 0
      return total > container ? total : undefined
    },

    filteredData() {
      return this.tableData
    },

    columns() {
      const vm   = this
      const cols = [
        { type: 'selection', title: '', key: 'selection', width: 50 }
      ]

      this.tableColumns.forEach((col, index) => {
        const colDef = {
          key:       col.field,
          width:     vm.colPixels[index],
          title:     col.title,
          resizable: true,
          ellipsis:  { tooltip: true }
        }

        if (col.desc || col.sortable) {
          colDef.title = () => {
            const parts = [h('span', col.title)]
            if (col.desc) {
              parts.push(
                h(NTooltip, { trigger: 'hover', placement: 'top' }, {
                  default: () => col.desc,
                  trigger: () => h('span', {
                    style: 'margin-left:4px;color:#aaa;cursor:help;display:inline-flex;align-items:center',
                    onClick: (e) => e.stopPropagation()
                  }, [
                    h('iconify-icon', { icon: 'material-symbols:help-outline', style: 'font-size:16px' })
                  ])
                })
              )
            }
            if (col.sortable) {
              const state = vm.sortStates[col.field]
              parts.push(
                h('span', {
                  style: 'margin-left:5px;display:inline-flex;flex-direction:column;gap:0'
                }, [
                  h('span', { style: `display:block;font-size:7px;line-height:1;transform:scaleX(1.5);color:${state === 'asc'  ? '#2563eb' : '#ccc'}` }, '▲'),
                  h('span', { style: `display:block;font-size:7px;line-height:1;transform:scaleX(1.5);color:${state === 'desc' ? '#2563eb' : '#ccc'}` }, '▼')
                ])
              )
            }
            return h('span', {
              style: `display:inline-flex;align-items:center;${col.sortable ? 'cursor:pointer;width:100%' : ''}`,
              onClick: col.sortable ? () => vm.toggleSort(col.field) : undefined
            }, parts)
          }
        }

        if (col.type === 'TAG') {
          colDef.render = (row) => {
            const val = row[col.field]
            if (val === null || val === undefined || val === '') return ''
            const tags = String(val).split(',').map(t => t.trim()).filter(Boolean)
            const visible = tags.slice(0, 1)
            const rest = tags.length - 1
            const nodes = visible.map(t => h(NTag, { size: 'small', style: 'flex-shrink:0', color: { color: 'rgba(37,99,235,0.08)', textColor: '#2563eb', borderColor: 'transparent' } }, { default: () => t }))
            if (rest > 0) nodes.push(h(NTooltip, { trigger: 'hover' }, {
              trigger: () => h('span', { style: 'flex-shrink:0;cursor:default;font-size:12px;color:#888;padding:2px 6px;background:rgba(128,128,128,0.1);border-radius:3px' }, '+' + rest),
              default: () => tags.slice(1).join('，')
            }))
            return h('span', { style: 'display:inline-flex;gap:4px;align-items:center' }, nodes)
          }
        }

        if (col.type === 'BOOLEAN') {
          colDef.render = (row) => {
            const val = row[col.field]
            if (val === null || val === undefined || val === '') return ''
            const isTrue = String(val).toLowerCase() === 'true'
            const bInfo = vm.booleanMap && vm.booleanMap[col.field]
            if (bInfo && bInfo.type === 'SWITCH') {
              const novaName = vm.novaName
              const pkField = vm.pkFieldName || 'id'
              const editField = (vm.editFields || []).find(function(f) { return f.field === col.field })
              const disabled = !editField || (editField.readonly && editField.readonly.edit)
              const isDark = document.body.classList.contains('dark')
              const offBg = isDark ? '#444' : '#d9d9d9'
              const onClick = disabled ? undefined : () => {
                const newVal = !isTrue
                $.ajax({
                  url: '/nova/table/update', method: 'POST', contentType: 'application/json',
                  data: JSON.stringify({ novaName, formInfo: [{ field: pkField, value: String(row[pkField]), type: '' }, { field: col.field, value: String(newVal), type: 'BOOLEAN' }] }),
                  success: (resp) => { if (resp.code === 200) { if (window.$message) window.$message.success('修改成功'); window.NovaTableJQ.loadData(novaName) } }
                })
              }
              return h('span', { style: `display:inline-block;vertical-align:middle;width:44px;height:22px;border-radius:11px;background:${isTrue ? '#006be6' : offBg};position:relative;cursor:${disabled ? 'not-allowed' : 'pointer'};opacity:${disabled ? '0.5' : '1'};flex-shrink:0;transition:background .2s`, onClick }, [
                h('span', { style: `position:absolute;top:0;${isTrue ? 'left:0;right:20px' : 'right:0;left:20px'};bottom:0;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;user-select:none` }, isTrue ? '是' : '否'),
                h('span', { style: `position:absolute;top:3px;left:${isTrue ? '26px' : '3px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)` })
              ])
            }
            const color = isTrue ? '#18a058' : '#d03050'
            return h(NTag, { size: 'small', color: { color: color + '20', textColor: darkenHex(color, 0.15), borderColor: 'transparent' } }, { default: () => isTrue ? '是' : '否' })
          }
        }

        if (col.type === 'CHOICE') {
          colDef.render = (row, rowIndex) => {
            const text = row[col.field]
            if (text === null || text === undefined || text === '') return text
            const colorData = vm.tableRowColors[rowIndex] && vm.tableRowColors[rowIndex][col.field]
            const choice = vm.choiceMap && vm.choiceMap[col.field]
            const isMulti = choice && choice.selectType === 'MULTI'
            const makeTag = (label, color) => {
              const bg = color ? color + '20' : 'rgba(128,128,128,0.1)'
              const tc = color ? darkenHex(color, 0.35) : 'inherit'
              return h(NTag, { size: 'small', color: { color: bg, textColor: tc, borderColor: 'transparent' } }, { default: () => label })
            }
            if (isMulti) {
              const labels = String(text).split(',').map(s => s.trim()).filter(Boolean)
              const colors = Array.isArray(colorData) ? colorData : []
              const visible = labels.slice(0, 1)
              const rest = labels.length - 1
              const nodes = visible.map((label, i) => makeTag(label, colors[i] || null))
              if (rest > 0) nodes.push(h(NTooltip, { trigger: 'hover' }, {
                trigger: () => h('span', { style: 'flex-shrink:0;cursor:default;font-size:12px;color:#888;padding:2px 6px;background:rgba(128,128,128,0.1);border-radius:3px' }, '+' + rest),
                default: () => labels.slice(1).join('，')
              }))
              return h('span', { style: 'display:inline-flex;gap:4px;align-items:center' }, nodes)
            }
            return makeTag(text, colorData)
          }
        }

        if (col.type === 'DATE') {
          colDef.render = (row) => {
            const ts = row[col.field]
            if (ts === null || ts === undefined || ts === '') return ''
            const dateInfo = vm.dateMap && vm.dateMap[col.field]
            const type = dateInfo && dateInfo.type
            const d = new Date(ts)
            const p = n => String(n).padStart(2, '0')
            if (type === 'YEAR')       return String(d.getFullYear())
            if (type === 'MONTH')      return d.getFullYear() + '-' + p(d.getMonth() + 1)
            if (type === 'DATE')       return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
            if (type === 'TIME')       return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
            // DATE_TIME 及默认
            return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
                   p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
          }
        }

        cols.push(colDef)
      })

      cols.push({
        title: '操作', key: 'actions', width: 140, fixed: 'right',
        render(row) {
          return h(NSpace, { size: 8 }, {
            default: () => [
              h('span', { style: { color: '#2080f0', cursor: 'pointer', fontSize: '13px' }, onClick: () => vm.handleEdit(row) }, '编辑'),
              h(NPopconfirm,
                { onPositiveClick: () => vm.handleDelete(row), positiveText: '确定', negativeText: '取消' },
                {
                  default: () => '确定删除吗？',
                  trigger:  () => h('span', { style: { color: '#d03050', cursor: 'pointer', fontSize: '13px' } }, '删除')
                }
              )
            ]
          })
        }
      })

      return cols
    }
  },

  watch: {
    '$route.params.novaName'(newVal) {
      if (newVal && window.NovaTableJQ) window.NovaTableJQ.onRouteChange(newVal)
    }
  },

  mounted() {
    window.vmMap = window.vmMap || {}
    this.novaName = this.$route.params.novaName || ''
    window.vmMap[this.novaName] = this
    window.activeNovaName = this.novaName
    // 挂载分页回调（需要 this，不能在 data 里写）
    this.paginationConfig.onUpdatePage     = this.handlePageChange
    this.paginationConfig.onUpdatePageSize = this.handlePageSizeChange
    this.paginationConfig.suffix           = ({ itemCount }) => `共 ${itemCount} 条`
    if (window.NovaTableJQ) window.NovaTableJQ.onMounted(this.novaName)
  },

  activated() {
    window.activeNovaName = this.novaName
    setTimeout(() => window.NovaTableJQ && window.NovaTableJQ.updateTableHeight(), 80)
  },

  beforeUnmount() {
    if (window.vmMap) delete window.vmMap[this.novaName]
    if (window.activeNovaName === this.novaName) window.activeNovaName = null
    $(window).off('resize.novaTable')
  },

  methods: {
    isReadonly(f) {
      if (!f.readonly) return false
      return this.formMode === 'add' ? !!f.readonly.add : !!f.readonly.edit
    },
    toggleSort(field) {
      const cur  = this.sortStates[field]
      const next = cur == null ? 'asc' : cur === 'asc' ? 'desc' : null
      this.sortStates = Object.assign({}, this.sortStates, { [field]: next })
      window.NovaTableJQ.onSortChange(this.novaName)
    },
    toggleFilter() {
      if (this.searchFields.length <= 3) return
      this.filterExpanded = !this.filterExpanded
      this.$nextTick(() => window.NovaTableJQ && window.NovaTableJQ.updateTableHeight())
    },
    fieldOptions(field) {
      const choice = this.choiceMap[field.field]
      if (!choice || !choice.values) return []
      return choice.values.map(v => ({ label: v.label, value: v.value }))
    },
    editFieldOptions(f) {
      const choice = this.choiceMap[f.field]
      if (!choice || !choice.values) return []
      return choice.values.map(v => ({ label: v.label, value: v.value }))
    },
    tagOptions(field) {
      const tag = this.tagMap && this.tagMap[field]
      if (!tag || !tag.tags) return []
      return tag.tags.map(t => ({ label: t, value: t }))
    },
    datePickerType(field, vague, forEdit) {
      const dateInfo = this.dateMap && this.dateMap[field]
      const single = { DATE: 'date', TIME: 'time', DATE_TIME: 'datetime', MONTH: 'month', YEAR: 'year' }
      const range  = { DATE: 'daterange', TIME: 'time', DATE_TIME: 'datetimerange', MONTH: 'monthrange', YEAR: 'yearrange' }
      const map = vague ? range : single
      return (dateInfo && map[dateInfo.type]) || (vague ? 'daterange' : 'date')
    },
    datePickerDisabled(field, forEdit) {
      if (!forEdit) return undefined
      const dateInfo = this.dateMap && this.dateMap[field]
      if (!dateInfo || dateInfo.pickerMode === 'ALL') return undefined
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayTs = today.getTime()
      if (dateInfo.pickerMode === 'FUTURE')  return (ts) => ts < todayTs
      if (dateInfo.pickerMode === 'HISTORY') return (ts) => ts > todayTs
      return undefined
    },
    handleCheck(keys)   { this.checkedRowKeys = keys },
    handleReset()       { window.NovaTableJQ.handleReset() },
    handleQuery() {
      const t = this
      const snapshot = JSON.stringify(t.filterForm)
      if (snapshot !== t._lastFilterSnapshot) {
        t.paginationConfig.page = 1
        t._lastFilterSnapshot = snapshot
      }
      window.NovaTableJQ.loadData(t.novaName)
    },
    handleAdd()         { window.NovaTableJQ.handleAdd() },
    handleEdit(row)     { window.NovaTableJQ.handleEdit(row) },
    handleDelete(row)   { window.NovaTableJQ.handleDelete(row) },
    handleBatchDelete() { window.NovaTableJQ.handleBatchDelete() },
    handleFormSubmit()  { window.NovaTableJQ.handleFormSubmit() },
    handleAttachmentChange(f, event) {
      const files = Array.from(event.target.files || [])
      event.target.value = ''
      if (!files.length) return
      const cfg = this.attachmentMap[f.field] || {}
      const maxLimit = cfg.maxLimit || 1
      const current = (this.formData[f.field] || []).length
      const allowed = maxLimit - current
      if (allowed <= 0) return
      if (files.length > allowed) {
        if (window.$message) window.$message.error('最多还能上传 ' + allowed + ' 个文件')
        return
      }
      const toUpload = files.slice(0, allowed)
      for (const file of toUpload) {
        if (cfg.fileTypes && cfg.fileTypes.length) {
          const ext = '.' + file.name.split('.').pop().toLowerCase()
          if (!cfg.fileTypes.some(t => t.toLowerCase() === ext)) {
            if (window.$message) window.$message.error('不支持的文件类型：' + ext)
            return
          }
        }
        const kb = file.size / 1024
        if (cfg.minSize > 0 && kb < cfg.minSize) {
          if (window.$message) window.$message.error('文件不能小于 ' + cfg.minSize + ' KB')
          return
        }
        if (cfg.maxSize > 0 && kb > cfg.maxSize) {
          if (window.$message) window.$message.error('文件不能超过 ' + cfg.maxSize + ' KB')
          return
        }
      }
      // 上传逻辑待实现：将 toUpload 文件异步上传，返回 url 后 push 到 formData[f.field]
    },
    openPreview(f) {
      this.previewField = f
      this.previewIndex = 0
      this.previewModalShow = true
    },
    copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          if (window.$message) window.$message.success('链接已复制')
        }).catch(function () {
          var input = document.createElement('textarea')
          input.value = text
          document.body.appendChild(input)
          input.select()
          try { document.execCommand('copy') } catch (e) {}
          document.body.removeChild(input)
          if (window.$message) window.$message.success('链接已复制')
        })
      } else {
        var input = document.createElement('textarea')
        input.value = text
        document.body.appendChild(input)
        input.select()
        try { document.execCommand('copy') } catch (e) {}
        document.body.removeChild(input)
        if (window.$message) window.$message.success('链接已复制')
      }
    },
    closePreview() {
      this.previewModalShow = false
      this.previewField = null
      this.previewIndex = 0
    },
    deleteFromPreview(idx) {
      if (!this.previewField) return
      this.formData[this.previewField.field].splice(idx, 1)
      const total = (this.formData[this.previewField.field] || []).length
      if (this.previewIndex >= total) this.previewIndex = Math.max(0, total - 1)
    },
    setAttachmentDropdown(fieldKey) {
      this.attachmentDropdownKey = fieldKey
    },
    clearAttachmentDropdown() {
      this.attachmentDropdownKey = null
    },
    handlePageChange(current) {
      window.NovaTableJQ.onPageChange(this.novaName, current)
    },
    handlePageSizeChange(pageSize) {
      window.NovaTableJQ.onPageSizeChange(this.novaName, pageSize)
    }
  },

  template: `
    <div style="padding:16px">

      <!-- 筛选卡片 -->
      <n-card :bordered="false" class="page-card filter-card">
        <div class="filter-grid">
          <template v-for="(field, index) in searchFields" :key="field.field">
            <div v-if="filterExpanded || index < 3" style="display:flex;align-items:center;gap:8px;width:100%">
              <span class="form-label">{{ field.title }}</span>
              <n-select v-if="field.type === 'CHOICE' && choiceMap[field.field] && choiceMap[field.field].selectType === 'SINGLE' && !field.vague"
                v-model:value="filterForm[field.field]"
                :options="fieldOptions(field)"
                :placeholder="'请选择' + field.title"
                clearable style="flex:1"
              />
              <n-select v-else-if="field.type === 'CHOICE'"
                v-model:value="filterForm[field.field]"
                :options="fieldOptions(field)"
                :placeholder="'请选择' + field.title"
                multiple clearable style="flex:1"
              />
              <n-select v-else-if="field.type === 'TAG'"
                v-model:value="filterForm[field.field]"
                :options="tagOptions(field.field)"
                :placeholder="'请选择' + field.title"
                multiple clearable filterable
                :tag="tagMap[field.field] && tagMap[field.field].allowExtension"
                style="flex:1"
              />
              <n-select v-else-if="field.type === 'BOOLEAN'"
                v-model:value="filterForm[field.field]"
                :options="[{label:'是',value:'true'},{label:'否',value:'false'}]"
                :placeholder="'请选择' + field.title"
                clearable style="flex:1"
              />
              <div v-else-if="field.type === 'NUMBER' && field.vague" class="number-vague-field">
                <n-input-number
                  v-model:value="filterForm[field.field][0]"
                  placeholder="最小值"
                  :min="numberMap[field.field] && numberMap[field.field].min"
                  :max="numberMap[field.field] && numberMap[field.field].max"
                  :precision="numberMap[field.field] && numberMap[field.field].type === 'DECIMAL' ? (numberMap[field.field].decimal || 2) : 0"
                  :show-button="false" :bordered="false" style="flex:1;min-width:0"
                />
                <span class="number-vague-sep">—</span>
                <n-input-number
                  v-model:value="filterForm[field.field][1]"
                  placeholder="最大值"
                  :min="numberMap[field.field] && numberMap[field.field].min"
                  :max="numberMap[field.field] && numberMap[field.field].max"
                  :precision="numberMap[field.field] && numberMap[field.field].type === 'DECIMAL' ? (numberMap[field.field].decimal || 2) : 0"
                  :show-button="false" :bordered="false" style="flex:1;min-width:0"
                />
                <span class="number-vague-icon"><iconify-icon icon="mdi:numeric" style="font-size:16px;display:block" /></span>
              </div>
              <n-input-number v-else-if="field.type === 'NUMBER'"
                v-model:value="filterForm[field.field]"
                :placeholder="'请输入' + field.title"
                :min="numberMap[field.field] && numberMap[field.field].min"
                :max="numberMap[field.field] && numberMap[field.field].max"
                :precision="numberMap[field.field] && numberMap[field.field].type === 'DECIMAL' ? (numberMap[field.field].decimal || 2) : 0"
                :show-button="false"
                clearable style="flex:1"
              />
              <n-date-picker v-else-if="field.type === 'DATE'"
                v-model:value="filterForm[field.field]"
                :type="datePickerType(field.field, field.vague, false)"
                :is-date-disabled="datePickerDisabled(field.field, false)"
                :placeholder="field.vague ? ['开始时间', '结束时间'] : '请选择' + field.title"
                clearable style="flex:1"
              />
              <n-input v-else
                v-model:value="filterForm[field.field]"
                :placeholder="'请输入' + field.title"
                clearable style="flex:1"
              />
            </div>
          </template>
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;grid-column:4">
            <n-button @click="handleReset">重 置</n-button>
            <n-button type="primary" @click="handleQuery">查 询</n-button>
            <n-button dashed @click="toggleFilter" :disabled="searchFields.length <= 3">
              <template #icon>
                <n-icon><iconify-icon :icon="filterExpanded ? 'material-symbols:keyboard-arrow-up' : 'material-symbols:keyboard-arrow-down'"></iconify-icon></n-icon>
              </template>
              {{ filterExpanded ? '收 起' : '展 开' }}
            </n-button>
          </div>
        </div>
      </n-card>

      <!-- 表格卡片 -->
      <n-card :bordered="false" class="page-card table-card">
        <div class="table-card-header">
          <span style="font-size:16px;font-weight:500">数据列表</span>
          <div style="display:flex;gap:8px">
            <n-button v-if="checkedRowKeys.length > 0" type="error" @click="handleBatchDelete">
              <template #icon><n-icon><iconify-icon icon="material-symbols:delete-outline"></iconify-icon></n-icon></template>
              删 除
            </n-button>
            <n-button type="primary" @click="handleAdd">
              <template #icon><n-icon><iconify-icon icon="material-symbols:add"></iconify-icon></n-icon></template>
              新 增
            </n-button>
            <n-button circle class="btn-circle" style="background:transparent" @click="handleQuery">
              <template #icon><n-icon size="15"><iconify-icon icon="lucide:refresh-cw" style="font-size:15px"></iconify-icon></n-icon></template>
            </n-button>
            <n-popover trigger="click" placement="bottom-end">
              <template #trigger>
                <n-button circle class="btn-circle" style="background:transparent">
                  <template #icon><n-icon size="15"><iconify-icon icon="lucide:settings" style="font-size:15px"></iconify-icon></n-icon></template>
                </n-button>
              </template>
              <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;min-width:160px">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
                  <span>斑马纹</span>
                  <n-switch v-model:value="striped" />
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
                  <span>表格大小</span>
                  <n-radio-group v-model:value="tableSize" size="small">
                    <n-radio-button value="small">紧凑</n-radio-button>
                    <n-radio-button value="medium">默认</n-radio-button>
                    <n-radio-button value="large">宽松</n-radio-button>
                  </n-radio-group>
                </div>
              </div>
            </n-popover>
          </div>
        </div>
        <div id="table-wrapper">
          <n-data-table
            :data="filteredData"
            :columns="columns"
            :row-key="row => row[pkFieldName]"
            :checked-row-keys="checkedRowKeys"
            @update:checked-row-keys="handleCheck"
            :loading="loading"
            :remote="true"
            :pagination="paginationConfig"
            :striped="striped"
            :size="tableSize"
            :scroll-x="scrollX"
            :flex-height="true"
            style="width:100%;height:100%"
          />
        </div>
      </n-card>

      <!-- 新增/编辑弹窗 -->
      <n-modal v-model:show="showForm" preset="card" :title="formMode === 'add' ? '新增' : '编辑'" style="width:960px;margin-top:60px">
        <div :style="'display:grid;gap:16px 24px;' + (editLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')">
          <template v-for="f in editFields" :key="f.field">
            <n-divider v-if="f.type === 'DIVIDE' && editLayout !== 'FULL_LINE'" style="grid-column:1/-1;margin:0">{{ f.title }}</n-divider>
            <div v-else-if="f.type === 'EMPTY' && editLayout !== 'FULL_LINE'"></div>
            <div v-else-if="f.type !== 'DIVIDE' && f.type !== 'EMPTY'" :style="'display:flex;flex-direction:column;gap:4px' + (f.type === 'TEXTAREA' ? ';grid-column:1/-1' : '')">
              <span class="edit-form-label">
                <span v-if="f.notNull && !isReadonly(f)" class="form-label-required">*</span>{{ f.title }}
                <n-tooltip v-if="f.desc" trigger="hover" placement="top">
                  <template #trigger>
                    <span class="form-label-help">
                      <iconify-icon icon="material-symbols:help-outline" style="font-size:15px"></iconify-icon>
                    </span>
                  </template>
                  {{ f.desc }}
                </n-tooltip>
              </span>
              <n-checkbox-group
                v-if="f.type === 'CHOICE' && choiceMap[f.field] && choiceMap[f.field].showType === 'RADIO' && choiceMap[f.field].selectType === 'MULTI'"
                v-model:value="formData[f.field]"
                :disabled="isReadonly(f)"
                @update:value="delete formErrors[f.field]"
              >
                <n-space><n-checkbox v-for="o in editFieldOptions(f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
              </n-checkbox-group>
              <n-radio-group
                v-else-if="f.type === 'CHOICE' && choiceMap[f.field] && choiceMap[f.field].showType === 'RADIO'"
                v-model:value="formData[f.field]"
                :disabled="isReadonly(f)"
                @update:value="delete formErrors[f.field]"
              >
                <n-space><n-radio v-for="o in editFieldOptions(f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
              </n-radio-group>
              <n-select
                v-else-if="f.type === 'CHOICE' && choiceMap[f.field] && choiceMap[f.field].selectType === 'MULTI'"
                v-model:value="formData[f.field]"
                :options="editFieldOptions(f)"
                :placeholder="'请选择' + f.title"
                :status="formErrors[f.field] ? 'error' : undefined"
                :disabled="isReadonly(f)"
                multiple clearable
                @update:value="delete formErrors[f.field]"
              />
              <n-select
                v-else-if="f.type === 'CHOICE'"
                v-model:value="formData[f.field]"
                :options="editFieldOptions(f)"
                :placeholder="'请选择' + f.title"
                :status="formErrors[f.field] ? 'error' : undefined"
                :disabled="isReadonly(f)"
                clearable
                @update:value="delete formErrors[f.field]"
              />
              <n-select
                v-else-if="f.type === 'BOOLEAN'"
                v-model:value="formData[f.field]"
                :options="[{label:'是',value:'true'},{label:'否',value:'false'}]"
                :placeholder="'请选择' + f.title"
                :status="formErrors[f.field] ? 'error' : undefined"
                :disabled="isReadonly(f)"
                clearable
                @update:value="delete formErrors[f.field]"
              />
              <n-input-number
                v-else-if="f.type === 'NUMBER'"
                v-model:value="formData[f.field]"
                :placeholder="'请输入' + f.title"
                :min="numberMap[f.field] && numberMap[f.field].min"
                :max="numberMap[f.field] && numberMap[f.field].max"
                :precision="numberMap[f.field] && numberMap[f.field].type === 'DECIMAL' ? (numberMap[f.field].decimal || 2) : 0"
                :show-button="false"
                :status="formErrors[f.field] ? 'error' : undefined"
                :disabled="isReadonly(f)"
                clearable style="width:100%"
                @update:value="delete formErrors[f.field]"
              />
              <n-date-picker
                v-else-if="f.type === 'DATE'"
                v-model:value="formData[f.field]"
                :type="datePickerType(f.field, false, true)"
                :is-date-disabled="datePickerDisabled(f.field, true)"
                :placeholder="'请选择' + f.title"
                :status="formErrors[f.field] ? 'error' : undefined"
                :disabled="isReadonly(f)"
                clearable style="width:100%"
                @update:value="delete formErrors[f.field]"
              />
              <n-select
                v-else-if="f.type === 'TAG'"
                v-model:value="formData[f.field]"
                :options="tagOptions(f.field)"
                :placeholder="'请输入或选择' + f.title"
                :status="formErrors[f.field] ? 'error' : undefined"
                :disabled="isReadonly(f)"
                :max-tag-count="tagMap[f.field] && tagMap[f.field].maxTagCount"
                :tag="tagMap[f.field] && tagMap[f.field].allowExtension"
                filterable multiple clearable
                @update:value="delete formErrors[f.field]"
              />
              <n-input
                v-else-if="f.type === 'TEXTAREA'"
                v-model:value="formData[f.field]"
                type="textarea"
                :autosize="{ minRows: 3 }"
                :placeholder="'请输入' + f.title"
                :status="formErrors[f.field] ? 'error' : undefined"
                :disabled="isReadonly(f)"
                @update:value="delete formErrors[f.field]"
              />
              <div v-else-if="f.type === 'ATTACHMENT'" class="attachment-field"
                @mouseenter="setAttachmentDropdown(f.field)" @mouseleave="clearAttachmentDropdown">
                <div class="attachment-btn">
                  <iconify-icon icon="mdi:paperclip" style="font-size:13px"></iconify-icon>
                  附件管理
                  <iconify-icon icon="mdi:chevron-down" :style="'font-size:12px;transition:transform .2s ease;transform:' + (attachmentDropdownKey === f.field ? 'rotate(180deg)' : 'rotate(0deg)')"></iconify-icon>
                </div>
                <transition name="dropdown-fade">
                  <div v-if="attachmentDropdownKey === f.field" class="attachment-dropdown">
                    <div class="attachment-dropdown-inner">
                      <label v-if="!isReadonly(f) && (!attachmentMap[f.field] || !attachmentMap[f.field].maxLimit || (formData[f.field] || []).length < attachmentMap[f.field].maxLimit)"
                        class="attachment-dropdown-item"
                        :for="'upload-dd-' + f.field">
                        <iconify-icon icon="mdi:upload" style="font-size:13px"></iconify-icon>
                        上传文件{{ attachmentMap[f.field] && attachmentMap[f.field].maxLimit ? '（共' + (attachmentMap[f.field].maxLimit - (formData[f.field] || []).length) + '个）' : '' }}
                        <input :id="'upload-dd-' + f.field" type="file" style="display:none"
                          :multiple="attachmentMap[f.field] && attachmentMap[f.field].maxLimit > 1"
                          :accept="attachmentMap[f.field] && attachmentMap[f.field].fileTypes && attachmentMap[f.field].fileTypes.length ? attachmentMap[f.field].fileTypes.join(',') : undefined"
                          @change="handleAttachmentChange(f, $event)"
                        />
                      </label>
                      <div v-if="(formData[f.field] || []).length > 0"
                        class="attachment-dropdown-item"
                        @click="openPreview(f)">
                        <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>
                        查看文件（共{{ (formData[f.field] || []).length }}个）
                      </div>
                      <div v-else class="attachment-dropdown-item attachment-disabled">
                        <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>
                        查看文件（共0个）
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
              <n-input
                v-else
                v-model:value="formData[f.field]"
                :placeholder="'请输入' + f.title"
                :status="formErrors[f.field] ? 'error' : undefined"
                :disabled="isReadonly(f)"
                clearable
                @update:value="delete formErrors[f.field]"
              />
              <span v-if="formErrors[f.field]" class="form-error-tip">{{ formErrors[f.field] }}</span>
            </div>
          </template>
        </div>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showForm = false">取 消</n-button>
            <n-button type="primary" @click="handleFormSubmit">确 定</n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- 附件预览弹窗 -->
      <n-modal v-model:show="previewModalShow" preset="card" style="width:760px;margin-top:60px;padding:0">
        <template #header>
          <div class="gallery-header">
            <span class="gallery-title">{{ previewField ? (previewField.title || '附件预览') : '附件预览' }}</span>
            <span v-if="previewField && attachmentMap[previewField.field] && attachmentMap[previewField.field].type === 'IMAGE' && (formData[previewField.field] || []).length > 0" class="gallery-count">
              {{ previewIndex + 1 }} / {{ (formData[previewField.field] || []).length }}
            </span>
          </div>
        </template>
        <div v-if="previewField && attachmentMap[previewField.field] && attachmentMap[previewField.field].type === 'IMAGE'" class="gallery-wrap">
          <div class="gallery-body">
            <div class="gallery-stage">
              <button v-if="previewIndex > 0" class="gallery-nav gallery-nav-prev" @click="slideDirection = 'left'; previewIndex--">‹</button>
              <transition :name="'slide-' + slideDirection">
                <img :key="previewIndex" :src="formData[previewField.field][previewIndex]" class="gallery-main-img" />
              </transition>
              <button v-if="previewIndex < (formData[previewField.field] || []).length - 1" class="gallery-nav gallery-nav-next" @click="slideDirection = 'right'; previewIndex++">›</button>
            </div>
            <div v-if="(formData[previewField.field] || []).length > 0" class="gallery-sider">
              <div class="gallery-thumb-list">
                <div v-for="(url, idx) in (formData[previewField.field] || [])" :key="idx" class="gallery-thumb-item">
                  <img :src="url" class="gallery-thumb-img" :class="{active: previewIndex === idx}"
                    @click="slideDirection = previewIndex < idx ? 'right' : 'left'; previewIndex = idx" />
                  <span class="gallery-thumb-del" @click.stop="deleteFromPreview(idx)">×</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="(formData[previewField.field] || []).length > 0" class="gallery-dots">
            <span v-for="(url, idx) in (formData[previewField.field] || [])" :key="'dot-' + idx"
              :class="'gallery-dot' + (previewIndex === idx ? ' active' : '')"
              @click="slideDirection = previewIndex < idx ? 'right' : 'left'; previewIndex = idx"></span>
          </div>
          <div v-if="(formData[previewField.field] || []).length > 0" class="gallery-url-wrap" :title="'点击复制: ' + (formData[previewField.field] || [])[previewIndex]" @click="copyText((formData[previewField.field] || [])[previewIndex])">
            <div class="gallery-url-label">图片地址</div>
            <div class="gallery-url-text">{{ (formData[previewField.field] || [])[previewIndex] }}</div>
          </div>
          <div v-if="(formData[previewField.field] || []).length === 0" class="gallery-empty">暂无图片</div>
        </div>
        <div v-else-if="previewField" class="preview-file-list">
          <template v-for="(url, idx) in (formData[previewField.field] || [])" :key="idx">
            <div class="preview-file-row">
              <span class="preview-file-url">{{ url }}</span>
              <n-space>
                <n-button size="tiny" @click="copyText(url)">复制</n-button>
                <n-button type="error" size="tiny" @click="deleteFromPreview(idx)">删除</n-button>
              </n-space>
            </div>
          </template>
          <div v-if="(formData[previewField.field] || []).length === 0" class="preview-empty">暂无文件</div>
        </div>
      </n-modal>

    </div>
  `
}

window.NovaTable = NovaTable
})()
