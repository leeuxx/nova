// pages/picker.js — 关联引用选择页 Vue 组件
;(function () {
const { h } = Vue
const { NTooltip, NTag, NRadio } = naive

function parseWidthPct(w) {
  if (!w) return 10
  if (String(w).endsWith('%')) return parseFloat(w)
  return -(parseInt(w) || 150)
}

function darkenHex(hex, factor) {
  var c = hex.replace('#', '')
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2]
  var r = Math.max(0, Math.round(parseInt(c.slice(0,2),16) * (1 - factor)))
  var g = Math.max(0, Math.round(parseInt(c.slice(2,4),16) * (1 - factor)))
  var b = Math.max(0, Math.round(parseInt(c.slice(4,6),16) * (1 - factor)))
  return '#' + [r,g,b].map(function(v){ return v.toString(16).padStart(2,'0') }).join('')
}

const NovaPicker = {
  name: 'NovaPicker',

  data() {
    return {
      choiceMap:      {},
      tagMap:         {},
      dateMap:        {},
      numberMap:      {},
      booleanMap:     {},
      referenceMap:   {},
      tableWrapperWidth: 0,
      novaName:       '',
      level:          0,
      pkFieldName:    'id',
      tableRowColors: [],
      tableData:      [],
      tableColumns:   [],
      sortStates:     {},
      filterExpanded: false,
      searchFields:   [],
      filterForm:     {},
      striped:        true,
      tableSize:      'medium',
      loading:        false,
      selectedRowKey: null,
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
    isDark() {
      return window.__pickerDark === true
    },
    colPixels() {
      const fixedPx = 50
      const available = (this.tableWrapperWidth || 1200) - fixedPx
      return this.tableColumns.map(col => {
        const w = parseWidthPct(col.width)
        return w < 0 ? -w : Math.round(w / 100 * available)
      })
    },

    scrollX() {
      if (!this.tableColumns.length) return undefined
      const fixedPx = 50
      const total = fixedPx + this.colPixels.reduce((s, w) => s + w, 0)
      const container = this.tableWrapperWidth || 0
      return total > container ? total : undefined
    },

    columns() {
      const vm = this
      const cols = []

      cols.push({
        key: '__radio__',
        width: 50,
        title: '',
        render(row) {
          return h('div', { style: 'display:flex;align-items:center;justify-content:center;width:100%;height:100%' }, [
            h(NRadio, {
              value: row[vm.pkFieldName],
              checked: vm.selectedRowKey === row[vm.pkFieldName],
              onClick: () => vm.selectRow(row),
              style: { transform: 'scale(1.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
            })
          ])
        }
      })

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
                h('span', { style: 'margin-left:5px;display:inline-flex;flex-direction:column;gap:0' }, [
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
              const isDark = document.body.classList.contains('dark')
              const offBg = isDark ? '#444' : '#d9d9d9'
              return h('span', { style: `display:inline-block;vertical-align:middle;width:44px;height:22px;border-radius:11px;background:${isTrue ? '#006be6' : offBg};position:relative;cursor:not-allowed;opacity:0.7;flex-shrink:0` }, [
                h('span', { style: `position:absolute;top:0;${isTrue ? 'left:0;right:20px' : 'right:0;left:20px'};bottom:0;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;user-select:none` }, isTrue ? '是' : '否'),
                h('span', { style: `position:absolute;top:3px;left:${isTrue ? '26px' : '3px'};width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2)` })
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

        if (col.type === 'REFERENCE') {
          const dotIdx = col.field.indexOf('.')
          const objKey  = dotIdx > -1 ? col.field.slice(0, dotIdx)  : col.field
          const propKey = dotIdx > -1 ? col.field.slice(dotIdx + 1) : ''
          colDef.key = col.field
          colDef.render = (row) => {
            const obj = row[objKey]
            if (obj === null || obj === undefined) return ''
            const val = propKey ? obj[propKey] : obj
            return val === null || val === undefined ? '' : String(val)
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
            if (type === 'YEAR')  return String(d.getFullYear())
            if (type === 'MONTH') return d.getFullYear() + '-' + p(d.getMonth() + 1)
            if (type === 'DATE')  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
            if (type === 'TIME')  return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
            return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
                   p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
          }
        }

        cols.push(colDef)
      })

      return cols
    }
  },

  mounted() {
    const params = new URLSearchParams(window.location.search)
    this.novaName = params.get('novaName') || ''
    this.level = parseInt(params.get('level') || '1', 10)
    window.pickerVm = this
    this.paginationConfig.onUpdatePage     = (p) => window.NovaPickerJQ.onPageChange(p)
    this.paginationConfig.onUpdatePageSize = (s) => window.NovaPickerJQ.onPageSizeChange(s)
    this.paginationConfig.suffix           = ({ itemCount }) => `共 ${itemCount} 条`
    if (this.novaName && window.NovaPickerJQ) window.NovaPickerJQ.onMounted(this.novaName)

    // 监听来自子 picker 的消息
    window.addEventListener('message', this.handlePickerMessage)
  },

  beforeUnmount() {
    window.pickerVm = null
    $(window).off('resize.novaPicker')
    window.removeEventListener('message', this.handlePickerMessage)
  },

  methods: {
    selectRow(row) {
      this.selectedRowKey = row[this.pkFieldName]
      let plainRow = {}
      try {
        plainRow = JSON.parse(JSON.stringify(row))
      } catch (e) {
        for (const key in row) {
          try {
            plainRow[key] = JSON.parse(JSON.stringify(row[key]))
          } catch {
            plainRow[key] = String(row[key])
          }
        }
      }
      window.parent.postMessage({
        type:        'nova-picker-row',
        row:         plainRow,
        pkField:     this.pkFieldName,
        fromLevel:   this.level,
        targetLevel: this.level - 1
      }, '*')
    },
    toggleSort(field) {
      const cur  = this.sortStates[field]
      const next = cur == null ? 'asc' : cur === 'asc' ? 'desc' : null
      this.sortStates = Object.assign({}, this.sortStates, { [field]: next })
      window.NovaPickerJQ.onSortChange()
    },
    toggleFilter() {
      if (this.searchFields.length <= 3) return
      this.filterExpanded = !this.filterExpanded
      this.$nextTick(() => window.NovaPickerJQ && window.NovaPickerJQ.updateTableHeight())
    },
    fieldOptions(field) {
      const choice = this.choiceMap[field.field]
      if (!choice || !choice.values) return []
      return choice.values.map(v => ({ label: v.label, value: v.value }))
    },
    tagOptions(field) {
      const tag = this.tagMap && this.tagMap[field]
      if (!tag || !tag.tags) return []
      return tag.tags.map(t => ({ label: t, value: t }))
    },
    datePickerType(field, vague) {
      const dateInfo = this.dateMap && this.dateMap[field]
      const single = { DATE: 'date', TIME: 'time', DATE_TIME: 'datetime', MONTH: 'month', YEAR: 'year' }
      const range  = { DATE: 'daterange', TIME: 'time', DATE_TIME: 'datetimerange', MONTH: 'monthrange', YEAR: 'yearrange' }
      const map = vague ? range : single
      return (dateInfo && map[dateInfo.type]) || (vague ? 'daterange' : 'date')
    },
    handleReset() { window.NovaPickerJQ.handleReset() },
    handleQuery() {
      this.paginationConfig.page = 1
      window.NovaPickerJQ.loadData(this.novaName)
    },
    openReferenceModalForFilter(field) {
      const refInfo = this.referenceMap[field.field]
      if (!refInfo || !refInfo.referenceName) return

      // 向上层发送打开 picker 的消息
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'nova-picker-open',
          novaName: refInfo.referenceName,
          level: this.level + 1,
          field: JSON.parse(JSON.stringify(field)),
          isForFilter: true
        }, '*')
      }
    },
    referenceDisplayLabel(field) {
      const displayVal = this.filterForm[field + '_display']
      if (displayVal !== null && displayVal !== undefined && displayVal !== '') return String(displayVal)
      const val = this.filterForm[field]
      if (val === null || val === undefined || val === '') return ''
      return String(val)
    }
  },

  template: `
    <div style="padding:8px 8px 16px 8px;display:flex;flex-direction:column;height:100%;box-sizing:border-box">

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
                :type="datePickerType(field.field, field.vague)"
                :placeholder="field.vague ? ['开始时间', '结束时间'] : '请选择' + field.title"
                clearable style="flex:1"
              />
              <div v-else-if="field.type === 'REFERENCE' && referenceMap[field.field]" @click="openReferenceModalForFilter(field)" style="flex:1;cursor:pointer">
                <n-input
                  :value="referenceDisplayLabel(field.field)"
                  :placeholder="'请选择' + field.title"
                  readonly
                  clearable
                  @clear.stop="filterForm[field.field] = null; filterForm[field.field + '_display'] = ''"
                >
                  <template #suffix>
                    <iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon>
                  </template>
                </n-input>
              </div>
              <n-input v-else-if="field.type === 'REFERENCE'"
                v-model:value="filterForm[field.field]"
                :placeholder="'请输入' + field.title"
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
        <div id="picker-table-wrapper">
          <n-data-table
            :data="tableData"
            :columns="columns"
            :row-key="row => row[pkFieldName]"
            :loading="loading"
            :remote="true"
            :pagination="paginationConfig"
            :striped="striped"
            :size="tableSize"
            :scroll-x="scrollX"
            :flex-height="true"
            :row-props="(row) => ({ onClick: () => selectRow(row), style: { cursor: 'pointer' } })"
            style="width:100%;height:100%"
          />
        </div>
      </n-card>

    </div>
  `
}

window.NovaPicker = NovaPicker
})()