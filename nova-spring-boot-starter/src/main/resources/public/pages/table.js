// pages/table.js — 通用表格页 Vue 组件，所有表格菜单共用此模板
;(function () {
const { h } = Vue
const { NPopconfirm, NSpace, NTooltip, NTag, NRadio, NDropdown } = naive

// 解析列宽：百分比返回浮点数（0~100），像素返回负数表示固定像素
function parseWidthPct(w) {
  if (!w) return 10  // 默认 10%
  if (String(w).endsWith('%')) return parseFloat(w)
  return -(parseInt(w) || 150)  // 负数 = 固定像素
}

// 将 hex 颜色加深：factor 为加深比例（0~1），返回加深后的 hex
function darkenHex(hex, factor) {
  if (!hex || typeof hex !== 'string' || !/^#?[0-9a-fA-F]{3,8}$/.test(hex)) return 'inherit'
  var c = hex.replace('#', '')
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2]
  var r = Math.max(0, Math.round(parseInt(c.slice(0,2),16) * (1 - factor)))
  var g = Math.max(0, Math.round(parseInt(c.slice(2,4),16) * (1 - factor)))
  var b = Math.max(0, Math.round(parseInt(c.slice(4,6),16) * (1 - factor)))
  return '#' + [r,g,b].map(function(v){ return v.toString(16).padStart(2,'0') }).join('')
}

// ─── showByExpr 表达式解析器 ────────────────────────────────────
// 支持语法：field op value [&& / || ...] 以及括号分组
// op: = != > >= < <= = null != null
// value: 'string' "string" number true false null
function parseShowExpr(expr) {
  var pos = 0
  var src = (expr || '').trim()

  function skipWs() { while (pos < src.length && /\s/.test(src[pos])) pos++ }
  function peek()   { skipWs(); return src[pos] }

  function parseOr() {
    var left = parseAnd()
    while (true) {
      skipWs()
      if (src.slice(pos, pos + 2) === '||') { pos += 2; left = { op: '||', left: left, right: parseAnd() } }
      else break
    }
    return left
  }

  function parseAnd() {
    var left = parseAtom()
    while (true) {
      skipWs()
      if (src.slice(pos, pos + 2) === '&&') { pos += 2; left = { op: '&&', left: left, right: parseAtom() } }
      else break
    }
    return left
  }

  function parseAtom() {
    skipWs()
    if (src[pos] === '(') {
      pos++ // skip (
      var inner = parseOr()
      skipWs()
      if (src[pos] === ')') pos++ // skip )
      return inner
    }
    return parseCondition()
  }

  function parseCondition() {
    skipWs()
    // field name: word chars
    var fieldMatch = src.slice(pos).match(/^[\w.]+/)
    if (!fieldMatch) return { op: 'lit', val: true }
    var field = fieldMatch[0]; pos += field.length
    skipWs()
    // operator
    var op
    if      (src.slice(pos, pos + 2) === '!=') { op = '!='; pos += 2 }
    else if (src.slice(pos, pos + 2) === '>=') { op = '>='; pos += 2 }
    else if (src.slice(pos, pos + 2) === '<=') { op = '<='; pos += 2 }
    else if (src.slice(pos, pos + 2) === '==') { op = '=='; pos += 2 }
    else if (src[pos] === '>')                 { op = '>';  pos += 1 }
    else if (src[pos] === '<')                 { op = '<';  pos += 1 }
    else return { op: 'lit', val: true }
    skipWs()
    // value
    var val
    if (src.slice(pos, pos + 4).toLowerCase() === 'null') { val = null; pos += 4 }
    else if (src.slice(pos, pos + 4).toLowerCase() === 'true') { val = true; pos += 4 }
    else if (src.slice(pos, pos + 5).toLowerCase() === 'false') { val = false; pos += 5 }
    else if (src[pos] === "'" || src[pos] === '"') {
      var q = src[pos++]; var s = ''
      while (pos < src.length && src[pos] !== q) { s += src[pos++] }
      pos++ // closing quote
      val = s
    } else {
      var numMatch = src.slice(pos).match(/^-?\d+(\.\d+)?/)
      if (numMatch) { val = parseFloat(numMatch[0]); pos += numMatch[0].length }
      else val = null
    }
    return { op: op, field: field, val: val }
  }

  try { return parseOr() } catch(e) { return { op: 'lit', val: true } }
}

function evalShowNode(node, formData) {
  if (!node) return true
  if (node.op === 'lit')  return !!node.val
  if (node.op === '||')   return evalShowNode(node.left, formData) || evalShowNode(node.right, formData)
  if (node.op === '&&')   return evalShowNode(node.left, formData) && evalShowNode(node.right, formData)
  // condition
  var raw = formData[node.field]
  var fv  = (raw === undefined || raw === null || raw === '') ? null : raw
  var cv  = node.val
  // null checks
  if (node.op === '=='  && cv === null) return fv === null
  if (node.op === '!=' && cv === null) return fv !== null
  // typed compare
  if (fv === null) return false
  if (node.op === '==') return String(fv) === String(cv)
  if (node.op === '!=') return String(fv) !== String(cv)
  var fn = parseFloat(fv), cn = parseFloat(cv)
  if (isNaN(fn) || isNaN(cn)) return false
  if (node.op === '>')  return fn >  cn
  if (node.op === '>=') return fn >= cn
  if (node.op === '<')  return fn <  cn
  if (node.op === '<=') return fn <= cn
  return true
}

function evalShowExpr(expr, formData) {
  if (!expr) return true
  return evalShowNode(parseShowExpr(expr), formData)
}
window.evalShowExpr = evalShowExpr
// ────────────────────────────────────────────────────────────────

const NovaTable = {
  name: 'NovaTable',

  props: {
    pickerMode:         { type: Boolean, default: false },
    viewMode:           { type: Boolean, default: false },
    embeddedMode:       { type: Boolean, default: false },
    linkMode:           { type: Boolean, default: false },
    pickerMulti:        { type: Boolean, default: false },
    readonly:           { type: Boolean, default: false },
    dualMode:           { type: Boolean, default: false },
    viewRow:            { type: Object,  default: null },
    novaNameProp:       { type: String,  default: '' },
    sourceNovaNameProp: { type: String,  default: '' },
    sourceFieldsProp:   { type: Object,  default: () => ({}) }
  },

  emits: ['pick', 'link-add', 'check'],

  data() {
    return {
      choiceMap:      {},
      tagMap:         {},
      dateMap:        {},
      numberMap:      {},
      booleanMap:     {},
      attachmentMap:  {},
      referenceMap:   {},
      refPickerField: null,
      refPickerRow:   null,
      refPickerData:  [],
      refPickerLoading: false,
      refPickerColumns: [],
      refPickerStack: [],      tableWrapperWidth: 0,
      novaName:       '',
      novaIdFieldName:    null,
      tableRowColors: [],
      tableData:      [],
      rawTableData:   [],
      tableColumns:   [],
      sortStates:     {},
      filterExpanded: false,
      checkedRowKeys: [],
      selectedRowKey: null,
      searchFields:   [],
      filterForm:     {},
      tapSearchField:  null,
      tapSearchValue:  null,
      showForm:       false,
      formTab:        'form',
      openingForm:    false,         // 弹窗打开瞬间置 true，nextTick 置 false，期间忽略 onFormTabChange
      formMode:       'add',
      visitedEmbTabs: new Set(),
      currentRow:     null,
      formData:       {},
      editFields:        [],
      editReferenceTabs:   [],
      refTabData:          {},
      editAppendageTabs:   [],
      editExtraTabs:       [],
      appendageTabBuild:   {},
      appendageFormData:   {},
      appendageFormErrors: {},
      appendageDetailsLoaded: {},
      editLayout:     'DEFAULT',
      linkMap:        {},
      linkTargetInfo: {},
      linkTabBuild:     {},
      linkFormData:     {},
      linkPickerShow:            false,
      linkPickerTargetNova:       '',
      linkPickerCurrentTab:       '',
      linkPickerSelectedKeys:     [],
      linkPickerSourceFields:     {},
      linkPickerTitle:            '',
      dualTableViewActive:        false,
      dualTableClosing:           false,
      _dualReloading:             false,
      dualTableCurrentKey:        '',
      dualTableCurrentNova:       '',
      dualTableCurrentLabel:      '',
      dualTableSourceFields:      {},
      _dualSelectedRow:           null,
      _dualTableVersion:         0,
      // ── 自定义按钮（mock 数据，用于前端预览效果）────────────────────
      rowOperations:  [],

      // ── 操作表单（novaClassName）── 独立弹窗 + 独立状态 ────
      opFormShow:     false,
      opFormErrors:   {},
      opFormLoading:  false,
      opFormNovaName: '',
      opFormFields:   [],
      opFormData:     {},
      opFormChoiceMap:   {},
      opFormRefMap:      {},
      opFormAppendageMap: {},
      opFormDateMap:     {},
      opFormNumberMap:   {},
      opFormBooleanMap:  {},
      opFormTagMap:      {},
      opFormAttachmentMap: {},
      opFormLayoutObj:      {},
      opFormBtn:      null,
      opFormRow:      null,
      // opForm tab 相关
      opFormTab:          'form',
      opFormExtraTabs:    [],      // APPENDAGE 表单 tab
      opFormAppTabBuild:  {},      // 附属表单 build 数据
      opFormAppFormData:  {},      // 附属表单数据
      opFormAppFormErrors:{},      // 附属表单校验错误
      formErrors:     {},
      striped:        true,
      tableSize:      'medium',
      pageSize:       10,
      pageSizes:      [10, 20, 50, 100],
      loading:          false,
      previewModalShow: false,
      previewField:     null,
      previewAppNovaName: null,
      previewIndex:     0,
      slideDirection:  'right',
      attachmentDropdownKey: null,
      refSelectOptions:  {},   // { [field]: [{label, value}] }
      refSelectLoading:  {},   // { [field]: bool }
      refSelectTotal:    {},   // { [field]: number }
      refSelectPage:     {},   // { [field]: number }
      refSelectQuery:    {},   // { [field]: string }
      _refSelectTimers:  {},   // 防抖 timer
      paginationConfig: {
        page:            1,
        itemCount:       0,
        pageSize:        10,
        pageSlot:        9,
        showSizePicker:  true,
        pageSizes:       [10, 20, 50, 100].map(n => ({ label: n + ' 条/页', value: n })),
        showQuickJumper: true
      }
    }
  },

  computed: {
    isDark() {
      return window.__appDarkMode ? window.__appDarkMode.value : false
    },
    embSize() { return undefined },
    tapSearchOptions() {
      const f = this.tapSearchField
      if (!f) return []
      const info = this.choiceMap[f.field] || {}
      const vals = info.values || []
      const opts = vals.map(v => ({ value: v.value, label: v.label }))
      if (f.tapSearch && f.tapSearch.showAll) opts.unshift({ value: null, label: '全部' })
      return opts
    },
    isEmbTab() { return !!(this.formTab && (this.formTab.startsWith('emb_') || this.formTab.startsWith('link_'))) },
    dualTableSubTables() {
      const list = []
      const appendageMap = this.appendageMap || {}
      for (const field in appendageMap) {
        const info = appendageMap[field]
        if (info && info.dualTable) {
          list.push({ label: info.dualTableTitle || info.referenceName, novaName: info.referenceName, type: 'appendage', field, fieldInfo: info })
        }
      }
      const linkMap = this.linkMap || {}
      for (const field in linkMap) {
        const info = linkMap[field]
        if (info && info.dualTable) {
          list.push({ label: info.dualTableTitle || info.referenceName, novaName: info.referenceName, type: 'link', field, fieldInfo: info })
        }
      }
      return list
    },
    dualTableEnabled() {
      return this.dualTableSubTables.length > 0 && !this.pickerMode && !this.embeddedMode
    },
    // 自定义按钮分类
    rowCustomButtons() {
      return (this.rowOperations || []).filter(b => b.mode === 'SINGLE' || b.mode === 'MULTI')
    },
    rowActionColWidth() {
      var btns = (this.rowOperations || []).filter(function(b) { return b.mode === 'SINGLE' || b.mode === 'MULTI' })
      var unfolded = btns.length > 0 ? 1 : 0
      var hasFolded = btns.length > 1
      var w = this.linkMode ? 45 : 85     // 编辑+删除(85) / 仅删除(45)
      w += unfolded * 60                  // 每个非折叠按钮
      if (hasFolded) w += 38              // 更多图标
      return w
    },
    toolbarCustomButtons() {
      return (this.rowOperations || []).filter(b => b.mode === 'MULTI' || b.mode === 'MULTI_ONLY' || b.mode === 'BUTTON')
    },
    toolbarUnfoldedButtons() {
      return this.toolbarCustomButtons.slice(0, 1)
    },
    toolbarFoldedButtons() {
      return this.toolbarCustomButtons.slice(1)
    },
    toolbarFoldedOptions() {
      var self = this
      return this.toolbarFoldedButtons.map(function(btn) {
        return {
          label: btn.title,
          key: btn.title,
          icon: btn.icon ? function() { return h('iconify-icon', { icon: btn.icon }) } : undefined,
          disabled: (btn.mode === 'MULTI' || btn.mode === 'MULTI_ONLY') && self.checkedRowKeys.length === 0,
          props: btn.tip ? { title: btn.tip } : undefined
        }
      })
    },
    isDualTableLink() {
      if (!this.dualTableViewActive) return false
      const sub = this.dualTableSubTables.find(s => s.novaName === this.dualTableCurrentNova)
      return sub && sub.type === 'link'
    },
    // 固定列像素：checkbox 50 + 操作列 140
    colPixels() {
      const fixedPx = 50 + this.rowActionColWidth
      const width = this.dualTableViewActive ? Math.max(this.tableWrapperWidth || 1200, 1200) : (this.tableWrapperWidth || 1200)
      const available = width - fixedPx
      // 各列宽度（百分比转像素 or 固定像素）
      return this.tableColumns.map(col => {
        const w = parseWidthPct(col.width)
        return w < 0 ? -w : Math.round(w / 100 * available)
      })
    },

    scrollX() {
      if (!this.tableColumns.length) return undefined
      const fixedPx = 50 + this.rowActionColWidth
      const total = fixedPx + this.colPixels.reduce((s, w) => s + w, 0)
      if (this.dualTableViewActive) return total
      const container = this.tableWrapperWidth || 0
      return total > container ? total : undefined
    },

    filteredData() {
      return this.tableData
    },

    previewFileList() {
      if (!this.previewField) return []
      if (this.previewAppNovaName) return (this.appendageFormData[this.previewAppNovaName] || {})[this.previewField.field] || []
      return this.formData[this.previewField.field] || []
    },
    previewAttachCfg() {
      if (!this.previewField) return {}
      if (this.previewAppNovaName) return (this.appBuild(this.previewAppNovaName).attachmentMap || {})[this.previewField.field] || {}
      return this.attachmentMap[this.previewField.field] || {}
    },

    visibleEditFields() {
      const fields = this.editFields
      const fd     = this.formData
      // REFERENCE 字段对象名 → referenceField 值的映射，兼容表达式里直接用对象名判断
      const evalFd = Object.assign({}, fd)
      for (const key in this.referenceMap) {
        const rf = this.referenceMap[key] && this.referenceMap[key].referenceField
        if (rf) evalFd[key] = fd[rf] !== undefined ? fd[rf] : null
      }
      return fields.map(f => ({
        field: f,
        visible: !f.showByExpr || evalShowExpr(f.showByExpr, evalFd)
      }))
    },
    // ── 操作表单 computed ────────────────────────────────────
    visibleOpFormFields() {
      var fields = this.opFormFields || []
      var fd     = this.opFormData || {}
      var evalFd = Object.assign({}, fd)
      for (var key in this.opFormRefMap) {
        var rf = this.opFormRefMap[key] && this.opFormRefMap[key].referenceField
        if (rf) evalFd[key] = fd[rf] !== undefined ? fd[rf] : null
      }
      return fields.map(function(f) {
        return { field: f, visible: !f.showByExpr || evalShowExpr(f.showByExpr, evalFd) }
      })
    },
    opFormLayout() {
      return (this.opFormLayoutObj && this.opFormLayoutObj.editLayout) || 'DEFAULT'
    },
    columns() {
      const vm   = this
      const cols = []

      if (vm.pickerMode) {
        if (vm.pickerMulti) {
          cols.push({ type: 'selection', title: '', key: 'selection', width: 50 })
        } else {
          cols.push({
            key: '__radio__', width: 50, title: '',
            render(row) {
              return h('div', { style: 'display:flex;align-items:center;justify-content:center;width:100%;height:100%' }, [
                h(NRadio, {
                  value: row[vm.novaIdFieldName],
                  checked: vm.selectedRowKey === row[vm.novaIdFieldName],
                  onClick: () => vm.selectRow(row),
                  style: { transform: 'scale(1.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
                })
              ])
            }
          })
        }
      } else if (!vm.readonly) {
        cols.push({ type: 'selection', title: '', key: 'selection', width: 50 })
      }

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
              const novaIdField = vm.novaIdFieldName || 'id'
              const editField = (vm.editFields || []).find(function(f) { return f.field === col.field })
              const disabled = !editField || (editField.readonly && editField.readonly.edit)
              const isDark = document.body.classList.contains('dark')
              const offBg = isDark ? '#444' : '#d9d9d9'
              const onClick = disabled ? undefined : () => {
                const newVal = !isTrue
                $.ajax({
                  url: '/nova/table/update', method: 'POST', contentType: 'application/json',
                  data: JSON.stringify({ novaName, formInfo: [{ field: novaIdField, value: String(row[novaIdField]), type: '' }, { field: col.field, value: String(newVal), type: 'BOOLEAN' }] }),
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

        if (col.type === 'REFERENCE') {
          colDef.key = col.field
          colDef.render = (row) => {
            const v = row[col.field + '_display']
            return (v === null || v === undefined) ? '' : String(v)
          }
        }

        if (col.type === 'APPENDAGE') {
          colDef.render = (row) => {
            const v = row[col.field + '_display']
            return (v === null || v === undefined) ? '' : String(v)
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

      if (!vm.pickerMode) {
        cols.push({
          title: '操作', key: 'actions', width: vm.rowActionColWidth, fixed: 'right',
          render(row) {
            var buttons = []
            if (!vm.linkMode) {
              buttons.push(h('span', { class: 'row-action-btn', style: { color: '#2080f0', cursor: 'pointer', fontSize: '13px' }, onClick: () => vm.handleEdit(row) }, '编辑'))
            }
            buttons.push(h(NPopconfirm,
              { onPositiveClick: () => vm.handleDelete(row), positiveText: '确定', negativeText: '取消' },
              {
                default: () => '确定删除吗？',
                trigger:  () => h('span', { class: 'row-action-btn', style: { color: '#d03050', cursor: 'pointer', fontSize: '13px' } }, '删除')
              }
            ))
            // ── 自定义按钮：SINGLE / MULTI（行操作区）────────────────
            var rowBtns = vm.rowCustomButtons || []
            var rowUnfolded = rowBtns.slice(0, 1)
            var rowFolded   = rowBtns.slice(1)
            rowUnfolded.forEach(function(btn) {
              var enabled = !btn.ifExpr || window.evalShowExpr(btn.ifExpr, row)
              var btnStyle = { color: enabled ? (btn.color || '#7c3aed') : '#ccc', cursor: enabled ? 'pointer' : 'not-allowed', fontSize: '13px' }
              var btnTitle = enabled ? (btn.tip || btn.title) : (btn.tip || btn.title) + ' (不可用)'
              var triggerEl = h('span', { class: 'row-action-btn', style: btnStyle, title: btnTitle }, btn.title)
              var handler = function() {
                if (btn.type === 'NOVA' && btn.novaClassName) { vm.openOpForm(btn, row); return }
                console.log('[CustomBtn] row:', btn.title, 'row:', row)
              }
              if (enabled && btn.callHint) {
                buttons.push(h(NPopconfirm, {
                  onPositiveClick: handler, positiveText: '确定', negativeText: '取消'
                }, { default: function() { return btn.callHint }, trigger: function() { return triggerEl } }))
              } else if (enabled) {
                buttons.push(h('span', { class: 'row-action-btn', style: btnStyle, title: btnTitle, onClick: handler }, btn.title))
              } else {
                buttons.push(triggerEl)
              }
            })
            if (rowFolded.length > 0) {
              var foldedOpts = rowFolded.map(function(btn) {
                var enabled = !btn.ifExpr || window.evalShowExpr(btn.ifExpr, row)
                return { label: btn.title, key: btn.title, disabled: !enabled, icon: btn.icon ? function() { return h('iconify-icon', { icon: btn.icon }) } : undefined, props: btn.tip ? { title: btn.tip } : undefined }
              })
              buttons.push(h(NDropdown, {
                options: foldedOpts,
                trigger: 'hover',
                onSelect: function(key) {
                  var btn = rowFolded.find(function(b) { return b.title === key })
                  if (!btn) return
                  var action = function() {
                    if (btn.type === 'NOVA' && btn.novaClassName) { vm.openOpForm(btn, row); return }
                    console.log('[CustomBtn] row folded:', btn.title, 'row:', row)
                  }
                  if (btn.callHint) { window.msg.confirm('warning', '确认操作', btn.callHint, action) }
                  else { action() }
                }
              }, {
                default: function() {
                  return h('iconify-icon', { icon: 'material-symbols:more-horiz', style: { color: '#888', cursor: 'pointer', fontSize: '18px' } })
                }
              }))
            }
            return h(NSpace, { size: 8 }, { default: () => buttons })
          }
        })
      }

      return cols
    }
  },

  beforeRouteUpdate() {
      if (this.dualTableViewActive) {
        this.dualTableViewActive = false
        this.dualTableClosing = false
        this._syncDualTableClass()
      }
    },

  watch: {
    dualTableViewActive(val) {
      if (!this.dualMode) {
        this.paginationConfig.pageSlot = val ? 5 : 9
        this.paginationConfig.showQuickJumper = !val
      }
      this._syncDualTableClass()
    },
    showForm(val) {
      if (!val) {
        // 弹窗关闭：清空所有 tab 相关缓存，确保下次打开完全等同于第一次
        this.visitedEmbTabs      = new Set()
        this.formTab             = 'form'
        this.appendageDetailsLoaded = {}
        this.appendageTabBuild      = {}
        this.appendageFormData      = {}
        this.appendageFormErrors    = {}
        this.refTabData          = {}
        this._refCoord           = {}
        this.linkFormData        = {}
        this.linkTabBuild        = {}
      } else {
        // 弹窗打开：置标记屏蔽 n-tabs 因 value 同步触发的 onFormTabChange
        this.openingForm = true
        this.formTab     = 'form'
        // 用 setTimeout 确保在 n-tabs 同步完成、所有 emit 结束后再解除屏蔽
        setTimeout(() => { this.openingForm = false }, 0)
      }
    },
    formData: {
      deep: true,
      handler() {
        const fields = this.editFields
        if (!fields || !fields.length) return
        const evalFd = Object.assign({}, this.formData)
        for (const key in this.referenceMap) {
          const rf = this.referenceMap[key] && this.referenceMap[key].referenceField
          if (rf) evalFd[key] = this.formData[rf] !== undefined ? this.formData[rf] : null
        }
        const maxIter = fields.length
        for (var i = 0; i < maxIter; i++) {
          var changed = false
          for (var j = 0; j < fields.length; j++) {
            var f = fields[j]
            if (!f.showByExpr) continue
            if (!evalShowExpr(f.showByExpr, evalFd)) {
              var isEmpty = this.formData[f.field] === null
                         || this.formData[f.field] === undefined
                         || this.formData[f.field] === ''
                         || (Array.isArray(this.formData[f.field]) && !this.formData[f.field].length)
              if (!isEmpty) {
                this.formData[f.field] = null
                if (this.formData[f.field + '_display'] !== undefined) this.formData[f.field + '_display'] = ''
                changed = true
              }
            }
          }
          if (!changed) break
        }
        // 当前 tab 是被隐藏的 appendage tab 时自动切回 form
        if (this.formTab && this.formTab.startsWith('app_')) {
          var curAppNovaName = this.formTab.slice(4)
          var curTab = (this.editExtraTabs || []).find(function(t) { return t.tapNovaName === curAppNovaName })
          if (curTab && (curTab.tapShow === false || (curTab.tapShowByExpr && !evalShowExpr(curTab.tapShowByExpr, evalFd)))) {
            this.formTab = 'form'
          }
        }
      }
    },

    'sourceFieldsProp': {
      handler(newVal) {
        if (this._dualReloading) return
        if (!this._vmKey) return
        // 内容比较：如果 sourceFields 内容没变化（只是引用变了），跳过 loadData
        // 防止组件重渲染时 buildLinkSourceFields 返回新对象导致的无效刷新
        var newJson = JSON.stringify(newVal || {})
        if (this._lastSourceFieldsJson === newJson) return
        this._lastSourceFieldsJson = newJson

        var target = window.vmMap && window.vmMap[this._vmKey]
        if (!target) return
        var embSourceFields = newVal || {}
        target._sourceFields = embSourceFields
        var sourceKeys = Object.keys(embSourceFields)
        var sourceRefFields = []
        if (sourceKeys.length > 0 && target.editFields) {
          target.editFields.forEach(function(f) {
            if (f.type === 'REFERENCE' && f.reference && f.reference.referenceField && sourceKeys.includes(f.reference.referenceField)) {
              sourceRefFields.push({ field: f.field, type: 'REFERENCE', referenceField: f.reference.referenceField, value: embSourceFields[f.reference.referenceField] })
            }
          })
        }
        var linkInfo = target.linkTargetInfo
        if (linkInfo && sourceKeys.length > 0) {
          var ltFields = [linkInfo.thisReferenceField, linkInfo.linkReferenceField]
          ltFields.forEach(function(refField) {
            if (refField && embSourceFields[refField] != null && !sourceRefFields.some(function(s) { return s.field === refField })) {
              sourceRefFields.push({ field: refField, type: 'LINK_TARGET', referenceField: refField, value: embSourceFields[refField] })
            }
          })
        }
        target._sourceRefFields = sourceRefFields
        // dualMode / embeddedMode 都需要在 sourceFields 变化时重新加载数据
        if (this.dualMode || this.embeddedMode) {
          window.NovaTableJQ.loadData(this._vmKey)
        }
      },
      deep: true
    }
  },

  mounted() {
    this._isActive = true
    window.vmMap = window.vmMap || {}
    if (this.pickerMode) {
      this.novaName = this.novaNameProp || ''
      this._vmKey = '__picker_' + (this.novaName) + '_' + Date.now()
      window.vmMap[this._vmKey] = this
      this.paginationConfig.onUpdatePage     = this.handlePageChange
      this.paginationConfig.onUpdatePageSize = this.handlePageSizeChange
      this.paginationConfig.suffix           = ({ itemCount }) => `共 ${itemCount} 条`
      if (this.novaName && window.NovaTableJQ) window.NovaTableJQ.onPickerMounted(this.novaName, this._vmKey, this.sourceNovaNameProp || this.novaName, this.sourceFieldsProp || {})
    } else if (this.viewMode) {
      this.novaName = this.novaNameProp || ''
      this._vmKey = '__view_' + this.novaName + '_' + Date.now()
      window.vmMap[this._vmKey] = this
      if (this.novaName && window.NovaTableJQ) window.NovaTableJQ.onViewMounted(this.novaName, this._vmKey, this.viewRow, this.sourceNovaNameProp)
    } else if (this.dualMode) {
      this.novaName = this.novaNameProp || ''
      this._vmKey = '__dual_' + this.novaName + '_' + Date.now()
      window.vmMap[this._vmKey] = this
      this.paginationConfig.pageSlot = 5
      this.paginationConfig.showQuickJumper = false
      this.paginationConfig.onUpdatePage     = this.handlePageChange
      this.paginationConfig.onUpdatePageSize = this.handlePageSizeChange
      this.paginationConfig.suffix           = ({ itemCount }) => `共 ${itemCount} 条`
      if (this.novaName && window.NovaTableJQ) window.NovaTableJQ.onEmbeddedMounted(this.novaName, this._vmKey, this.sourceNovaNameProp || this.novaName, this.sourceFieldsProp || {})
    } else if (this.embeddedMode) {
      this.novaName = this.novaNameProp || ''
      this._vmKey = '__emb_' + this.novaName + '_' + Date.now()
      window.vmMap[this._vmKey] = this
      this.paginationConfig.onUpdatePage     = this.handlePageChange
      this.paginationConfig.onUpdatePageSize = this.handlePageSizeChange
      this.paginationConfig.suffix           = ({ itemCount }) => `共 ${itemCount} 条`
      if (this.novaName && window.NovaTableJQ) window.NovaTableJQ.onEmbeddedMounted(this.novaName, this._vmKey, this.sourceNovaNameProp || this.novaName, this.sourceFieldsProp || {}, this.linkMode)
    } else {
      this.novaName = this.$route.params.novaName || ''
      window.vmMap[this.novaName] = this
      window.activeNovaName = this.novaName
      this.paginationConfig.onUpdatePage     = this.handlePageChange
      this.paginationConfig.onUpdatePageSize = this.handlePageSizeChange
      this.paginationConfig.suffix           = ({ itemCount }) => `共 ${itemCount} 条`
      if (window.NovaTableJQ) window.NovaTableJQ.onMounted(this.novaName)
    }
  },

  activated() {
    this._isActive = true
    if (!this.pickerMode) {
      window.vmMap = window.vmMap || {}
      window.vmMap[this.novaName] = this
      window.activeNovaName = this.novaName
    }
    setTimeout(() => window.NovaTableJQ && window.NovaTableJQ.updateTableHeight(), 80)
  },

  deactivated() {
    this._isActive = false
  },

  beforeUnmount() {
    this._isActive = false
    if (this.pickerMode || this.viewMode || this.embeddedMode || this.dualMode) {
      if (this._vmKey && window.vmMap) delete window.vmMap[this._vmKey]
    } else {
      if (window.vmMap) delete window.vmMap[this.novaName]
      if (window.activeNovaName === this.novaName) window.activeNovaName = null
      $(window).off('resize.novaTable')
    }
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
      const key = (this.pickerMode || this.embeddedMode || this.dualMode) ? this._vmKey : this.novaName
      window.NovaTableJQ.onSortChange(key)
    },
    toggleFilter() {
      const threshold = (this.embeddedMode || this.dualMode || this.dualTableViewActive) ? 1 : 3
      if (this.searchFields.length <= threshold) return
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
    // ── 操作表单 helpers ────────────────────────────────────────
    opFieldOpts(f) {
      var choice = this.opFormChoiceMap[f.field]
      if (!choice || !choice.values) return []
      return choice.values.map(function(v) { return { label: v.label, value: v.value } })
    },
    opDateType(field) {
      var info = this.opFormDateMap[field]
      var map = { DATE: 'date', TIME: 'time', DATE_TIME: 'datetime', MONTH: 'month', YEAR: 'year' }
      return (info && map[info.type]) || 'date'
    },
    opTagOpts(field) {
      var tag = this.opFormTagMap[field]
      if (!tag || !tag.tags) return []
      return tag.tags.map(function(t) { return { label: t, value: t } })
    },
    openOpReferenceModal(f) {
      var refInfo = this.opFormRefMap[f.field]
      if (!refInfo || !refInfo.referenceName) return
      this.refPickerStack.push({ level: 1, novaName: refInfo.referenceName, field: f, row: null, isForFilter: false, target: 'opForm', visible: false })
      var self = this
      this.$nextTick(function() {
        var picker = self.refPickerStack[self.refPickerStack.length - 1]
        if (picker) picker.visible = true
      })
    },
    openOpAppReferenceModal(novaName, f) {
      var refMap = (this.opFormAppTabBuild[novaName] || {}).referenceMap || {}
      var refInfo = refMap[f.field]
      if (!refInfo || !refInfo.referenceName) return
      this.refPickerStack.push({ level: 1, novaName: refInfo.referenceName, field: f, row: null, isForFilter: false, target: 'opFormApp', appNovaName: novaName, visible: false })
      var self = this
      this.$nextTick(function() {
        var picker = self.refPickerStack[self.refPickerStack.length - 1]
        if (picker) picker.visible = true
      })
    },
    handleOpAppAttachmentChange(appNovaName, f, event) {
      var files = Array.from(event.target.files || [])
      event.target.value = ''
      if (!files.length) return
      var build = this.opFormAppTabBuild[appNovaName] || {}
      var cfg = (build.attachmentMap || {})[f.field] || {}
      var currentList = (this.opFormAppFormData[appNovaName] || {})[f.field] || []
      var maxLimit = cfg.maxLimit || 1
      var allowed = maxLimit - currentList.length
      if (allowed <= 0) return
      if (files.length > allowed) {
        if (window.$message) window.$message.error('最多还能上传 ' + allowed + ' 个文件')
        return
      }
      var toUpload = files.slice(0, allowed)
      for (var i = 0; i < toUpload.length; i++) {
        var file = toUpload[i]
        if (cfg.fileTypes && cfg.fileTypes.length) {
          var ext = '.' + file.name.split('.').pop().toLowerCase()
          if (!cfg.fileTypes.some(function(t) { return t.toLowerCase() === ext })) {
            if (window.$message) window.$message.error('不支持的文件类型：' + ext)
            return
          }
        }
        var kb = file.size / 1024
        if (cfg.minSize > 0 && kb < cfg.minSize) { if (window.$message) window.$message.error('文件不能小于 ' + cfg.minSize + ' KB'); return }
        if (cfg.maxSize > 0 && kb > cfg.maxSize) { if (window.$message) window.$message.error('文件不能超过 ' + cfg.maxSize + ' KB'); return }
      }
      var formData = new FormData()
      formData.append('novaName', this.opFormNovaName)
      toUpload.forEach(function(file) { formData.append('files', file) })
      var self = this
      var field = f.field
      $.ajax({
        url: '/nova/attachment/upload', method: 'POST', data: formData, processData: false, contentType: false,
        success: function(resp) {
          if (resp.code !== 200) { if (window.$message) window.$message.error(resp.msg || '上传失败'); return }
          if (!self.opFormAppFormData[appNovaName]) self.opFormAppFormData[appNovaName] = {}
          if (!self.opFormAppFormData[appNovaName][field]) self.opFormAppFormData[appNovaName][field] = []
          ;(resp.data || []).forEach(function(url) { self.opFormAppFormData[appNovaName][field].push(url) })
          if (window.$message) window.$message.success('上传成功')
        },
        error: function() { if (window.$message) window.$message.error('上传请求失败') }
      })
    },
    // ── appendageForm helpers ───────────────────────────────────
    appBuild(n)        { return this.appendageTabBuild[n] || {} },
    appFd(n)           { return this.appendageFormData[n]  || {} },
    appErrs(n)         { return this.appendageFormErrors[n] || {} },
    appSetFd(n, f, v)  {
      if (this.appendageFormData[n])   this.appendageFormData[n][f] = v
      if (this.appendageFormErrors[n]) delete this.appendageFormErrors[n][f]
    },
    appChoice(n, f)    { return ((this.appendageTabBuild[n] || {}).choiceMap || {})[f] || null },
    appFieldOpts(n, f) {
      const c = this.appChoice(n, f.field)
      if (!c || !c.values) return []
      return c.values.map(v => ({ label: v.label, value: v.value }))
    },
    appTagOpts(n, field) {
      const t = ((this.appendageTabBuild[n] || {}).tagMap || {})[field]
      if (!t || !t.tags) return []
      return t.tags.map(v => ({ label: v, value: v }))
    },
    appDateType(n, field) {
      const d = ((this.appendageTabBuild[n] || {}).dateMap || {})[field]
      return (d && d.type === 'DATE_TIME') ? 'datetime' : 'date'
    },
    appNumInfo(n, field) { return ((this.appendageTabBuild[n] || {}).numberMap || {})[field] || {} },
    appFieldVisible(n, f) {
      if (!f.showByExpr) return true
      var fd = this.appFd(n), refMap = (this.appBuild(n).referenceMap || {})
      var evalFd = Object.assign({}, fd)
      for (var k in refMap) { var rf = refMap[k] && refMap[k].referenceField; if (rf) evalFd[k] = fd[rf] !== undefined ? fd[rf] : null }
      return evalShowExpr(f.showByExpr, evalFd)
    },
    evalShowExprSafe(expr, fd) {
      if (!expr) return true
      return evalShowExpr(expr, fd)
    },
    isFieldValueEmpty(f, val) {
      if (val === null || val === undefined) return true
      if (Array.isArray(val)) return val.length === 0
      return String(val).trim() === ''
    },
    tabTotalRequired(tabName) {
      var self = this
      if (tabName === 'form') {
        return self.visibleEditFields.filter(function(item) {
          return item.visible && item.field.notNull && !self.isReadonly(item.field)
        }).length
      }
      if (tabName.startsWith('app_')) {
        var n = tabName.slice(4), build = self.appBuild(n), refMap = build.referenceMap || {}
        var fd = self.appFd(n), evalFd = Object.assign({}, fd)
        for (var k in refMap) { var rf = refMap[k] && refMap[k].referenceField; if (rf) evalFd[k] = fd[rf] !== undefined ? fd[rf] : null }
        return (build.editFields || []).filter(function(f) {
          if (!f.notNull || self.isReadonly(f)) return false
          if (f.type === 'REFERENCE' && refMap[f.field] && refMap[f.field].referenceName === self.novaName) return false
          if (f.showByExpr && !evalShowExpr(f.showByExpr, evalFd)) return false
          return true
        }).length
      }
      return 0
    },
    tabRequiredCount(tabName) {
      var self = this
      if (tabName === 'form') {
        return self.visibleEditFields.filter(function(item) {
          return item.visible && item.field.notNull && !self.isReadonly(item.field) && self.isFieldValueEmpty(item.field, self.formData[item.field.field])
        }).length
      }
      if (tabName.startsWith('app_')) {
        var n = tabName.slice(4), build = self.appBuild(n), refMap = build.referenceMap || {}
        var fd = self.appFd(n), evalFd = Object.assign({}, fd)
        for (var k in refMap) { var rf = refMap[k] && refMap[k].referenceField; if (rf) evalFd[k] = fd[rf] !== undefined ? fd[rf] : null }
        return (build.editFields || []).filter(function(f) {
          if (!f.notNull || self.isReadonly(f)) return false
          if (f.type === 'REFERENCE' && refMap[f.field] && refMap[f.field].referenceName === self.novaName) return false
          if (f.showByExpr && !evalShowExpr(f.showByExpr, evalFd)) return false
          return self.isFieldValueEmpty(f, fd[f.field])
        }).length
      }
      return 0
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
    handleCheck(keys)   { this.checkedRowKeys = keys; if (this.pickerMulti) this.$emit('check', keys) },
    toggleCheckedRow(row) {
      const key = row[this.novaIdFieldName]
      const idx = this.checkedRowKeys.indexOf(key)
      if (idx >= 0) this.checkedRowKeys.splice(idx, 1)
      else this.checkedRowKeys.push(key)
      this.$emit('check', this.checkedRowKeys.slice())
    },
    handleReset() {
      if (this.pickerMode || this.embeddedMode) {
        const form = {}
        const choiceMap = this.choiceMap || {}
        this.searchFields.forEach(f => {
          const choiceInfo = choiceMap[f.field]
          const isMultiChoice = f.type === 'CHOICE' && (choiceInfo && choiceInfo.selectType === 'MULTI' || f.vague)
          const isSingleChoice = f.type === 'CHOICE' && choiceInfo && choiceInfo.selectType === 'SINGLE' && !f.vague
          form[f.field] = (isMultiChoice || f.type === 'TAG') ? [] : (f.type === 'NUMBER' && f.vague ? [null, null] : (isSingleChoice || f.type === 'DATE' || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : ''))
          if (f.type === 'REFERENCE' || f.type === 'APPENDAGE') form[f.field + '_display'] = ''
        })
        this.filterForm = form
        this.paginationConfig.page = 1
        window.NovaTableJQ.loadData(this._vmKey)
      } else {
        window.NovaTableJQ.handleReset()
      }
    },
    onTapSelect(val) {
      this.tapSearchValue = (val === '__all__' ? null : val)
      const self = this
      setTimeout(function() { self.handleQuery() }, 100)
    },
    handleQuery() {
      const t = this
      const snapshot = JSON.stringify(t.filterForm)
      if (snapshot !== t._lastFilterSnapshot) {
        t.paginationConfig.page = 1
        t._lastFilterSnapshot = snapshot
      }
      const key = (t.pickerMode || t.embeddedMode || t.dualMode) ? t._vmKey : t.novaName
      window.NovaTableJQ.loadData(key)
    },
    handleAdd()         { if (this.embeddedMode || this.dualMode) window.NovaTableJQ.handleAdd(this._vmKey); else window.NovaTableJQ.handleAdd() },
    handleEdit(row)     { if (this.embeddedMode || this.dualMode) window.NovaTableJQ.handleEdit(row, this._vmKey); else window.NovaTableJQ.handleEdit(row) },
    handleDelete(row)   { if (this.embeddedMode || this.dualMode) window.NovaTableJQ.handleDelete(row, this._vmKey); else window.NovaTableJQ.handleDelete(row) },
    handleBatchDelete() { if (this.embeddedMode || this.dualMode) window.NovaTableJQ.handleBatchDelete(this._vmKey); else window.NovaTableJQ.handleBatchDelete() },
    handleCustomBtnClick(btn) {
      if (btn.type === 'NOVA' && btn.novaClassName) {
        this.openOpForm(btn, null)
        return
      }
      var action = function() { console.log('[CustomBtn] toolbar:', btn.title) }
      if (btn.callHint) { window.msg.confirm('warning', '确认操作', btn.callHint, action) }
      else { action() }
    },
    openOpForm(btn, row) {
      if (!btn.novaClassName) return
      var self = this
      self.opFormLoading = true
      $.ajax({
        url: '/nova/table/build',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ novaName: btn.novaClassName }),
        success: function(resp) {
          self.opFormLoading = false
          if (resp.code !== 200) { if (window.$message) window.$message.error(resp.msg || '加载失败'); return }
          var d = resp.data
          self.opFormBtn = btn
          self.opFormRow = row || null
          self.opFormNovaName = btn.novaClassName
          self.opFormChoiceMap = d.choice || {}
          self.opFormRefMap    = d.reference || {}
          self.opFormAppendageMap = d.appendage || {}
          self.opFormDateMap     = d.date || {}
          self.opFormNumberMap   = d.number || {}
          self.opFormBooleanMap  = d.booleanInfo || {}
          self.opFormTagMap      = d.tag || {}
          self.opFormAttachmentMap = d.attachment || {}
          self.opFormLayoutObj   = d.layout || {}
          var allEdit = d.edit || []
          // 基本信息 tab 字段
          self.opFormFields = allEdit.filter(function(e) { return e.tapType === 'thisForm' }).reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
          self.opFormFields = self.opFormFields.filter(function(f) {
            return f.type !== 'APPENDAGE' && f.type !== 'APPENDAGES' && f.type !== 'LINK' && f.type !== 'PASSWORD'
          })
          // APPENDAGE 表单 tab（排除表格和链接 tab）
          self.opFormExtraTabs = allEdit.filter(function(e) {
            return e.tapType === 'appendageForm'
          })
          self.opFormAppTabBuild = {}
          self.opFormAppFormData = {}
          self.opFormAppFormErrors = {}
          // 预加载所有 APPENDAGE tab 的 build 数据（和普通新增/编辑一致）
          self.opFormExtraTabs.forEach(function(tab) {
            self.loadOpAppendageBuild(tab.tapNovaName)
          })
          var fd = {}
          self.opFormFields.forEach(function(f) {
            var ci = self.opFormChoiceMap[f.field]
            var isMulti = f.type === 'CHOICE' && ci && ci.selectType === 'MULTI'
            var isSingle = f.type === 'CHOICE' && ci && ci.selectType === 'SINGLE'
            fd[f.field] = (isMulti || f.type === 'TAG' || f.type === 'ATTACHMENT') ? [] : (isSingle || f.type === 'DATE' || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : '')
            if (f.type === 'REFERENCE') fd[f.field + '_display'] = ''
          })
          self.opFormData = fd
          self.opFormErrors = {}
          self.opFormShow = true
        },
        error: function() {
          self.opFormLoading = false
          if (window.$message) window.$message.error('请求失败')
        }
      })
    },
    closeOpForm() {
      this.opFormShow = false
      this.opFormBtn = null
      this.opFormRow = null
      this.opFormFields = []
      this.opFormData = {}
      this.opFormChoiceMap = {}
      this.opFormRefMap = {}
      this.opFormExtraTabs = []
      this.opFormAppTabBuild = {}
      this.opFormAppFormData = {}
      this.opFormAppFormErrors = {}
      this.opFormTab = 'form'
    },
    // ── opForm tab 辅助 ───────────────────────────────────────
    opFormAppBuild(n)       { return this.opFormAppTabBuild[n] || {} },
    opFormAppData(n)        { return this.opFormAppFormData[n] || {} },
    opFormAppErrors(n)      { return this.opFormAppFormErrors[n] || {} },
    opFormAppSetFd(n, f, v) {
      if (this.opFormAppFormData[n]) this.opFormAppFormData[n][f] = v
      if (this.opFormAppFormErrors[n]) delete this.opFormAppFormErrors[n][f]
    },
    opFormAppChoice(n, f)   { return ((this.opFormAppTabBuild[n] || {}).choiceMap || {})[f] || null },
    opFormAppFieldOpts(n, f) {
      var c = this.opFormAppChoice(n, f)
      if (!c || !c.values) return []
      return c.values.map(function(v) { return { label: v.label, value: v.value } })
    },
    opFormAppNumInfo(n, f)  { return ((this.opFormAppTabBuild[n] || {}).numberMap || {})[f] || {} },
    opFormAppDateType(n, f) {
      var info = ((this.opFormAppTabBuild[n] || {}).dateMap || {})[f]
      var map = { DATE: 'date', TIME: 'time', DATE_TIME: 'datetime', MONTH: 'month', YEAR: 'year' }
      return (info && map[info.type]) || 'date'
    },
    opFormAppTagOpts(n, f) {
      var tag = ((this.opFormAppTabBuild[n] || {}).tagMap || {})[f]
      if (!tag || !tag.tags) return []
      return tag.tags.map(function(t) { return { label: t, value: t } })
    },
    opFormTabRequiredCount(tabName) {
      var self = this
      if (tabName === 'form') {
        return (self.visibleOpFormFields || []).filter(function(item) {
          return item.visible && item.field.notNull
        }).length
      }
      if (tabName.startsWith('app_')) {
        var n = tabName.slice(4)
        var build = self.opFormAppTabBuild[n] || {}
        var fields = build.editFields || []
        var fd = self.opFormAppFormData[n] || {}
        var refMap = build.referenceMap || {}
        var evalFd = Object.assign({}, fd)
        for (var k in refMap) {
          var rf = refMap[k] && refMap[k].referenceField
          if (rf) evalFd[k] = fd[rf] !== undefined ? fd[rf] : null
        }
        return fields.filter(function(f) {
          if (!f.notNull) return false
          if (f.showByExpr && !evalShowExpr(f.showByExpr, evalFd)) return false
          return true
        }).length
      }
      return 0
    },
    onOpFormTabChange(tab) {
      this.opFormTab = tab
      if (tab.startsWith('app_')) {
        var appNovaName = tab.slice(4)
        if (this.opFormAppTabBuild[appNovaName]) return
        this.loadOpAppendageBuild(appNovaName)
      }
    },
    loadOpAppendageBuild(appNovaName) {
      var self = this
      $.ajax({
        url: '/nova/table/build',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ novaName: appNovaName }),
        success: function(resp) {
          if (resp.code !== 200) return
          var d = resp.data
          var tab = (self.opFormExtraTabs || []).find(function(t) { return t.tapNovaName === appNovaName })
          if (!tab) return
          var relField = tab.tapRelationField || ''
          var sourceKeys = self.opFormData && self.opFormData[relField] ? [self.opFormData[relField]] : []
          // 使用 jq 层的 sourceField 处理逻辑
          var cm = d.choice || {}
          var editFields = (d.edit || []).filter(function(e) { return e.tapType === 'thisForm' }).reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
          self.opFormAppTabBuild[appNovaName] = {
            editFields: editFields,
            choiceMap: cm,
            numberMap: d.number || {},
            dateMap: d.date || {},
            booleanMap: d.booleanInfo || {},
            referenceMap: d.reference || {},
            tagMap: d.tag || {},
            attachmentMap: d.attachment || {},
            layout: d.layout || {}
          }
          // 初始化表单数据
          var fd = {}
          editFields.forEach(function(f) {
            var ci = cm[f.field]
            var isMulti = f.type === 'CHOICE' && ci && ci.selectType === 'MULTI'
            fd[f.field] = (isMulti || f.type === 'TAG' || f.type === 'ATTACHMENT') ? [] : (f.type === 'CHOICE' && ci && ci.selectType === 'SINGLE' ? null : f.type === 'DATE' || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : '')
            if (f.type === 'REFERENCE') fd[f.field + '_display'] = ''
          })
          self.opFormAppFormData[appNovaName] = fd
          self.opFormAppFormErrors[appNovaName] = {}
        }
      })
    },
    submitOpForm() {
      var formData = this.opFormData
      var fields   = this.opFormFields || []
      var visibleSet = new Set((this.visibleOpFormFields || []).filter(function(v) { return v.visible }).map(function(v) { return v.field.field }))
      var errors = {}
      fields.forEach(function(f) {
        if (f.type === 'DIVIDE' || f.type === 'EMPTY' || !f.notNull) return
        if (!visibleSet.has(f.field)) return
        var val = formData[f.field]
        var empty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
        if (empty) errors[f.field] = f.title + '不能为空'
      })
      this.opFormErrors = errors
      if (Object.keys(errors).length > 0) { this.opFormTab = 'form'; return }

      // 校验附属表单
      var appErrors = {}
      var firstErrAppTab = null
      var self = this
      ;(this.opFormExtraTabs || []).forEach(function(appTab) {
        var n = appTab.tapNovaName
        var build = self.opFormAppTabBuild[n] || {}
        var fd = self.opFormAppFormData[n] || {}
        var refMap = build.referenceMap || {}
        var evalFd = Object.assign({}, fd)
        for (var k in refMap) { var rf = refMap[k] && refMap[k].referenceField; if (rf) evalFd[k] = fd[rf] !== undefined ? fd[rf] : null }
        var errs = {}
        ;(build.editFields || []).forEach(function(f) {
          if (!f.notNull) return
          if (f.type === 'REFERENCE' && refMap[f.field] && refMap[f.field].referenceName === self.opFormNovaName) return
          if (f.showByExpr && !evalShowExpr(f.showByExpr, evalFd)) return
          var val = fd[f.field]
          var empty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
          if (empty) errs[f.field] = f.title + '不能为空'
        })
        appErrors[n] = errs
        if (!firstErrAppTab && Object.keys(errs).length > 0) firstErrAppTab = n
      })
      var newAppErrors = Object.assign({}, this.opFormAppFormErrors, appErrors)
      this.opFormAppFormErrors = newAppErrors
      if (firstErrAppTab) { this.opFormTab = 'app_' + firstErrAppTab; return }

      // TODO: 等 operation 端点就绪后对接
      console.log('[OpForm] submit:', this.opFormBtn && this.opFormBtn.novaClassName, this.opFormData, this.opFormAppFormData)
      this.closeOpForm()
    },
    handleOpAttachmentChange(f, event) {
      var files = Array.from(event.target.files || [])
      event.target.value = ''
      if (!files.length) return
      var cfg = this.opFormAttachmentMap[f.field] || {}
      var currentList = this.opFormData[f.field] || []
      var maxLimit = cfg.maxLimit || 1
      var allowed = maxLimit - currentList.length
      if (allowed <= 0) return
      if (files.length > allowed) {
        if (window.$message) window.$message.error('最多还能上传 ' + allowed + ' 个文件')
        return
      }
      var toUpload = files.slice(0, allowed)
      for (var i = 0; i < toUpload.length; i++) {
        var file = toUpload[i]
        if (cfg.fileTypes && cfg.fileTypes.length) {
          var ext = '.' + file.name.split('.').pop().toLowerCase()
          if (!cfg.fileTypes.some(function(t) { return t.toLowerCase() === ext })) {
            if (window.$message) window.$message.error('不支持的文件类型：' + ext)
            return
          }
        }
        var kb = file.size / 1024
        if (cfg.minSize > 0 && kb < cfg.minSize) { if (window.$message) window.$message.error('文件不能小于 ' + cfg.minSize + ' KB'); return }
        if (cfg.maxSize > 0 && kb > cfg.maxSize) { if (window.$message) window.$message.error('文件不能超过 ' + cfg.maxSize + ' KB'); return }
      }
      var formData = new FormData()
      formData.append('novaName', this.opFormNovaName)
      toUpload.forEach(function(file) { formData.append('files', file) })
      var self = this
      var field = f.field
      $.ajax({
        url: '/nova/attachment/upload', method: 'POST', data: formData, processData: false, contentType: false,
        success: function(resp) {
          if (resp.code !== 200) { if (window.$message) window.$message.error(resp.msg || '上传失败'); return }
          if (!self.opFormData[field]) self.opFormData[field] = []
          ;(resp.data || []).forEach(function(url) { self.opFormData[field].push(url) })
          if (window.$message) window.$message.success('上传成功')
        },
        error: function() { if (window.$message) window.$message.error('上传请求失败') }
      })
    },
    handleFormSubmit()  { if (this.embeddedMode || this.dualMode) window.NovaTableJQ.handleFormSubmit(this._vmKey); else window.NovaTableJQ.handleFormSubmit() },
    handleAttachmentChange(f, event, appNovaName) {
      const files = Array.from(event.target.files || [])
      event.target.value = ''
      if (!files.length) return
      const cfg = appNovaName ? ((this.appBuild(appNovaName).attachmentMap || {})[f.field] || {}) : (this.attachmentMap[f.field] || {})
      const currentList = appNovaName ? (this.appFd(appNovaName)[f.field] || []) : (this.formData[f.field] || [])
      const maxLimit = cfg.maxLimit || 1
      const allowed = maxLimit - currentList.length
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
        if (cfg.minSize > 0 && kb < cfg.minSize) { if (window.$message) window.$message.error('文件不能小于 ' + cfg.minSize + ' KB'); return }
        if (cfg.maxSize > 0 && kb > cfg.maxSize) { if (window.$message) window.$message.error('文件不能超过 ' + cfg.maxSize + ' KB'); return }
      }
      const formData = new FormData()
      formData.append('novaName', this.novaName)
      toUpload.forEach(file => formData.append('files', file))
      const field = f.field
      const vm = this
      $.ajax({
        url: '/nova/attachment/upload', method: 'POST', data: formData, processData: false, contentType: false,
        success(resp) {
          if (resp.code !== 200) { if (window.$message) window.$message.error(resp.msg || '上传失败'); return }
          if (appNovaName) {
            if (!vm.appendageFormData[appNovaName]) return
            if (!vm.appendageFormData[appNovaName][field]) vm.appendageFormData[appNovaName][field] = []
            ;(resp.data || []).forEach(url => vm.appendageFormData[appNovaName][field].push(url))
          } else {
            if (!vm.formData[field]) vm.formData[field] = []
            ;(resp.data || []).forEach(url => vm.formData[field].push(url))
          }
          if (window.$message) window.$message.success('上传成功')
          vm.openPreview(f, appNovaName || null)
        },
        error() { if (window.$message) window.$message.error('上传请求失败') }
      })
    },
    openPreview(f, appNovaName) {
      this.previewField = f
      this.previewAppNovaName = appNovaName || null
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
      this.previewAppNovaName = null
      this.previewIndex = 0
    },
    deleteFromPreview(idx) {
      if (!this.previewField) return
      const list = this.previewFileList
      list.splice(idx, 1)
      if (this.previewIndex >= list.length) this.previewIndex = Math.max(0, list.length - 1)
    },
    setAttachmentDropdown(fieldKey) {
      this.attachmentDropdownKey = fieldKey
    },
    clearAttachmentDropdown() {
      this.attachmentDropdownKey = null
    },
    openReferenceModal(f) {
      if (this.isReadonly(f)) return
      const refInfo = this.referenceMap[f.field]
      if (!refInfo || !refInfo.referenceName) return
      this.refPickerStack.push({ level: 1, novaName: refInfo.referenceName, field: f, row: null, isForFilter: false, visible: false })
      this.$nextTick(() => {
        const picker = this.refPickerStack[this.refPickerStack.length - 1]
        if (picker) picker.visible = true
      })
    },
    openAppReferenceModal(n, f) {
      if (this.isReadonly(f)) return
      var refInfo = (this.appBuild(n).referenceMap || {})[f.field]
      if (!refInfo || !refInfo.referenceName) return
      this.refPickerStack.push({ level: 1, novaName: refInfo.referenceName, field: f, row: null, isForFilter: false, appNovaName: n, visible: false })
      this.$nextTick(() => {
        const picker = this.refPickerStack[this.refPickerStack.length - 1]
        if (picker) picker.visible = true
      })
    },
    openReferenceModalForFilter(f) {
      const refInfo = this.referenceMap[f.field]
      if (!refInfo || !refInfo.referenceName) return
      this.refPickerStack.push({ level: 1, novaName: refInfo.referenceName, field: f, row: null, isForFilter: true, visible: false })
      this.$nextTick(() => {
        const picker = this.refPickerStack[this.refPickerStack.length - 1]
        if (picker) picker.visible = true
      })
    },
    openAppendageModalForFilter(f) {
      const appInfo = this.appendageMap && this.appendageMap[f.field]
      if (!appInfo || !appInfo.referenceName) return
      this.refPickerStack.push({ level: 1, novaName: appInfo.referenceName, field: f, row: null, isForFilter: true, visible: false })
      this.$nextTick(() => {
        const picker = this.refPickerStack[this.refPickerStack.length - 1]
        if (picker) picker.visible = true
      })
    },
    openLinkModalForFilter(f) {
      const linkInfo = this.linkMap && this.linkMap[f.field]
      const selectInfo = linkInfo && linkInfo.selectInfo
      if (!selectInfo || !selectInfo.referenceName) return
      this.refPickerStack.push({ level: 1, novaName: selectInfo.referenceName, field: f, row: null, isForFilter: true, visible: false })
      this.$nextTick(() => {
        const picker = this.refPickerStack[this.refPickerStack.length - 1]
        if (picker) picker.visible = true
      })
    },
    buildEmbSourceFields(tab) {
      const appendageMap = this.appendageMap || {}
      for (const k in appendageMap) {
        if (appendageMap[k].referenceName === tab.tapNovaName) {
          const appInfo = appendageMap[k]
          const storageField = appInfo.storageField || 'id'
          const pkVal = this.currentRow && this.currentRow[storageField]
          if (!pkVal) return {}
          // key 用父表 PK 字段名（storageField），后端结合 sourceNovaName 做关联过滤
          return { [storageField]: String(pkVal) }
        }
      }
      return {}
    },
    buildPickerSourceFields(picker) {
      const fields = {}
      if (!picker.isForFilter && this.currentRow) fields.ids = String(this.currentRow[this.novaIdFieldName] || '')
      const isLink = picker.field.type === 'LINK'
      const fieldInfo = isLink
        ? (this.linkMap && this.linkMap[picker.field.field])
        : this.referenceMap[picker.field.field]
      const transmit = fieldInfo && fieldInfo.referenceTransmitField
      if (!transmit || !transmit.length) return fields
      const src = picker.isForFilter ? this.filterForm : this.formData
      transmit.forEach(f => {
        const v = src[f]
        if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return
        fields[f] = String(v)
      })
      return fields
    },
    closePickerAtLevel(level) {
      const picker = this.refPickerStack.find(p => p.level === level)
      if (picker) {
        picker.visible = false
        setTimeout(() => {
          this.refPickerStack = this.refPickerStack.filter(p => p.level < level)
        }, 300)
      } else {
        this.refPickerStack = this.refPickerStack.filter(p => p.level < level)
      }
    },
    onPickerPick(level, row) {
      const picker = this.refPickerStack.find(p => p.level === level)
      if (picker) picker.selectedRow = row
    },
    confirmPickerSelect(level) {
      const picker = this.refPickerStack.find(p => p.level === level)
      if (!picker) return

      if (!picker.selectedRow) {
        if (window.$message) window.$message.warning('请先选择一行')
        return
      }

      const refInfo = picker.target === 'opFormApp'
        ? ((this.opFormAppTabBuild[picker.appNovaName] || {}).referenceMap || {})[picker.field.field]
        : picker.target === 'opForm'
          ? this.opFormRefMap[picker.field.field]
          : picker.appNovaName
            ? (this.appBuild(picker.appNovaName).referenceMap || {})[picker.field.field]
            : this.referenceMap[picker.field.field]
      const appInfo = (picker.target !== 'opForm' && !picker.appNovaName && picker.isForFilter && picker.field.type !== 'LINK') ? (this.appendageMap && this.appendageMap[picker.field.field]) : null
      const linkInfo = (picker.target !== 'opForm' && !picker.appNovaName && picker.isForFilter && picker.field.type === 'LINK') ? (this.linkMap && this.linkMap[picker.field.field]) : null
      const linkSelectInfo = linkInfo && linkInfo.selectInfo
      // APPENDAGE filter：key=storageField（主表字段），value=行里 referenceField 的值（附属对象存的主表外键）
      const storageField = linkSelectInfo ? (linkSelectInfo.storageField || 'id') : (appInfo ? (appInfo.referenceField || 'id') : ((refInfo && refInfo.storageField) || 'id'))
      const displayField = linkSelectInfo ? (linkSelectInfo.displayField || storageField) : (appInfo ? (appInfo.displayField || storageField) : ((refInfo && refInfo.displayField) || storageField))
      const row = picker.selectedRow

      if (picker.appNovaName && picker.target !== 'opFormApp') {
        const appFd = this.appendageFormData[picker.appNovaName]
        if (appFd) {
          const storedVal = row[storageField] !== undefined ? row[storageField] : ''
          appFd[picker.field.field] = storedVal
          appFd[picker.field.field + '_display'] = row[displayField] !== undefined ? row[displayField] : ''
          if (refInfo && refInfo.referenceField) appFd[refInfo.referenceField] = storedVal
        }
        this.closePickerAtLevel(level)
        return
      }

      const targetData = picker.target === 'opFormApp' ? (this.opFormAppFormData[picker.appNovaName] || {})
                       : picker.target === 'opForm' ? this.opFormData
                       : picker.isForFilter ? this.filterForm
                       : this.formData
      const storedVal = row[storageField] !== undefined ? row[storageField] : ''
      targetData[picker.field.field] = storedVal
      targetData[picker.field.field + '_display'] = row[displayField] !== undefined ? row[displayField] : ''
      if (refInfo && refInfo.referenceField) {
        targetData[refInfo.referenceField] = storedVal
      }

      if (picker.target !== 'opForm' && picker.target !== 'opFormApp' && !picker.isForFilter) {
        delete this.formErrors[picker.field.field]
      }

      this.closePickerAtLevel(level)
    },
    // ── LINK 组件方法 ──────────────────────────────────────────
    buildLinkSourceFields(tab) {
      const build = this.linkTabBuild[tab.tapNovaName]
      if (!build) return {}
      const lt = build.linkTarget || {}
      const refField = lt.thisReferenceField
      const storageField = lt.thisStorageField || refField
      if (!refField) return {}
      // 取值用 storageField（实际存储关联值的字段），key 用 refField（关联字段名）
      const refVal = this.currentRow && this.currentRow[storageField]
      if (refVal === null || refVal === undefined) return {}
      return { [refField]: String(refVal) }
    },
    openLinkPicker(linkNovaName, tapTitle) {
      const build = this.linkTabBuild[linkNovaName]
      if (!build) return
      const lt = build.linkTarget || {}
      const targetNova = lt.linkReferenceName
      if (!targetNova) {
        if (window.$message) window.$message.warning('未找到目标表')
        return
      }
      this.linkPickerTitle = '选择 ' + (tapTitle || '关联数据')
      // 从 linkMap 中查找对应字段的 referenceTransmitField 并构建透传参数
      const srcFields = {}
      const linkMap = this.linkMap || {}
      for (const field in linkMap) {
        if (linkMap[field] && linkMap[field].referenceName === linkNovaName) {
          const transmit = linkMap[field].referenceTransmitField
          if (transmit && transmit.length) {
            transmit.forEach(f => {
              const v = this.formData[f]
              if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
                srcFields[f] = String(v)
            })
          }
          break
        }
      }
      this.linkPickerTargetNova = targetNova
      this.linkPickerCurrentTab = linkNovaName
      this.linkPickerSelectedKeys = []
      this.linkPickerSourceFields = srcFields
      this.linkPickerShow = true
    },
    closeLinkPicker() {
      this.linkPickerShow = false
      this.linkPickerTargetNova = ''
      this.linkPickerCurrentTab = ''
      this.linkPickerSelectedKeys = []
    },
    onLinkPickerPick(selectedKeys) {
      this.linkPickerSelectedKeys = selectedKeys || []
    },
    _findEmbVmKey(linkNovaName) {
      var keys = Object.keys(window.vmMap || {})
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('__emb_' + linkNovaName) === 0) return keys[i]
      }
      return null
    },
    confirmLinkPickerSelect() {
      if (!this.linkPickerSelectedKeys.length) {
        if (window.$message) window.$message.warning('请至少选择一行')
        return
      }
      var linkNovaName = this.linkPickerCurrentTab
      var build = this.linkTabBuild[linkNovaName]
      if (!build) return
      var sourceField = build.sourceFieldName
      var targetField = build.targetFieldName
      var sourceRow = this.dualTableViewActive ? this._dualSelectedRow : this.currentRow
      var sourceValue = sourceRow && sourceRow[this.novaIdFieldName]
      if (!sourceField) { console.error('[Nova] 缺少 sourceField', build); if (window.$message) window.$message.error('关联参数不完整: 缺少源字段名'); return }
      if (!targetField) { console.error('[Nova] 缺少 targetField', build); if (window.$message) window.$message.error('关联参数不完整: 缺少目标字段名'); return }
      if (sourceValue == null) { console.error('[Nova] 缺少 sourceValue', this.currentRow, this.novaIdFieldName); if (window.$message) window.$message.error('关联参数不完整: 缺少源记录ID'); return }

      // 获取目标表格 vmKey，传给 handleLinkAdd 用于刷新
      var targetVmKey = null
      if (this.dualTableViewActive) {
        var dualVm = this.$refs.dualTableRef
        if (dualVm && dualVm._vmKey) targetVmKey = dualVm._vmKey
      } else {
        targetVmKey = this._findEmbVmKey(linkNovaName)
      }

      window.NovaTableJQ.handleLinkAdd(
        this.novaName, linkNovaName,
        sourceField, sourceValue,
        targetField, this.linkPickerSelectedKeys,
        this._vmKey || this.novaName,
        targetVmKey
      )
      this.closeLinkPicker()
    },
    toggleDualTableView() {
      if (this.dualTableViewActive) {
        this.dualTableClosing = true
        setTimeout(() => {
          this.dualTableViewActive = false
          this.dualTableClosing = false
          this._syncDualTableClass()
        }, 300)
      } else {
        this.openDualTableView(this.dualTableSubTables[0].novaName)
      }
    },
    handleDualLinkAdd() {
      var dualVm = this.$refs.dualTableRef
      if (!dualVm) return
      var lt = dualVm.linkTargetInfo || {}
      var targetNova = lt.linkReferenceName
      if (!targetNova) {
        if (window.$message) window.$message.warning('未找到目标表')
        return
      }
      this.linkPickerTargetNova = targetNova
      this.linkPickerCurrentTab = this.dualTableCurrentNova
      this.linkPickerSelectedKeys = []
      this.linkPickerSourceFields = {}
      this.linkPickerTitle = '选择 ' + (this.dualTableCurrentLabel || '关联数据')
      this.linkPickerShow = true
    },
    openDualTableView(novaName) {
      const item = this.dualTableSubTables.find(s => s.novaName === novaName)
      if (!item) return
      if (!this._dualSelectedRow && this.filteredData && this.filteredData.length > 0) {
        this._dualSelectedRow = this.filteredData[0]
      }
      this.dualTableViewActive = true
      this._dualTableVersion++
      this.dualTableCurrentNova = item.novaName
      this.dualTableCurrentLabel = item.label
      this.dualTableCurrentKey = '__dual_' + item.novaName + '_v' + this._dualTableVersion
      this.buildDualTableSourceFields()
      this._syncDualTableClass()
    },
    buildDualTableSourceFields() {
      const row = this._dualSelectedRow
      if (!row) { this.dualTableSourceFields = {}; return }
      // 查找当前子表在 dualTableSubTables 中的类型
      const sub = this.dualTableSubTables.find(s => s.novaName === this.dualTableCurrentNova)
      if (!sub) { this.dualTableSourceFields = {}; return }

      if (sub.type === 'link') {
        // LINK 类型：key 用 operateInfo.referenceField（join表FK），value 用 row[storageField]
        const linkInfo = sub.fieldInfo || {}
        const op = linkInfo.operateInfo || {}
        const refField = op.referenceField
        const storageField = op.storageField || 'id'
        if (!refField) { this.dualTableSourceFields = {}; return }
        const val = row[storageField]
        if (val == null) { this.dualTableSourceFields = {}; return }
        this.dualTableSourceFields = { [refField]: String(val) }
      } else {
        // APPENDAGES 类型：取 fieldInfo.storageField，值为当前行对应字段值
        const appInfo = sub.fieldInfo || {}
        const storageField = appInfo.storageField || 'id'
        const val = row[storageField]
        if (val == null) { this.dualTableSourceFields = {}; return }
        this.dualTableSourceFields = { [storageField]: String(val) }
      }
    },
    _applyDualSourceFields(target) {
      var embSourceFields = this.dualTableSourceFields || {}
      target._sourceFields = embSourceFields
      var sourceKeys = Object.keys(embSourceFields)
      var sourceRefFields = []
      if (sourceKeys.length > 0) {
        var refMap = target.referenceMap || {}
        for (var field in refMap) {
          var refInfo = refMap[field]
          if (refInfo.storageField && sourceKeys.indexOf(refInfo.storageField) !== -1) {
            sourceRefFields.push({ field: field, type: 'REFERENCE', referenceField: refInfo.referenceField || 'id', value: embSourceFields[refInfo.storageField] })
          }
        }
      }
      var linkInfo = target.linkTargetInfo
      if (linkInfo && sourceKeys.length > 0) {
        var ltFields = [linkInfo.thisReferenceField, linkInfo.linkReferenceField]
        ltFields.forEach(function(refField) {
          if (refField && embSourceFields[refField] != null && !sourceRefFields.some(function(s) { return s.field === refField })) {
            sourceRefFields.push({ field: refField, type: 'LINK_TARGET', referenceField: refField, value: embSourceFields[refField] })
          }
        })
      }
      target._sourceRefFields = sourceRefFields
    },
    reloadDual(novaName, sourceFields) {
      if (this._vmKey && window.vmMap) delete window.vmMap[this._vmKey]
      this.novaName = novaName
      this._vmKey = '__dual_' + novaName + '_' + Date.now()
      window.vmMap[this._vmKey] = this
      if (window.NovaTableJQ) {
        window.NovaTableJQ.onEmbeddedMounted(novaName, this._vmKey, this.sourceNovaNameProp || novaName, sourceFields || {}, true)
      }
      var self = this
      this.$nextTick(function () {
        if (self._vmKey && window.NovaTableJQ) {
          window.NovaTableJQ.loadData(self._vmKey)
        }
      })
    },
    onDualTableRowClick(row) {
      if (!this.dualTableViewActive) return
      this._dualSelectedRow = row
      var dualVm = this.$refs.dualTableRef
      if (dualVm) dualVm._dualReloading = true
      this.buildDualTableSourceFields()
      var self = this
      this.$nextTick(function () {
        var dualVm = self.$refs.dualTableRef
        if (dualVm && dualVm._vmKey) {
          dualVm._dualReloading = false
          var target = window.vmMap && window.vmMap[dualVm._vmKey]
          if (target) {
            self._applyDualSourceFields(target)
            window.NovaTableJQ.loadData(dualVm._vmKey)
          }
        }
      })
    },
    onDualTableSubChange(novaName) {
      const item = this.dualTableSubTables.find(s => s.novaName === novaName)
      if (!item) return
      var dualVm = this.$refs.dualTableRef
      if (dualVm) dualVm._dualReloading = true
      this.dualTableCurrentNova = item.novaName
      this.dualTableCurrentLabel = item.label
      this.buildDualTableSourceFields()
      var self = this
      this.$nextTick(function () {
        var vm = self.$refs.dualTableRef
        if (vm) {
          vm._dualReloading = false
          vm.reloadDual(item.novaName, self.dualTableSourceFields)
        }
        self.$nextTick(function () {
          var panelEl = document.querySelector('.dual-right-panel')
          if (panelEl) {
            var contentEl = panelEl.querySelector('.page-card, .embedded-table')
            if (contentEl) {
              contentEl.classList.remove('dual-content-fade')
              void contentEl.offsetWidth
              contentEl.classList.add('dual-content-fade')
            }
          }
        })
      })
    },
    _syncDualTableClass() {
      const el = document.querySelector('.page-content')
      if (el) {
        if (this.dualTableViewActive || this.dualTableClosing) {
          el.classList.add('dual-mode')
        } else {
          el.classList.remove('dual-mode')
        }
      }
    },
    _doRefSelectRequest(field, refField, query, page, append, onDone) {
      const refInfo = this.referenceMap[refField] || (this.appendageMap && this.appendageMap[refField]) || (this.linkMap && this.linkMap[refField]) || {}
      const isLink = this.linkMap && this.linkMap[refField]
      const selectInfo = isLink && isLink.selectInfo
      const refNovaName = selectInfo ? selectInfo.referenceName : (refInfo.referenceName || refField)
      const isForFilter = String(field).startsWith('_f_')
      const src = isForFilter ? this.filterForm : this.formData
      const transmit = refInfo.referenceTransmitField
      const sourceFields = {}
      if (!isForFilter && this.currentRow) sourceFields.ids = String(this.currentRow[this.novaIdFieldName] || '')
      if (transmit && transmit.length) {
        transmit.forEach(f => {
          const v = src[f]
          if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
            sourceFields[f] = String(v)
        })
      }
      this.refSelectLoading[field] = true
      $.ajax({
        url: '/nova/table/promptSearch',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          novaName: refNovaName,
          sourceNovaName: this.novaName,
          sourceFields,
          prompt: query,
          pageBean: { current: page, size: 10 }
        }),
        success: (resp) => {
          const pb = resp.data || {}
          const items = (pb.records || []).map(item => ({
            label: String(item.displayField ?? ''),
            value: item.storageField
          }))
          this.refSelectOptions[field] = append
            ? (this.refSelectOptions[field] || []).concat(items)
            : items
          this.refSelectTotal[field] = pb.total || 0
          this.refSelectPage[field]  = page
          this.refSelectLoading[field] = false
          if (onDone) this.$nextTick(onDone)
        },
        error: () => { this.refSelectLoading[field] = false }
      })
    },
    onRefSelectSearch(f, query) {
      const field = f.field
      const refField = f._refField || field
      clearTimeout(this._refSelectTimers[field])
      if (!query) {
        this.refSelectOptions[field] = []
        this.refSelectTotal[field]   = 0
        this.refSelectPage[field]    = 1
        this.refSelectQuery[field]   = ''
        return
      }
      this.refSelectQuery[field]   = query
      this.refSelectLoading[field] = true
      this._refSelectTimers[field] = setTimeout(() => {
        this._doRefSelectRequest(field, refField, query, 1, false)
      }, 300)
    },
    loadMoreRefSelect(field, refField) {
      const query = this.refSelectQuery[field]
      if (!query || this.refSelectLoading[field]) return
      const nextPage = (this.refSelectPage[field] || 1) + 1
      const menu = document.querySelector('.n-base-select-menu')
      const scrollEl = menu && (
        menu.querySelector('.n-virtual-list') ||
        menu.querySelector('.n-scrollbar-container') ||
        menu.querySelector('.n-base-select-menu__items')
      )
      const savedTop = scrollEl ? scrollEl.scrollTop : 0
      this._doRefSelectRequest(field, refField, query, nextPage, true, () => {
        requestAnimationFrame(() => {
          const m = document.querySelector('.n-base-select-menu')
          const el = m && (
            m.querySelector('.n-virtual-list') ||
            m.querySelector('.n-scrollbar-container') ||
            m.querySelector('.n-base-select-menu__items')
          )
          if (el) el.scrollTop = savedTop
        })
      })
    },
    onRefSelectUpdate(f, value, option) {
      this.formData[f.field] = value
      this.formData[f.field + '_display'] = option ? option.label : ''
      delete this.formErrors[f.field]
    },
    referenceDisplayLabel(field) {
      const displayVal = this.formData[field + '_display']
      if (displayVal !== null && displayVal !== undefined && displayVal !== '') return String(displayVal)
      const val = this.formData[field]
      if (val === null || val === undefined || val === '') return ''
      return String(val)
    },
    selectRow(row) {
      this.selectedRowKey = row[this.novaIdFieldName]
      // 平铺 REFERENCE 字段的外键值，使 APPENDAGE filter 能通过 referenceField 名称直接取值
      const enrichedRow = Object.assign({}, row)
      for (const key in (this.referenceMap || {})) {
        const ri = this.referenceMap[key]
        if (ri && ri.referenceField && row[key] && typeof row[key] === 'object') {
          const fkVal = row[key][ri.storageField || 'id']
          if (fkVal !== undefined) enrichedRow[ri.referenceField] = fkVal
        }
      }
      this.$emit('pick', enrichedRow)
    },
    onFormTabChange(tab) {
      // 弹窗打开瞬间的 v-model 同步不应触发按需加载
      if (this.openingForm) return
      if (tab.startsWith('emb_') || tab.startsWith('link_')) {
        this.visitedEmbTabs = new Set([...this.visitedEmbTabs, tab])
        // linkForm 的 linkTarget 等元数据在子 <nova-table> 自行 /build 后由 syncLinkTabBuild 同步
      } else if (tab.startsWith('ref_')) {
        var refNovaName = tab.slice(4)
        if (this.refTabData[refNovaName] != null) return
        if (window.NovaTableJQ) window.NovaTableJQ.loadReferenceDetails(this.novaName, refNovaName)
      } else if (tab.startsWith('app_')) {
        var appNovaName = tab.slice(4)
        if (this.appendageDetailsLoaded && this.appendageDetailsLoaded[appNovaName]) return
        if (window.NovaTableJQ) window.NovaTableJQ.loadAppendageDetails(this.novaName, appNovaName)
      }
    },
    refTabDisplayValue(novaName, f) {
      const maps = this.refTabMaps[novaName] || {}
      const data = this.refTabData[novaName] || {}
      const val  = data[f.field]
      if (val === null || val === undefined || val === '') return ''
      const choiceInfo = maps.choiceMap && maps.choiceMap[f.field]
      if (choiceInfo) {
        const vals = choiceInfo.selectType === 'MULTI' ? String(val).split(',') : [String(val)]
        return vals.map(v => { const o = (choiceInfo.values || []).find(x => x.value === v); return o ? o.label : v }).join('、')
      }
      if (f.type === 'DATE') {
        const ts = Number(val); if (!ts || isNaN(ts)) return String(val)
        const type = maps.dateMap && maps.dateMap[f.field] && maps.dateMap[f.field].type
        return this.formatDateTs(ts, type)
      }
      if (f.type === 'BOOLEAN') return (val === 'true' || val === true) ? '是' : '否'
      if (f.type === 'TAG')  return Array.isArray(val) ? val.join('、') : String(val).split(',').filter(Boolean).join('、')
      if (f.type === 'REFERENCE') return String(data[f.field + '_display'] || val)
      return String(val)
    },
    formatDateTs(ts, type) {
      const d = new Date(ts)
      const p = n => String(n).padStart(2, '0')
      if (type === 'YEAR')  return String(d.getFullYear())
      if (type === 'MONTH') return d.getFullYear() + '-' + p(d.getMonth() + 1)
      if (type === 'DATE')  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
             p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
    },
    viewFieldIcon(f) {
      const icons = {
        INPUT: 'material-symbols:text-fields', NUMBER: 'mdi:numeric',
        TEXTAREA: 'material-symbols:notes', CHOICE: 'material-symbols:checklist',
        TAG: 'material-symbols:tag', DATE: 'material-symbols:calendar-today',
        BOOLEAN: 'mdi:radiobox-marked', ATTACHMENT: 'mdi:paperclip',
        REFERENCE: 'material-symbols:link'
      }
      return icons[f.type] || 'mdi:format-list-bulleted-square'
    },
    viewDisplayValue(f) {
      const val = this.formData[f.field]
      if (val === null || val === undefined || val === '') return ''
      const choiceInfo = this.choiceMap && this.choiceMap[f.field]
      if (choiceInfo) {
        const vals = choiceInfo.selectType === 'MULTI' ? String(val).split(',') : [String(val)]
        return vals.map(v => { const o = (choiceInfo.values || []).find(x => x.value === v); return o ? o.label : v }).join('、')
      }
      if (f.type === 'DATE') {
        const ts = Number(val); if (!ts || isNaN(ts)) return String(val)
        const dateInfo = this.dateMap && this.dateMap[f.field]
        const d = new Date(ts)
        return this.formatDateTs(ts, dateInfo && dateInfo.type)
      }
      if (f.type === 'BOOLEAN') return (val === 'true' || val === true) ? '是' : '否'
      if (f.type === 'TAG') return Array.isArray(val) ? val.join('、') : String(val).split(',').filter(Boolean).join('、')
      if (f.type === 'REFERENCE') return String(this.formData[f.field + '_display'] || val)
      return String(val)
    },
    handlePageChange(current) {
      const key = (this.pickerMode || this.embeddedMode || this.dualMode) ? this._vmKey : this.novaName
      window.NovaTableJQ.onPageChange(key, current)
    },
    handlePageSizeChange(pageSize) {
      const key = (this.pickerMode || this.embeddedMode || this.dualMode) ? this._vmKey : this.novaName
      window.NovaTableJQ.onPageSizeChange(key, pageSize)
    }
  },

  template: `
    <div v-if="viewMode">
      <div v-if="editFields.length === 0" style="text-align:center;padding:60px;color:#aaa;font-size:14px">加载中…</div>
      <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
        <template v-for="f in editFields.filter(f => f.type !== 'DIVIDE' && f.type !== 'EMPTY')" :key="f.field">
          <div style="background:var(--n-card-color);border:1px solid var(--n-border-color);border-radius:8px;overflow:hidden;display:flex"
            :style="f.type === 'ATTACHMENT' ? 'grid-column: 1 / -1' : ''">
            <div style="width:4px;flex-shrink:0;background:var(--n-primary-color);opacity:0.6"></div>
            <div style="flex:1;padding:12px 14px;min-width:0">
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px">
                <iconify-icon v-if="viewFieldIcon(f)" :icon="viewFieldIcon(f)" width="14" style="color:var(--n-primary-color);opacity:0.8;flex-shrink:0"></iconify-icon>
                <span style="font-size:11px;font-weight:500;color:var(--n-text-color-3);letter-spacing:0.3px;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ f.title }}</span>
              </div>
              <!-- 附件类型 -->
              <div v-if="f.type === 'ATTACHMENT'">
                <div v-if="!(formData[f.field] || []).length" style="font-size:13px;color:var(--n-text-color-3);font-style:italic">-</div>
                <template v-else-if="attachmentMap[f.field] && attachmentMap[f.field].type === 'IMAGE'">
                  <div style="display:flex;flex-wrap:wrap;gap:8px">
                    <div v-for="(url, idx) in (formData[f.field] || [])" :key="idx" class="gallery-thumb-item" style="width:72px;height:72px">
                      <img :src="url" class="gallery-thumb-img" style="width:72px;height:72px"
                        @click="previewField = f; previewIndex = idx; previewModalShow = true" />
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div v-for="(url, idx) in (formData[f.field] || [])" :key="idx"
                    style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--n-border-color)">
                    <iconify-icon icon="mdi:paperclip" width="13" style="color:var(--n-primary-color);flex-shrink:0"></iconify-icon>
                    <span style="flex:1;font-size:13px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--n-text-color-1)" :title="url">{{ url }}</span>
                    <span style="font-size:12px;color:var(--n-primary-color);cursor:pointer;flex-shrink:0" @click="copyText(url)">复制</span>
                  </div>
                </template>
              </div>
              <!-- 普通类型 -->
              <div v-else style="font-size:14px;color:var(--n-text-color-1);line-height:1.5;min-height:21px;overflow:hidden">
                <span v-if="!viewDisplayValue(f)" style="color:var(--n-text-color-3);font-style:italic">-</span>
                <span v-else
                  style="display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;cursor:default"
                  :title="viewDisplayValue(f)">{{ viewDisplayValue(f) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
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
              <n-button size="tiny" @click="copyText(url)">复制</n-button>
            </div>
          </template>
          <div v-if="(formData[previewField.field] || []).length === 0" class="preview-empty">暂无文件</div>
        </div>
      </n-modal>
    </div>
    <div v-else :class="embeddedMode ? 'embedded-table' : ''" :style="pickerMode ? 'height:100%;display:flex;flex-direction:column;overflow:hidden;padding:0 16px' : (embeddedMode ? '' : dualMode ? 'flex:1;display:flex;flex-direction:column;overflow:hidden' : dualTableViewActive ? 'padding:16px 8px 16px 16px' : 'padding:16px')">

      <!-- 筛选卡片 -->
      <component v-if="!linkMode" :is="embeddedMode ? 'div' : 'n-card'" :bordered="false" class="page-card filter-card" :style="embeddedMode ? 'flex-shrink:0' : ''">
        <div :class="['filter-grid', embeddedMode ? 'embedded' : '', (dualMode || dualTableViewActive) ? 'dual' : '']" :style="embeddedMode ? 'padding:8px 0' : ''">
          <template v-for="(field, index) in searchFields" :key="field.field">
            <div v-if="filterExpanded || index < ((dualMode || dualTableViewActive) ? 1 : 3)" style="display:flex;align-items:center;gap:8px;width:100%">
              <span class="form-label">{{ field.title }}</span>
              <n-select v-if="field.type === 'CHOICE' && choiceMap[field.field] && choiceMap[field.field].selectType === 'SINGLE' && !field.vague"
                v-model:value="filterForm[field.field]"
                :options="fieldOptions(field)"
                :placeholder="'请选择' + field.title"
                :size="embSize"
                clearable style="flex:1"
              />
              <n-select v-else-if="field.type === 'CHOICE'"
                v-model:value="filterForm[field.field]"
                :options="fieldOptions(field)"
                :placeholder="'请选择' + field.title"
                :size="embSize"
                multiple clearable style="flex:1"
              />
              <n-select v-else-if="field.type === 'TAG'"
                v-model:value="filterForm[field.field]"
                :options="tagOptions(field.field)"
                :placeholder="'请选择' + field.title"
                :size="embSize"
                multiple clearable filterable
                :tag="tagMap[field.field] && tagMap[field.field].allowExtension"
                style="flex:1"
              />
              <n-select v-else-if="field.type === 'BOOLEAN'"
                v-model:value="filterForm[field.field]"
                :options="[{label:'是',value:'true'},{label:'否',value:'false'}]"
                :placeholder="'请选择' + field.title"
                :size="embSize"
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
                :size="embSize"
                :show-button="false"
                clearable style="flex:1"
              />
              <n-date-picker v-else-if="field.type === 'DATE'"
                v-model:value="filterForm[field.field]"
                :type="datePickerType(field.field, field.vague, false)"
                :is-date-disabled="datePickerDisabled(field.field, false)"
                :placeholder="field.vague ? ['开始时间', '结束时间'] : '请选择' + field.title"
                :size="embSize"
                clearable style="flex:1"
              />
              <!-- 筛选区 REFERENCE 非 vague：下拉搜索 -->
              <n-select
                v-else-if="field.type === 'REFERENCE' && referenceMap[field.field] && field.vague"
                :value="filterForm[field.field] || null"
                :options="refSelectOptions['_f_' + field.field] || []"
                :loading="!!refSelectLoading['_f_' + field.field]"
                :placeholder="'输入关键词搜索'"
                :size="embSize"
                filterable
                remote
                clearable
                :clear-filter-after-select="false"
                style="flex:1"
                @search="(q) => onRefSelectSearch({ field: '_f_' + field.field, _refField: field.field }, q)"
                @update:value="(v, opt) => { filterForm[field.field] = v; filterForm[field.field + '_display'] = opt ? opt.label : '' }"
                @clear="filterForm[field.field] = null; filterForm[field.field + '_display'] = ''"
              >
                <template #empty>
                  <div style="padding:12px;text-align:center;color:#aaa;font-size:13px">
                    {{ refSelectLoading['_f_' + field.field] ? '搜索中…' : '输入关键词开始搜索' }}
                  </div>
                </template>
                <template #action>
                  <div style="display:flex;align-items:center;justify-content:center;padding:6px 8px">
                    <div v-if="(refSelectOptions['_f_' + field.field] || []).length < (refSelectTotal['_f_' + field.field] || 0)"
                      style="display:flex;align-items:center;gap:4px;font-size:12px;color:#2563eb;cursor:pointer;padding:2px 6px;border-radius:4px;transition:background .15s"
                      @mouseenter="$event.currentTarget.style.background='#eff6ff'"
                      @mouseleave="$event.currentTarget.style.background='transparent'"
                      @click.stop="loadMoreRefSelect('_f_' + field.field, field.field)">
                      <iconify-icon icon="mdi:chevron-down" style="font-size:14px"></iconify-icon>
                      加载更多({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </div>
                    <span v-else-if="(refSelectOptions['_f_' + field.field] || []).length > 0" style="font-size:12px;color:#aaa">
                      已全部加载({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </span>
                  </div>
                </template>
              </n-select>
              <!-- 筛选区 REFERENCE vague=true：弹窗选择 -->
              <div v-else-if="field.type === 'REFERENCE' && referenceMap[field.field]" @click="openReferenceModalForFilter(field)" style="flex:1;cursor:pointer">
                <n-input
                  :value="filterForm[field.field + '_display'] || filterForm[field.field] || ''"
                  :placeholder="'请选择' + field.title"
                  :size="embSize"
                  readonly
                  clearable
                  @clear.stop="filterForm[field.field] = null; filterForm[field.field + '_display'] = ''"
                >
                  <template #suffix>
                    <iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon>
                  </template>
                </n-input>
              </div>
              <!-- 筛选区 APPENDAGE vague=false：下拉搜索 -->
              <n-select
                v-else-if="(field.type === 'APPENDAGE' || field.type === 'APPENDAGES') && appendageMap && appendageMap[field.field] && field.vague"
                :value="filterForm[field.field] || null"
                :options="refSelectOptions['_f_' + field.field] || []"
                :loading="!!refSelectLoading['_f_' + field.field]"
                :placeholder="'输入关键词搜索'"
                :size="embSize"
                filterable
                remote
                clearable
                :clear-filter-after-select="false"
                style="flex:1"
                @search="(q) => onRefSelectSearch({ field: '_f_' + field.field, _refField: field.field }, q)"
                @update:value="(v, opt) => { filterForm[field.field] = v; filterForm[field.field + '_display'] = opt ? opt.label : '' }"
                @clear="filterForm[field.field] = null; filterForm[field.field + '_display'] = ''"
              >
                <template #empty>
                  <div style="padding:12px;text-align:center;color:#aaa;font-size:13px">
                    {{ refSelectLoading['_f_' + field.field] ? '搜索中…' : '输入关键词开始搜索' }}
                  </div>
                </template>
                <template #action>
                  <div style="display:flex;align-items:center;justify-content:center;padding:6px 8px">
                    <div v-if="(refSelectOptions['_f_' + field.field] || []).length < (refSelectTotal['_f_' + field.field] || 0)"
                      style="display:flex;align-items:center;gap:4px;font-size:12px;color:#2563eb;cursor:pointer;padding:2px 6px;border-radius:4px;transition:background .15s"
                      @mouseenter="$event.currentTarget.style.background='#eff6ff'"
                      @mouseleave="$event.currentTarget.style.background='transparent'"
                      @click.stop="loadMoreRefSelect('_f_' + field.field, field.field)">
                      <iconify-icon icon="mdi:chevron-down" style="font-size:14px"></iconify-icon>
                      加载更多({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </div>
                    <span v-else-if="(refSelectOptions['_f_' + field.field] || []).length > 0" style="font-size:12px;color:#aaa">
                      已全部加载({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </span>
                  </div>
                </template>
              </n-select>
              <!-- 筛选区 APPENDAGE / APPENDAGES vague=false：弹窗选择 -->
              <div v-else-if="(field.type === 'APPENDAGE' || field.type === 'APPENDAGES') && appendageMap && appendageMap[field.field]" @click="openAppendageModalForFilter(field)" style="flex:1;cursor:pointer">
                <n-input
                  :value="filterForm[field.field + '_display'] || filterForm[field.field] || ''"
                  :placeholder="'请选择' + field.title"
                  :size="embSize"
                  readonly
                  clearable
                  @clear.stop="filterForm[field.field] = null; filterForm[field.field + '_display'] = ''"
                >
                  <template #suffix>
                    <iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon>
                  </template>
                </n-input>
              </div>
              <!-- 筛选区 LINK vague=true：下拉搜索 -->
              <n-select
                v-else-if="field.type === 'LINK' && linkMap && linkMap[field.field] && field.vague"
                :value="filterForm[field.field] || null"
                :options="refSelectOptions['_f_' + field.field] || []"
                :loading="!!refSelectLoading['_f_' + field.field]"
                :placeholder="'输入关键词搜索'"
                :size="embSize"
                filterable
                remote
                clearable
                :clear-filter-after-select="false"
                style="flex:1"
                @search="(q) => onRefSelectSearch({ field: '_f_' + field.field, _refField: field.field }, q)"
                @update:value="(v, opt) => { filterForm[field.field] = v; filterForm[field.field + '_display'] = opt ? opt.label : '' }"
                @clear="filterForm[field.field] = null; filterForm[field.field + '_display'] = ''"
              >
                <template #empty>
                  <div style="padding:12px;text-align:center;color:#aaa;font-size:13px">
                    {{ refSelectLoading['_f_' + field.field] ? '搜索中…' : '输入关键词开始搜索' }}
                  </div>
                </template>
                <template #action>
                  <div style="display:flex;align-items:center;justify-content:center;padding:6px 8px">
                    <div v-if="(refSelectOptions['_f_' + field.field] || []).length < (refSelectTotal['_f_' + field.field] || 0)"
                      style="display:flex;align-items:center;gap:4px;font-size:12px;color:#2563eb;cursor:pointer;padding:2px 6px;border-radius:4px;transition:background .15s"
                      @mouseenter="$event.currentTarget.style.background='#eff6ff'"
                      @mouseleave="$event.currentTarget.style.background='transparent'"
                      @click.stop="loadMoreRefSelect('_f_' + field.field, field.field)">
                      <iconify-icon icon="mdi:chevron-down" style="font-size:14px"></iconify-icon>
                      加载更多({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </div>
                    <span v-else-if="(refSelectOptions['_f_' + field.field] || []).length > 0" style="font-size:12px;color:#aaa">
                      已全部加载({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </span>
                  </div>
                </template>
              </n-select>
              <!-- 筛选区 LINK vague=false：弹窗选择 -->
              <div v-else-if="field.type === 'LINK' && linkMap && linkMap[field.field]" @click="openLinkModalForFilter(field)" style="flex:1;cursor:pointer">
                <n-input
                  :value="filterForm[field.field + '_display'] || filterForm[field.field] || ''"
                  :placeholder="'请选择' + field.title"
                  :size="embSize"
                  readonly
                  clearable
                  @clear.stop="filterForm[field.field] = null; filterForm[field.field + '_display'] = ''"
                >
                  <template #suffix>
                    <iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon>
                  </template>
                </n-input>
              </div>
              <n-input v-else
                v-model:value="filterForm[field.field]"
                :placeholder="'请输入' + field.title"
                :size="embSize"
                clearable style="flex:1"
              />
            </div>
          </template>
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px" :style="(dualMode || dualTableViewActive) ? 'grid-column:2' : 'grid-column:4'">
            <n-button :size="embSize" @click="handleReset">重 置</n-button>
            <n-button :size="embSize" type="primary" @click="handleQuery">查 询</n-button>
            <n-button :size="embSize" dashed @click="toggleFilter" :disabled="searchFields.length <= ((dualMode || dualTableViewActive) ? 1 : 3)">
              <template #icon>
                <n-icon><iconify-icon :icon="filterExpanded ? 'material-symbols:keyboard-arrow-up' : 'material-symbols:keyboard-arrow-down'"></iconify-icon></n-icon>
              </template>
              {{ filterExpanded ? '收 起' : '展 开' }}
            </n-button>
          </div>
        </div>
      </component>

      <!-- 表格卡片 -->
      <component :is="embeddedMode ? 'div' : 'n-card'" :bordered="false" class="page-card table-card" :style="pickerMode ? 'flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0' : (dualMode ? 'flex:1;min-height:0' : embeddedMode ? 'flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0' : '')" :content-style="pickerMode ? 'flex:1;display:flex;flex-direction:column;overflow:hidden;padding:8px' : (dualMode ? 'display:flex;flex-direction:column;overflow:hidden;flex:1' : undefined)">
        <div v-if="!pickerMode" class="table-card-header" :style="embeddedMode ? 'flex-shrink:0' : ''">
          <!-- 标题/tap + 操作按钮行 -->
            <n-tabs v-if="tapSearchField" type="line" :tabs-padding="0"
              :value="tapSearchValue === null ? '__all__' : tapSearchValue"
              @update:value="onTapSelect"
              style="flex:1;min-width:0;margin-bottom:-1px">
              <n-tab v-for="opt in tapSearchOptions" :key="opt.value === null ? '__all__' : opt.value"
                :name="opt.value === null ? '__all__' : opt.value">
                {{ opt.label }}
              </n-tab>
            </n-tabs>
            <span v-else style="font-size:16px;font-weight:500">数据列表</span>
            <div style="display:flex;gap:8px">
            <!-- ── 自定义按钮：MULTI / MULTI_ONLY / BUTTON（工具栏）─── -->
            <n-dropdown v-if="toolbarFoldedButtons.length > 0"
              trigger="hover"
              :options="toolbarFoldedOptions"
              @select="(key) => { var btn = toolbarFoldedButtons.find(function(b) { return b.title === key }); if (btn) handleCustomBtnClick(btn) }">
              <n-button :size="embSize" circle style="background:transparent" title="更多操作">
                <template #icon><n-icon size="16"><iconify-icon icon="material-symbols:more-horiz"></iconify-icon></n-icon></template>
              </n-button>
            </n-dropdown>
            <template v-for="btn in toolbarUnfoldedButtons" :key="btn.title">
              <n-popconfirm v-if="btn.callHint" positive-text="确定" negative-text="取消" @positive-click="handleCustomBtnClick(btn)">
                <template #trigger>
                  <n-button :size="embSize" type="default"
                    :disabled="(btn.mode === 'MULTI' || btn.mode === 'MULTI_ONLY') && checkedRowKeys.length === 0"
                    :title="btn.tip || btn.title">
                    <template v-if="btn.icon" #icon><n-icon size="15"><iconify-icon :icon="btn.icon" style="font-size:15px"></iconify-icon></n-icon></template>
                    {{ btn.title }}
                  </n-button>
                </template>
                {{ btn.callHint }}
              </n-popconfirm>
              <n-button v-else :size="embSize" type="default"
                :disabled="(btn.mode === 'MULTI' || btn.mode === 'MULTI_ONLY') && checkedRowKeys.length === 0"
                :title="btn.tip || btn.title"
                @click="handleCustomBtnClick(btn)">
                <template v-if="btn.icon" #icon><n-icon size="15"><iconify-icon :icon="btn.icon" style="font-size:15px"></iconify-icon></n-icon></template>
                {{ btn.title }}
              </n-button>
            </template>
            <n-button v-if="checkedRowKeys.length > 0 && !readonly" :size="embSize" type="error" @click="handleBatchDelete">
              <template #icon><n-icon><iconify-icon icon="material-symbols:delete-outline"></iconify-icon></n-icon></template>
              删 除
            </n-button>
            <n-button v-if="linkMode && !readonly" :size="embSize" type="primary" @click="$emit('link-add')">
              <template #icon><n-icon><iconify-icon icon="material-symbols:add"></iconify-icon></n-icon></template>
              新增
            </n-button>
            <n-button v-if="!readonly && !linkMode" :size="embSize" type="primary" @click="handleAdd">
              <template #icon><n-icon><iconify-icon icon="material-symbols:add"></iconify-icon></n-icon></template>
              新 增
            </n-button>
            <n-button :size="embSize" circle class="btn-circle" style="background:transparent" @click="handleQuery">
              <template #icon><n-icon size="15"><iconify-icon icon="lucide:refresh-cw" style="font-size:15px"></iconify-icon></n-icon></template>
            </n-button>
            <!-- 多子表：带悬浮下拉 -->
            <n-popover v-if="dualTableEnabled && !dualMode && dualTableSubTables.length > 1" trigger="hover" placement="bottom" :show-arrow="false">
              <template #trigger>
                <n-button :size="embSize" circle class="btn-circle" type="default"
                :style="dualTableViewActive ? { color: '#2563eb', background: 'transparent' } : { background: 'transparent' }"
                @click="toggleDualTableView"
                :title="dualTableViewActive ? '关闭双表视图' : '开启双表视图'">
                <template #icon><n-icon size="15"><iconify-icon icon="material-symbols:table-outline" style="font-size:15px"></iconify-icon></n-icon></template>
              </n-button>
              </template>
              <div style="display:flex;flex-direction:column;gap:2px;font-size:13px;min-width:120px;padding:4px 0">
                  <div v-for="s in dualTableSubTables" :key="s.novaName"
                    style="padding:6px 10px;cursor:pointer;border-radius:4px;transition:background .15s;text-align:center"
                    :style="{ color: (dualTableViewActive && s.novaName === dualTableCurrentNova) ? '#2563eb' : '' }"
                    @click.stop="dualTableViewActive ? onDualTableSubChange(s.novaName) : openDualTableView(s.novaName)"
                    @mouseenter="e => e.target.style.background='rgba(37,99,235,0.06)'"
                    @mouseleave="e => e.target.style.background=''">
                    {{ s.label }}
                  </div>
                </div>
            </n-popover>
            <!-- 单子表：仅按钮，无下拉 -->
            <n-button v-if="dualTableEnabled && !dualMode && dualTableSubTables.length === 1" :size="embSize" circle class="btn-circle" type="default"
              :style="dualTableViewActive ? { color: '#2563eb', background: 'transparent' } : { background: 'transparent' }"
              @click="toggleDualTableView"
              :title="dualTableViewActive ? '关闭双表视图' : '开启双表视图'">
              <template #icon><n-icon size="15"><iconify-icon icon="material-symbols:table-outline" style="font-size:15px"></iconify-icon></n-icon></template>
            </n-button>
            <n-popover trigger="click" placement="bottom-end">
              <template #trigger>
                <n-button :size="embSize" circle class="btn-circle" style="background:transparent">
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
        <div id="table-wrapper" :style="(pickerMode || embeddedMode || dualMode) ? 'flex:1;min-height:0;overflow:hidden' : ''">
          <n-data-table
            :data="filteredData"
            :columns="columns"
            :row-key="row => row[novaIdFieldName]"
            :checked-row-keys="checkedRowKeys"
            @update:checked-row-keys="handleCheck"
            :row-props="(pickerMode || pickerMulti) ? (row) => ({ style: 'cursor:pointer', onClick: () => pickerMulti ? toggleCheckedRow(row) : selectRow(row) }) : (dualTableViewActive ? (row) => ({ style: 'cursor:pointer', onClick: (e) => { if (e.target.closest('.row-action-btn') || e.target.closest('.n-checkbox') || e.target.closest('button') || e.target.closest('.n-button')) return; onDualTableRowClick(row) } }) : undefined)"
            :row-class-name="dualTableViewActive ? (row) => (row[novaIdFieldName] === (this._dualSelectedRow && this._dualSelectedRow[this.novaIdFieldName])) ? 'dual-selected-row' : '' : undefined"
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
      </component>

      <!-- 新增/编辑弹窗 -->
      <n-modal v-model:show="showForm" display-directive="if" preset="card" :title="formMode === 'add' ? '新增' : '编辑'" :style="isEmbTab ? 'width:calc(100vw - 80px);max-width:1600px;margin-top:40px;max-height:calc(100vh - 80px);display:flex;flex-direction:column;transition:width 0.3s ease,max-height 0.3s ease,margin-top 0.3s ease' : 'width:960px;margin-top:60px;max-height:calc(100vh - 120px);display:flex;flex-direction:column'" :content-style="{padding:'0',overflow:'auto',flex:'1',minHeight:'0'}" :header-style="{paddingBottom:'8px'}">
        <n-tabs v-model:value="formTab" type="line"
          style="padding:0 20px;margin-top:-4px"
          :class="''"
          @update:value="onFormTabChange">

          <!-- Tab 1: 表单 -->
          <n-tab-pane name="form" style="padding:16px 0 20px 0">
            <template #tab><iconify-icon icon="mdi:pencil-outline" style="font-size:14px;vertical-align:-2px;margin-right:4px"></iconify-icon>基本信息<span v-if="tabRequiredCount('form') > 0" style="margin-left:4px;background:#d03050;color:#fff;border-radius:10px;padding:0 5px;font-size:11px;line-height:16px;display:inline-block;vertical-align:middle">{{ tabRequiredCount('form') }}</span><span v-else-if="tabTotalRequired('form') > 0" style="margin-left:4px;display:inline-block;width:7px;height:7px;background:#18a058;border-radius:50%;vertical-align:middle"></span></template>
            <div :key="'tab_' + formTab" style="animation:tabFadeIn .5s cubic-bezier(0.22,0.61,0.36,1)">
            <div :style="'display:grid;gap:16px 24px;' + (editLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')">
          <template v-for="{field: f, visible: _vis} in visibleEditFields" :key="f.field">
            <n-divider v-if="f.type === 'DIVIDE' && editLayout !== 'FULL_LINE'" v-show="_vis" style="grid-column:1/-1;margin:0">{{ f.title }}</n-divider>
            <div v-else-if="f.type === 'EMPTY' && editLayout !== 'FULL_LINE'" v-show="_vis"></div>
            <div v-else-if="f.type !== 'DIVIDE' && f.type !== 'EMPTY'" v-show="_vis" :style="'display:flex;flex-direction:column;gap:4px' + (f.type === 'TEXTAREA' ? ';grid-column:1/-1' : '')"
                 :aria-hidden="!_vis ? 'true' : undefined">
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
              <div v-else-if="f.type === 'REFERENCE' && referenceMap[f.field]"
                @click="!isReadonly(f) && openReferenceModal(f)"
                style="cursor:pointer">
                <n-input
                  :value="referenceDisplayLabel(f.field)"
                  :placeholder="'请选择' + f.title"
                  readonly
                  clearable
                  :status="formErrors[f.field] ? 'error' : undefined"
                  :disabled="isReadonly(f)"
                  @clear.stop="formData[f.field] = null; formData[f.field + '_display'] = ''; if (referenceMap[f.field] && referenceMap[f.field].referenceField) formData[referenceMap[f.field].referenceField] = null; delete formErrors[f.field]"
                >
                  <template #suffix>
                    <iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon>
                  </template>
                </n-input>
              </div>
              <div v-else-if="f.type === 'ATTACHMENT'" class="attachment-field"
                @mouseenter="setAttachmentDropdown(f.field)" @mouseleave="clearAttachmentDropdown">
                <div class="attachment-btn">
                  <iconify-icon icon="mdi:paperclip" style="font-size:13px"></iconify-icon>
                  附件管理
                  <iconify-icon icon="mdi:chevron-down" :style="'font-size:12px;transition:transform .2s ease;transform:' + (attachmentDropdownKey === f.field ? (attachmentMap[f.field] && attachmentMap[f.field].showType === 'DOWN' ? 'rotate(180deg)' : 'rotate(180deg)') : 'rotate(0deg)')"></iconify-icon>
                </div>
                <transition name="dropdown-fade">
                  <div v-if="attachmentDropdownKey === f.field" :class="'attachment-dropdown' + (attachmentMap[f.field] && attachmentMap[f.field].showType === 'DOWN' ? ' down' : '')">
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
        </div>
        </n-tab-pane>

        <!-- referenceForm / appendageForm 统一按后端顺序渲染 -->
        <template v-for="tab in editExtraTabs" :key="tab.tapNovaName">
        <n-tab-pane v-if="tab.tapShow !== false && (tab.tapType !== 'referenceForm' || formMode !== 'add') && (tab.tapType !== 'appendagesTable' || formMode !== 'add') && (tab.tapType !== 'linkForm' || formMode !== 'add') && (!tab.tapShowByExpr || evalShowExprSafe(tab.tapShowByExpr, formData))"
          :name="(tab.tapType === 'referenceForm' ? 'ref_' : tab.tapType === 'appendagesTable' ? 'emb_' : tab.tapType === 'linkForm' ? 'link_' : 'app_') + tab.tapNovaName"
          display-directive="if"
          :style="tab.tapType === 'appendagesTable' ? ('padding:0 0 15px 0;overflow:hidden;height:' + (isEmbTab ? 'calc(100vh - 240px)' : '460px')) : 'padding:16px 0 20px 0'">
          <template #tab><iconify-icon :icon="tab.tapType === 'referenceForm' ? 'mdi:eye-outline' : tab.tapType === 'appendagesTable' ? 'mdi:table' : tab.tapType === 'linkForm' ? 'mdi:link-variant' : 'mdi:note-outline'" style="font-size:14px;vertical-align:-2px;margin-right:4px"></iconify-icon>{{ tab.tapTitle || tab.tapNovaName }}<template v-if="tab.tapType === 'appendageForm'"><span v-if="tabRequiredCount('app_' + tab.tapNovaName) > 0" style="margin-left:4px;background:#d03050;color:#fff;border-radius:10px;padding:0 5px;font-size:11px;line-height:16px;display:inline-block;vertical-align:middle">{{ tabRequiredCount('app_' + tab.tapNovaName) }}</span><span v-else-if="tabTotalRequired('app_' + tab.tapNovaName) > 0" style="margin-left:4px;display:inline-block;width:7px;height:7px;background:#18a058;border-radius:50%;vertical-align:middle"></span></template></template>
          <div :key="tab.tapNovaName" style="animation:tabFadeIn .5s cubic-bezier(0.22,0.61,0.36,1)">

          <!-- referenceForm 内容 -->
          <div v-if="tab.tapType === 'referenceForm' && refTabData[tab.tapNovaName] == null" style="text-align:center;padding:40px;color:#aaa;font-size:13px">加载中…</div>
          <nova-table v-else-if="tab.tapType === 'referenceForm'"
            :view-mode="true"
            :nova-name-prop="tab.tapNovaName"
            :source-nova-name-prop="novaName"
            :view-row="refTabData[tab.tapNovaName]" />

          <!-- appendageForm 内容 -->
          <template v-else-if="tab.tapType === 'appendageForm'">
          <div v-if="!(appBuild(tab.tapNovaName).editFields || []).length" style="text-align:center;padding:40px;color:#aaa;font-size:13px">加载中…</div>
          <div v-else :style="'display:grid;gap:16px 24px;' + (appBuild(tab.tapNovaName).editLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')">
            <template v-for="f in (appBuild(tab.tapNovaName).editFields || [])" :key="f.field">
              <n-divider v-if="f.type === 'DIVIDE' && appBuild(tab.tapNovaName).editLayout !== 'FULL_LINE'" v-show="appFieldVisible(tab.tapNovaName, f)" style="grid-column:1/-1;margin:0">{{ f.title }}</n-divider>
              <div v-else-if="f.type === 'EMPTY' && appBuild(tab.tapNovaName).editLayout !== 'FULL_LINE'" v-show="appFieldVisible(tab.tapNovaName, f)"></div>
              <div v-else-if="f.type !== 'DIVIDE' && f.type !== 'EMPTY' && !(f.type === 'REFERENCE' && (appBuild(tab.tapNovaName).referenceMap || {})[f.field] && (appBuild(tab.tapNovaName).referenceMap || {})[f.field].referenceName === novaName)"
                v-show="appFieldVisible(tab.tapNovaName, f)"
                :style="'display:flex;flex-direction:column;gap:4px' + (f.type === 'TEXTAREA' ? ';grid-column:1/-1' : '')">
                <span class="edit-form-label">
                  <span v-if="f.notNull && !isReadonly(f)" class="form-label-required">*</span>{{ f.title }}
                  <n-tooltip v-if="f.desc" trigger="hover" placement="top"><template #trigger><span class="form-label-help"><iconify-icon icon="material-symbols:help-outline" style="font-size:15px"></iconify-icon></span></template>{{ f.desc }}</n-tooltip>
                </span>
                <n-checkbox-group v-if="f.type === 'CHOICE' && appChoice(tab.tapNovaName,f.field) && appChoice(tab.tapNovaName,f.field).showType === 'RADIO' && appChoice(tab.tapNovaName,f.field).selectType === 'MULTI'"
                  :value="appFd(tab.tapNovaName)[f.field]" :disabled="isReadonly(f)"
                  @update:value="appSetFd(tab.tapNovaName,f.field,$event)">
                  <n-space><n-checkbox v-for="o in appFieldOpts(tab.tapNovaName,f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
                </n-checkbox-group>
                <n-radio-group v-else-if="f.type === 'CHOICE' && appChoice(tab.tapNovaName,f.field) && appChoice(tab.tapNovaName,f.field).showType === 'RADIO'"
                  :value="appFd(tab.tapNovaName)[f.field]" :disabled="isReadonly(f)"
                  @update:value="appSetFd(tab.tapNovaName,f.field,$event)">
                  <n-space><n-radio v-for="o in appFieldOpts(tab.tapNovaName,f)" :key="o.value" :value="o.value" :label="o.label" /></n-radio-group>
                <n-select v-else-if="f.type === 'CHOICE' && appChoice(tab.tapNovaName,f.field) && appChoice(tab.tapNovaName,f.field).selectType === 'MULTI'"
                  :value="appFd(tab.tapNovaName)[f.field]" :options="appFieldOpts(tab.tapNovaName,f)"
                  :placeholder="'请选择'+f.title" :status="appErrs(tab.tapNovaName)[f.field]?'error':undefined"
                  :disabled="isReadonly(f)" multiple clearable @update:value="appSetFd(tab.tapNovaName,f.field,$event)" />
                <n-select v-else-if="f.type === 'CHOICE'"
                  :value="appFd(tab.tapNovaName)[f.field]" :options="appFieldOpts(tab.tapNovaName,f)"
                  :placeholder="'请选择'+f.title" :status="appErrs(tab.tapNovaName)[f.field]?'error':undefined"
                  :disabled="isReadonly(f)" clearable @update:value="appSetFd(tab.tapNovaName,f.field,$event)" />
                <n-select v-else-if="f.type === 'BOOLEAN'"
                  :value="appFd(tab.tapNovaName)[f.field]" :options="[{label:'是',value:'true'},{label:'否',value:'false'}]"
                  :placeholder="'请选择'+f.title" :status="appErrs(tab.tapNovaName)[f.field]?'error':undefined"
                  :disabled="isReadonly(f)" clearable @update:value="appSetFd(tab.tapNovaName,f.field,$event)" />
                <n-input-number v-else-if="f.type === 'NUMBER'"
                  :value="appFd(tab.tapNovaName)[f.field]"
                  :placeholder="'请输入'+f.title" :show-button="false" style="width:100%"
                  :min="appNumInfo(tab.tapNovaName,f.field).min" :max="appNumInfo(tab.tapNovaName,f.field).max"
                  :precision="appNumInfo(tab.tapNovaName,f.field).type==='DECIMAL'?(appNumInfo(tab.tapNovaName,f.field).decimal||2):0"
                  :status="appErrs(tab.tapNovaName)[f.field]?'error':undefined"
                  :disabled="isReadonly(f)" clearable @update:value="appSetFd(tab.tapNovaName,f.field,$event)" />
                <n-date-picker v-else-if="f.type === 'DATE'"
                  :value="appFd(tab.tapNovaName)[f.field]" :type="appDateType(tab.tapNovaName,f.field)"
                  :placeholder="'请选择'+f.title" :status="appErrs(tab.tapNovaName)[f.field]?'error':undefined"
                  :disabled="isReadonly(f)" clearable style="width:100%"
                  @update:value="appSetFd(tab.tapNovaName,f.field,$event)" />
                <n-select v-else-if="f.type === 'TAG'"
                  :value="appFd(tab.tapNovaName)[f.field]" :options="appTagOpts(tab.tapNovaName,f.field)"
                  :placeholder="'请输入或选择'+f.title" :status="appErrs(tab.tapNovaName)[f.field]?'error':undefined"
                  :disabled="isReadonly(f)" filterable multiple clearable
                  @update:value="appSetFd(tab.tapNovaName,f.field,$event)" />
                <n-input v-else-if="f.type === 'TEXTAREA'"
                  :value="appFd(tab.tapNovaName)[f.field]" type="textarea" :autosize="{minRows:3}"
                  :placeholder="'请输入'+f.title" :status="appErrs(tab.tapNovaName)[f.field]?'error':undefined"
                  :disabled="isReadonly(f)" @update:value="appSetFd(tab.tapNovaName,f.field,$event)" />
                <div v-else-if="f.type === 'REFERENCE' && (appBuild(tab.tapNovaName).referenceMap||{})[f.field]"
                  @click="!isReadonly(f) && openAppReferenceModal(tab.tapNovaName, f)" style="cursor:pointer">
                  <n-input
                    :value="appFd(tab.tapNovaName)[f.field+'_display'] || appFd(tab.tapNovaName)[f.field]"
                    :placeholder="'请选择'+f.title" readonly clearable
                    :status="appErrs(tab.tapNovaName)[f.field]?'error':undefined"
                    :disabled="isReadonly(f)"
                    @clear.stop="appSetFd(tab.tapNovaName,f.field,null);appSetFd(tab.tapNovaName,f.field+'_display','')">
                    <template #suffix><iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon></template>
                  </n-input>
                </div>
                <div v-else-if="f.type === 'ATTACHMENT'" class="attachment-field"
                  @mouseenter="setAttachmentDropdown(tab.tapNovaName+'__'+f.field)" @mouseleave="clearAttachmentDropdown">
                  <div class="attachment-btn">
                    <iconify-icon icon="mdi:paperclip" style="font-size:13px"></iconify-icon>附件管理
                    <iconify-icon icon="mdi:chevron-down" :style="'font-size:12px;transition:transform .2s ease;transform:' + (attachmentDropdownKey === tab.tapNovaName+'__'+f.field ? 'rotate(180deg)' : 'rotate(0deg)')"></iconify-icon>
                  </div>
                  <transition name="dropdown-fade">
                    <div v-if="attachmentDropdownKey === tab.tapNovaName+'__'+f.field" :class="'attachment-dropdown' + ((appBuild(tab.tapNovaName).attachmentMap||{})[f.field] && (appBuild(tab.tapNovaName).attachmentMap||{})[f.field].showType === 'DOWN' ? ' down' : '')">
                      <div class="attachment-dropdown-inner">
                        <label v-if="!isReadonly(f) && (!(appBuild(tab.tapNovaName).attachmentMap||{})[f.field] || !(appBuild(tab.tapNovaName).attachmentMap||{})[f.field].maxLimit || (appFd(tab.tapNovaName)[f.field]||[]).length < (appBuild(tab.tapNovaName).attachmentMap||{})[f.field].maxLimit)"
                          class="attachment-dropdown-item" :for="'upload-app-'+tab.tapNovaName+'-'+f.field">
                          <iconify-icon icon="mdi:upload" style="font-size:13px"></iconify-icon>
                          上传文件{{ (appBuild(tab.tapNovaName).attachmentMap||{})[f.field] && (appBuild(tab.tapNovaName).attachmentMap||{})[f.field].maxLimit ? '（共'+((appBuild(tab.tapNovaName).attachmentMap||{})[f.field].maxLimit-(appFd(tab.tapNovaName)[f.field]||[]).length)+'个）' : '' }}
                          <input :id="'upload-app-'+tab.tapNovaName+'-'+f.field" type="file" style="display:none"
                            :multiple="(appBuild(tab.tapNovaName).attachmentMap||{})[f.field] && (appBuild(tab.tapNovaName).attachmentMap||{})[f.field].maxLimit > 1"
                            @change="handleAttachmentChange(f, $event, tab.tapNovaName)" />
                        </label>
                        <div v-if="(appFd(tab.tapNovaName)[f.field]||[]).length > 0" class="attachment-dropdown-item" @click="openPreview(f, tab.tapNovaName)">
                          <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>查看文件（共{{ (appFd(tab.tapNovaName)[f.field]||[]).length }}个）
                        </div>
                        <div v-else class="attachment-dropdown-item attachment-disabled">
                          <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>查看文件（共0个）
                        </div>
                      </div>
                    </div>
                  </transition>
                </div>
                <n-input v-else
                  :value="appFd(tab.tapNovaName)[f.field]" :placeholder="'请输入'+f.title"
                  :status="appErrs(tab.tapNovaName)[f.field]?'error':undefined"
                  :disabled="isReadonly(f)" clearable @update:value="appSetFd(tab.tapNovaName,f.field,$event)" />
                <span v-if="appErrs(tab.tapNovaName)[f.field]" class="form-error-tip">{{ appErrs(tab.tapNovaName)[f.field] }}</span>
              </div>
            </template>
          </div>
          </template>

          <!-- appendagesTable 内容 -->
          <template v-else-if="tab.tapType === 'appendagesTable'">
            <div :style="'display:flex;flex-direction:column;overflow:hidden;height:' + (isEmbTab ? 'calc(100vh - 240px)' : '460px')">
              <nova-table
                v-if="showForm && visitedEmbTabs.has('emb_' + tab.tapNovaName)"
                :key="'emb_' + tab.tapNovaName + '_' + (currentRow && currentRow[novaIdFieldName])"
                :embedded-mode="true"
                :nova-name-prop="tab.tapNovaName"
                :source-nova-name-prop="novaName"
                :source-fields-prop="buildEmbSourceFields(tab)"
              />
            </div>
          </template>

          <!-- linkForm 内容（中间表嵌入式表格） -->
          <template v-else-if="tab.tapType === 'linkForm'">
            <div :style="'display:flex;flex-direction:column;overflow:hidden;height:' + (isEmbTab ? 'calc(100vh - 240px)' : '460px')">
              <nova-table
                v-if="showForm && visitedEmbTabs.has('link_' + tab.tapNovaName)"
                :key="'link_' + tab.tapNovaName + '_' + (currentRow && currentRow[novaIdFieldName])"
                :embedded-mode="true"
                :link-mode="true"
                :nova-name-prop="tab.tapNovaName"
                :source-nova-name-prop="novaName"
                :source-fields-prop="buildLinkSourceFields(tab)"
                @link-add="openLinkPicker(tab.tapNovaName, tab.tapTitle)"
              />
            </div>
          </template>

          </div>
        </n-tab-pane>
        </template>

        </n-tabs>
        <template #footer>
          <n-space v-if="!formTab.startsWith('emb_') && !formTab.startsWith('ref_') && !formTab.startsWith('link_')" justify="end">
            <n-button @click="showForm = false">取 消</n-button>
            <n-button type="primary" @click="handleFormSubmit">确 定</n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- 附件预览弹窗（viewMode 和普通模式共用） -->
      <n-modal v-model:show="previewModalShow" preset="card" style="width:760px;margin-top:60px;padding:0">
        <template #header>
          <div class="gallery-header">
            <span class="gallery-title">{{ previewField ? (previewField.title || '附件预览') : '附件预览' }}</span>
            <span v-if="previewField && previewAttachCfg.type === 'IMAGE' && previewFileList.length > 0" class="gallery-count">
              {{ previewIndex + 1 }} / {{ previewFileList.length }}
            </span>
          </div>
        </template>
        <div v-if="previewField && previewAttachCfg.type === 'IMAGE'" class="gallery-wrap">
          <div class="gallery-body">
            <div class="gallery-stage">
              <button v-if="previewIndex > 0" class="gallery-nav gallery-nav-prev" @click="slideDirection = 'left'; previewIndex--">‹</button>
              <transition :name="'slide-' + slideDirection">
                <img :key="previewIndex" :src="previewFileList[previewIndex]" class="gallery-main-img" />
              </transition>
              <button v-if="previewIndex < previewFileList.length - 1" class="gallery-nav gallery-nav-next" @click="slideDirection = 'right'; previewIndex++">›</button>
            </div>
            <div v-if="previewFileList.length > 0" class="gallery-sider">
              <div class="gallery-thumb-list">
                <div v-for="(url, idx) in previewFileList" :key="idx" class="gallery-thumb-item">
                  <img :src="url" class="gallery-thumb-img" :class="{active: previewIndex === idx}"
                    @click="slideDirection = previewIndex < idx ? 'right' : 'left'; previewIndex = idx" />
                  <span class="gallery-thumb-del" @click.stop="deleteFromPreview(idx)">×</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="previewFileList.length > 0" class="gallery-dots">
            <span v-for="(url, idx) in previewFileList" :key="'dot-' + idx"
              :class="'gallery-dot' + (previewIndex === idx ? ' active' : '')"
              @click="slideDirection = previewIndex < idx ? 'right' : 'left'; previewIndex = idx"></span>
          </div>
          <div v-if="previewFileList.length > 0" class="gallery-url-wrap" :title="'点击复制: ' + previewFileList[previewIndex]" @click="copyText(previewFileList[previewIndex])">
            <div class="gallery-url-label">图片地址</div>
            <div class="gallery-url-text">{{ previewFileList[previewIndex] }}</div>
          </div>
          <div v-if="previewFileList.length === 0" class="gallery-empty">暂无图片</div>
        </div>
        <div v-else-if="previewField" class="preview-file-list">
          <template v-for="(url, idx) in previewFileList" :key="idx">
            <div class="preview-file-row">
              <span class="preview-file-url">{{ url }}</span>
              <n-space>
                <n-button size="tiny" @click="copyText(url)">复制</n-button>
                <n-button type="error" size="tiny" @click="deleteFromPreview(idx)">删除</n-button>
              </n-space>
            </div>
          </template>
          <div v-if="previewFileList.length === 0" class="preview-empty">暂无文件</div>
        </div>
      </n-modal>

      <!-- 关联引用选择弹窗 -->
      <n-modal v-for="picker in refPickerStack" :key="picker.level" :show="picker.visible" @update:show="(v) => { if (!v) closePickerAtLevel(picker.level) }" preset="card" class="ref-picker-modal" :title="'选择 ' + picker.field.title" style="width:calc(100vw - 80px);max-width:1600px;margin-top:20px" :content-style="{ padding: '0' }" :z-index="3000 + picker.level">
        <div :style="{ height: 'calc(100vh - 180px)', maxHeight: '700px', overflow: 'hidden' }">
          <nova-table :picker-mode="true" :nova-name-prop="picker.novaName" :source-nova-name-prop="novaName" :source-fields-prop="buildPickerSourceFields(picker)" @pick="onPickerPick(picker.level, $event)" />
        </div>
        <template #footer>
          <div style="display:flex;justify-content:flex-end;gap:8px;width:100%">
            <n-button @click="closePickerAtLevel(picker.level)">关闭 (Esc)</n-button>
            <n-button type="primary" @click="confirmPickerSelect(picker.level)">选 择</n-button>
          </div>
        </template>
      </n-modal>

      <!-- LINK 多选关联弹窗 -->
      <n-modal v-model:show="linkPickerShow" preset="card" class="ref-picker-modal" :title="linkPickerTitle || '选择关联数据'" style="width:calc(100vw - 80px);max-width:1600px;margin-top:20px" :content-style="{ padding: '0' }" :z-index="3500">
        <div :style="{ height: 'calc(100vh - 180px)', maxHeight: '700px', overflow: 'hidden' }">
          <nova-table v-if="linkPickerShow" :picker-mode="true" :picker-multi="true" :nova-name-prop="linkPickerTargetNova" :source-fields-prop="linkPickerSourceFields" @check="onLinkPickerPick" />
        </div>
        <template #footer>
          <div style="display:flex;justify-content:flex-end;gap:8px;width:100%">
            <n-button @click="closeLinkPicker">关闭 (Esc)</n-button>
            <n-button type="primary" @click="confirmLinkPickerSelect">选 择</n-button>
          </div>
        </template>
      </n-modal>

      <!-- 操作表单弹窗（novaClassName） — 独立状态，不干扰主表单 -->
      <n-modal v-model:show="opFormShow" display-directive="if" preset="card"
        :title="(opFormBtn && opFormBtn.title) || '操作'"
        style="width:960px;margin-top:60px;max-height:calc(100vh - 120px);display:flex;flex-direction:column"
        :content-style="{padding:'0',overflow:'auto',flex:'1',minHeight:'0'}"
        :header-style="{paddingBottom:'8px'}">
        <n-tabs v-model:value="opFormTab" type="line"
          style="padding:0 20px;margin-top:-4px"
          @update:value="onOpFormTabChange">
          <!-- Tab 1: 基本信息 -->
          <n-tab-pane name="form" style="padding:16px 0 20px 0">
            <template #tab>
              <iconify-icon icon="mdi:pencil-outline" style="font-size:14px;vertical-align:-2px;margin-right:4px"></iconify-icon>基本信息
              <span v-if="opFormTabRequiredCount('form') > 0" style="margin-left:4px;background:#d03050;color:#fff;border-radius:10px;padding:0 5px;font-size:11px;line-height:16px;display:inline-block;vertical-align:middle">{{ opFormTabRequiredCount('form') }}</span>
            </template>
            <div :style="'display:grid;gap:16px 24px;' + (opFormLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')">
            <template v-for="{field: f, visible: _vis} in visibleOpFormFields" :key="f.field">
              <n-divider v-if="f.type === 'DIVIDE' && opFormLayout !== 'FULL_LINE'" v-show="_vis" style="grid-column:1/-1;margin:0">{{ f.title }}</n-divider>
              <div v-else-if="f.type === 'EMPTY' && opFormLayout !== 'FULL_LINE'" v-show="_vis"></div>
              <div v-else-if="f.type !== 'DIVIDE' && f.type !== 'EMPTY'" v-show="_vis"
                :style="'display:flex;flex-direction:column;gap:4px' + (f.type === 'TEXTAREA' ? ';grid-column:1/-1' : '')">
                <span class="edit-form-label">
                  <span v-if="f.notNull" class="form-label-required">*</span>{{ f.title }}
                  <n-tooltip v-if="f.desc" trigger="hover" placement="top">
                    <template #trigger><span class="form-label-help"><iconify-icon icon="material-symbols:help-outline" style="font-size:15px"></iconify-icon></span></template>
                    {{ f.desc }}
                  </n-tooltip>
                </span>
                <!-- 字段渲染复用相同模式，读取 opForm* 状态 -->
                <n-checkbox-group
                  v-if="f.type === 'CHOICE' && opFormChoiceMap[f.field] && opFormChoiceMap[f.field].showType === 'RADIO' && opFormChoiceMap[f.field].selectType === 'MULTI'"
                  v-model:value="opFormData[f.field]">
                  <n-space><n-checkbox v-for="o in opFieldOpts(f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
                </n-checkbox-group>
                <n-radio-group
                  v-else-if="f.type === 'CHOICE' && opFormChoiceMap[f.field] && opFormChoiceMap[f.field].showType === 'RADIO'"
                  v-model:value="opFormData[f.field]">
                  <n-space><n-radio v-for="o in opFieldOpts(f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
                </n-radio-group>
                <n-select
                  v-else-if="f.type === 'CHOICE' && opFormChoiceMap[f.field] && opFormChoiceMap[f.field].selectType === 'MULTI'"
                  v-model:value="opFormData[f.field]" :options="opFieldOpts(f)"
                  :placeholder="'请选择' + f.title" multiple clearable />
                <n-select
                  v-else-if="f.type === 'CHOICE'"
                  v-model:value="opFormData[f.field]" :options="opFieldOpts(f)"
                  :placeholder="'请选择' + f.title" clearable />
                <n-select
                  v-else-if="f.type === 'BOOLEAN'"
                  v-model:value="opFormData[f.field]"
                  :options="[{label:'是',value:'true'},{label:'否',value:'false'}]"
                  :placeholder="'请选择' + f.title" clearable />
                <n-input-number
                  v-else-if="f.type === 'NUMBER'"
                  v-model:value="opFormData[f.field]" :placeholder="'请输入' + f.title"
                  :min="opFormNumberMap[f.field] && opFormNumberMap[f.field].min"
                  :max="opFormNumberMap[f.field] && opFormNumberMap[f.field].max"
                  :precision="opFormNumberMap[f.field] && opFormNumberMap[f.field].type === 'DECIMAL' ? (opFormNumberMap[f.field].decimal || 2) : 0"
                  :show-button="false" clearable style="width:100%" />
                <n-date-picker
                  v-else-if="f.type === 'DATE'"
                  v-model:value="opFormData[f.field]"
                  :type="opDateType(f.field)" :placeholder="'请选择' + f.title"
                  clearable style="width:100%" />
                <n-select
                  v-else-if="f.type === 'TAG'"
                  v-model:value="opFormData[f.field]" :options="opTagOpts(f.field)"
                  :placeholder="'请输入或选择' + f.title"
                  :max-tag-count="opFormTagMap[f.field] && opFormTagMap[f.field].maxTagCount"
                  :tag="opFormTagMap[f.field] && opFormTagMap[f.field].allowExtension"
                  filterable multiple clearable />
                <n-input
                  v-else-if="f.type === 'TEXTAREA'"
                  v-model:value="opFormData[f.field]" type="textarea"
                  :autosize="{ minRows: 3 }" :placeholder="'请输入' + f.title" />
                <div v-else-if="f.type === 'REFERENCE' && opFormRefMap[f.field]"
                  @click="openOpReferenceModal(f)" style="cursor:pointer">
                  <n-input
                    :value="opFormData[f.field + '_display'] || opFormData[f.field]"
                    :placeholder="'请选择' + f.title" readonly clearable
                    @clear.stop="opFormData[f.field] = null; opFormData[f.field + '_display'] = ''">
                    <template #suffix><iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon></template>
                  </n-input>
                </div>
                <div v-else-if="f.type === 'ATTACHMENT'" class="attachment-field"
                  @mouseenter="attachmentDropdownKey = 'op_' + f.field" @mouseleave="attachmentDropdownKey = null">
                  <div class="attachment-btn">
                    <iconify-icon icon="mdi:paperclip" style="font-size:13px"></iconify-icon>附件管理
                    <iconify-icon icon="mdi:chevron-down" :style="'font-size:12px;transition:transform .2s ease;transform:' + (attachmentDropdownKey === 'op_' + f.field ? 'rotate(180deg)' : 'rotate(0deg)')"></iconify-icon>
                  </div>
                  <transition name="dropdown-fade">
                    <div v-if="attachmentDropdownKey === 'op_' + f.field" :class="'attachment-dropdown' + (opFormAttachmentMap[f.field] && opFormAttachmentMap[f.field].showType === 'DOWN' ? ' down' : '')">
                      <div class="attachment-dropdown-inner">
                        <label v-if="!opFormAttachmentMap[f.field] || !opFormAttachmentMap[f.field].maxLimit || (opFormData[f.field] || []).length < opFormAttachmentMap[f.field].maxLimit"
                          class="attachment-dropdown-item" :for="'upload-op-' + f.field">
                          <iconify-icon icon="mdi:upload" style="font-size:13px"></iconify-icon>
                          上传文件{{ opFormAttachmentMap[f.field] && opFormAttachmentMap[f.field].maxLimit ? '（共' + (opFormAttachmentMap[f.field].maxLimit - (opFormData[f.field] || []).length) + '个）' : '' }}
                          <input :id="'upload-op-' + f.field" type="file" style="display:none"
                            :multiple="opFormAttachmentMap[f.field] && opFormAttachmentMap[f.field].maxLimit > 1"
                            @change="handleOpAttachmentChange(f, $event)" />
                        </label>
                        <div v-if="(opFormData[f.field] || []).length > 0" class="attachment-dropdown-item" @click="openPreview(f)">
                          <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>
                          查看文件（共{{ (opFormData[f.field] || []).length }}个）
                        </div>
                        <div v-else class="attachment-dropdown-item attachment-disabled">
                          <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>查看文件（共0个）
                        </div>
                      </div>
                    </div>
                  </transition>
                </div>
                <n-input v-else v-model:value="opFormData[f.field]" :placeholder="'请输入' + f.title" clearable />
                <span v-if="opFormErrors[f.field]" class="form-error-tip">{{ opFormErrors[f.field] }}</span>
              </div>
            </template>
          </div>
          </n-tab-pane>
          <!-- APPENDAGE 表单 Tab -->
          <n-tab-pane v-for="tab in opFormExtraTabs" :key="tab.tapNovaName"
            :name="'app_' + tab.tapNovaName" style="padding:16px 0 20px 0">
            <template #tab>
              <iconify-icon icon="mdi:note-outline" style="font-size:14px;vertical-align:-2px;margin-right:4px"></iconify-icon>{{ tab.tapTitle || tab.tapNovaName }}
              <span v-if="opFormTabRequiredCount('app_' + tab.tapNovaName) > 0" style="margin-left:4px;background:#d03050;color:#fff;border-radius:10px;padding:0 5px;font-size:11px;line-height:16px;display:inline-block;vertical-align:middle">{{ opFormTabRequiredCount('app_' + tab.tapNovaName) }}</span>
            </template>
            <div v-if="!(opFormAppBuild(tab.tapNovaName).editFields || []).length" style="text-align:center;padding:40px;color:#aaa;font-size:13px">加载中…</div>
            <div v-else :style="'display:grid;gap:16px 24px;' + ((opFormAppBuild(tab.tapNovaName).layout || {}).editLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')">
              <template v-for="f in (opFormAppBuild(tab.tapNovaName).editFields || [])" :key="f.field">
                <n-divider v-if="f.type === 'DIVIDE' && (opFormAppBuild(tab.tapNovaName).layout || {}).editLayout !== 'FULL_LINE'" style="grid-column:1/-1;margin:0">{{ f.title }}</n-divider>
                <div v-else-if="f.type === 'DIVIDE'" style="grid-column:1/-1;margin:0"><n-divider>{{ f.title }}</n-divider></div>
                <div v-else-if="f.type === 'EMPTY' && (opFormAppBuild(tab.tapNovaName).layout || {}).editLayout !== 'FULL_LINE'"></div>
                <div v-else-if="f.type !== 'DIVIDE' && f.type !== 'EMPTY'"
                  :style="'display:flex;flex-direction:column;gap:4px' + (f.type === 'TEXTAREA' ? ';grid-column:1/-1' : '')">
                  <span class="edit-form-label">
                    <span v-if="f.notNull" class="form-label-required">*</span>{{ f.title }}
                    <n-tooltip v-if="f.desc" trigger="hover" placement="top">
                      <template #trigger><span class="form-label-help"><iconify-icon icon="material-symbols:help-outline" style="font-size:15px"></iconify-icon></span></template>
                      {{ f.desc }}
                    </n-tooltip>
                  </span>
                  <n-checkbox-group
                    v-if="f.type === 'CHOICE' && opFormAppChoice(tab.tapNovaName, f.field) && opFormAppChoice(tab.tapNovaName, f.field).showType === 'RADIO' && opFormAppChoice(tab.tapNovaName, f.field).selectType === 'MULTI'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)">
                    <n-space><n-checkbox v-for="o in opFormAppFieldOpts(tab.tapNovaName, f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
                  </n-checkbox-group>
                  <n-radio-group
                    v-else-if="f.type === 'CHOICE' && opFormAppChoice(tab.tapNovaName, f.field) && opFormAppChoice(tab.tapNovaName, f.field).showType === 'RADIO'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)">
                    <n-space><n-radio v-for="o in opFormAppFieldOpts(tab.tapNovaName, f)" :key="o.value" :value="o.value" :label="o.label" /></n-radio-group>
                  <n-select
                    v-else-if="f.type === 'CHOICE' && opFormAppChoice(tab.tapNovaName, f.field) && opFormAppChoice(tab.tapNovaName, f.field).selectType === 'MULTI'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]" :options="opFormAppFieldOpts(tab.tapNovaName, f)"
                    :placeholder="'请选择' + f.title"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    multiple clearable @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-select
                    v-else-if="f.type === 'CHOICE'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]" :options="opFormAppFieldOpts(tab.tapNovaName, f)"
                    :placeholder="'请选择' + f.title"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    clearable @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-select
                    v-else-if="f.type === 'BOOLEAN'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]" :options="[{label:'是',value:'true'},{label:'否',value:'false'}]"
                    :placeholder="'请选择' + f.title"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    clearable @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-input-number
                    v-else-if="f.type === 'NUMBER'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    :placeholder="'请输入' + f.title" :show-button="false" style="width:100%"
                    :min="opFormAppNumInfo(tab.tapNovaName, f.field).min"
                    :max="opFormAppNumInfo(tab.tapNovaName, f.field).max"
                    :precision="opFormAppNumInfo(tab.tapNovaName, f.field).type === 'DECIMAL' ? (opFormAppNumInfo(tab.tapNovaName, f.field).decimal || 2) : 0"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    clearable @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-date-picker
                    v-else-if="f.type === 'DATE'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    :type="opFormAppDateType(tab.tapNovaName, f.field)"
                    :placeholder="'请选择' + f.title"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    clearable style="width:100%"
                    @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-select
                    v-else-if="f.type === 'TAG'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    :options="opFormAppTagOpts(tab.tapNovaName, f.field)"
                    :placeholder="'请输入或选择' + f.title"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    filterable multiple clearable
                    @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-input
                    v-else-if="f.type === 'TEXTAREA'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    type="textarea" :autosize="{minRows:3}"
                    :placeholder="'请输入' + f.title"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <div v-else-if="f.type === 'REFERENCE' && opFormAppChoice(tab.tapNovaName, f.field) === null"
                    style="cursor:pointer"
                    @click="openOpAppReferenceModal(tab.tapNovaName, f)">
                    <n-input
                      :value="opFormAppData(tab.tapNovaName)[f.field + '_display'] || opFormAppData(tab.tapNovaName)[f.field]"
                      :placeholder="'请选择' + f.title" readonly clearable
                      @clear.stop="opFormAppSetFd(tab.tapNovaName, f.field, null); opFormAppSetFd(tab.tapNovaName, f.field + '_display', '')">
                      <template #suffix><iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon></template>
                    </n-input>
                  </div>
                  <div v-else-if="f.type === 'ATTACHMENT'" class="attachment-field"
                    :style="'grid-column:1/-1'"
                    @mouseenter="attachmentDropdownKey = 'opApp_' + tab.tapNovaName + '_' + f.field"
                    @mouseleave="attachmentDropdownKey = null">
                    <div class="attachment-btn">
                      <iconify-icon icon="mdi:paperclip" style="font-size:13px"></iconify-icon>附件管理
                      <iconify-icon icon="mdi:chevron-down" :style="'font-size:12px;transition:transform .2s ease;transform:' + (attachmentDropdownKey === 'opApp_' + tab.tapNovaName + '_' + f.field ? 'rotate(180deg)' : 'rotate(0deg)')"></iconify-icon>
                    </div>
                    <transition name="dropdown-fade">
                      <div v-if="attachmentDropdownKey === 'opApp_' + tab.tapNovaName + '_' + f.field"
                        :class="'attachment-dropdown' + ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field] && (opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field].showType === 'DOWN' ? ' down' : '')">
                        <div class="attachment-dropdown-inner">
                          <label v-if="!((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]) || !((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]).maxLimit || (opFormAppData(tab.tapNovaName)[f.field] || []).length < ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]).maxLimit"
                            class="attachment-dropdown-item"
                            :for="'upload-opApp-' + tab.tapNovaName + '-' + f.field">
                            <iconify-icon icon="mdi:upload" style="font-size:13px"></iconify-icon>
                            上传文件{{ ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]) && ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]).maxLimit ? '（共' + (((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]).maxLimit - (opFormAppData(tab.tapNovaName)[f.field] || []).length) + '个）' : '' }}
                            <input :id="'upload-opApp-' + tab.tapNovaName + '-' + f.field" type="file" style="display:none"
                              :multiple="((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]) && ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]).maxLimit > 1"
                              @change="handleOpAppAttachmentChange(tab.tapNovaName, f, $event)" />
                          </label>
                          <div v-if="(opFormAppData(tab.tapNovaName)[f.field] || []).length > 0"
                            class="attachment-dropdown-item"
                            @click="openPreview(f, tab.tapNovaName)">
                            <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>
                            查看文件（共{{ (opFormAppData(tab.tapNovaName)[f.field] || []).length }}个）
                          </div>
                          <div v-else class="attachment-dropdown-item attachment-disabled">
                            <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>查看文件（共0个）
                          </div>
                        </div>
                      </div>
                    </transition>
                  </div>
                  <n-input
                    v-else
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    :placeholder="'请输入' + f.title"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    clearable @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <span v-if="opFormAppErrors(tab.tapNovaName)[f.field]" class="form-error-tip">{{ opFormAppErrors(tab.tapNovaName)[f.field] }}</span>
                </div>
              </template>
            </div>
          </n-tab-pane>
        </n-tabs>
        <template #footer>
          <n-space justify="end">
            <n-button @click="closeOpForm">取 消</n-button>
            <n-button type="primary" @click="submitOpForm">确 定</n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- 双表视图右面板：Teleport 到 .page-content 作为 flex 兄弟元素 -->
      <Teleport to=".page-content" v-if="(dualTableViewActive || dualTableClosing) && dualTableEnabled && dualTableCurrentNova">
        <nova-table ref="dualTableRef" :key="dualTableCurrentKey" :dual-mode="true" :link-mode="isDualTableLink" :nova-name-prop="dualTableCurrentNova" :source-nova-name-prop="novaName" :source-fields-prop="dualTableSourceFields" class="dual-right-panel" :class="{ 'is-open': dualTableViewActive && !dualTableClosing, 'is-closing': dualTableClosing }" @link-add="handleDualLinkAdd" />
      </Teleport>
    </div>
  `
}

NovaTable.components = { NovaTable }

window.NovaTable = NovaTable
})()
