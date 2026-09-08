// pages/table.js — 通用表格页 Vue 组件，所有表格菜单共用此模板
;(function () {
const { h } = Vue
const { NPopconfirm, NSpace, NTooltip, NTag, NRadio, NDropdown, NButtonGroup, NButton } = naive
const NovaImagePreview = window.NovaImagePreview

// 点路径取值，row 为普通 Map 时按 'a.b.c' 逐层下钻
function getFieldValue(row, path) {
  if (row == null) return undefined
  var parts = String(path || '').split('.')
  var val = row
  for (var i = 0; i < parts.length; i++) {
    if (val === null || val === undefined) return undefined
    val = val[parts[i]]
  }
  return val
}
const NovaRollNumber   = window.NovaRollNumber

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

// 全局字段展示格式化工具（只读详情面板复用：LINK 树节点详情、REFERENCE 预览等）
window.NovaFieldView = (function() {
  function fmtDate(ts, type) {
    var d = new Date(ts)
    var p = function(n) { return String(n).padStart(2, '0') }
    if (type === 'YEAR')  return String(d.getFullYear())
    if (type === 'YEAR_MONTH') return d.getFullYear() + '-' + p(d.getMonth() + 1)
    if (type === 'DATE')  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
           p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
  }
  function format(f, val, ctx) {
    ctx = ctx || {}
    var choiceMap    = ctx.choiceMap    || {}
    var dateMap      = ctx.dateMap      || {}
    var numberMap    = ctx.numberMap    || {}
    var referenceMap = ctx.referenceMap || {}
    if (val === null || val === undefined || val === '') return ''
    var type = f.type
    // CHOICE: 翻译 value → label
    if (type === 'CHOICE') {
      var ci = choiceMap[f.field]
      if (ci) {
        var vals = ci.selectType === 'MULTI' ? String(val).split(',') : [String(val)]
        return vals.map(function(v) {
          var o = (ci.values || []).find(function(x) { return x.value === v })
          return o ? o.label : v
        }).join('、')
      }
      return String(val)
    }
    // DATE: 按 dateMap.type 格式化时间戳
    if (type === 'DATE') {
      var ts = Number(val)
      if (!ts || isNaN(ts)) return String(val)
      var di = dateMap[f.field]
      return fmtDate(ts, di && di.type)
    }
    // BOOLEAN: 是 / 否
    if (type === 'BOOLEAN') {
      return (val === 'true' || val === true) ? (window.__t ? window.__t('common.yes') : '是') : (window.__t ? window.__t('common.no') : '否')
    }
    // TAG: 数组或逗号串拼接
    if (type === 'TAG') {
      return Array.isArray(val) ? val.join('、') : String(val).split(',').filter(Boolean).join('、')
    }
    // REFERENCE: 取 _display
    if (type === 'REFERENCE') {
      return String((ctx.formData && ctx.formData[f.field + '_display']) || val)
    }
    // LINK / APPENDAGE: 取 _display
    if (type === 'LINK' || type === 'APPENDAGE') {
      var d = (ctx.formData && ctx.formData[f.field + '_display'])
      return d ? String(d) : String(val)
    }
    // NUMBER: 按 numberMap.format 格式化
    if (type === 'NUMBER') {
      var ni = numberMap[f.field]
      var n = Number(val)
      if (isNaN(n)) return String(val)
      if (ni && ni.format) {
        var parts = ni.format.split('.')
        var decimals = parts.length > 1 ? parts[1].length : 0
        return n.toFixed(decimals)
      }
      return String(n)
    }
    // ATTACHMENT: 文件名 / 数量提示（具体预览走 NovaAttachmentPreview）
    if (type === 'ATTACHMENT') {
      if (Array.isArray(val)) return val.length ? val.length + ' 个文件' : ''
      return String(val)
    }
    // 默认纯文本
    return String(val)
  }
  return { format: format }
})()

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

  // 工具函数：将表单字段 + 数据转为 List<FormInfo>
  function _buildFormInfoList(fields, data, refMap, attachmentMap) {
    var fm = refMap || {}
    var am = attachmentMap || {}
    return (fields || []).filter(function(f) { return f.type !== 'DIVIDE' && f.type !== 'EMPTY' }).map(function(f) {
      var val = data[f.field]
      var strVal
      if (val === null || val === undefined || val === '') {
        strVal = ''
      } else if (Array.isArray(val)) {
        if (f.type === 'ATTACHMENT') {
          var sep = (am[f.field] || {}).separator
          strVal = sep != null ? val.join(sep) : ''
        } else {
          strVal = val.join(',')
        }
      } else {
        strVal = String(val)
      }
      var item = { field: f.field, value: strVal, type: f.type }
      if (f.type === 'REFERENCE') {
        var refInfo = fm[f.field] || {}
        if (refInfo.referenceField) item.reference = { field: refInfo.referenceField }
      }
      return item
    })
  }

  // 工具函数：父级值变化时，自动选中子级第一个匹配选项，无匹配则清空
  function clearCascadeChildren(formData, choiceMap, parentField) {
    var parentVal = formData[parentField]
    for (var key in choiceMap) {
      var choice = choiceMap[key]
      if (choice.refChoice === parentField) {
        if (parentVal != null && parentVal !== '' && !(Array.isArray(parentVal) && !parentVal.length)) {
          // 有父值 → 尝试自动选中第一个匹配的子选项
          var matched = (choice.values || []).filter(function(v) {
            return Array.isArray(parentVal) ? parentVal.includes(v.refValue) : v.refValue === parentVal
          })
          if (matched.length) {
            var firstVal = matched[0].value
            formData[key] = choice.selectType === 'MULTI' ? [firstVal] : firstVal
          } else {
            formData[key] = choice.selectType === 'MULTI' ? [] : null
          }
        } else {
          // 父级为空 → 清空
          formData[key] = choice.selectType === 'MULTI' ? [] : null
        }
        if (typeof formData[key + '_display'] !== 'undefined') {
          formData[key + '_display'] = ''
        }
        // 递归处理孙级
        clearCascadeChildren(formData, choiceMap, key)
      }
    }
  }

  // ────────────────────────────────────────────────────────────────

const NovaTable = {
  name: 'NovaTable',
  components: { NovaFormThis: window.NovaFormThis, NovaImagePreview: NovaImagePreview, NovaRollNumber: NovaRollNumber, NovaFileList: window.NovaFileList },

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
    sourceFieldsProp:       { type: Object,  default: () => ({}) },
    refReferenceFieldsProp: { type: Object,  default: () => ({}) }
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
      refBuildMeta:       {},   // 嵌套字段子表元数据缓存：refNovaName → /build 响应
      refBuildMetaLoading: {}, // 嵌套字段子表元数据加载中标记
      refPickerField: null,
      refPickerRow:   null,
      refPickerData:  [],
      refPickerLoading: false,
      refPickerColumns: [],
      refPickerStack: [],      tableWrapperWidth: 0,
      novaName:       '',
      novaIdFieldName:    null,
      tableData:      [],
      rawTableData:   [],
      tableColumns:   [],
      sortStates:     {},
      filterExpanded: false,
      checkedRowKeys: [],
      expandedRowKeys: [],
      isTree: false,
      treeLoadingKeys: [],
      rawTreeData: [],
      treeNodeMap: {},
      treeParentMap: {},
      treeSearchKeyword: '',
      treeSearchHitKeys: new Set(),
      treeCascade:      false,
      treeParentField: '',
      treeStorageField: '',
      treeSearchField: '',
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
      editAppendageTabs:   [],
      editExtraTabs:       [],
      rawDetailRow:       null,
      appendageTabBuild:   {},
      appendageFormData:   {},
      appendageFormErrors: {},
      appendageDetailsLoaded: {},
      appendageTabReady: {},
      editLayout:     'DEFAULT',
      linkMap:        {},
      drills:         [],  // drill 配置数组：[{ dualTableTitle, linkNovaName, column, joinColumn }]
      linkTargetInfo: {},
      popMap:         {},  // pop 弹窗配置：字段名 → { title, param, handleName }
      popActiveKey:   '',  // 当前打开 popover 的 "行主键@列field"，用于精确定位单行单元格
      popTooltipShow: {},  // 每行 pop 列完整内容 tooltip 是否显示（仅文本溢出时 true）
      tipShow:        false,  // 顶部提示面板是否展开
      tipHideTimer:   null,   // 收起延时器，划过边界时 200ms 延迟再关
      tipHtml:        '',     // 顶部提示面板内容（HTML）；由 /build 响应的 tooltip 字段填充，为空则不显示小三角
      popTitle:       '',
      popLoading:     false,
      popList:        [],  // [{ type, name, value }]
      linkTabBuild:     {},
      linkFormData:     {},
      linkPickerShow:            false,
      linkPickerTargetNova:       '',
      linkPickerCurrentTab:       '',
      linkPickerSelectedKeys:     [],
      linkPickerSourceFields:     {},
      linkPickerTitle:            '',
      // ── linkTree 模式 ──────────────────────────────────────────
      linkTreeData:             {},   // { [tapNovaName]: treeNode[] }   全量树数据
      linkTreeFilteredData:     {},   // { [tapNovaName]: treeNode[] }   搜索过滤后的树数据
      linkTreeDefaultExpandedKeys: {}, // { [tapNovaName]: any[] }        默认展开的 key（来自 treeLevel）
      linkTreeExpandedKeys:     {},   // { [tapNovaName]: any[] }        当前展开的 key
      linkTreeCheckedKeys:      {},   // { [tapNovaName]: Set }          所有勾选的 key
      linkTreeDisplayKeys:      {},   // { [tapNovaName]: string[] }     展示的勾选 key
      linkTreeLoading:          {},   // { [tapNovaName]: boolean }      加载中
      linkTreeSearchKeyword:    {},   // { [tapNovaName]: string }       搜索关键词
      linkTreeNodeMap:          {},   // { [tapNovaName]: { key: node }} 节点快速查找
      dualTableViewActive:        false,
      dualTableClosing:           false,
      _dualReloading:             false,
      dualTableCurrentKey:        '',
      dualTableCurrentNova:       '',
      dualTableCurrentSubId:      '',
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
      opFormButtons:    {},
      opFormBtn:      null,
      opFormRow:      null,
      // ── TPL 自定义模板弹窗/抽屉 ──
      tplModalShow:       false,
      tplDrawerShow:      false,
      tplUrl:             '',
      tplTitle:           '',
      tplDrawerSize:      '50%',
      tplDrawerPlacement: 'right',
      // opForm tab 相关
      opFormTab:          'form',
      opFormTabTitle:     '',      // 后端 thisForm.tapTitle 透传，未传则前端 i18n 兜底
      opFormExtraTabs:    [],      // APPENDAGE 表单 tab
      opFormAppTabBuild:  {},      // 附属表单 build 数据
      opFormAppFormData:  {},      // 附属表单数据
      opFormAppFormErrors:{},      // 附属表单校验错误
      // EDITOR (Tiptap) 实例管理
      _opEditorHosts:     new Map(),     // key 'main:field' / 'app:<nova>:field' -> DOM element
      _opEditorToolbars:  new Map(),     // key -> toolbar DOM element
      _opEditorInstances: new Map(),     // key -> rec { editor, destroy }
      formErrors:     {},
      striped:        localStorage.getItem('nova-table-striped') !== null
                        ? localStorage.getItem('nova-table-striped') === 'true'
                        : false,
      tableSize:      localStorage.getItem('nova-table-size') || 'medium',
      cellOverflow:   localStorage.getItem('nova-table-cell-overflow') || 'ellipsis',
      rowDblclickEdit:localStorage.getItem('nova-table-row-dblclick-edit') === 'true',
      loadingStyle:   localStorage.getItem('nova-table-loading-style') || 'spinner',
      novaLoadingHtml: (window.NovaLoading && window.NovaLoading.html) ? window.NovaLoading.html() : '',
      pageSize:       10,
      pageSizes:      [10, 20, 50, 100],
      loading:          false,
      buildLoading:       true,   // 主表 /build 构建中，显示 loading 覆盖层（首帧即遮住表格；整页加载阶段由 setBuildLoading 关闭，避免与首屏 loading 重叠）
      previewModalShow: false,
      previewField:     null,
      previewAppNovaName: null,
      previewIndex:     0,
      previewIsOpForm:  false,
      slideDirection:  'right',
      // 表格附件预览弹窗
      tableAttachPreviewShow: false,
      tableAttachPreviewField: null,
      tableAttachPreviewUrls: [],
      tableAttachPreviewType: null,
      tableAttachPreviewIndex: 0,
      videoHoverIdx: -1,
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
        showSizePicker:  false,
        pageSizes:       [10, 20, 50, 100].map(n => ({ label: window.__t('table.items_per_page', { n: n }), value: n })),
        showQuickJumper: false,
        showPageSize:    false,
        showPrev:        false,
        showNext:        false
      }
    }
  },

  computed: {
    isDark() {
      return window.__appDarkMode ? window.__appDarkMode.value : false
    },
    canDblclickEdit() {
      if (this.readonly || this.linkMode) return false
      if (!this.rowDblclickEdit) return false
      var w = window
      return typeof w.__hasButton === 'function' && w.__hasButton(this.novaName || this.novaNameProp, 'edit')
    },
    embSize() { return undefined },
    isMainNovaView() {
      // 主 nova 表格视图：排除 viewMode / pickerMode / embeddedMode / linkMode / dualMode
      return !this.viewMode && !this.pickerMode && !this.embeddedMode && !this.linkMode && !this.dualMode
    },
    showNovaTip() {
      // 仅在主 nova 表格视图且 tipHtml 非空时显示顶部提示
      return this.isMainNovaView && !!this.tipHtml
    },
    tapSearchOptions() {
      const f = this.tapSearchField
      if (!f) return []
      const info = this.choiceMap[f.field] || {}
      const vals = info.values || []
      const opts = vals.map(v => ({ value: v.value, label: v.label }))
      if (f.tapSearch && f.tapSearch.showAll) opts.unshift({ value: null, label: window.__t('table.all') })
      return opts
    },
    isEmbTab() {
      if (!this.formTab) return false
      if (this.formTab.startsWith('emb_')) return true
      if (this.formTab.startsWith('link_')) return true
      return false
    },
    dualTableSubTables() {
      const list = []
      const appendageMap = this.appendageMap || {}
      for (const field in appendageMap) {
        const info = appendageMap[field]
        if (info && info.dualTable) {
          const novaName = info.referenceName
          list.push({ id: 'appendage:' + novaName, label: info.dualTableTitle || novaName, novaName, type: 'appendage', field, fieldInfo: info })
        }
      }
      const linkMap = this.linkMap || {}
      for (const field in linkMap) {
        const info = linkMap[field]
        if (info && info.dualTable) {
          const novaName = info.referenceName
          list.push({ id: 'link:' + novaName, label: info.dualTableTitle || novaName, novaName, type: 'link', field, fieldInfo: info })
        }
      }
      const drills = this.drills || []
      for (var i = 0; i < drills.length; i++) {
        var info = drills[i]
        if (info && info.show !== false) {
          const novaName = info.linkNovaName
          list.push({ id: 'drill:' + novaName, label: info.dualTableTitle, novaName, type: 'drill', field: i, fieldInfo: info })
        }
      }
      return list
    },
    dualTableEnabled() {
      return this.dualTableSubTables.length > 0 && !this.pickerMode && !this.embeddedMode
    },
    // 双表视图右面板样式：flex 布局属性，不设 height，由 JS 动态同步
    dualPanelStyle() {
      return {
        flex: '0 0 50%',
        width: '50%',
        padding: '16px 16px 4px 8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }
    },
    // 自定义按钮分类
    rowCustomButtons() {
      return window.NovaTableButtons.filterRowCustomButtons(this.rowOperations)
    },
    rowActionColWidth() {
      return window.NovaTableButtons.calcRowActionColWidth(this.linkMode, this.rowOperations, this.novaName, this.readonly, this.sysBtnHide)
    },
    toolbarCustomButtons() {
      return window.NovaTableButtons.filterToolbarCustomButtons(this.rowOperations)
    },
    toolbarUnfoldedButtons() {
      return this.toolbarCustomButtons.slice(0, 1)
    },
    toolbarFoldedButtons() {
      return this.toolbarCustomButtons.slice(1)
    },
    toolbarFoldedOptions() {
      var self = this
      return window.NovaTableButtons.buildFoldedOptions(this.toolbarFoldedButtons, function(btn) {
        return (btn.mode === 'MULTI' || btn.mode === 'MULTI_ONLY') && self.checkedRowKeys.length === 0
      })
    },
    isDualTableLink() {
      if (!this.dualTableViewActive) return false
      const sub = this.dualTableSubTables.find(s => s.id === this.dualTableCurrentSubId)
      return sub && sub.type === 'link'
    },
    isDualTableDrill() {
      if (!this.dualTableViewActive) return false
      const sub = this.dualTableSubTables.find(s => s.id === this.dualTableCurrentSubId)
      return sub && sub.type === 'drill'
    },
    tbStandardShow() {
      return window.NovaTableButtons.toolbarStandardShow(this)
    },
    // 列宽像素：checkbox 50 + 操作列 + 数据列
    // 后端列宽总和 < 100% 时补全铺满，≥ 100% 时原样渲染（出现滚动条）
    // 补全策略：未设宽度的列视为弹性列，剩余空间优先平均分给它们
    // 双表模式：容器变窄，同样配置可能出现滚动条，属正常现象，不做特殊处理
    colPixels() {
      const fixedPx = 50 + this.rowActionColWidth
      const width = this.tableWrapperWidth || 1200
      const available = Math.max(width - fixedPx, 0)

      // 分类：有明确百分比的列 / 未设宽度的弹性列 / 固定像素列
      let specifiedPct = 0
      let flexCount = 0
      this.tableColumns.forEach(function(col) {
        if (!col.width) {
          flexCount++          // 未设宽度 → 弹性列
        } else {
          const w = parseWidthPct(col.width)
          if (w > 0) specifiedPct += w  // 百分比列累加
          // w < 0 是固定像素列，不参与百分比分配
        }
      })

      // 弹性列分到的百分比：剩余空间平均分配
      let flexPct = 0
      if (specifiedPct < 100 && flexCount > 0) {
        flexPct = (100 - specifiedPct) / flexCount
      }

      // 放大比率（无弹性列且不足 100% 时等比放大）
      const ratio = flexCount === 0 && specifiedPct > 0 && specifiedPct < 100
        ? 100 / specifiedPct
        : 1

      const widths = this.tableColumns.map(function(col) {
        if (!col.width) {
          // 弹性列：分到平均宽度
          return Math.round(flexPct / 100 * available)
        }
        const w = parseWidthPct(col.width)
        if (w < 0) return -w // 固定像素列直接返回
        return Math.round(w * ratio / 100 * available)
      })

      // 双表模式：列宽等比缩放（系数由各表 build 返回）
      if ((this.dualMode || this.dualTableViewActive) && this.dualShrink && this.dualShrink !== 1) {
        return widths.map(function(w) { return Math.round(w * this.dualShrink) }.bind(this))
      }
      return widths
    },

    treeSearchFieldTitle() {
      if (!this.treeSearchField || !this.tableColumns.length) return window.__t('table.search')
      var col = this.tableColumns.find(function(c) { return c.field === this.treeSearchField }, this)
      return col ? col.title : window.__t('table.search')
    },

    scrollX() {
      if (!this.tableColumns.length) return undefined
      const fixedPx = 50 + this.rowActionColWidth
      const total = fixedPx + this.colPixels.reduce((s, w) => s + w, 0)
      // 双表视图激活时，用实际容器宽度判断滚动条（保持列宽不变）
      let container = this.tableWrapperWidth || 0
      if (this.dualTableViewActive) {
        const $wrapper = document.querySelector('#table-wrapper')
        if ($wrapper) container = $wrapper.clientWidth
      } else if (this.dualMode) {
        const $panel = document.querySelector('.dual-right-panel')
        if ($panel) container = $panel.clientWidth
      }
      return total > container ? total : undefined
    },

    filteredData() {
      return this.tableData
    },

    previewFileList() {
      if (!this.previewField) return []
      if (this.previewIsOpForm) {
        if (this.previewAppNovaName) return (this.opFormAppFormData[this.previewAppNovaName] || {})[this.previewField.field] || []
        return this.opFormData[this.previewField.field] || []
      }
      if (this.previewAppNovaName) return (this.appendageFormData[this.previewAppNovaName] || {})[this.previewField.field] || []
      return this.formData[this.previewField.field] || []
    },
    previewAttachCfg() {
      if (!this.previewField) return {}
      if (this.previewIsOpForm) {
        if (this.previewAppNovaName) return (this.opFormAppBuild(this.previewAppNovaName).attachmentMap || {})[this.previewField.field] || {}
        return this.opFormAttachmentMap[this.previewField.field] || {}
      }
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
    opFormSections() {
      var seen  = {}
      var order = []
      var map   = {}
      this.visibleOpFormFields.forEach(function(item) {
        var g = (item.field && item.field.group) || ''
        if (!seen[g]) {
          seen[g] = true
          order.push(g)
          map[g] = []
        }
        map[g].push(item)
      })
      return order.map(function(g) {
        return { key: g || '__ungrouped__', title: g || '', items: map[g] }
      }).filter(function(sec) {
        return sec.items.some(function(it) { return it.visible })
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
          cols.push({ type: 'selection', title: '', key: 'selection', width: 50, disabled: (row) => vm.isRowSelectDisabled(row) })
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
        // dualMode 下即使 readonly 也保留复选框列，保持与 appendages 等子表格式统一（纯展示无实际操作）
        cols.push({ type: 'selection', title: '', key: 'selection', width: 50, disabled: (row) => vm.isRowSelectDisabled(row) })
      } else if (vm.dualMode && !vm.linkMode) {
        cols.push({ type: 'selection', title: '', key: 'selection', width: 50 })
      }

      this.tableColumns.forEach((col, index) => {
        const isTreeTable = vm.isTree
        const colDef = {
          key:       col.field,
          width:     col.width || undefined,
          title:     col.title,
          resizable: true,
          ellipsis:  vm.cellOverflow === 'ellipsis' ? { tooltip: true } : false
        }

        // 嵌套字段（REFERENCE/APPENDAGE 引用子表属性）：读取子表元数据（响应式），
        // 元数据未就绪时由下方逻辑渲染 loading 占位；规则渲染与主表一致，仅换用子表映射
        const dotIdx2 = col.field.indexOf('.')
        const propKey = dotIdx2 > -1 ? col.field.slice(dotIdx2 + 1) : col.field
        let subMeta = null
        let subLoading = false
        if (col.refNovaName) {
          subMeta = vm.refBuildMeta && vm.refBuildMeta[col.refNovaName]
          subLoading = !subMeta && !!(vm.refBuildMetaLoading && vm.refBuildMetaLoading[col.refNovaName])
        }

        if (index === 0 && isTreeTable) {
          colDef.ellipsis = false
          colDef.cellProps = () => ({ style: { paddingLeft: 0 } })
          if (vm.pickerMode) {
            colDef.tree = true
          }
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
            const val = getFieldValue(row, col.field)
            if (val === null || val === undefined || val === '') return ''
            const tags = String(val).split(',').map(t => t.trim()).filter(Boolean)
            const visible = tags.slice(0, 1)
            const rest = tags.length - 1
            const nodes = visible.map(t => h('span', { style: 'flex-shrink:0;display:inline-block;padding:1px 6px;border-radius:3px;font-size:12px;background:rgba(37,99,235,0.08);color:#2563eb' }, t))
            if (rest > 0) nodes.push(h(NTooltip, { trigger: 'hover' }, {
              trigger: () => h('span', { style: 'flex-shrink:0;cursor:default;font-size:12px;color:#888;padding:2px 6px;background:rgba(128,128,128,0.1);border-radius:3px' }, '+' + rest),
              default: () => tags.slice(1).join('，')
            }))
            return h('span', { style: 'display:inline-flex;gap:4px;align-items:center' }, nodes)
          }
        }

        if (col.type === 'ICON') {
          colDef.render = (row) => {
            const val = getFieldValue(row, col.field)
            if (val === null || val === undefined || val === '') return ''
            const iconStr = String(val)
            return h(NTooltip, { trigger: 'hover', placement: 'top' }, {
              default: () => iconStr,
              trigger: () => h('iconify-icon', { icon: iconStr, style: 'font-size:18px;display:inline-flex;align-items:center' })
            })
          }
        }

        if (col.type === 'BOOLEAN') {
          colDef.render = (row) => {
            const val = getFieldValue(row, col.field)
            if (val === null || val === undefined || val === '') return ''
            const isTrue = String(val).toLowerCase() === 'true'
            // 嵌套字段使用子表元数据决定展示方式；SWITCH 渲染为只读开关（嵌套字段不支持行内更新子表）
            const bInfo = col.refNovaName && subMeta
              ? ((subMeta.booleanInfo || {})[propKey])
              : (vm.booleanMap && vm.booleanMap[col.field])
            if (bInfo && (bInfo.tableType === 'SWITCH' || bInfo.tableType === 'SEGMENT')) {
              const novaName = vm.novaName
              const novaIdField = vm.novaIdFieldName
              const editField = (vm.editFields || []).find(function(f) { return f.field === col.field })
              var rowEditHidden = (vm.sysBtnHide || {}).edit && window.evalShowExpr((vm.sysBtnHide || {}).edit, row)
              const disabled = !editField || (editField.readonly && editField.readonly.edit) || !window.__hasButton(vm.novaName, 'edit') || rowEditHidden
              if (bInfo.tableType === 'SEGMENT') {
                const loadKey = (vm.embeddedMode || vm.dualMode) ? vm._vmKey : novaName
                const segSet = disabled ? undefined : (newVal) => {
                  window.fetchApi.post('/nova/table/update', { novaName, formInfo: [{ field: novaIdField, value: String(row[novaIdField]), type: '' }, { field: col.field, value: newVal, type: 'BOOLEAN' }] }).then((resp) => { if (window.$message) window.$message.success(window.__t('table.op_success')); window.NovaTableJQ.loadData(loadKey) })
                }
                return h(NButtonGroup, { size: 'small' }, {
                  default: () => [
                    h(NButton, { type: isTrue ? 'primary' : 'default', disabled, onClick: () => segSet && segSet('true') }, { default: () => window.__t('common.yes') }),
                    h(NButton, { type: isTrue ? 'default' : 'primary', disabled, onClick: () => segSet && segSet('false') }, { default: () => window.__t('common.no') })
                  ]
                })
              }
              // SWITCH
              const isDark = document.body.classList.contains('dark')
              const offBg = isDark ? '#444' : '#d9d9d9'
              if (col.refNovaName) {
                // 嵌套开关：禁用、不可点击
                return h('span', { style: `display:inline-block;vertical-align:middle;width:44px;height:22px;border-radius:11px;background:${isTrue ? '#006be6' : offBg};position:relative;cursor:not-allowed;opacity:0.5;flex-shrink:0` }, [
                  h('span', { style: `position:absolute;top:0;${isTrue ? 'left:0;right:20px' : 'right:0;left:20px'};bottom:0;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;user-select:none` }, isTrue ? window.__t('common.yes') : window.__t('common.no')),
                  h('span', { style: `position:absolute;top:3px;left:${isTrue ? '26px' : '3px'};width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2)` })
                ])
              }
              const newVal = isTrue ? 'false' : 'true'
              const loadKey = (vm.embeddedMode || vm.dualMode) ? vm._vmKey : novaName
              const onClick = disabled ? undefined : () => {
                window.fetchApi.post('/nova/table/update', { novaName, formInfo: [{ field: novaIdField, value: String(row[novaIdField]), type: '' }, { field: col.field, value: newVal, type: 'BOOLEAN' }] }).then((resp) => { if (window.$message) window.$message.success(window.__t('table.op_success')); window.NovaTableJQ.loadData(loadKey) })
              }
              return h('span', { style: `display:inline-block;vertical-align:middle;width:44px;height:22px;border-radius:11px;background:${isTrue ? '#006be6' : offBg};position:relative;cursor:${disabled ? 'not-allowed' : 'pointer'};opacity:${disabled ? '0.5' : '1'};flex-shrink:0;transition:background .2s`, onClick }, [
                h('span', { style: `position:absolute;top:0;${isTrue ? 'left:0;right:20px' : 'right:0;left:20px'};bottom:0;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;user-select:none` }, isTrue ? window.__t('common.yes') : window.__t('common.no')),
                h('span', { style: `position:absolute;top:3px;left:${isTrue ? '26px' : '3px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)` })
              ])
            }
            const color = isTrue ? '#18a058' : '#d03050'
            return h('span', { style: 'display:inline-block;padding:1px 6px;border-radius:3px;font-size:12px;background:' + color + '20;color:' + darkenHex(color, 0.15) }, isTrue ? window.__t('common.yes') : window.__t('common.no'))
          }
        }

        if (col.type === 'CHOICE') {
          colDef.render = (row, rowIndex) => {
            // 嵌套字段：translateRecords 已将 label 写入 col.field（扁平 key），优先取；否则解析嵌套原始值
            const flatVal = row[col.field]
            const text = (flatVal !== undefined && flatVal !== null) ? flatVal : getFieldValue(row, col.field)
            if (text === null || text === undefined || text === '') return text
            const colorData = row._colors && row._colors[col.field]
            const choice = col.refNovaName && subMeta
              ? ((subMeta.choice || {})[propKey])
              : (vm.choiceMap && vm.choiceMap[col.field])
            const isMulti = choice && choice.selectType === 'MULTI'
            const makeTag = (label, color) => {
              const bg = color ? color + '20' : 'rgba(128,128,128,0.1)'
              const tc = color ? darkenHex(color, 0.35) : 'inherit'
              return h('span', { style: 'display:inline-block;padding:1px 6px;border-radius:3px;font-size:12px;background:' + bg + ';color:' + tc }, label)
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
            if (v === null || v === undefined) return ''
            const s = String(v)
            if (!s) return ''
            if (/<[a-z]+[\s>]/i.test(s)) return h('span', { innerHTML: s })
            return s
          }
        }

        if (col.type === 'APPENDAGE') {
          colDef.render = (row) => {
            const v = row[col.field + '_display']
            if (v === null || v === undefined) return ''
            const s = String(v)
            if (!s) return ''
            if (/<[a-z]+[\s>]/i.test(s)) return h('span', { innerHTML: s })
            return s
          }
        }

        if (col.type === 'DATE') {
          colDef.render = (row) => {
            const ts = getFieldValue(row, col.field)
            if (ts === null || ts === undefined || ts === '') return ''
            const dateInfo = col.refNovaName && subMeta
              ? ((subMeta.date || {})[propKey])
              : (vm.dateMap && vm.dateMap[col.field])
            const type = dateInfo && dateInfo.type
            const d = new Date(ts)
            const p = n => String(n).padStart(2, '0')
            if (type === 'YEAR')       return String(d.getFullYear())
            if (type === 'YEAR_MONTH') return d.getFullYear() + '-' + p(d.getMonth() + 1)
            if (type === 'DATE')       return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
            if (type === 'TIME')       return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
            // DATE_TIME 及默认
            return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
                   p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
          }
        }

        if (col.type === 'ATTACHMENT') {
          colDef.render = (row) => {
            const val = getFieldValue(row, col.field)
            if (val === null || val === undefined || val === '') return ''
            const cfg = col.refNovaName && subMeta
              ? ((subMeta.attachment || {})[propKey])
              : (vm.attachmentMap && vm.attachmentMap[col.field])
            const sep = cfg && cfg.separator
            if (!sep) return ''
            const urls = String(val).split(sep).map(s => s.trim()).filter(Boolean)
            if (!urls.length) return ''
            const tableShowType = cfg && cfg.tableShowType ? cfg.tableShowType : 'TEXT'
            const isMulti = urls.length > 1
            const open = function() { vm.openTableAttachPreview({ field: col.field, title: col.title }, urls, tableShowType) }
            if (tableShowType === 'IMAGE') {
              // 图片预览：封装组件（首图缩略图 + N 徽标 + 内建预览 + 可选右上角删除按钮）
              return h(NTooltip, { trigger: 'hover', placement: 'top' }, {
                default: () => window.__t('table.click_view_detail'),
                trigger: () => h(NovaImagePreview, {
                  srcList: urls,
                  width: 20,
                  height: 20,
                  objectFit: 'cover',
                  showDelete: false
                })
              })
            }
            if (tableShowType === 'QR_CODE') {
              // 二维码预览：把文本转成 data URL，复用 NovaImagePreview（与普通图片同一组件）
              const qrSrcs = urls.map(function (t) { return window.NovaQRCode && window.NovaQRCode.toDataURL(t, 200) }).filter(Boolean)
              return h(NTooltip, { trigger: 'hover', placement: 'top' }, {
                default: () => window.__t('table.click_view_detail'),
                trigger: () => h(NovaImagePreview, {
                  srcList: qrSrcs,
                  width: 20,
                  height: 20,
                  objectFit: 'cover',
                  showDelete: false
                })
              })
            }
            if (tableShowType === 'VIDEO') {
              const badge = isMulti ? h('span', { style: 'flex-shrink:0;cursor:pointer;font-size:12px;color:#888;padding:2px 6px;background:rgba(128,128,128,0.1);border-radius:3px', onClick: open }, '+' + (urls.length - 1)) : null
              return h(NTooltip, { trigger: 'hover', placement: 'top' }, {
                default: () => window.__t('table.click_view_detail'),
                trigger: () => h('span', { style: 'display:inline-flex;align-items:center;gap:4px;cursor:pointer', onClick: open }, [
                  h('span', { style: 'display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:3px;background:#f0f0f0;font-size:14px' }, [
                    h('iconify-icon', { icon: 'mdi:play-circle-outline', style: 'color:#555' })
                  ]),
                  badge
                ])
              })
            }
            if (tableShowType === 'DIALOG') {
              return h(NTooltip, { trigger: 'hover', placement: 'top' }, {
                default: () => window.__t('table.click_view_detail'),
                trigger: () => h('span', { style: 'display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:3px;background:#f0f0f0;font-size:16px;cursor:pointer', onClick: open }, [
                  h('iconify-icon', { icon: 'mdi:paperclip', style: 'color:#888' })
                ])
              })
            }
            // TEXT：默认文本
            return val
          }
        }

        if (col.type === 'EDITOR') {
          colDef.render = (row) => {
            const val = getFieldValue(row, col.field)
            if (val === null || val === undefined || val === '') return ''
            return h(NTooltip, { trigger: 'hover', placement: 'top' }, {
              default: () => window.__t('table.preview_rich'),
              trigger: () => h('span', {
                class: 'cell-editor-preview',
                style: 'cursor:pointer;display:inline-flex;align-items:center;gap:4px;color:#2563eb',
                onClick: (e) => {
                  e.stopPropagation()
                  vm.openTableEditorPreview(col.title, val)
                }
              }, [
                h('iconify-icon', { icon: 'bi:filetype-html', width: 18 }),
                h('span', { style: 'font-size:12px' }, window.__t('common.preview'))
              ])
            })
          }
        }

        if (col.type === 'NUMBER') {
          const numInfo = vm.numberMap[col.field] || {}
          // roll=true：加载时滚动动画，挂载/值变化时从 0 递增到目标值
          if (numInfo.roll) {
            const decimals = numInfo.type === 'DECIMAL' ? (numInfo.decimal || 2) : 0
            colDef.render = (row) => {
              const val = getFieldValue(row, col.field)
              if (val === null || val === undefined || val === '') return ''
              const n = Number(val)
              if (isNaN(n)) return String(val)
              return h(NovaRollNumber, { value: n, decimals })
            }
          }
        }

        // 嵌套字段子表元数据未就绪：显示 loading 占位，就绪后 columns() 会重新求值并替换为规则渲染
        if (subLoading) {
          colDef.render = function() {
            return h('span', { style: 'display:inline-flex;align-items:center;color:#bbb' }, [
              h('span', { style: 'width:10px;height:10px;border:1.5px solid #ccc;border-top-color:transparent;border-radius:50%;display:inline-block;animation:refSpin .7s linear infinite' })
            ])
          }
        }

        // pop 可点击文本：pops 的 key 与列 field 直接匹配（含嵌套列如 testDemoView.id）。
        // 点击时在单元格位置弹出带箭头的 popover（n-popover trigger 模式），展示 getPopModel 返回的 name/value 列表
        if (!subLoading) {
          const popCfg = vm.popMap[String(col.field || '')]
          if (popCfg) {
            // 禁用 naive 的 ellipsis tooltip（避免与 popover 双弹层叠加），
            // 改用自实现的 NTooltip 显示完整内容，并在 pop 打开时禁用该 tooltip
            if (colDef.ellipsis && colDef.ellipsis.tooltip) {
              colDef.ellipsis = { tooltip: false }
            }
            const baseRender = colDef.render
            const NPopover = window.naive.NPopover
            const NTooltip = window.naive.NTooltip
            const fieldKey = col.field
            colDef.render = (row) => {
              // REFERENCE 等嵌套列后端平铺为 "外层.column" key；兼容平铺 key 与嵌套对象两种数据形态
              const raw = row[col.field] !== undefined ? row[col.field] : getFieldValue(row, col.field)
              const text = String(raw ?? '').trim()
              if (text === '') return ''
              const triggerNode = baseRender ? baseRender(row) : text
              // 以 行主键@列field 唯一标识单元格，避免仅按列匹配导致整列弹窗同时打开
              const rowKey = String(row[vm.novaIdFieldName] ?? '')
              const myKey = rowKey + '@' + fieldKey
              const popOpen = vm.popActiveKey === myKey
              return h(NPopover, {
                trigger: 'click',
                placement: 'bottom-start',
                style: 'max-width:420px',
                show: popOpen,
                onUpdateShow: (show) => {
                  if (show) {
                    vm.popActiveKey = myKey
                    vm.handlePopClick(popCfg, text, row)
                  } else {
                    vm.popActiveKey = ''
                  }
                }
              }, {
                trigger: () => h(NTooltip, {
                  trigger: 'manual',
                  placement: 'top',
                  show: vm.popTooltipShow[myKey] === true && !popOpen
                }, {
                  trigger: () => h('span', {
                    style: 'position:relative;display:block;width:100%;overflow:hidden;cursor:pointer',
                    onClick: (e) => e.stopPropagation(),
                    onMouseenter: (e) => {
                      const ic = e.currentTarget.querySelector('iconify-icon'); if (ic) ic.style.color = '#2563eb'
                      // 仅文本溢出时显示完整内容 tooltip（按单元格 myKey 隔离）
                      const textEl = e.currentTarget.querySelector('span')
                      vm.popTooltipShow[myKey] = !!(textEl && textEl.scrollWidth > textEl.clientWidth)
                    },
                    onMouseleave: (e) => {
                      const ic = e.currentTarget.querySelector('iconify-icon'); if (ic) ic.style.color = '#9ca3af'
                      vm.popTooltipShow[myKey] = false
                    }
                  }, [
                    h('span', { style: 'display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:18px' }, [triggerNode]),
                    h('iconify-icon', {
                      icon: 'material-symbols:visibility-outline',
                      style: 'position:absolute;right:0;top:50%;transform:translateY(-50%);font-size:14px;color:#9ca3af;transition:color .2s'
                    })
                  ]),
                  default: () => triggerNode
                }),
                default: () => vm.renderPopContent()
              })
            }
          }
        }

        cols.push(colDef)
      })

      // 兜底渲染：自动检测字符串是否含 HTML 标签
      cols.forEach(function(c) {
        if (c.render) return
        c.render = function(row) {
          var v = getFieldValue(row, c.key)
          if (v === null || v === undefined) return ''
          var s = String(v)
          if (!s) return ''
          if (/<[a-z]+[\s>]/i.test(s)) {
            return h('span', { innerHTML: s })
          }
          return s
        }
      })

      // defaultValue：值为空时显示默认文本
      ;(function() {
        var dvMap = {}
        vm.tableColumns.forEach(function(tc) { if (tc.defaultValue) dvMap[tc.field] = tc.defaultValue })
        if (Object.keys(dvMap).length) {
          cols.forEach(function(c) {
            var dv = dvMap[c.key]
            if (!dv) return
            var origRender = c.render
            c.render = function(row) {
              var v = getFieldValue(row, c.key)
              if (v === null || v === undefined || v === '') {
                return h('span', { innerHTML: String(dv) })
              }
              return origRender ? origRender.apply(this, arguments) : String(v)
            }
          })
        }
      })()

      if (!vm.pickerMode && window.NovaTableButtons.hasRowActions(vm)) {
        cols.push({
          title: window.__t('table.actions'), key: 'actions', width: vm.rowActionColWidth, fixed: 'right',
          render(row) {
            return window.NovaTableButtons.buildRowActions(vm, row)
          }
        })
      }

      // 树形搜索：命中行的搜索字段值标红
      if (vm.isTree && vm.treeSearchField && vm.treeSearchHitKeys && vm.treeSearchHitKeys.size > 0) {
        for (var hi = 0; hi < cols.length; hi++) {
          var hitCol = cols[hi]
          if (hitCol.key === vm.treeSearchField) {
            var origRender = hitCol.render
            var pkField = vm.novaIdFieldName
            hitCol.render = function(row, rowIndex) {
              var isHit = vm.treeSearchHitKeys.has(String(row[pkField]))
              var content = origRender ? origRender(row, rowIndex) : (row[vm.treeSearchField] != null ? String(row[vm.treeSearchField]) : '')
              if (isHit) {
                return h('span', { style: { color: '#d03050', fontWeight: '500' } }, [content])
              }
              return content
            }
            break
          }
        }
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
    striped(val) {
      localStorage.setItem('nova-table-striped', val ? 'true' : 'false')
    },
    tableSize(val) {
      localStorage.setItem('nova-table-size', val)
    },
    cellOverflow: {
      immediate: true,
      handler(val) {
        localStorage.setItem('nova-table-cell-overflow', val)
        document.body.classList.toggle('table-wrap-cell', val === 'wrap')
      }
    },
    rowDblclickEdit(val) {
      localStorage.setItem('nova-table-row-dblclick-edit', val ? 'true' : 'false')
    },
    loadingStyle(val) {
      localStorage.setItem('nova-table-loading-style', val)
    },
    dualTableViewActive(val) {
      if (!this.dualMode) {
        this.paginationConfig.pageSlot = val ? 5 : 9
        if (!this.isTree) {
          this.paginationConfig.showQuickJumper = !val
        }
      }
      this._syncDualTableClass()
      if (val) {
        var self = this
        Vue.nextTick(function() { self.syncDualPanelHeight() })
      }
    },
    showForm(val) {
      if (!val) {
        // 弹窗关闭：清空所有 tab 相关缓存，确保下次打开完全等同于第一次
        this.visitedEmbTabs      = new Set()
        this.formTab             = 'form'
        this.appendageDetailsLoaded = {}
        this.appendageTabBuild      = {}
        this.appendageFormData      = {}
        this.appendageTabReady      = {}
        this.appendageFormErrors    = {}
        this.linkFormData            = {}
        // 保留双表面板状态和所有子表构建数据（双表视图需要 linkTabBuild[novaName]，不是 linkTabBuild['__dual__']）
        ;['linkTreeData','linkTreeFilteredData','linkTreeDefaultExpandedKeys',
          'linkTreeExpandedKeys','linkTreeCheckedKeys','linkTreeDisplayKeys',
          'linkTreeLoading','linkTreeSearchKeyword','linkTreeNodeMap'].forEach(function(p) {
          var d = this[p]['__dual__']
          this[p] = {}
          if (d !== undefined) this[p]['__dual__'] = d
        }, this)
        // 保存所有子表构建数据（key 不是 '__dual__'）
        var savedSubBuilds = {}
        for (var key in this.linkTabBuild) {
          if (key !== '__dual__') savedSubBuilds[key] = this.linkTabBuild[key]
        }
        // 清空 linkTabBuild
        this.linkTabBuild = {}
        // 恢复子表构建数据
        for (var key in savedSubBuilds) {
          this.linkTabBuild[key] = savedSubBuilds[key]
        }
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

    opFormShow(val) {
      if (!val) {
        this.destroyOpEditors()
        this._opEditorHosts.clear()
      } else {
        var self = this
        this.$nextTick(function() {
          self.$nextTick(function() {
            self.mountOpEditors()
          })
        })
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
        // consumedKeys: 记录已被 refMap 匹配消费掉的 sourceField key，
        // 剩余的 key（LINK_TARGET 的 thisReferenceField / drill 的 joinColumn）直接用 key 本身作为条件列
        var consumedKeys = []
        if (sourceKeys.length > 0) {
          // 使用 referenceMap（与 buildTable 一致）而非 editFields 做匹配，
          // 因为 buildTable 会从 editFields 中移除已匹配的 REFERENCE 字段
          var refMap = target.referenceMap || {}
          Object.keys(refMap).forEach(function(field) {
            var refInfo = refMap[field]
            if (refInfo.storageField && sourceKeys.includes(refInfo.storageField)) {
              consumedKeys.push(refInfo.storageField)
              sourceRefFields.push({ field: field, referenceField: refInfo.referenceField, value: embSourceFields[refInfo.storageField] })
            }
          })
        }
        // 未命中 refMap 的 source key 直接作为条件列（类型由后端按字段注解适配）
        sourceKeys.forEach(function(k) {
          if (embSourceFields[k] != null && consumedKeys.indexOf(k) === -1) {
            sourceRefFields.push({ field: k, referenceField: k, value: String(embSourceFields[k]) })
          }
        })
        target._sourceRefFields = sourceRefFields
        // dualMode / embeddedMode 都需要在 sourceFields 变化时重新加载数据
        if (this.dualMode || this.embeddedMode) {
          window.NovaTableJQ.loadData(this._vmKey)
        }
      },
      deep: true
    },
    tableAttachPreviewIndex(val, oldVal) {
      if (val === oldVal) return
      var self = this
      Vue.nextTick(function() {
        // 重置所有悬浮预览视频和遮罩
        document.querySelectorAll('.vplay-overlay').forEach(function(el) { el.style.opacity = '0' })
        document.querySelectorAll('.nova-video-preview').forEach(function(el) {
          if (el.readyState >= 1) { el.pause(); el.currentTime = 0.1 }
        })
        if (self._pvTimer) { clearTimeout(self._pvTimer); self._pvTimer = null }
      })
    }
  },

  mounted() {
    this._isActive = true
    this._isFirstActivate = true
    window.vmMap = window.vmMap || {}
    if (this.pickerMode) {
      this.novaName = this.novaNameProp || ''
      this._vmKey = '__picker_' + (this.novaName) + '_' + Date.now()
      window.vmMap[this._vmKey] = this
      this.paginationConfig.onUpdatePage     = this.handlePageChange
      this.paginationConfig.onUpdatePageSize = this.handlePageSizeChange
      this.paginationConfig.suffix           = ({ itemCount }) => window.__t('table.total_n', { n: itemCount })
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
      this.paginationConfig.suffix           = ({ itemCount }) => window.__t('table.total_n', { n: itemCount })
      // _dualReloadPending 为 true 说明 reloadDual 会接管，跳过初始加载
      var _drp = window._dualReloadPending
      window._dualReloadPending = false
      if (!_drp && this.novaName && window.NovaTableJQ) window.NovaTableJQ.onEmbeddedMounted(this.novaName, this._vmKey, this.sourceNovaNameProp || this.novaName, this.sourceFieldsProp || {})
    } else if (this.embeddedMode) {
      this.novaName = this.novaNameProp || ''
      this._vmKey = '__emb_' + this.novaName + '_' + Date.now()
      window.vmMap[this._vmKey] = this
      this.paginationConfig.onUpdatePage     = this.handlePageChange
      this.paginationConfig.onUpdatePageSize = this.handlePageSizeChange
      this.paginationConfig.suffix           = ({ itemCount }) => window.__t('table.total_n', { n: itemCount })
      if (this.novaName && window.NovaTableJQ) window.NovaTableJQ.onEmbeddedMounted(this.novaName, this._vmKey, this.sourceNovaNameProp || this.novaName, this.sourceFieldsProp || {}, this.linkMode)
    } else {
      this.novaName = this.$route.params.novaName || ''
      window.vmMap[this.novaName] = this
      window.activeNovaName = this.novaName
      this.paginationConfig.onUpdatePage     = this.handlePageChange
      this.paginationConfig.onUpdatePageSize = this.handlePageSizeChange
      this.paginationConfig.suffix           = ({ itemCount }) => window.__t('table.total_n', { n: itemCount })
      if (window.NovaTableJQ) window.NovaTableJQ.onMounted(this.novaName)
    }
    // 双表视图高度同步：resize 时重新同步
    this._onDualResize = function() {
      this.syncDualPanelHeight()
    }.bind(this)
    window.addEventListener('resize', this._onDualResize)
  },

  activated() {
    this._isActive = true
    if (!this.pickerMode) {
      window.vmMap = window.vmMap || {}
      window.vmMap[this.novaName] = this
      window.activeNovaName = this.novaName
    }
    // 缓存 tab 回切：build 不重发，立即结束顶部加载条（首次进入由 build 完成触发）
    if (window.__novaPageLoading && this._isFirstActivate === false) {
      window.__novaPageLoading.finish()
    }
    this._isFirstActivate = false
    setTimeout(() => { if (window.NovaTableJQ) { window.NovaTableJQ.updateTableHeight(); window.NovaTableJQ.updateTableWidth() } }, 80)
  },

  deactivated() {
    this._isActive = false
    // 切 tab 缓存离开时同步关闭双表视图，避免切回时右面板残留
    if (this.dualTableViewActive || this.dualTableClosing) {
      this.dualTableViewActive = false
      this.dualTableClosing = false
      this.linkTreeData['__dual__'] = null
      this.linkTreeCheckedKeys['__dual__'] = null
      this.linkTreeLoading['__dual__'] = false
      this.linkTreeFilteredData['__dual__'] = null
      this.linkTreeDefaultExpandedKeys['__dual__'] = null
      this.linkTreeExpandedKeys['__dual__'] = null
      this.linkTreeDisplayKeys['__dual__'] = null
      this.linkTreeSearchKeyword['__dual__'] = null
      this._syncDualTableClass()
    }
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
    if (this._onDualResize) {
      window.removeEventListener('resize', this._onDualResize)
      this._onDualResize = null
    }
  },

  updated() {
    if (!this.opFormShow) return
    if (this._opEditorMountingPending) return
    if (this._opEditorHosts.size === 0) return
    var self = this
    this._opEditorMountingPending = true
    this.$nextTick(function() {
      self._opEditorMountingPending = false
      self.mountOpEditors()
    })
  },

  methods: {
    isRowSelectDisabled(row) {
      var expr = (this.sysBtnHide || {}).rowSelect
      return !!(expr && window.evalShowExpr(expr, row))
    },
    onTipEnter() {
      if (this.tipHideTimer) { clearTimeout(this.tipHideTimer); this.tipHideTimer = null }
      this.tipShow = true
    },
    onTipLeave() {
      if (this.tipHideTimer) clearTimeout(this.tipHideTimer)
      this.tipHideTimer = setTimeout(() => { this.tipShow = false }, 200)
    },
    onTipToggle() {
      this.tipShow = !this.tipShow
      if (this.tipShow && this.tipHideTimer) {
        clearTimeout(this.tipHideTimer); this.tipHideTimer = null
      }
    },
    tableRowClassName(row) {
      var cls = []
      if (this.dualTableViewActive && row[this.novaIdFieldName] === (this._dualSelectedRow && this._dualSelectedRow[this.novaIdFieldName])) {
        cls.push('dual-selected-row')
      }
      if (row._newChild) cls.push('tree-child-new')
      return cls.join(' ') || undefined
    },
    
    findRow(list, rowKey, callback) {
      var pk = this.novaIdFieldName
      for (var i = 0; i < list.length; i++) {
        if (String(list[i][pk]) === String(rowKey)) {
          callback && callback(list[i])
          return true
        }
        if (list[i].children && list[i].children.length > 0) {
          if (this.findRow(list[i].children, rowKey, callback)) return true
        }
      }
      return false
    },
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
      if (choice.refChoice) {
        var parentVal = this.filterForm[choice.refChoice]
        if (!parentVal || (Array.isArray(parentVal) && !parentVal.length)) return []
        return choice.values.filter(v => Array.isArray(parentVal) ? parentVal.includes(v.refValue) : v.refValue === parentVal).map(v => ({ label: v.label, value: v.value }))
      }
      return choice.values.map(v => ({ label: v.label, value: v.value }))
    },
    // editFieldOptions moved to NovaFormThis child component
    buildFoldedOptions(buttons, disabledFn) {
      return window.NovaTableButtons.buildFoldedOptions(buttons, disabledFn)
    },
    // ── 操作表单 helpers ────────────────────────────────────────
    opFieldOpts(f) {
      var choice = this.opFormChoiceMap[f.field]
      if (!choice || !choice.values) return []
      if (choice.refChoice) {
        var parentVal = this.opFormData[choice.refChoice]
        if (!parentVal || (Array.isArray(parentVal) && !parentVal.length)) return []
        return choice.values.filter(function(v) { return Array.isArray(parentVal) ? parentVal.includes(v.refValue) : v.refValue === parentVal }).map(function(v) { return { label: v.label, value: v.value } })
      }
      return choice.values.map(function(v) { return { label: v.label, value: v.value } })
    },
    opDateType(field) {
      var info = this.opFormDateMap[field]
      var map = { DATE: 'date', TIME: 'time', DATE_TIME: 'datetime', YEAR_MONTH: 'month', YEAR: 'year' }
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
        if (window.$message) window.$message.error(window.__t('table.upload_max', { n: allowed }))
        return
      }
      var toUpload = files.slice(0, allowed)
      for (var i = 0; i < toUpload.length; i++) {
        var file = toUpload[i]
        if (cfg.fileTypes && cfg.fileTypes.length) {
          var ext = '.' + file.name.split('.').pop().toLowerCase()
          if (!cfg.fileTypes.some(function(t) { return t.toLowerCase() === ext })) {
            if (window.$message) window.$message.error(window.__t('table.upload_type_unsupported') + '：' + ext)
            return
          }
        }
        var kb = file.size / 1024
        if (cfg.minSize > 0 && kb < cfg.minSize) { if (window.$message) window.$message.error(window.__t('table.file_too_small') + ' ' + cfg.minSize + ' KB'); return }
        if (cfg.maxSize > 0 && kb > cfg.maxSize) { if (window.$message) window.$message.error(window.__t('table.file_too_large') + ' ' + cfg.maxSize + ' KB'); return }
      }
      var formData = new FormData()
      formData.append('novaName', this.opFormNovaName)
      toUpload.forEach(function(file) { formData.append('files', file) })
      var self = this
      var field = f.field
      window.fetchApi.upload('/nova/attachment/upload', formData).then(function(resp) {
        if (!self.opFormAppFormData[appNovaName]) self.opFormAppFormData[appNovaName] = {}
        if (!self.opFormAppFormData[appNovaName][field]) self.opFormAppFormData[appNovaName][field] = []
        ;(resp.data || []).forEach(function(url) { self.opFormAppFormData[appNovaName][field].push(url) })
        if (window.$message) window.$message.success(window.__t('table.upload_success'))
      }).catch(function() {})
    },
    // ── appendageForm helpers ───────────────────────────────────
    appBuild(n)        { return this.appendageTabBuild[n] || {} },
    appFd(n)           { return this.appendageFormData[n]  || {} },
    appErrs(n)         { return this.appendageFormErrors[n] || {} },
    appSetFd(n, f, v)  {
      if (this.appendageFormData[n])   this.appendageFormData[n][f] = v
      if (this.appendageFormErrors[n]) delete this.appendageFormErrors[n][f]
    },
    onAppFieldChange(appNovaName, { field, value }) {
      this.appSetFd(appNovaName, field, value)
      // 级联选择：父级值变化时清除子级
      var build = this.appendageTabBuild[appNovaName] || this.opFormAppTabBuild[appNovaName] || {}
      var appFd = this.appendageFormData[appNovaName] || {}
      clearCascadeChildren(appFd, build.choiceMap || {}, field)
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
      const single = { DATE: 'date', TIME: 'time', DATE_TIME: 'datetime', YEAR_MONTH: 'month', YEAR: 'year' }
      const range  = { DATE: 'daterange', TIME: 'time', DATE_TIME: 'datetimerange', YEAR_MONTH: 'monthrange', YEAR: 'yearrange' }
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
    searchDatePlaceholder(field) {
      const dateInfo = this.dateMap && this.dateMap[field.field]
      const type = dateInfo && dateInfo.type
      if (field.vague) {
        if (type === 'YEAR')      return [window.__t('table.start_year'), window.__t('table.end_year')]
        if (type === 'YEAR_MONTH') return [window.__t('table.start_year_month'), window.__t('table.end_year_month')]
        return [window.__t('table.start_time'), window.__t('table.end_time')]
      }
      if (type === 'YEAR')      return window.__t('table.select_year')
      if (type === 'YEAR_MONTH') return window.__t('table.select_year_month')
      return window.__t('table.select_field_placeholder', { name: field.title })
    },
    handleCheck(keys)   {
      // 去重：防止 n-data-table 在某些情况下传重复值
      var uniqueKeys = []
      var seen = new Set()
      keys.forEach(function(k) {
        var sk = String(k)
        if (!seen.has(sk)) { seen.add(sk); uniqueKeys.push(sk) }
      })
      this.checkedRowKeys = uniqueKeys
      if (this.pickerMulti) {
        var emitKeys = uniqueKeys
        // 树形 + cascade=true：将选中节点的祖先也注入 emit，部分勾选子节点时也能带上父节点
        if (this.isTree && this.treeCascade && uniqueKeys.length > 0) {
          emitKeys = uniqueKeys.slice()
          var nodeMap = this.treeNodeMap || {}
          var parentField = this.treeParentField
          var storageField = this.treeStorageField
          var keySet = new Set(emitKeys)
          uniqueKeys.forEach(function(key) {
            var cur = key
            while (cur) {
              var node = nodeMap[cur]
              if (!node) break
              var parent = node[parentField]
              if (parent == null || parent === '') break
              var pk = typeof parent === 'object' ? String(parent[storageField]) : String(parent)
              if (!keySet.has(pk)) { keySet.add(pk); emitKeys.push(pk) }
              cur = pk
            }
          })
        }
        this.$emit('check', emitKeys)
      }
    },
    handleExpand(keys) {
      this.expandedRowKeys = keys
    },
    toggleCheckedRow(row) {
      const key = String(row[this.novaIdFieldName])
      const idx = this.checkedRowKeys.indexOf(key)
      if (idx >= 0) {
        this.checkedRowKeys.splice(idx, 1)
      } else {
        this.checkedRowKeys.push(key)
      }
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
      if (t.isTree) {
        t.applyTreeSearch()
        return
      }
      const snapshot = JSON.stringify(t.filterForm)
      if (snapshot !== t._lastFilterSnapshot) {
        t.paginationConfig.page = 1
        t._lastFilterSnapshot = snapshot
      }
      const key = (t.pickerMode || t.embeddedMode || t.dualMode) ? t._vmKey : t.novaName
      window.NovaTableJQ.loadData(key)
    },
    applyTreeSearch() {
      const keyword = this.treeSearchKeyword.trim()
      const pk = this.novaIdFieldName
      const searchField = this.treeSearchField
      const nodeMap = this.treeNodeMap || {}
      const parentField = this.treeParentField
      const storageField = this.treeStorageField
      const getParentId = function(node) {
        var parent = node[parentField]
        if (parent == null || parent === '') return null
        if (typeof parent === 'object') {
          return parent[storageField]
        }
        return parent
      }

      if (!keyword) {
        this.treeSearchHitKeys = new Set()
        window.NovaTableJQ.loadTreeData(this._vmKey || this.novaName)
        return
      }

      const hitKeys = new Set()
      for (const key in nodeMap) {
        const node = nodeMap[key]
        const searchValue = node[searchField]
        if (searchValue != null && String(searchValue).toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
          hitKeys.add(key)
        }
      }

      if (hitKeys.size === 0) {
        this.tableData = []
        this.expandedRowKeys = []
        return
      }

      const ancestorKeys = new Set()
      hitKeys.forEach(function(hitKey) {
        var currentKey = hitKey
        while (currentKey) {
          var node = nodeMap[currentKey]
          if (!node) break
          var parentId = getParentId(node)
          if (parentId == null || parentId === '') break
          ancestorKeys.add(String(parentId))
          currentKey = String(parentId)
        }
      })

      const allKeys = new Set([...hitKeys, ...ancestorKeys])
      const filteredNodes = []
      allKeys.forEach(function(key) {
        const node = nodeMap[key]
        if (node) {
          filteredNodes.push({ ...node })
        }
      })

      const tempMap = {}
      filteredNodes.forEach(function(node) {
        tempMap[String(node[pk])] = node
        node.children = []
      })

      filteredNodes.forEach(function(node) {
        var parentId = getParentId(node)
        if (parentId != null && parentId !== '') {
          var parentKey = String(parentId)
          if (tempMap[parentKey]) {
            if (!tempMap[parentKey].children) tempMap[parentKey].children = []
            tempMap[parentKey].children.push(node)
          }
        }
      })

      const treeData = filteredNodes.filter(function(node) {
        var parentId = getParentId(node)
        return parentId === null || parentId === undefined || parentId === ''
      })

      treeData.sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0) })
      treeData.forEach(function(node) {
        if (node.children) {
          node.children.sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0) })
        }
      })

      this.tableData = treeData
      this.expandedRowKeys = Array.from(ancestorKeys)
      this.treeSearchHitKeys = hitKeys
    },
    handleTreeSearchReset() {
      this.treeSearchKeyword = ''
      this.treeSearchHitKeys = new Set()
      this.handleQuery()
    },
    handleAdd()         { if (this.embeddedMode || this.dualMode) window.NovaTableJQ.handleAdd(this._vmKey); else window.NovaTableJQ.handleAdd() },
    handleEdit(row)     { if (this.embeddedMode || this.dualMode) window.NovaTableJQ.handleEdit(row, this._vmKey); else window.NovaTableJQ.handleEdit(row) },
    handleDelete(row)   { if (this.embeddedMode || this.dualMode) window.NovaTableJQ.handleDelete(row, this._vmKey); else window.NovaTableJQ.handleDelete(row) },
    handleBatchDelete() { if (this.embeddedMode || this.dualMode) window.NovaTableJQ.handleBatchDelete(this._vmKey); else window.NovaTableJQ.handleBatchDelete() },
    handleExpandedRowKeysUpdate(keys) {
      this.expandedRowKeys = keys
    },
    submitCustomBtn(btn, row) {
      var self = this
      var novaIds = []
      if (row) {
        // 行按钮：取当前行主键，与 mode 无关
        var pk = row[this.novaIdFieldName]
        if (pk != null) novaIds.push(String(pk))
      } else if (btn.mode === 'MULTI' || btn.mode === 'MULTI_ONLY') {
        // 工具栏按钮：取勾选行
        novaIds = this.checkedRowKeys.map(function(k) { return String(k) })
      }
      window.fetchApi.post('/nova/table/rowOperationSubmit', {
          novaName: this.novaName,
          type: btn.type,
          novaIds: novaIds,
          operationHandler: btn.operationHandler,
          operationParam: btn.operationParam || '',
          novaFromName: btn.novaClassName || null,
          formInfo: [],
          appendageFormInfo: {}
        }).then(function(resp) {
          if (window.$message) window.$message.success(window.__t('table.op_success'))
          if (resp.data && resp.data.jsExpression) {
            try { new Function(resp.data.jsExpression)() } catch(e) { console.error('[CustomBtn] jsExpression error:', e) }
          } else {
            if (window.NovaTableJQ) window.NovaTableJQ.loadData(self.vmKey || self.novaName)
          }
        }).catch(function(err) { if (!err || !err.code) { if (window.$message) window.$message.error(window.__t('table.request_failed')) } })
    },
    handleCustomBtnClick(btn, skipConfirm) {
      if (btn.type === 'NOVA' && btn.novaClassName) {
        this.openOpForm(btn, null)
        return
      }
      if (btn.type === 'TPL') {
        this.openTpl(btn, null)
        return
      }
      var self = this
      var action = function() { self.submitCustomBtn(btn, null) }
      if (btn.callHint && !skipConfirm) { window.modal.confirm(btn.callHint, { title: window.__t('table.confirm_action'), onConfirm: action }) }
      else { action() }
    },
    handlePopClick(popCfg, value, row) {
      if (!popCfg || !popCfg.handleName) return
      if (!value) {
        if (window.$message) window.$message.warning(window.__t('table.no_clickable_content'))
        return
      }
      var self = this
      this.popTitle = popCfg.title || window.__t('common.detail')
      this.popList = []
      this.popLoading = true
      // 按 popCfg.context 列出的字段名，从当前行取值（支持平铺 key 与点路径两种形态）；
      // CHOICE 等列会被 translateRecords 翻译成 label，需从 _raw 取原始值
      var context = {}
      if (popCfg.context && popCfg.context.length && row) {
        popCfg.context.forEach(function(key) {
          var v
          if (row._raw && row._raw[key] !== undefined) {
            v = row._raw[key]
          } else if (row[key] !== undefined) {
            v = row[key]
          } else {
            v = getFieldValue(row, key)
          }
          if (v !== undefined) context[key] = v
        })
      }
      window.fetchApi.post('/nova/table/pop', {
        novaName: this.novaName,
        handleName: popCfg.handleName,
        value: value,
        param: popCfg.param || '',
        context: context
      }).then(function(resp) {
        self.popLoading = false
        self.popList = resp.data || []
      }).catch(function() {
        self.popLoading = false
        self.popList = []
        if (window.$message) window.$message.error(window.__t('table.popup_load_failed'))
      })
    },
    // popover 内容：title + getPopModel 返回的 name/value 列表（TAG 拆标签、BOOLEAN 转是/否）
    renderPopContent() {
      const naive = window.naive
      const vm = this
      let body
      if (this.popLoading) {
        body = h('div', { style: 'padding:12px 0;text-align:center;color:#888' }, window.__t('common.loading'))
      } else if (!this.popList || this.popList.length === 0) {
        body = h('div', { style: 'padding:12px 0;text-align:center;color:#888' }, window.__t('table.no_data'))
      } else {
        body = h('div', { style: 'max-height:60vh;overflow:auto;min-width:220px' }, this.popList.map((item) => {
          let valueNode
          if (item.type === 'TAG') {
            const tags = String(item.value || '').split(',').filter(Boolean)
            valueNode = h('span', { style: 'display:inline-flex;flex-wrap:wrap;gap:4px' }, tags.map((t) => h(naive.NTag, { size: 'small', bordered: false }, { default: () => t })))
          } else if (item.type === 'BOOLEAN') {
            const isTrue = String(item.value) === 'true' || item.value === true
            valueNode = h(naive.NTag, { size: 'small', bordered: false, type: isTrue ? 'success' : 'error' }, { default: () => (isTrue ? window.__t('common.yes') : window.__t('common.no')) })
          } else {
            valueNode = h('span', { style: 'word-break:break-all' }, String(item.value ?? ''))
          }
          return h('div', { style: 'display:flex;align-items:flex-start;padding:6px 0' }, [
            h('span', { style: 'flex-shrink:0;width:84px;text-align:right;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', title: item.name }, item.name + '：'),
            valueNode
          ])
        }))
      }
      return h('div', { style: 'min-width:220px' }, [
        h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:16px;font-weight:600' }, [
          h('span', {}, this.popTitle || window.__t('common.detail')),
          h('span', {
            title: window.__t('common.close'),
            style: 'cursor:pointer;color:#888;display:inline-flex;flex-shrink:0',
            onClick: () => { vm.popActiveKey = '' }
          }, [ h('iconify-icon', { icon: 'material-symbols:close', style: 'font-size:16px' }) ])
        ]),
        h('div', { style: 'margin:6px 0;border-bottom:1px solid rgba(128,128,128,.2)' }),
        body
      ])
    },
    openTpl(btn, row) {
      var self = this
      var tpl = btn.tpl || {}
      var novaIds = []
      if (row) {
        var pk = row[this.novaIdFieldName]
        if (pk != null) novaIds.push(String(pk))
      } else if (btn.mode === 'MULTI' || btn.mode === 'MULTI_ONLY') {
        novaIds = this.checkedRowKeys.map(function(k) { return String(k) })
      }
      window.fetchApi.post('/nova/tpl/getTplPath', {
        novaName: this.novaName,
        novaIdValues: novaIds,
        path: tpl.path || '',
        operationParam: btn.operationParam || ''
      }).then(function(resp) {
        var url = resp.data
        if (tpl.openWay === 'DRAWER') {
          self.tplUrl = url
          self.tplTitle = btn.title || ''
          self.tplDrawerPlacement = (tpl.drawerPlacement || 'RIGHT').toLowerCase()
          // 左右抽屉取 width，上下抽屉取 height
          var isVertical = self.tplDrawerPlacement === 'top' || self.tplDrawerPlacement === 'bottom'
          self.tplDrawerSize = isVertical ? tpl.height : tpl.width
          self.tplDrawerShow = true
        } else {
          self.tplUrl = url
          self.tplTitle = btn.title || ''
          self.tplWidth = tpl.width
          self.tplHeight = self._pctToVh(tpl.height)
          self.tplModalShow = true
        }
      }).catch(function() { if (window.$message) window.$message.error(window.__t('table.template_load_failed')) })
    },
    // 百分比转 vh（后端配 '80%' → '80vh'，fixed 元素百分比高度失效，改用视口单位）
    _pctToVh(value) {
      if (!value) return value
      value = String(value).trim()
      if (value.endsWith('%')) return value.replace('%', 'vh')
      return value
    },
    closeTpl() {
      this.tplModalShow = false
      this.tplDrawerShow = false
      this.tplUrl = ''
      this.tplTitle = ''
    },
    handleFormButton(field, buttons, formData, btnNovaName) {
      var cfg = (buttons || {})[field.field]
      if (!cfg) return
      var transmit = {}
      if (cfg.transmitParams) {
        cfg.transmitParams.forEach(function(key) {
          var val = formData[key]
          if (val != null) transmit[key] = val
        })
      }
      var param = cfg.param || ''
      var handleJs = cfg.handleJs || ''
      var handleName = cfg.handleName || ''

      if (handleJs) {
        window.fetch(handleJs).then(function(resp) {
          if (!resp.ok) throw new Error(window.__t('table.template_load_failed') + ': ' + handleJs)
          return resp.text()
        }).then(function(code) {
          var $btn = cfg.id ? $(window.parent.document).find('#' + cfg.id) : null
          var fn = new Function('param', 'transmitParams', '$btn', code)
          fn(param, transmit, $btn)
        })
      } else if (handleName) {
        window.fetchApi.post('/nova/table/buttonClick', {
          novaName: btnNovaName || this.opFormNovaName || this.novaName,
          handleName: handleName,
          param: param,
          transmitParams: transmit
        }).then(function(resp) {
          var data = resp.data || {}
          if (data.status !== false) {
            if (window.$message) window.$message.success(data.message || window.__t('table.op_success'))
          } else {
            if (window.$message) window.$message.error(data.message || window.__t('table.op_failed'))
          }
        }).catch(function(err) {
          if (!err || !err.code) { if (window.$message) window.$message.error(window.__t('table.request_failed')) }
        })
      }
    },
    openOpForm(btn, row) {
      if (!btn.novaClassName) return
      var self = this
      self.opFormLoading = true
      window.fetchApi.post('/nova/table/build', { novaName: btn.novaClassName }, window.__novaMenuCode(btn.novaClassName)).then(function(resp) {
          self.opFormLoading = false
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
          self.opFormButtons    = d.buttons || {}
          self.opFormLayoutObj   = d.layout || {}
          var allEdit = d.edit || []
          // 基本信息 tab 名称：读后端 thisForm.tapTitle，方便后续按 nova 配置改名
          var thisFormEdit = allEdit.find(function(e) { return e.tapType === 'thisForm' })
          self.opFormTabTitle = (thisFormEdit && thisFormEdit.tapTitle) || ''
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
          // 加载表单初始值（handler.novaFormValue 返回的数据）
          self.loadOpFormInitialValues()
        }).catch(function(err) {
          self.opFormLoading = false
          if (!err || !err.code) { if (window.$message) window.$message.error(window.__t('table.request_failed')) }
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
      this.opFormButtons = {}
      this.opFormTab = 'form'
      this.opFormTabTitle = ''
      this._opLoadPending = null
    },
    // ── opForm tab 辅助 ───────────────────────────────────────
    opFormAppBuild(n)       { return this.opFormAppTabBuild[n] || {} },
    opFormAppSections(n) {
      var seen  = {}
      var order = []
      var map   = {}
      var fields = (this.opFormAppTabBuild[n] || {}).editFields || []
      fields.forEach(function(f) {
        var g = (f && f.group) || ''
        if (!seen[g]) {
          seen[g] = true
          order.push(g)
          map[g] = []
        }
        map[g].push(f)
      })
      return order.map(function(g) {
        return { key: g || '__ungrouped__', title: g || '', items: map[g] }
      })
    },
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
      var map = { DATE: 'date', TIME: 'time', DATE_TIME: 'datetime', YEAR_MONTH: 'month', YEAR: 'year' }
      return (info && map[info.type]) || 'date'
    },
    opFormAppTagOpts(n, f) {
      var tag = ((this.opFormAppTabBuild[n] || {}).tagMap || {})[f]
      if (!tag || !tag.tags) return []
      return tag.tags.map(function(t) { return { label: t, value: t } })
    },
    opFormTabRequiredCount(tabName) {
      var self = this
      var isEmpty = function(f, val) {
        if (f.type === 'REFERENCE') return !val || val === ''
        if (val === null || val === undefined || val === '') return true
        if (Array.isArray(val)) return val.length === 0
        return false
      }
      if (tabName === 'form') {
        return (self.visibleOpFormFields || []).filter(function(item) {
          if (!item.visible || !item.field.notNull) return false
          return isEmpty(item.field, self.opFormData[item.field.field])
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
          if (f.type === 'REFERENCE' && refMap[f.field] && refMap[f.field].referenceName === self.opFormNovaName) return false
          if (f.showByExpr && !evalShowExpr(f.showByExpr, evalFd)) return false
          return isEmpty(f, fd[f.field])
        }).length
      }
      return 0
    },
    opFormTabTotalRequired(tabName) {
      var self = this
      if (tabName === 'form') {
        return (self.visibleOpFormFields || []).filter(function(item) {
          return item.visible && item.field.notNull
        }).length
      }
      if (tabName.startsWith('app_')) {
        var n = tabName.slice(4)
        var build = self.opFormAppTabBuild[n] || {}
        var refMap = build.referenceMap || {}
        var fd = self.opFormAppFormData[n] || {}
        var evalFd = Object.assign({}, fd)
        for (var k in refMap) {
          var rf = refMap[k] && refMap[k].referenceField
          if (rf) evalFd[k] = fd[rf] !== undefined ? fd[rf] : null
        }
        return (build.editFields || []).filter(function(f) {
          if (!f.notNull) return false
          if (f.type === 'REFERENCE' && refMap[f.field] && refMap[f.field].referenceName === self.opFormNovaName) return false
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
      window.fetchApi.post('/nova/table/build', { novaName: appNovaName }, window.__novaMenuCode(appNovaName)).then(function(resp) {
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
            buttons: d.buttons || {},
            layout: d.layout || {}
          }
          // 初始化表单数据（应用 defaultValue）
          var fd = {}
          editFields.forEach(function(f) {
            var dv = window.NovaTableJQ_form.convertDefaultValue(f, cm, d.attachment || {})
            if (dv !== undefined) {
              fd[f.field] = dv
              if (f.type === 'REFERENCE') fd[f.field + '_display'] = ''
              return
            }
            var ci = cm[f.field]
            var isMulti = f.type === 'CHOICE' && ci && ci.selectType === 'MULTI'
            fd[f.field] = (isMulti || f.type === 'TAG' || f.type === 'ATTACHMENT') ? [] : (f.type === 'CHOICE' && ci && ci.selectType === 'SINGLE' ? null : f.type === 'DATE' || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : '')
            if (f.type === 'REFERENCE') fd[f.field + '_display'] = ''
          })
          self.opFormAppFormData[appNovaName] = fd
          self.opFormAppFormErrors[appNovaName] = {}
          // 应用待处理的 rowOperationLoad 返回的附属表单初始值
          var pendingLoad = self._opLoadPending && self._opLoadPending[appNovaName]
          if (pendingLoad) {
            self._applyOpLoadData(pendingLoad, fd, editFields, d.reference || {}, cm, d.attachment || {})
            delete self._opLoadPending[appNovaName]
          }
          // 触发一次 mount（适用于 openOpForm 预加载完成的情况）
          self.$nextTick(function() { self.syncOpEditorsContent() })
        })
    },
    _applyOpLoadData(source, targetData, fields, refMap, choiceMap, attachmentMap) {
      var rm = refMap || {}
      var cm = choiceMap || {}
      var am = attachmentMap || {}
      var self = this
      fields.forEach(function(f) {
        if (f.type === 'DIVIDE' || f.type === 'EMPTY') return
        var val = source[f.field]
        // 后端没返回值（undefined/null）时，应用 defaultValue
        if ((val === undefined || val === null)) {
          var dv = window.NovaTableJQ_form.convertDefaultValue(f, choiceMap, am)
          if (dv !== undefined) {
            targetData[f.field] = dv
            if (f.type === 'REFERENCE') targetData[f.field + '_display'] = ''
            return
          }
        }
        if (val === undefined) return
        if (f.type === 'CHOICE') {
          var ci = cm[f.field]
          if (ci && ci.selectType === 'MULTI' && val != null && String(val).length > 0) {
            targetData[f.field] = String(val).split(',')
          } else {
            targetData[f.field] = (val === null || val === undefined) ? null : String(val)
          }
        } else if (f.type === 'TAG') {
          targetData[f.field] = (val != null && String(val).length > 0) ? String(val).split(',') : []
        } else if (f.type === 'ATTACHMENT') {
          var attCfg = am[f.field] || {}
          var attSep = attCfg.separator
          targetData[f.field] = (val != null && String(val).length > 0 && attSep != null) ? String(val).split(attSep) : []
        } else if (f.type === 'DATE') {
          var ts = val !== null && val !== undefined ? Number(val) : null
          targetData[f.field] = (ts && !isNaN(ts)) ? ts : null
        } else if (f.type === 'BOOLEAN') {
          targetData[f.field] = (val === null || val === undefined) ? null : String(val)
        } else if (f.type === 'NUMBER') {
          targetData[f.field] = (val === null || val === undefined || val === '') ? null : Number(val)
        } else if (f.type === 'REFERENCE') {
          var refInfo = rm[f.field] || {}
          var sf = refInfo.storageField
          targetData[f.field] = (val && typeof val === 'object')
            ? (sf && val[sf] !== undefined && val[sf] !== null ? String(val[sf]) : null)
            : (val !== null && val !== undefined && val !== '' ? String(val) : null)
          targetData[f.field + '_display'] = (val && typeof val === 'object' && refInfo.displayField)
            ? (val[refInfo.displayField] != null ? String(val[refInfo.displayField]) : '') : ''
        } else {
          targetData[f.field] = (val === null || val === undefined) ? '' : val
        }
      })
    },
    loadOpFormInitialValues() {
      var self = this
      var novaIds = []
      if (this.opFormRow) {
        var pk = this.opFormRow[this.novaIdFieldName]
        if (pk != null) novaIds.push(String(pk))
      } else {
        novaIds = this.checkedRowKeys.map(function(k) { return String(k) })
      }
      window.fetchApi.post('/nova/table/rowOperationLoad', {
          novaName: this.opFormNovaName,
          novaIds: novaIds,
          operationHandler: this.opFormBtn.operationHandler,
          operationParam: this.opFormBtn.operationParam || ''
        }).then(function(resp) {
          if (!resp.data) return
          var data = resp.data
          // 基本表单数据
          var mainData = data[self.opFormNovaName]
          if (mainData) {
            self._applyOpLoadData(mainData, self.opFormData, self.opFormFields, self.opFormRefMap, self.opFormChoiceMap, self.attachmentMap)
          }
          // APPENDAGE 数据：已加载的立即应用，未加载的缓存
          self._opLoadPending = self._opLoadPending || {}
          Object.keys(data).forEach(function(key) {
            if (key === self.opFormNovaName) return
            var appData = data[key]
            if (!appData) return
            var build = self.opFormAppTabBuild[key]
            if (build && build.editFields) {
              self._applyOpLoadData(appData, self.opFormAppFormData[key], build.editFields, build.referenceMap || {}, build.choiceMap || {}, build.attachmentMap || {})
            } else {
              self._opLoadPending[key] = appData
            }
          })
          // 已挂载的 EDITOR 实例内容同步到最新的 formData
          self.$nextTick(function() { self.syncOpEditorsContent() })
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
        if (empty) errors[f.field] = f.title + window.__t('common.required')
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
          if (empty) errs[f.field] = f.title + window.__t('common.required')
        })
        appErrors[n] = errs
        if (!firstErrAppTab && Object.keys(errs).length > 0) firstErrAppTab = n
      })
      var newAppErrors = Object.assign({}, this.opFormAppFormErrors, appErrors)
      this.opFormAppFormErrors = newAppErrors
      if (firstErrAppTab) { this.opFormTab = 'app_' + firstErrAppTab; return }

      // 组装选中行 ID 列表
      var novaIds = []
      if (this.opFormBtn && this.opFormBtn.mode === 'SINGLE' && this.opFormRow) {
        var pk = this.opFormRow[this.novaIdFieldName]
        if (pk != null) novaIds.push(String(pk))
      } else if (this.opFormBtn && (this.opFormBtn.mode === 'MULTI' || this.opFormBtn.mode === 'MULTI_ONLY')) {
        novaIds = this.checkedRowKeys.map(function(k) { return String(k) })
      }
      // 组装主表单数据
      var formInfo = _buildFormInfoList(this.opFormFields, this.opFormData, this.opFormRefMap, this.attachmentMap)
      // 组装附属表单数据
      var appendageFormInfo = {}
      ;(this.opFormExtraTabs || []).forEach(function(tab) {
        var n = tab.tapNovaName
        var build = self.opFormAppTabBuild[n] || {}
        var fd = self.opFormAppFormData[n] || {}
        appendageFormInfo[n] = _buildFormInfoList(build.editFields || [], fd, build.referenceMap || {}, build.attachmentMap || {})
      })
      window.fetchApi.post('/nova/table/rowOperationSubmit', {
          novaName: this.novaName,
          type: this.opFormBtn.type,
          novaIds: novaIds,
          operationHandler: this.opFormBtn.operationHandler,
          operationParam: this.opFormBtn.operationParam || '',
          novaFromName: this.opFormBtn.novaClassName,
          formInfo: formInfo,
          appendageFormInfo: appendageFormInfo
        }).then(function(resp) {
          self.closeOpForm()
          if (window.$message) window.$message.success(window.__t('table.op_success'))
          if (resp.data && resp.data.jsExpression) {
            try { new Function(resp.data.jsExpression)() } catch(e) { console.error('[OpForm] jsExpression error:', e) }
          } else {
            if (window.NovaTableJQ) window.NovaTableJQ.loadData(self.vmKey || self.novaName)
          }
        }).catch(function(err) { if (!err || !err.code) { if (window.$message) window.$message.error(window.__t('table.request_failed')) } })
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
        if (window.$message) window.$message.error(window.__t('table.upload_max', { n: allowed }))
        return
      }
      var toUpload = files.slice(0, allowed)
      for (var i = 0; i < toUpload.length; i++) {
        var file = toUpload[i]
        if (cfg.fileTypes && cfg.fileTypes.length) {
          var ext = '.' + file.name.split('.').pop().toLowerCase()
          if (!cfg.fileTypes.some(function(t) { return t.toLowerCase() === ext })) {
            if (window.$message) window.$message.error(window.__t('table.upload_type_unsupported') + '：' + ext)
            return
          }
        }
        var kb = file.size / 1024
        if (cfg.minSize > 0 && kb < cfg.minSize) { if (window.$message) window.$message.error(window.__t('table.file_too_small') + ' ' + cfg.minSize + ' KB'); return }
        if (cfg.maxSize > 0 && kb > cfg.maxSize) { if (window.$message) window.$message.error(window.__t('table.file_too_large') + ' ' + cfg.maxSize + ' KB'); return }
      }
      var formData = new FormData()
      formData.append('novaName', this.opFormNovaName)
      toUpload.forEach(function(file) { formData.append('files', file) })
      var self = this
      var field = f.field
      window.fetchApi.upload('/nova/attachment/upload', formData).then(function(resp) {
        if (!self.opFormData[field]) self.opFormData[field] = []
        ;(resp.data || []).forEach(function(url) { self.opFormData[field].push(url) })
        if (window.$message) window.$message.success(window.__t('table.upload_success'))
      }).catch(function() {})
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
        if (window.$message) window.$message.error(window.__t('table.upload_max', { n: allowed }))
        return
      }
      const toUpload = files.slice(0, allowed)
      for (const file of toUpload) {
        if (cfg.fileTypes && cfg.fileTypes.length) {
          const ext = '.' + file.name.split('.').pop().toLowerCase()
          if (!cfg.fileTypes.some(t => t.toLowerCase() === ext)) {
            if (window.$message) window.$message.error(window.__t('table.upload_type_unsupported') + '：' + ext)
            return
          }
        }
        const kb = file.size / 1024
        if (cfg.minSize > 0 && kb < cfg.minSize) { if (window.$message) window.$message.error(window.__t('table.file_too_small') + ' ' + cfg.minSize + ' KB'); return }
        if (cfg.maxSize > 0 && kb > cfg.maxSize) { if (window.$message) window.$message.error(window.__t('table.file_too_large') + ' ' + cfg.maxSize + ' KB'); return }
      }
      const formData = new FormData()
      formData.append('novaName', this.novaName)
      toUpload.forEach(file => formData.append('files', file))
      const field = f.field
      const vm = this
      window.fetchApi.upload('/nova/attachment/upload', formData).then(resp => {
        if (appNovaName) {
          if (!vm.appendageFormData[appNovaName]) return
          if (!vm.appendageFormData[appNovaName][field]) vm.appendageFormData[appNovaName][field] = []
          ;(resp.data || []).forEach(url => vm.appendageFormData[appNovaName][field].push(url))
        } else {
          if (!vm.formData[field]) vm.formData[field] = []
          ;(resp.data || []).forEach(url => vm.formData[field].push(url))
        }
        if (window.$message) window.$message.success(window.__t('table.upload_success'))
        vm.openPreview(f, appNovaName || null)
      }).catch(() => {})
    },
    openPreview(f, appNovaName, isOpForm) {
      this.previewField = f
      this.previewAppNovaName = appNovaName || null
      this.previewIsOpForm = !!isOpForm
      this.previewIndex = 0
      // IMAGE 附件：直接弹出图片预览组件；其他类型用文件列表弹窗
      if (this.previewAttachCfg.type === 'IMAGE') {
        this.previewModalShow = false
        this.$nextTick(function () {
          if (this.$refs.novaImagePreviewRef) this.$refs.novaImagePreviewRef.open(0)
        })
      } else {
        this.previewModalShow = true
      }
    },
    copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          if (window.$message) window.$message.success(window.__t('table.link_copied'))
        }).catch(function () {
          var input = document.createElement('textarea')
          input.value = text
          document.body.appendChild(input)
          input.select()
          try { document.execCommand('copy') } catch (e) {}
          document.body.removeChild(input)
          if (window.$message) window.$message.success(window.__t('table.link_copied'))
        })
      } else {
        var input = document.createElement('textarea')
        input.value = text
        document.body.appendChild(input)
        input.select()
        try { document.execCommand('copy') } catch (e) {}
        document.body.removeChild(input)
        if (window.$message) window.$message.success(window.__t('table.link_copied'))
      }
    },
    closePreview() {
      this.previewModalShow = false
      this.previewField = null
      this.previewAppNovaName = null
      this.previewIsOpForm = false
      this.previewIndex = 0
    },
    deleteFromPreview(idx) {
      if (!this.previewField) return
      const list = this.previewFileList
      list.splice(idx, 1)
      if (this.previewIndex >= list.length) this.previewIndex = Math.max(0, list.length - 1)
    },
    triggerOpFileUpload(fieldKey) {
      var input = document.getElementById('upload-op-' + fieldKey)
      if (input) input.click()
    },
    triggerOpAppFileUpload(appNovaName, fieldKey) {
      var input = document.getElementById('upload-opApp-' + appNovaName + '-' + fieldKey)
      if (input) input.click()
    },
    // 打开表格附件预览弹窗
    openTableAttachPreview(field, urls, type) {
      this.tableAttachPreviewField = field
      this.tableAttachPreviewUrls = urls
      this.tableAttachPreviewType = type
      this.tableAttachPreviewIndex = 0
      this.tableAttachPreviewShow = true
    },
    // 打开表格富文本预览弹窗
    openTableEditorPreview(title, html) {
      var encoded
      try {
        encoded = btoa(unescape(encodeURIComponent(html || '')))
      } catch (e) {
        encoded = ''
      }
      if (!window.popup || !window.popup.modal) {
        window.alert(window.__t('table.popup_not_ready'))
        return
      }
      window.popup.drawer('/editor-preview.html#' + encoded, {
        title: title || window.__t('table.rich_preview'),
        size: '35%'
      })
    },
    // ── 操作表单 EDITOR (Tiptap) 生命周期 ──
    registerOpEditorHost(section, field, el) {
      var key = section + ':' + field
      if (el) {
        this._opEditorHosts.set(key, el)
      } else {
        this._opEditorHosts.delete(key)
        var inst = this._opEditorInstances.get(key)
        if (inst) {
          try { window.NovaAiEditor && window.NovaAiEditor.destroy(inst.editor) } catch (e) {}
          this._opEditorInstances.delete(key)
        }
      }
    },
    registerOpEditorToolbar(section, field, el) {
      var key = section + ':' + field
      if (el) {
        this._opEditorToolbars.set(key, el)
      } else {
        this._opEditorToolbars.delete(key)
      }
    },
    _mountOpEditor(key, el) {
      if (!window.NovaAiEditor) return
      if (this._opEditorInstances.has(key)) return
      if (!this._opEditorMounting) this._opEditorMounting = new Set()
      if (this._opEditorMounting.has(key)) return
      this._opEditorMounting.add(key)
      var sep = key.indexOf(':')
      var section = key.slice(0, sep)
      var field = key.slice(sep + 1)
      var self = this
      var initialVal = ''
      if (section === 'main') {
        initialVal = self.opFormData[field]
      } else if (section.indexOf('app:') === 0) {
        var appName = section.slice(4)
        initialVal = (self.opFormAppFormData[appName] || {})[field]
      }
      if (initialVal === null || initialVal === undefined) initialVal = ''
      function syncBack(html) {
        if (self._opEditorSyncing) return
        if (section === 'main') {
          self.$set(self.opFormData, field, html)
        } else if (section.indexOf('app:') === 0) {
          var appName2 = section.slice(4)
          if (!self.opFormAppFormData[appName2]) self.$set(self.opFormAppFormData, appName2, {})
          self.$set(self.opFormAppFormData[appName2], field, html)
        }
      }
      window.NovaAiEditor.createEditor(el, initialVal, syncBack).then(function(editor) {
        self._opEditorMounting.delete(key)
        if (!editor) return
        if (self._opEditorInstances.has(key)) {
          try { window.NovaAiEditor.destroy(editor) } catch (e) {}
          return
        }
        self._opEditorInstances.set(key, { editor: editor })
      }).catch(function(err) {
        self._opEditorMounting.delete(key)
        console.error('[opEditor] create error', key, err)
      })
    },
    syncOpEditorsContent() {
      if (!window.NovaAiEditor) return
      var self = this
      this._opEditorSyncing = true
      this._opEditorInstances.forEach(function(rec, key) {
        var sep = key.indexOf(':')
        var section = key.slice(0, sep)
        var field = key.slice(sep + 1)
        var val = ''
        if (section === 'main') {
          val = self.opFormData[field]
        } else if (section.indexOf('app:') === 0) {
          var appName = section.slice(4)
          val = (self.opFormAppFormData[appName] || {})[field]
        }
        if (val === null || val === undefined) val = ''
        try {
          var editor = rec.editor
          var current = editor.getHtml()
          if (current !== val) window.NovaAiEditor.setContent(editor, val)
        } catch (e) {}
      })
      this._opEditorSyncing = false
    },
    mountOpEditors() {
      if (!this.opFormShow) return
      if (this._opEditorHosts.size === 0) return
      var self = this
      var start = function() {
        if (!window.NovaAiEditor) return
        self._opEditorHosts.forEach(function(el, key) {
          self._mountOpEditor(key, el)
        })
      }
      if (window.NovaAiEditor && window.NovaAiEditor.createEditor) {
        start()
      } else if (window.NovaAiEditor && window.NovaAiEditor.ensureLoaded) {
        window.NovaAiEditor.ensureLoaded().then(function() { start() })
      }
    },
    destroyOpEditors() {
      var self = this
      this._opEditorInstances.forEach(function(rec) {
        try { window.NovaAiEditor && window.NovaAiEditor.destroy(rec.editor) } catch (e) {}
      })
      this._opEditorInstances.clear()
      this._opEditorToolbars.clear()
    },
    closeTableAttachPreview() {
      this.tableAttachPreviewShow = false
      this.tableAttachPreviewField = null
      this.tableAttachPreviewUrls = []
      this.tableAttachPreviewType = null
      this.tableAttachPreviewIndex = 0
    },
    handleTableAttachDelete(e) {
      this.tableAttachPreviewUrls.splice(e.index, 1)
      if (this.tableAttachPreviewUrls.length === 0) this.tableAttachPreviewShow = false
    },
    // ── 视频悬浮预览 ──
    onVideoPreviewLoaded(e, idx) {
      var v = e.currentTarget
      var ph = v.parentElement.querySelector('.vthumb-placeholder')
      if (ph) { ph.style.opacity = '0'; setTimeout(function() { if (ph) ph.style.display = 'none' }, 300) }
      if (v.readyState >= 1) v.currentTime = 0.1
    },
    startVideoPreview(e, idx) {
      if (this._pvTimer) { clearTimeout(this._pvTimer); this._pvTimer = null }
      var card = document.querySelector('[data-vidx="' + idx + '"]')
      if (!card) return
      card.style.transform = 'translateY(-2px)'
      var pv = card.querySelector('.nova-video-preview')
      if (pv && pv.readyState >= 1) { pv.currentTime = 0; pv.muted = true; pv.play().catch(function() {}) }
      var overlay = card.querySelector('.vplay-overlay')
      if (overlay) overlay.style.opacity = '1'
    },
    stopVideoPreview(e, idx) {
      if (this._pvTimer) { clearTimeout(this._pvTimer); this._pvTimer = null }
      var card = document.querySelector('[data-vidx="' + idx + '"]')
      if (!card) return
      card.style.transform = ''
      var pv = card.querySelector('.nova-video-preview')
      if (pv && pv.readyState >= 1) { pv.pause(); pv.currentTime = 0.1 }
      var overlay = card.querySelector('.vplay-overlay')
      if (overlay) overlay.style.opacity = '0'
    },
    onFormFieldChange({ field, value }) {
      this.formData[field] = value
      if (value === null && this.referenceMap && this.referenceMap[field]) {
        this.formData[field + '_display'] = ''
        var refInfo = this.referenceMap[field]
        if (refInfo && refInfo.referenceField) this.formData[refInfo.referenceField] = null
      }
      // 级联选择：父级值变化时清除子级
      clearCascadeChildren(this.formData, this.choiceMap, field)
      delete this.formErrors[field]
    },
    // 查询条件级联清除
    onFilterChoiceUpdate(fieldKey) {
      clearCascadeChildren(this.filterForm, this.choiceMap, fieldKey)
    },
    // opForm 级联清除
    onOpChoiceUpdate(fieldKey) {
      clearCascadeChildren(this.opFormData, this.opFormChoiceMap, fieldKey)
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
      return window.NovaTableJQ_appendages.buildEmbSourceFields(this, tab)
    },
    buildRefReferenceFields(tab) {
      return window.NovaTableJQ_appendages.buildRefReferenceFields(this, tab)
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
        if (window.$message) window.$message.warning(window.__t('table.select_row_first'))
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
      const storageField = linkSelectInfo ? linkSelectInfo.storageField : (appInfo ? appInfo.referenceField : (refInfo && refInfo.storageField))
      const displayField = linkSelectInfo ? linkSelectInfo.displayField : (appInfo ? appInfo.displayField : (refInfo && refInfo.displayField))
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
        if (window.$message) window.$message.warning(window.__t('table.target_table_not_found'))
        return
      }
      this.linkPickerTitle = window.__t('table.link_picker_title', { name: tapTitle || window.__t('table.link_picker_title_default') })
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
        if (window.$message) window.$message.warning(window.__t('table.select_one_first'))
        return
      }
      var linkNovaName = this.linkPickerCurrentTab
      var build = this.linkTabBuild[linkNovaName]
      if (!build) return
      var sourceField = build.sourceFieldName
      var targetField = build.targetFieldName
      var sourceRow = this.dualTableViewActive ? this._dualSelectedRow : this.currentRow
      var sourceValue = sourceRow && sourceRow[this.novaIdFieldName]
      if (!sourceField) { console.error('[Nova] 缺少 sourceField', build); if (window.$message) window.$message.error(window.__t('table.link_param_missing_basic', { name: 'sourceField' })); return }
      if (!targetField) { console.error('[Nova] 缺少 targetField', build); if (window.$message) window.$message.error(window.__t('table.link_param_missing_basic', { name: 'targetField' })); return }
      if (sourceValue == null) { console.error('[Nova] 缺少 sourceValue', this.currentRow, this.novaIdFieldName); if (window.$message) window.$message.error(window.__t('table.link_param_missing_basic', { name: 'sourceValue' })); return }

      // 获取目标表格 vmKey，传给 handleLinkAdd 用于刷新
      var targetVmKey = null
      if (this.dualTableViewActive) {
        var dualVm = this.$refs.dualTableRef
        if (dualVm && dualVm._vmKey) targetVmKey = dualVm._vmKey
      } else {
        targetVmKey = this._findEmbVmKey(linkNovaName)
      }

      window.NovaTableJQ_link.handleLinkAdd(
        this.novaName, linkNovaName,
        sourceField, sourceValue,
        targetField, this.linkPickerSelectedKeys,
        this._vmKey || this.novaName,
        targetVmKey
      )
      this.closeLinkPicker()
    },
    // ── linkTree 模式：LINK 直接渲染树 ──────────────────────────
    initLinkTreeTab(tapNovaName) {
      if (this.linkTreeData[tapNovaName]) return
      if (this.linkTreeLoading[tapNovaName]) return
      var build = this.linkTabBuild[tapNovaName]
      if (build && build.linkTarget) {
        if (build.linkTarget.linkTree) this.loadLinkTreeData(tapNovaName)
        return
      }
      var self = this
      this.linkTreeLoading[tapNovaName] = true
      window.fetchApi.post('/nova/table/build', { novaName: tapNovaName }, window.__novaMenuCode(tapNovaName)).then(function(resp) {
          var bd = resp.data || {}
          var lt = bd.linkTarget || {}
          var ltEditFields = (bd.edit || []).filter(function(e) { return e.tapType === 'thisForm' }).reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
          var newBuild = Object.assign({}, self.linkTabBuild)
          newBuild[tapNovaName] = {
            linkTarget: lt,
            sourceFieldName: lt.thisFieldName || '',
            targetFieldName: lt.linkFieldName || '',
            editFields: ltEditFields,
            tableColumns: bd.tableColumns || [],
            novaIdFieldName: bd.novaIdFieldName,
            choiceMap: bd.choice || {},
            referenceMap: bd.reference || {},
            linkMap: bd.link || {},
            dateMap: bd.date || {},
            numberMap: bd.number || {},
            tagMap: bd.tag || {},
            attachmentMap: bd.attachment || {}
          }
          self.linkTabBuild = newBuild
          self.linkTreeLoading[tapNovaName] = false
          if (lt.linkTree) {
            self.loadLinkTreeData(tapNovaName)
          }
          // 普通模式：linkTabBuild 已填充，模板自动渲染内嵌表格
        }).catch(function() {
          self.linkTreeLoading[tapNovaName] = false
          if (window.$message) window.$message.error(window.__t('table.link_get_mid_failed'))
        })
    },
    submitDualLinkTree() {
      window.NovaDualLinkJQ.submitDualLinkTree(this)
    },
    loadLinkTreeData(tapNovaName, options) {
      const stateKey = (options && options.stateKey) || tapNovaName
      const row = options && options.row
      // 防重入：仅当同一 LINK 表仍在加载时才跳过；切换子表（nova 变化）必须重新加载，
      // 否则旧表加载中残留的 linkTreeLoading 会挡住新表，右表无响应
      if (this.linkTreeLoading[stateKey] && this._linkTreeLoadingNova === tapNovaName) return
      this._linkTreeLoadingNova = tapNovaName
      this.linkTreeLoading[stateKey] = true
      this._linkTreeLoadingStart = Date.now()
      this.linkTreeSearchKeyword[stateKey] = ''

      const self = this
      const build = this.linkTabBuild[tapNovaName]
      if (!build || !build.linkTarget) {
        this.linkTreeLoading[stateKey] = false
        return
      }
      const lt = build.linkTarget
      const targetNovaName = lt.linkReferenceName
      if (!targetNovaName) {
        this.linkTreeLoading[stateKey] = false
        if (window.$message) window.$message.error(window.__t('table.target_table_not_found'))
        return
      }

      // 目标表 tree 配置已缓存（同子表内点击左表行复用，不重复 build）：直接加载树数据
      if (build.linkTreeTargetConfig) {
        this._startLinkTreeLoad(tapNovaName, stateKey, row, lt, targetNovaName)
        return
      }
      // 首次：请求目标 Nova 的 build 配置（treeSearchField, treeParentField 等）
      window.fetchApi.post('/nova/table/build', { novaName: targetNovaName }, window.__novaMenuCode(targetNovaName)).then(function(buildResp) {
            // 请求期间已切换到其他子表：丢弃过期响应，避免用旧表状态覆盖当前子表（仅双表视图；编辑弹窗无子表切换概念）
            if (stateKey === '__dual__' && self.dualTableCurrentNova !== tapNovaName) return
            if (buildResp.code !== 200) {
              self.linkTreeLoading[stateKey] = false
              if (window.$message) window.$message.error(window.__t('table.link_get_target_failed'))
              return
            }
            const buildData = buildResp.data || {}
            const treeInfo = buildData.tree || {}
            const treeSearchField = treeInfo.searchField
            const treeCascade = treeInfo.cascade !== false
            const treeLevel = treeInfo.level != null ? treeInfo.level : 0
            const refMap = buildData.reference || {}

            if (!treeSearchField) {
              self.linkTreeLoading[stateKey] = false
              if (window.$message) window.$message.error(window.__t('table.target_tree_field_missing'))
              return
            }

            // 从 reference map 中提取 treeParentField / treeStorageField
            var treeParentField = ''
            var treeStorageField = ''
            for (var rfKey in refMap) {
              var rf = refMap[rfKey] || {}
              if (rf.isThisObj === true) {
                treeParentField = rfKey
                treeStorageField = rf.storageField || ''
                break
              }
            }

            // 全量树 key = linkStorageField（中间表 build 的 linkTarget 下）
            const linkStorageField = lt.linkStorageField || ''
            if (!linkStorageField) {
              self.linkTreeLoading[stateKey] = false
              if (window.$message) window.$message.error(window.__t('table.mid_storage_missing'))
              return
            }

            const newBuild = Object.assign({}, self.linkTabBuild[tapNovaName] || {})
            newBuild.linkTreeTargetConfig = {
              linkStorageField: linkStorageField,
              treeSearchField: treeSearchField,
              treeCascade: treeCascade,
              treeLevel: treeLevel,
              treeParentField: treeParentField,
              treeStorageField: treeStorageField,
              tableColumns: buildData.tableColumns || []
            }
            // 目标表完整 build：给右侧详情面板用（含 group、choiceMap、dateMap 等元信息）
            newBuild.linkTreeTargetBuild = {
              tableColumns:    buildData.tableColumns || [],
              choice:          buildData.choice      || {},
              date:            buildData.date        || {},
              attachment:      buildData.attachment   || {},
              reference:       buildData.reference    || {},
              link:            buildData.link         || {},
              number:          buildData.number       || {},
              tag:             buildData.tag          || {},
              edit:            buildData.edit         || [],
              layout:          buildData.layout       || {},
              novaIdFieldName: buildData.novaIdFieldName
            }
            self.linkTabBuild[tapNovaName] = newBuild
            self._startLinkTreeLoad(tapNovaName, stateKey, row, lt, targetNovaName)
          }).catch(function() {
            self.linkTreeLoading[stateKey] = false
            if (window.$message) window.$message.error(window.__t('table.link_get_target_failed'))
          })
    },
    // 目标表 tree 配置已就绪后，发起两个并行 tree 请求并渲染（点击左表行复用缓存配置，不重复 build）
    _startLinkTreeLoad(tapNovaName, stateKey, row, lt, targetNovaName) {
      const self = this
      const build = this.linkTabBuild[tapNovaName] || {}
      const config = build.linkTreeTargetConfig
      if (!config) {
        this.linkTreeLoading[stateKey] = false
        return
      }
      const linkStorageField = config.linkStorageField
      const treeSearchField = config.treeSearchField
      const treeCascade = config.treeCascade
      const treeLevel = config.treeLevel
      const treeParentField = config.treeParentField
      const treeStorageField = config.treeStorageField

      // 从 linkMap 获取 referenceTransmitField 作为目标树透传字段（依赖当前行，每次构建）
      const srcFields = {}
      const linkMap = self.linkMap || {}
      for (const field in linkMap) {
        if (linkMap[field] && linkMap[field].selectInfo.referenceName === targetNovaName) {
          const transmit = linkMap[field].referenceTransmitField
          if (transmit && transmit.length) {
            transmit.forEach(f => {
              const v = (row || self.currentRow) && (row || self.currentRow)[f]
              if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
                srcFields[f] = String(v)
            })
          }
          break
        }
      }

      // 两个并行 tree 请求：目标表全量树 + 中间表已勾选 IDs
      var treeRendered = false
      var checkedReady = false
      var sortedRoot = []
      var nodeMap = {}
      var defaultExpandKeys = []
      var checkedKeys = new Set()

      function renderTree() {
        if (!treeRendered || !checkedReady) return
        // 排序（轻量，不影响动画）
        sortedRoot.sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0) })
        // 数据应用：触发 Vue 渲染 n-tree，占用主线程。动画期间（首屏 boot 或右表树加载动画）
        // 延迟到动画结束后执行，避免树渲染导致动画掉帧；数据已提前就绪，动画结束立即渲染不留空白
        var apply = function() {
          // 请求期间已切换到其他子表：丢弃过期树数据。否则旧 LINK 的树会被误判为
          // 当前子表的树（linkTreeData 有值走树分支），nova-table 不渲染、不触发 build，右表没反应（仅双表视图生效）
          if (stateKey === '__dual__' && self.dualTableCurrentNova !== tapNovaName) return
          self.linkTreeData[stateKey] = sortedRoot
          self.linkTreeNodeMap[stateKey] = nodeMap
          self.linkTreeCheckedKeys[stateKey] = checkedKeys
          self.linkTreeDefaultExpandedKeys[stateKey] = defaultExpandKeys
          self.linkTreeExpandedKeys[stateKey] = defaultExpandKeys
          self.linkTreeLoading[stateKey] = false
          self.updateLinkTreeDisplayKeys(stateKey)
          // 树渲染后同步右面板高度
          Vue.nextTick(function() { self.syncDualPanelHeight() })
        }
        // 首屏整页加载阶段：等全屏动画移除后再渲染
        if (window.__bootLoadingInDom && window.__bootLoadingInDom()) {
          window.NovaTableJQ.whenBootGone(apply)
          return
        }
        // 切 tab/点行：保证右表树加载动画完整展示一小段时间（避免闪烁且主线程空闲），再渲染
        var remain = window.NovaLoading.minDuration.linkTree - (Date.now() - (self._linkTreeLoadingStart || 0))
        if (remain > 0) { setTimeout(apply, remain) } else { apply() }
      }

      // Step 2a: 目标表 tree（全量树结构），sourceNovaName 为外层主 nova
      window.fetchApi.post('/nova/table/tree', { novaName: targetNovaName, sourceNovaName: self.novaName, sourceFields: srcFields }, window.__novaMenuCode(targetNovaName)).then(function(treeResp) {
          if (treeResp.code !== 200) {
            self.linkTreeLoading[stateKey] = false
            if (window.$message) window.$message.error(window.__t('table.tree_load_failed'))
            return
          }
          const rootList = treeResp.data.rootList || []
          const childrenList = treeResp.data.childrenList || []

          rootList.forEach(function(node) {
            nodeMap[String(node[linkStorageField])] = node
          })
          childrenList.forEach(function(node) {
            nodeMap[String(node[linkStorageField])] = node
          })

          // 构建 parentMap（用于建树）
          var getParentId = function(node) {
            var parent = node[treeParentField]
            if (parent == null || parent === '') return null
            if (typeof parent === 'object') {
              return parent[treeStorageField]
            }
            return parent
          }
          const parentMap = {}
          childrenList.forEach(function(node) {
            const parentId = getParentId(node)
            const key = parentId != null ? String(parentId) : null
            if (!parentMap[key]) parentMap[key] = []
            parentMap[key].push(node)
          })

          function buildTree(nodes) {
            nodes.forEach(function(node) {
              const children = parentMap[String(node[linkStorageField])] || []
              if (children.length > 0) {
                node.children = children.sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0) })
                buildTree(children)
              }
            })
          }
          buildTree(rootList)
          sortedRoot = rootList

          // 根据 treeLevel 计算默认展开的节点
          if (treeLevel > 0) {
            var collectByLevel = function(nodes, depth) {
              if (depth >= treeLevel) return
              nodes.forEach(function(node) {
                if (node[linkStorageField] != null) defaultExpandKeys.push(node[linkStorageField])
                if (node.children && node.children.length) {
                  collectByLevel(node.children, depth + 1)
                }
              })
            }
            collectByLevel(rootList, 0)
          }

          treeRendered = true
          renderTree()
        }).catch(function() {
          self.linkTreeLoading[stateKey] = false
          if (window.$message) window.$message.error(window.__t('table.tree_load_failed'))
        })

      // Step 2b: 反显接口（返回已勾选的 key 列表，直接回显）
      var storageField = lt.thisStorageField
      // linkStorageField 已在函数顶部声明（全量树 key 字段）
      window.fetchApi.post('/nova/table/treeDisplay', { novaName: tapNovaName, sourceNovaName: self.novaName, operateValue: String((row || self.currentRow)[storageField]) }, window.__novaMenuCode(tapNovaName)).then(function(linkResp) {
          if (linkResp.code === 200) {
            var list = linkResp.data || []
            list.forEach(function(val) {
              if (val != null) checkedKeys.add(val)
            })
          }
          checkedReady = true
          renderTree()
        }).catch(function() {
          // 反显失败：不勾选，树仍可正常显示
          checkedReady = true
          renderTree()
        })
    },
    updateLinkTreeDisplayKeys(tapNovaName) {
      const fullSet = this.linkTreeCheckedKeys[tapNovaName] || new Set()
      this.linkTreeDisplayKeys[tapNovaName] = Array.from(fullSet)
    },
    filterLinkTreeData(tapNovaName, configKey) {
      configKey = configKey || tapNovaName
      const keyword = (this.linkTreeSearchKeyword[tapNovaName] || '').trim().toLowerCase()
      const fullData = this.linkTreeData[tapNovaName]
      if (!keyword) {
        this.linkTreeFilteredData[tapNovaName] = null
        this.linkTreeExpandedKeys[tapNovaName] = this.linkTreeDefaultExpandedKeys[tapNovaName] || []
        return
      }
      if (!fullData) return

      const config = (this.linkTabBuild[configKey] || {}).linkTreeTargetConfig
      if (!config) return
      const searchField = config.treeSearchField
      const linkStorageField = config.linkStorageField
      const parentField = config.treeParentField
      const storageField = config.treeStorageField

      // 收集所有节点到 Map（保留原始 key 类型，和 n-tree 的 key-field 一致）
      const nodeMap = new Map()
      const collectAll = function(nodes) {
        nodes.forEach(function(node) {
          nodeMap.set(node[linkStorageField], node)
          if (node.children && node.children.length) collectAll(node.children)
        })
      }
      collectAll(fullData)

      // 找到命中节点
      const hitKeys = new Set()
      nodeMap.forEach(function(node, key) {
        var val = node[searchField]
        if (val != null && String(val).toLowerCase().indexOf(keyword) !== -1) {
          hitKeys.add(key)
        }
      })
      if (hitKeys.size === 0) { this.linkTreeFilteredData[tapNovaName] = []; this.linkTreeExpandedKeys[tapNovaName] = []; return }

      // 向上走祖先
      var getParentId = function(node) {
        var parent = node[parentField]
        if (parent == null || parent === '') return null
        if (typeof parent === 'object') { return parent[storageField] }
        return parent
      }
      var ancestorKeys = new Set()
      hitKeys.forEach(function(hitKey) {
        var cur = hitKey
        while (cur) {
          var n = nodeMap.get(cur)
          if (!n) break
          var pid = getParentId(n)
          if (pid == null || pid === '') break
          if (hitKeys.has(pid)) break
          ancestorKeys.add(pid)
          cur = pid
        }
      })

      // 命中节点及其祖先自动展开，保证用户能看到匹配节点
      hitKeys.forEach(function(hitKey) {
        var node = nodeMap.get(hitKey)
        if (node && node.children && node.children.length) {
          ancestorKeys.add(hitKey)
        }
      })
      var expandKeys = Array.from(ancestorKeys)

      // 可见节点 key 集合
      var visibleKeys = new Set([...hitKeys, ...ancestorKeys])

      // 递归过滤树，只保留可见节点
      var filterTree = function(nodes) {
        var result = []
        nodes.forEach(function(node) {
          if (!visibleKeys.has(node[linkStorageField])) return
          var copy = Object.assign({}, node)
          if (node.children && node.children.length) {
            var fc = filterTree(node.children)
            copy.children = fc.length > 0 ? fc : undefined
          }
          result.push(copy)
        })
        return result
      }

      this.linkTreeFilteredData[tapNovaName] = filterTree(fullData)
      this.linkTreeExpandedKeys[tapNovaName] = expandKeys
    },
    linkTreeSearchPlaceholder(tapNovaName) {
      const config = (this.linkTabBuild[tapNovaName] || {}).linkTreeTargetConfig
      if (!config) return window.__t('common.loading')
      const cols = config.tableColumns || []
      const searchField = config.treeSearchField
      for (var i = 0; i < cols.length; i++) {
        if (cols[i].field === searchField) {
          return window.__t('table.search_field_placeholder', { name: (cols[i].title || searchField) })
        }
      }
      return window.__t('table.search_field_placeholder', { name: searchField })
    },
    linkTreeRenderLabel(tapNovaName) {
      var self = this
      return function(info) {
        var node = info.option
        var config = (self.linkTabBuild[tapNovaName] || {}).linkTreeTargetConfig
        var label = config ? (node[config.treeSearchField] || '') : ''
        var keyword = (self.linkTreeSearchKeyword[tapNovaName] || '').trim()
        if (!keyword || !label) return label
        var lower = label.toLowerCase()
        var kw = keyword.toLowerCase()
        var parts = []
        var last = 0
        var idx = lower.indexOf(kw)
        while (idx !== -1) {
          if (idx > last) parts.push(h('span', {}, label.slice(last, idx)))
          parts.push(h('span', { style: { color: '#d03050' } }, label.slice(idx, idx + kw.length)))
          last = idx + kw.length
          idx = lower.indexOf(kw, last)
        }
        if (last < label.length) parts.push(h('span', {}, label.slice(last)))
        return parts.length > 0 ? h('span', {}, parts) : label
      }
    },
    onLinkTreeCheck(checkedKeys, tapNovaName) {
      const oldDisplay = this.linkTreeDisplayKeys[tapNovaName] || []
      const newChecked = Array.isArray(checkedKeys) ? checkedKeys : (checkedKeys.checked || [])

      const added = newChecked.filter(function(k) { return oldDisplay.indexOf(k) === -1 })
      const removed = oldDisplay.filter(function(k) { return newChecked.indexOf(k) === -1 })

      const fullSet = this.linkTreeCheckedKeys[tapNovaName] || new Set()
      added.forEach(function(k) { fullSet.add(k) })
      removed.forEach(function(k) { fullSet.delete(k) })
      this.linkTreeCheckedKeys[tapNovaName] = new Set(fullSet)

      this.updateLinkTreeDisplayKeys(tapNovaName)
    },
    submitLinkTree(tab) {
      const tapNovaName = tab.tapNovaName
      const build = this.linkTabBuild[tapNovaName]
      if (!build || !build.linkTarget) return

      const lt = build.linkTarget
      const checkedIds = Array.from(this.linkTreeCheckedKeys[tapNovaName] || [])

      if (checkedIds.length === 0) {
        if (window.$message) window.$message.warning(window.__t('table.select_node_first'))
        return
      }

      const sourceField = build.sourceFieldName
      const targetField = build.targetFieldName
      const sourceFields = this.buildLinkSourceFields(tab)
      const sourceValue = sourceFields[lt.thisReferenceField]

      if (!sourceField || !targetField) {
        if (window.$message) window.$message.error(window.__t('table.link_param_missing_basic', { name: 'field' }))
        return
      }
      if (!sourceValue) {
        if (window.$message) window.$message.error(window.__t('table.link_param_missing_basic', { name: 'sourceValue' }))
        return
      }

      window.NovaTableJQ_link.handleLinkAdd(
        this.novaName, tapNovaName,
        sourceField, sourceValue,
        targetField, checkedIds,
        this._vmKey || this.novaName,
        null
      )
    },
    onLinkTreeSearch(linkNovaName, keyword) {
      this.linkTreeSearchKeyword[linkNovaName] = keyword
      this.filterLinkTreeData(linkNovaName)
    },
    onLinkFormSave(linkNovaName) {
      this.submitLinkTree({ tapNovaName: linkNovaName })
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
        var first = this.dualTableSubTables[0]
        this.openDualTableView(first ? first.id : '')
      }
    },
    handleDualLinkAdd() {
      window.NovaDualLinkJQ.handleDualLinkAdd(this)
    },
    openDualTableView(subId) {
      const item = this.dualTableSubTables.find(s => s.id === subId)
      if (!item) return
      if (!this._dualSelectedRow && this.filteredData && this.filteredData.length > 0) {
        this._dualSelectedRow = this.filteredData[0]
      }

      // 清除双表树状态
      this.linkTreeData['__dual__'] = null
      this.linkTreeCheckedKeys['__dual__'] = null

      this.dualTableViewActive = true
      this._dualTableVersion++
      this.dualTableCurrentSubId = item.id
      this.dualTableCurrentNova = item.novaName
      this.dualTableCurrentLabel = item.label
      this.dualTableCurrentKey = '__dual_' + item.id + '_v' + this._dualTableVersion
      this.buildDualTableSourceFields()
      this._syncDualTableClass()
      // 双表视图激活后更新右表宽度
      var self = this
      setTimeout(function() { if (window.NovaTableJQ) window.NovaTableJQ.updateTableWidth() }, 100)

      // LINK 类型：尝试加载树模式
      if (item.type === 'link') {
        var self = this
        window.NovaDualLinkJQ.initDualLinkTreeTab(this, function(isTreeMode) {
          if (!isTreeMode) {
            // 非树模式：模板会回退到 nova-table
            self.linkTreeLoading['__dual__'] = false
            // 清除之前树模式可能设置的固定高度
            self.$nextTick(function() { self.syncDualPanelHeight() })
          }
        })
      }
    },
    buildDualTableSourceFields() {
      const row = this._dualSelectedRow
      if (!row) { this.dualTableSourceFields = {}; return }
      // 查找当前子表在 dualTableSubTables 中的类型
      const sub = this.dualTableSubTables.find(s => s.id === this.dualTableCurrentSubId)
      if (!sub) { this.dualTableSourceFields = {}; return }

      if (sub.type === 'link') {
        // LINK 类型：key 用 operateInfo.referenceField（join表FK），value 用 row[storageField]
        const linkInfo = sub.fieldInfo || {}
        const op = linkInfo.operateInfo || {}
        const refField = op.referenceField
        const storageField = op.storageField
        if (!refField) { this.dualTableSourceFields = {}; return }
        const val = row[storageField]
        if (val == null) { this.dualTableSourceFields = {}; return }
        this.dualTableSourceFields = { [refField]: String(val) }
      } else if (sub.type === 'drill') {
        // DRILL 类型：key 用 joinColumn，value 用当前行[column]的值
        const drillInfo = sub.fieldInfo || {}
        const column = drillInfo.column
        const joinColumn = drillInfo.joinColumn
        if (!column || !joinColumn) { this.dualTableSourceFields = {}; return }
        const val = row[column]
        if (val == null) { this.dualTableSourceFields = {}; return }
        this.dualTableSourceFields = { [joinColumn]: String(val) }
      } else {
        // APPENDAGES 类型：取 fieldInfo.storageField，值为当前行对应字段值
        const appInfo = sub.fieldInfo || {}
        const storageField = appInfo.storageField
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
      var consumedKeys = []
      if (sourceKeys.length > 0) {
        var refMap = target.referenceMap || {}
        for (var field in refMap) {
          var refInfo = refMap[field]
          if (refInfo.storageField && sourceKeys.indexOf(refInfo.storageField) !== -1) {
            consumedKeys.push(refInfo.storageField)
            sourceRefFields.push({ field: field, referenceField: refInfo.referenceField, value: embSourceFields[refInfo.storageField] })
          }
        }
      }
      // 未命中 refMap 的 source key 直接作为条件列（LINK_TARGET / drill joinColumn）
      sourceKeys.forEach(function(k) {
        if (embSourceFields[k] != null && consumedKeys.indexOf(k) === -1) {
          sourceRefFields.push({ field: k, referenceField: k, value: String(embSourceFields[k]) })
        }
      })
      target._sourceRefFields = sourceRefFields
    },
    reloadDual(novaName, sourceFields) {
      if (this._vmKey && window.vmMap) delete window.vmMap[this._vmKey]
      this.novaName = novaName
      this._vmKey = '__dual_' + novaName + '_' + Date.now()
      window.vmMap[this._vmKey] = this
      // reloadDual 显式接管了 build（下方 onEmbeddedMounted），清除 _dualReloadPending 标记。
      // 该标记在切换 drill/appendage 子表时置位，reloadDual 复用实例不触发 mounted 而残留；
      // 若残留 true，之后切换到 LINK 子表时内部 nova-table 新建挂载会误判
      // "reloadDual 将接管"而跳过 build，导致右表没反应、不发 build 接口
      window._dualReloadPending = false
      // 不传 deferDataLoad（默认 false），让 /build 响应回调中初始化好
      // _sourceRefFields 后自动调用 loadData，避免先于 /build 响应加载导致
      // 使用旧表元数据构造错误条件
      if (window.NovaTableJQ) {
        window.NovaTableJQ.onEmbeddedMounted(novaName, this._vmKey, this.sourceNovaNameProp || novaName, sourceFields || {})
      }
    },
    onDualTableRowClick(row) {
      if (!this.dualTableViewActive) return
      this._dualSelectedRow = row

      // 树模式：重新加载树数据（不清旧数据避免闪烁，loadLinkTreeData 内部会自动覆盖）
      if (this.linkTreeData['__dual__']) {
        this.loadLinkTreeData(this.dualTableCurrentNova, { row: row, stateKey: '__dual__' })
        return
      }

      if (this.isDualTableLink) {
        // LINK 非树模式：更新 sourceFields，由 watcher 自动处理条件更新和 loadData
        this.buildDualTableSourceFields()
        return
      }

      // APPENDAGES 委托 JQ
      window.NovaDualAppendagesJQ.onRowClick(this, row)
    },
    onDualTableSubChange(subId) {
      const item = this.dualTableSubTables.find(s => s.id === subId)
      if (!item) return

      // 相同 tab 不重复处理
      if (this.dualTableCurrentSubId === item.id) return

      // 清除双表树状态
      this.linkTreeData['__dual__'] = null
      this.linkTreeCheckedKeys['__dual__'] = null

      this.dualTableCurrentSubId = item.id
      this.dualTableCurrentNova = item.novaName
      this.dualTableCurrentLabel = item.label

      this.buildDualTableSourceFields()
      var self = this

      if (item.type === 'link') {
        // LINK 类型：尝试加载树模式
        window.NovaDualLinkJQ.initDualLinkTreeTab(this, function(isTreeMode) {
          if (!isTreeMode) {
            // 非树模式：设置 loading=false 让 nova-table 显示
            // 内层表格已通过 novaName key 重建，mounted() 自动调用 build/loadData
            self.linkTreeLoading['__dual__'] = false
            self.$nextTick(function () {
              self.syncDualPanelHeight()
              var panelEl = document.querySelector('.dual-right-panel')
              if (panelEl) {
                var contentEl = panelEl.querySelector('.page-card, .embedded-table')
                if (contentEl) {
                  contentEl.classList.remove('dual-content-slideup')
                  void contentEl.offsetWidth
                  contentEl.classList.add('dual-content-slideup')
                }
              }
            })
          }
        })
      } else {
        // APPENDAGES / DRILL 类型：直接操作 NovaTable 实例，
        // _dualReloading 阻止 sourceFieldsProp watcher 干扰，reloadDual 全权负责
        window._dualReloadPending = true
        var nt = this.$refs.dualTableRef
        if (nt) {
          nt._dualReloading = true
          // 切换钻取目标表：reloadDual 在 $nextTick 里才把 buildLoading 置 true，
          // 若不处理，切换瞬间旧表数据会先渲染出来（先表格后动画遮罩）。
          // 这里同步清空旧数据并立即显示遮罩，让首帧就是"遮罩盖住空表格"
          nt.tableData = []
          nt.rawTableData = []
          nt.buildLoading = true
          nt._buildLoadingStart = Date.now()
        }
        var self2 = this
        self2.$nextTick(function () {
          var nt2 = self2.$refs.dualTableRef
          if (nt2) {
            nt2._dualReloading = false
            nt2.reloadDual(item.novaName, self2.dualTableSourceFields)
          }
          self2.$nextTick(function () {
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
      }
    },
    _syncDualTableClass() {
      window.NovaDualAppendagesJQ.syncTableClass(this)
    },
    // 双表视图：右面板高度由 flex 拉伸决定（.page-content 高度固定），
    // 不再用 JS 读左表 offsetHeight 设置固定像素（初始布局未稳定时读到错误值，导致树贴底）
    syncDualPanelHeight() {
      var rightPanel = document.querySelector('.dual-right-panel')
      if (rightPanel) rightPanel.style.height = ''
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
      window.fetchApi.post('/nova/table/promptSearch', {
        novaName: refNovaName,
        sourceNovaName: this.novaName,
        sourceFields,
        prompt: query,
        pageBean: { current: page, size: 10 }
      }).then(resp => {
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
      }).catch(() => { this.refSelectLoading[field] = false })
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
    // referenceDisplayLabel moved to NovaFormThis child component
    selectRow(row) {
      this.selectedRowKey = row[this.novaIdFieldName]
      // 平铺 REFERENCE 字段的外键值，使 APPENDAGE filter 能通过 referenceField 名称直接取值
      const enrichedRow = Object.assign({}, row)
      for (const key in (this.referenceMap || {})) {
        const ri = this.referenceMap[key]
        if (ri && ri.referenceField && row[key] && typeof row[key] === 'object') {
          const fkVal = row[key][ri.storageField]
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
      } else if (tab.startsWith('app_')) {
        var appNovaName = tab.slice(4)
        if (this.appendageDetailsLoaded && this.appendageDetailsLoaded[appNovaName]) return
        if (window.NovaTableJQ_app) window.NovaTableJQ_app.loadAppendageDetails(this.novaName, appNovaName)
      }
    },

    formatDateTs(ts, type) {
      const d = new Date(ts)
      const p = n => String(n).padStart(2, '0')
      if (type === 'YEAR')  return String(d.getFullYear())
      if (type === 'YEAR_MONTH') return d.getFullYear() + '-' + p(d.getMonth() + 1)
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
      return window.NovaFieldView.format(f, this.formData[f.field], {
        choiceMap:    this.choiceMap,
        dateMap:      this.dateMap,
        numberMap:    this.numberMap,
        referenceMap: this.referenceMap,
        formData:     this.formData
      })
    },
    handlePageChange(current) {
      if (this.isTree) return
      this.expandedRowKeys = []
      this.treeLoadingKeys = []
      const key = (this.pickerMode || this.embeddedMode || this.dualMode) ? this._vmKey : this.novaName
      window.NovaTableJQ.onPageChange(key, current)
    },
    handlePageSizeChange(pageSize) {
      if (this.isTree) return
      const key = (this.pickerMode || this.embeddedMode || this.dualMode) ? this._vmKey : this.novaName
      window.NovaTableJQ.onPageSizeChange(key, pageSize)
    }
  },

  template: `
    <div v-if="viewMode">
      <div v-if="editFields.length === 0" style="text-align:center;padding:60px;color:#aaa;font-size:14px">{{ __t('common.loading') }}</div>
      <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:0px 24px">
        <template v-for="f in editFields.filter(f => f.type !== 'DIVIDE' && f.type !== 'EMPTY' && f.type !== 'BUTTON')" :key="f.field">
          <div :style="f.type === 'ATTACHMENT' ? 'grid-column: 1 / -1' : ''" style="padding:12px 0;border-bottom:1px dashed var(--n-border-color)">
            <div style="font-size:12px;color:var(--n-text-color-3);opacity:0.7;margin-bottom:6px;display:flex;align-items:center;gap:4px">
              <iconify-icon v-if="viewFieldIcon(f)" :icon="viewFieldIcon(f)" width="13" style="color:var(--n-text-color-3);flex-shrink:0"></iconify-icon>
              <span>{{ f.title }}</span>
            </div>
            <!-- 附件类型 -->
            <div v-if="f.type === 'ATTACHMENT'">
              <div v-if="!(formData[f.field] || []).length" style="font-size:14px;color:var(--n-text-color-3);font-style:italic">-</div>
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
                  <span style="flex:1;font-size:14px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--n-text-color-1)" :title="url">{{ url }}</span>
                  <span style="font-size:12px;color:var(--n-primary-color);cursor:pointer;flex-shrink:0" @click="copyText(url)">{{ __t('common.copy') }}</span>
                </div>
              </template>
            </div>
            <!-- 普通类型 -->
            <div v-else style="font-size:15px;font-weight:500;color:var(--n-text-color-1);line-height:1.5">
              <span v-if="!viewDisplayValue(f)" style="color:var(--n-text-color-3);font-style:italic;font-weight:400">-</span>
              <span v-else
                style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                :title="viewDisplayValue(f)">{{ viewDisplayValue(f) }}</span>
            </div>
          </div>
        </template>
      </div>
      <n-modal v-model:show="previewModalShow" preset="card" style="width:760px;margin-top:60px;padding:0">
        <template #header>
          <div class="gallery-header">
            <span class="gallery-title">{{ previewField ? (previewField.title || __t('table.attach_preview')) : __t('table.attach_preview') }}</span>
          </div>
        </template>
        <div v-if="previewField && attachmentMap[previewField.field] && attachmentMap[previewField.field].type === 'IMAGE'" class="gallery-wrap">
          <div class="gallery-body">
            <div v-if="(formData[previewField.field] || []).length > 0" class="gallery-sider">
              <div class="gallery-thumb-list">
                <div v-for="(url, idx) in (formData[previewField.field] || [])" :key="idx" class="gallery-thumb-item">
                  <img :src="url" class="gallery-thumb-img" :class="{active: previewIndex === idx}"
                    @click="slideDirection = previewIndex < idx ? 'right' : 'left'; previewIndex = idx" />
                </div>
              </div>
            </div>
            <div class="gallery-stage">
              <transition :name="'slide-' + slideDirection">
                <img :key="previewIndex" :src="formData[previewField.field][previewIndex]" class="gallery-main-img" />
              </transition>
            </div>
          </div>
          <div v-if="(formData[previewField.field] || []).length > 0" class="gallery-url-wrap" :title="__t('table.click_copy') + ': ' + (formData[previewField.field] || [])[previewIndex]" @click="copyText((formData[previewField.field] || [])[previewIndex])">
            <div class="gallery-url-label">{{ __t('table.image_url') }}</div>
            <div class="gallery-url-text">{{ (formData[previewField.field] || [])[previewIndex] }}</div>
          </div>
          <div v-if="(formData[previewField.field] || []).length === 0" class="gallery-empty">{{ __t('table.no_image') }}</div>
        </div>
        <div v-else-if="previewField" class="preview-file-list">
          <template v-for="(url, idx) in (formData[previewField.field] || [])" :key="idx">
            <div class="preview-file-row">
              <span class="preview-file-url">{{ url }}</span>
              <n-button size="tiny" @click="copyText(url)">{{ __t('common.copy') }}</n-button>
            </div>
          </template>
          <div v-if="(formData[previewField.field] || []).length === 0" class="preview-empty">{{ __t('table.no_file') }}</div>
        </div>
      </n-modal>
    </div>
    <div v-else :class="embeddedMode ? 'embedded-table' : ''" :style="'position:relative;' + (pickerMode ? 'height:100%;display:flex;flex-direction:column;overflow:hidden;padding:0 16px' : (embeddedMode ? '' : dualMode ? 'flex:1;display:flex;flex-direction:column;overflow:hidden' : isTree ? 'height:100%;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;padding:16px 8px 4px 16px' : 'height:100%;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;padding:16px 8px 4px 16px'))">

      <!-- 顶部提示面板：纯手动浮层（仅主 nova 视图）。触发 chip + 面板均为 absolute，不参与布局、不占高度 -->
      <div v-if="showNovaTip" class="nova-tip-bar">
        <div
          class="nova-tip-tab"
          :class="{ open: tipShow }"
          @click.stop="onTipToggle"
          @mouseenter="onTipEnter"
          @mouseleave="onTipLeave"
        >
          <span class="nova-tip-arrow" :class="{ rotated: tipShow }">▾</span>
        </div>
        <div
          v-show="tipShow"
          class="nova-tip-panel"
          @mouseenter="onTipEnter"
          @mouseleave="onTipLeave"
        >
          <div class="nova-tip-body">
            <div class="nova-tip-content" v-html="tipHtml"></div>
          </div>
        </div>
      </div>

      <!-- 主表 /build 构建中：loading 覆盖层（覆盖搜索区+表格），hidden 时淡出 -->
      <div class="table-build-overlay" :class="buildLoading ? '' : 'hidden'">
        <div class="table-build-loading" v-html="novaLoadingHtml"></div>
      </div>

      <!-- 树形表格搜索 -->
      <component v-if="isTree && !linkMode && treeSearchField" :is="embeddedMode ? 'div' : 'n-card'" :bordered="false" class="page-card filter-card" :style="embeddedMode ? 'flex-shrink:0' : ''">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="form-label" :title="treeSearchFieldTitle">{{ treeSearchFieldTitle }}</span>
          <n-input
            v-model:value="treeSearchKeyword"
            :placeholder="__t('table.search_field_placeholder', { name: treeSearchFieldTitle })"
            clearable
            :size="embSize"
            style="flex:1;max-width:300px"
            @keydown.enter="handleQuery"
          >
            <template #prefix>
              <iconify-icon icon="material-symbols:search" style="font-size:16px;color:#aaa"></iconify-icon>
            </template>
          </n-input>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:auto">
            <n-button :size="embSize" @click="handleTreeSearchReset">{{ __t('common.reset') }}</n-button>
            <n-button :size="embSize" type="primary" @click="handleQuery">{{ __t('common.query') }}</n-button>
            <n-button :size="embSize" dashed @click="toggleFilter" :disabled="true">
              <template #icon>
                <n-icon><iconify-icon :icon="filterExpanded ? 'material-symbols:keyboard-arrow-up' : 'material-symbols:keyboard-arrow-down'"></iconify-icon></n-icon>
              </template>
              {{ filterExpanded ? __t('common.collapse') : __t('common.expand') }}
            </n-button>
          </div>
        </div>
      </component>
      <!-- 普通表格筛选卡片 -->
      <component v-else-if="!linkMode" :is="embeddedMode ? 'div' : 'n-card'" :bordered="false" class="page-card filter-card" :style="'flex-shrink:0'">
        <div :class="['filter-grid', embeddedMode ? 'embedded' : '', (dualMode || dualTableViewActive) ? 'dual' : '']" :style="embeddedMode ? 'padding:8px 0' : ''">
          <template v-for="(field, index) in searchFields" :key="field.field">
            <div v-if="filterExpanded || index < ((dualMode || dualTableViewActive) ? 1 : 3)" style="display:flex;align-items:center;gap:8px;width:100%">
              <span class="form-label" :title="field.title">{{ field.title }}</span>
              <n-select v-if="field.type === 'CHOICE' && choiceMap[field.field] && choiceMap[field.field].selectType === 'SINGLE' && !field.vague"
                v-model:value="filterForm[field.field]"
                @update:value="onFilterChoiceUpdate(field.field)"
                :options="fieldOptions(field)"
                :placeholder="__t('table.select_field_placeholder', { name: field.title })"
                :size="embSize"
                clearable style="flex:1"
              />
              <n-select v-else-if="field.type === 'CHOICE'"
                v-model:value="filterForm[field.field]"
                @update:value="onFilterChoiceUpdate(field.field)"
                :options="fieldOptions(field)"
                :placeholder="__t('table.select_field_placeholder', { name: field.title })"
                :size="embSize"
                multiple clearable style="flex:1"
              />
              <n-select v-else-if="field.type === 'TAG'"
                v-model:value="filterForm[field.field]"
                :options="tagOptions(field.field)"
                :placeholder="__t('table.select_field_placeholder', { name: field.title })"
                :size="embSize"
                multiple clearable filterable
                :tag="tagMap[field.field] && tagMap[field.field].allowExtension"
                style="flex:1"
              />
              <n-select v-else-if="field.type === 'BOOLEAN'"
                v-model:value="filterForm[field.field]"
                :options="[{label:__t('table.yes'),value:'true'},{label:__t('table.no'),value:'false'}]"
                :placeholder="__t('table.select_field_placeholder', { name: field.title })"
                :size="embSize"
                clearable style="flex:1"
              />
              <div v-else-if="field.type === 'NUMBER' && field.vague" class="number-vague-field">
                <n-input-number
                  v-model:value="filterForm[field.field][0]"
                  :placeholder="__t('table.min_value')"
                  :min="numberMap[field.field] && numberMap[field.field].min"
                  :max="numberMap[field.field] && numberMap[field.field].max"
                  :precision="numberMap[field.field] && numberMap[field.field].type === 'DECIMAL' ? (numberMap[field.field].decimal || 2) : 0"
                  :show-button="false" :bordered="false" clearable style="flex:1;min-width:0"
                />
                <span class="number-vague-sep">—</span>
                <n-input-number
                  v-model:value="filterForm[field.field][1]"
                  :placeholder="__t('table.max_value')"
                  :min="numberMap[field.field] && numberMap[field.field].min"
                  :max="numberMap[field.field] && numberMap[field.field].max"
                  :precision="numberMap[field.field] && numberMap[field.field].type === 'DECIMAL' ? (numberMap[field.field].decimal || 2) : 0"
                  :show-button="false" :bordered="false" clearable style="flex:1;min-width:0"
                />
              </div>
              <n-input-number v-else-if="field.type === 'NUMBER'"
                v-model:value="filterForm[field.field]"
                :placeholder="__t('table.search_field_placeholder', { name: field.title })"
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
                :placeholder="field.vague ? '' : searchDatePlaceholder(field)"
                :start-placeholder="field.vague ? searchDatePlaceholder(field)[0] : undefined"
                :end-placeholder="field.vague ? searchDatePlaceholder(field)[1] : undefined"
                :size="embSize"
                clearable style="flex:1"
              />
              <!-- 筛选区 REFERENCE 非 vague：下拉搜索 -->
              <n-select
                v-else-if="field.type === 'REFERENCE' && referenceMap[field.field] && field.vague"
                :value="filterForm[field.field] || null"
                :options="refSelectOptions['_f_' + field.field] || []"
                :loading="!!refSelectLoading['_f_' + field.field]"
                :placeholder="__t('table.search_input_tip')"
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
                    {{ refSelectLoading['_f_' + field.field] ? __t('table.searching') : __t('table.search_input_tip') }}
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
                      {{ __t('table.load_more') }}({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </div>
                    <span v-else-if="(refSelectOptions['_f_' + field.field] || []).length > 0" style="font-size:12px;color:#aaa">
                      {{ __t('table.loaded_all') }}({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </span>
                  </div>
                </template>
              </n-select>
              <!-- 筛选区 REFERENCE vague=true：弹窗选择 -->
              <div v-else-if="field.type === 'REFERENCE' && referenceMap[field.field]" @click="openReferenceModalForFilter(field)" style="flex:1;cursor:pointer">
                <n-input
                  :value="filterForm[field.field + '_display'] || filterForm[field.field] || ''"
                  :placeholder="__t('table.select_field_placeholder', { name: field.title })"
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
                :placeholder="__t('table.search_input_tip')"
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
                    {{ refSelectLoading['_f_' + field.field] ? __t('table.searching') : __t('table.search_input_tip') }}
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
                      {{ __t('table.load_more') }}({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </div>
                    <span v-else-if="(refSelectOptions['_f_' + field.field] || []).length > 0" style="font-size:12px;color:#aaa">
                      {{ __t('table.loaded_all') }}({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </span>
                  </div>
                </template>
              </n-select>
              <!-- 筛选区 APPENDAGE / APPENDAGES vague=false：弹窗选择 -->
              <div v-else-if="(field.type === 'APPENDAGE' || field.type === 'APPENDAGES') && appendageMap && appendageMap[field.field]" @click="openAppendageModalForFilter(field)" style="flex:1;cursor:pointer">
                <n-input
                  :value="filterForm[field.field + '_display'] || filterForm[field.field] || ''"
                  :placeholder="__t('table.select_field_placeholder', { name: field.title })"
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
                :placeholder="__t('table.search_input_tip')"
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
                    {{ refSelectLoading['_f_' + field.field] ? __t('table.searching') : __t('table.search_input_tip') }}
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
                      {{ __t('table.load_more') }}({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </div>
                    <span v-else-if="(refSelectOptions['_f_' + field.field] || []).length > 0" style="font-size:12px;color:#aaa">
                      {{ __t('table.loaded_all') }}({{ (refSelectOptions['_f_' + field.field] || []).length }}/{{ refSelectTotal['_f_' + field.field] || 0 }})
                    </span>
                  </div>
                </template>
              </n-select>
              <!-- 筛选区 LINK vague=false：弹窗选择 -->
              <div v-else-if="field.type === 'LINK' && linkMap && linkMap[field.field]" @click="openLinkModalForFilter(field)" style="flex:1;cursor:pointer">
                <n-input
                  :value="filterForm[field.field + '_display'] || filterForm[field.field] || ''"
                  :placeholder="__t('table.select_field_placeholder', { name: field.title })"
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
                :placeholder="__t('table.search_field_placeholder', { name: field.title })"
                :size="embSize"
                clearable style="flex:1"
              />
            </div>
          </template>
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px" :style="(dualMode || dualTableViewActive) ? 'grid-column:2' : 'grid-column:4'">
            <n-button :size="embSize" @click="handleReset">{{ __t('common.reset') }}</n-button>
            <n-button :size="embSize" type="primary" @click="handleQuery">{{ __t('common.query') }}</n-button>
            <n-button :size="embSize" dashed @click="toggleFilter" :disabled="searchFields.length <= ((dualMode || dualTableViewActive) ? 1 : 3)">
              <template #icon>
                <n-icon><iconify-icon :icon="filterExpanded ? 'material-symbols:keyboard-arrow-up' : 'material-symbols:keyboard-arrow-down'"></iconify-icon></n-icon>
              </template>
              {{ filterExpanded ? __t('common.collapse') : __t('common.expand') }}
            </n-button>
          </div>
        </div>
      </component>

      <!-- 表格卡片 -->
      <component :is="embeddedMode ? 'div' : 'n-card'" :bordered="false" class="page-card table-card" :style="pickerMode ? 'flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0' : (dualMode ? 'flex:1;min-height:0' : embeddedMode ? 'flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0' : 'flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0')" :content-style="pickerMode ? 'flex:1;display:flex;flex-direction:column;overflow:hidden;padding:8px' : (dualMode ? 'display:flex;flex-direction:column;overflow:hidden;flex:1;padding-bottom:8px' : 'flex:1;display:flex;flex-direction:column;overflow:hidden;padding-bottom:8px')">
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
            <span v-else style="font-size:16px;font-weight:500">{{ __t('table.data_list') }}</span>
            <div style="display:flex;gap:8px">
            <!-- ── 自定义按钮：MULTI / MULTI_ONLY / BUTTON（工具栏）─── -->
            <n-dropdown v-if="toolbarFoldedButtons.length > 0"
              trigger="hover"
              :options="toolbarFoldedOptions"
              @select="(key) => { var btn = toolbarFoldedButtons.find(function(b) { return b.title === key }); if (btn) handleCustomBtnClick(btn) }">
              <n-button :size="embSize" circle style="background:transparent" :title="__t('table.more_actions')">
                <template #icon><n-icon size="16"><iconify-icon icon="material-symbols:more-horiz"></iconify-icon></n-icon></template>
              </n-button>
            </n-dropdown>
            <template v-for="btn in toolbarUnfoldedButtons" :key="btn.title">
              <n-popconfirm v-if="btn.callHint" :positive-text="__t('common.confirm')" :negative-text="__t('common.cancel')" @positive-click="handleCustomBtnClick(btn, true)">
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
            <n-button v-if="tbStandardShow.batchDelete" :size="embSize" type="error" @click="handleBatchDelete">
              <template #icon><n-icon><iconify-icon icon="material-symbols:delete-outline"></iconify-icon></n-icon></template>
              {{ __t('common.delete.spaced') }}
            </n-button>
            <n-button v-if="tbStandardShow.linkAdd" :size="embSize" type="primary" @click="$emit('link-add')">
              <template #icon><n-icon><iconify-icon icon="material-symbols:add"></iconify-icon></n-icon></template>
              {{ __t('common.add') }}
            </n-button>
            <n-button v-if="tbStandardShow.add" :size="embSize" type="primary" @click="handleAdd">
              <template #icon><n-icon><iconify-icon icon="material-symbols:add"></iconify-icon></n-icon></template>
              {{ __t('common.add.spaced') }}
            </n-button>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button :size="embSize" circle class="btn-circle" style="background:transparent" @click="handleQuery">
                  <template #icon><n-icon size="15"><iconify-icon icon="lucide:refresh-cw" style="font-size:15px"></iconify-icon></n-icon></template>
                </n-button>
              </template>
              {{ __t('table.refresh') }}
            </n-tooltip>
            <!-- 多子表：带悬浮下拉 -->
            <n-popover v-if="dualTableEnabled && !dualMode && dualTableSubTables.length > 1" trigger="hover" placement="bottom" :show-arrow="false">
              <template #trigger>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button :size="embSize" circle class="btn-circle" type="default"
                    :style="dualTableViewActive ? { color: '#2563eb', background: 'transparent' } : { background: 'transparent' }"
                    @click="toggleDualTableView">
                    <template #icon><n-icon size="15"><iconify-icon icon="material-symbols:table-outline" style="font-size:15px"></iconify-icon></n-icon></template>
                  </n-button>
                  </template>
                  {{ dualTableViewActive ? __t('table.close_dual_view') : __t('table.open_dual_view') }}
                </n-tooltip>
              </template>
              <div style="display:flex;flex-direction:column;gap:2px;font-size:13px;min-width:120px;padding:4px 0">
                  <div v-for="s in dualTableSubTables" :key="s.id"
                    style="padding:6px 10px;cursor:pointer;border-radius:4px;transition:background .15s;text-align:center"
                    :style="{ color: (dualTableViewActive && s.id === dualTableCurrentSubId) ? '#2563eb' : '' }"
                    @click.stop="dualTableViewActive ? onDualTableSubChange(s.id) : openDualTableView(s.id)"
                    @mouseenter="e => e.target.style.background='rgba(37,99,235,0.06)'"
                    @mouseleave="e => e.target.style.background=''">
                    {{ s.label }}
                  </div>
                </div>
            </n-popover>
            <!-- 单子表：仅按钮，无下拉 -->
            <n-tooltip v-if="dualTableEnabled && !dualMode && dualTableSubTables.length === 1" trigger="hover">
              <template #trigger>
                <n-button :size="embSize" circle class="btn-circle" type="default"
                  :style="dualTableViewActive ? { color: '#2563eb', background: 'transparent' } : { background: 'transparent' }"
                  @click="toggleDualTableView">
                  <template #icon><n-icon size="15"><iconify-icon icon="material-symbols:table-outline" style="font-size:15px"></iconify-icon></n-icon></template>
                </n-button>
              </template>
              {{ dualTableViewActive ? __t('table.close_dual_view') : __t('table.open_dual_view') }}
            </n-tooltip>
            <n-popover trigger="click" placement="bottom-end">
              <template #trigger>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button :size="embSize" circle class="btn-circle" style="background:transparent">
                      <template #icon><n-icon size="15"><iconify-icon icon="lucide:settings" style="font-size:15px"></iconify-icon></n-icon></template>
                    </n-button>
                  </template>
                  {{ __t('table.settings') }}
                </n-tooltip>
              </template>
              <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;min-width:160px">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
                  <span>{{ __t('table.zebra') }}</span>
                  <n-switch v-model:value="striped" />
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
                  <span>{{ __t('table.dblclick_edit') }}</span>
                  <n-switch v-model:value="rowDblclickEdit" />
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
                  <span>{{ __t('table.text_overflow') }}</span>
                  <n-radio-group v-model:value="cellOverflow" size="small">
                    <n-radio-button value="ellipsis">{{ __t('table.ellipsis') }}</n-radio-button>
                    <n-radio-button value="wrap">{{ __t('table.wrap') }}</n-radio-button>
                  </n-radio-group>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
                  <span>{{ __t('table.loading_animation') }}</span>
                  <n-radio-group v-model:value="loadingStyle" size="small">
                    <n-radio-button value="wave">{{ __t('table.wave') }}</n-radio-button>
                    <n-radio-button value="spinner">{{ __t('table.spinner') }}</n-radio-button>
                    <n-radio-button value="dots">{{ __t('table.dots') }}</n-radio-button>
                  </n-radio-group>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
                  <span>{{ __t('table.table_size') }}</span>
                  <n-radio-group v-model:value="tableSize" size="small">
                    <n-radio-button value="small">{{ __t('table.compact') }}</n-radio-button>
                    <n-radio-button value="medium">{{ __t('table.medium') }}</n-radio-button>
                    <n-radio-button value="large">{{ __t('table.large') }}</n-radio-button>
                  </n-radio-group>
                </div>
              </div>
            </n-popover>
          </div>
        </div>
        <div id="table-wrapper" :style="'flex:1;min-height:0;overflow:hidden'">
          <n-data-table
            :data="tableData"
            :columns="columns"
            :row-key="row => String(row[novaIdFieldName])"
            :checked-row-keys="checkedRowKeys"
            :cascade="treeCascade"
            @update:checked-row-keys="handleCheck"
            :expanded-row-keys="expandedRowKeys"
            @update:expanded-row-keys="handleExpandedRowKeysUpdate"
            :row-props="(pickerMode || pickerMulti) ? (row) => ({ style: 'cursor:pointer', onClick: (e) => { if (e.target.closest('.n-checkbox') || e.target.closest('.n-data-table-tree-row-expand-icon')) return; pickerMulti ? toggleCheckedRow(row) : selectRow(row) } }) : (dualTableViewActive ? (row) => ({ style: 'cursor:pointer', onClick: (e) => { if (e.target.closest('.row-action-btn') || e.target.closest('.n-checkbox') || e.target.closest('button') || e.target.closest('.n-button')) return; onDualTableRowClick(row) } }) : (canDblclickEdit ? (row) => ({ style: 'cursor:default', onDblclick: (e) => { if (e.target.closest('.row-action-btn') || e.target.closest('.n-checkbox') || e.target.closest('button') || e.target.closest('.n-button')) return; handleEdit(row) } }) : undefined))"
            :row-class-name="tableRowClassName"
            :loading="loading"
            :remote="!isTree"
            :pagination="paginationConfig"
            :striped="striped"
            :size="tableSize"
            :scroll-x="scrollX"
            :virtual-scroll="true"
            :flex-height="true"
            :class="{ 'tree-cell-overflow-ellipsis': isTree && cellOverflow === 'ellipsis' }"
            style="width:100%;height:100%"
          >
            <template #loading v-if="loadingStyle !== 'spinner'">
              <div :class="['custom-loading', 'loading-' + loadingStyle]">
                <span v-if="loadingStyle === 'wave'" class="wave-bars">
                  <span class="bar b1"></span>
                  <span class="bar b2"></span>
                  <span class="bar b3"></span>
                  <span class="bar b4"></span>
                  <span class="bar b5"></span>
                </span>
                <span v-if="loadingStyle === 'dots'" class="dots-wrap">
                  <span class="dot d1"></span>
                  <span class="dot d2"></span>
                  <span class="dot d3"></span>
                </span>
              </div>
            </template>
          </n-data-table>
        </div>
      </component>

      <!-- 新增/编辑弹窗 -->
      <n-modal v-model:show="showForm" display-directive="if" preset="card" :title="formMode === 'add' ? __t('common.add') : __t('common.edit')" :style="isEmbTab ? 'width:calc(100vw - 80px);max-width:1600px;margin-top:40px;max-height:calc(100vh - 80px);display:flex;flex-direction:column;transition:width 0.3s ease,max-height 0.3s ease,margin-top 0.3s ease' : 'width:960px;margin-top:60px;max-height:calc(100vh - 120px);display:flex;flex-direction:column'" :content-style="{padding:'0',overflow:'auto',flex:'1',minHeight:'0'}" :header-style="{paddingBottom:'8px'}">
        <n-tabs v-model:value="formTab" type="line"
          style="padding:0 20px;margin-top:-4px"
          :class="''"
          @update:value="onFormTabChange">

          <!-- Tab 1: 表单 -->
          <n-tab-pane name="form" style="padding:16px 0 20px 0">
            <template #tab><iconify-icon icon="mdi:pencil-outline" style="font-size:14px;vertical-align:-2px;margin-right:4px"></iconify-icon>{{ opFormTabTitle }}<span v-if="tabRequiredCount('form') > 0" style="margin-left:4px;background:#d03050;color:#fff;border-radius:10px;padding:0 5px;font-size:11px;line-height:16px;display:inline-block;vertical-align:middle">{{ tabRequiredCount('form') }}</span><span v-else-if="tabTotalRequired('form') > 0" style="margin-left:4px;display:inline-block;width:7px;height:7px;background:#18a058;border-radius:50%;vertical-align:middle"></span></template>
            <nova-form-this
              :form-data="formData"
              :form-errors="formErrors"
              :edit-fields="editFields"
              :edit-layout="editLayout"
              :choice-map="choiceMap"
              :reference-map="referenceMap"
              :number-map="numberMap"
              :date-map="dateMap"
              :tag-map="tagMap"
              :attachment-map="attachmentMap"
              :buttons="buttons"
              :boolean-map="booleanMap"
              :nova-name="novaName"
              :form-mode="formMode"
              :form-tab="formTab"
              @field-change="onFormFieldChange"
              @reference-click="openReferenceModal"
              @preview-click="openPreview"
              @attachment-change="handleAttachmentChange"
            />
          </n-tab-pane>

        <!-- referenceForm / appendageForm 统一按后端顺序渲染 -->
        <template v-for="tab in editExtraTabs" :key="tab.tapNovaName">
        <n-tab-pane v-if="tab.tapShow !== false && (tab.tapType !== 'referenceForm' || formMode !== 'add') && (tab.tapType !== 'appendagesTable' || formMode !== 'add') && (tab.tapType !== 'linkForm' || formMode !== 'add') && (!tab.tapShowByExpr || evalShowExprSafe(tab.tapShowByExpr, formData))"
          :name="(tab.tapType === 'referenceForm' ? 'ref_' : tab.tapType === 'appendagesTable' ? 'emb_' : tab.tapType === 'linkForm' ? 'link_' : 'app_') + tab.tapNovaName"
          display-directive="if"
          :style="tab.tapType === 'appendagesTable' ? ('padding:0 0 15px 0;overflow:hidden;height:' + (isEmbTab ? 'calc(100vh - 240px)' : '460px')) : 'padding:16px 0 20px 0'">
          <template #tab><iconify-icon :icon="tab.tapType === 'referenceForm' ? 'mdi:eye-outline' : tab.tapType === 'appendagesTable' ? 'mdi:table' : tab.tapType === 'linkForm' ? 'mdi:link-variant' : 'mdi:note-outline'" style="font-size:14px;vertical-align:-2px;margin-right:4px"></iconify-icon>{{ tab.tapTitle || tab.tapNovaName }}<template v-if="tab.tapType === 'appendageForm' && appendageTabReady[tab.tapNovaName]"><span v-if="tabRequiredCount('app_' + tab.tapNovaName) > 0" style="margin-left:4px;background:#d03050;color:#fff;border-radius:10px;padding:0 5px;font-size:11px;line-height:16px;display:inline-block;vertical-align:middle">{{ tabRequiredCount('app_' + tab.tapNovaName) }}</span><span v-else-if="tabTotalRequired('app_' + tab.tapNovaName) > 0" style="margin-left:4px;display:inline-block;width:7px;height:7px;background:#18a058;border-radius:50%;vertical-align:middle"></span></template></template>
          <div :key="tab.tapNovaName" style="animation:tabFadeIn .5s cubic-bezier(0.22,0.61,0.36,1)">

          <!-- referenceForm 内容 -->
          <nova-ref-form v-if="tab.tapType === 'referenceForm'"
            :ref-nova-name="tab.tapNovaName"
            :source-form-data="formData"
            :source-reference-map="referenceMap"
            :source-raw-detail-row="rawDetailRow"
            :loading-style="loadingStyle"
          />

          <!-- appendageForm 内容 -->
          <nova-app-form v-else-if="tab.tapType === 'appendageForm'"
            :app-nova-name="tab.tapNovaName"
            :parent-nova-name="novaName"
            :form-data="appendageFormData[tab.tapNovaName] || {}"
            :form-errors="appendageFormErrors[tab.tapNovaName] || {}"
            :build-data="appendageTabBuild[tab.tapNovaName] || {}"
            :form-mode="formMode"
            :readonly="readonly"
            @field-change="onAppFieldChange(tab.tapNovaName, $event)"
            @reference-click="(f) => openAppReferenceModal(tab.tapNovaName, f)"
            @attachment-change="(f, e) => handleAttachmentChange(f, e, tab.tapNovaName)"
            @preview-click="(f) => openPreview(f, tab.tapNovaName)"
          />
          <!-- appendagesTable 内容 -->
          <nova-appendages-table v-else-if="tab.tapType === 'appendagesTable'"
            :app-nova-name="tab.tapNovaName"
            :parent-nova-name="novaName"
            :visible="showForm && visitedEmbTabs.has('emb_' + tab.tapNovaName)"
            :embed-key="'emb_' + tab.tapNovaName + '_' + (currentRow && currentRow[novaIdFieldName])"
            :is-emb-tab="isEmbTab"
            :source-fields="buildEmbSourceFields(tab)"
            :ref-reference-fields="buildRefReferenceFields(tab)"
          />

          <!-- linkForm 内容 -->
          <nova-link-form v-else-if="tab.tapType === 'linkForm'"
            :link-nova-name="tab.tapNovaName"
            :nova-name="novaName"
            :tap-title="tab.tapTitle"
            :visible="showForm && visitedEmbTabs.has('link_' + tab.tapNovaName)"
            :embed-key="'link_' + tab.tapNovaName + '_' + (currentRow && currentRow[novaIdFieldName])"
            :is-emb-tab="isEmbTab"
            :source-fields="buildLinkSourceFields(tab)"
            :link-tab-build="linkTabBuild"
            :link-tree-data="linkTreeData"
            :link-tree-filtered-data="linkTreeFilteredData"
            :link-tree-default-expanded-keys="linkTreeDefaultExpandedKeys"
            :link-tree-expanded-keys="linkTreeExpandedKeys"
            :link-tree-display-keys="linkTreeDisplayKeys"
            :link-tree-node-map="linkTreeNodeMap"
            :link-tree-loading="linkTreeLoading"
            :link-tree-search-keyword="linkTreeSearchKeyword"
            :loading-style="loadingStyle"
            @init="initLinkTreeTab($event)"
            @link-add="(n, t) => openLinkPicker(n, t)"
            @tree-check="(n, k) => onLinkTreeCheck(k, n)"
            @tree-search="onLinkTreeSearch"
            @save-tree="onLinkFormSave"
          />

          </div>
        </n-tab-pane>
        </template>

        </n-tabs>
        <template #footer>
          <n-space v-if="!formTab.startsWith('emb_') && !formTab.startsWith('ref_') && !formTab.startsWith('link_')" justify="end">
            <n-button @click="showForm = false">{{ __t('common.cancel') }}</n-button>
            <n-button type="primary" @click="handleFormSubmit">{{ __t('common.confirm') }}</n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- 图片附件预览：点查看文件直接弹出全屏预览组件，不走列表弹窗 -->
      <NovaImagePreview
        ref="novaImagePreviewRef"
        :src-list="previewFileList"
        :width="64"
        :height="64"
        show-all
        show-delete
        :show-thumbs="false"
        @delete="deleteFromPreview($event.index)" />

      <!-- 附件文件列表弹窗（非图片类型） -->
      <n-modal v-model:show="previewModalShow" preset="card" style="width:760px;margin-top:60px;padding:0">
        <template #header>
          <div class="gallery-header">
            <span class="gallery-title">{{ previewField ? (previewField.title || __t('table.attach_preview')) : __t('table.attach_preview') }}</span>
          </div>
        </template>
        <div v-if="previewField">
          <NovaFileList
            :file-list="previewFileList"
            show-delete
            @delete="deleteFromPreview($event.index)" />
        </div>
      </n-modal>

      <!-- 关联引用选择弹窗 -->
      <n-modal v-for="picker in refPickerStack" :key="picker.level" :show="picker.visible" @update:show="(v) => { if (!v) closePickerAtLevel(picker.level) }" preset="card" class="ref-picker-modal" :title="__t('table.picker_title', { name: picker.field.title })" style="width:calc(100vw - 80px);max-width:1600px;margin-top:20px" :content-style="{ padding: '0' }" :z-index="3000 + picker.level">
        <div :style="{ height: 'calc(100vh - 180px)', maxHeight: '700px', overflow: 'hidden' }">
          <nova-table :picker-mode="true" :nova-name-prop="picker.novaName" :source-nova-name-prop="novaName" :source-fields-prop="buildPickerSourceFields(picker)" @pick="onPickerPick(picker.level, $event)" />
        </div>
        <template #footer>
          <div style="display:flex;justify-content:flex-end;gap:8px;width:100%">
            <n-button @click="closePickerAtLevel(picker.level)">{{ __t('common.close') }} (Esc)</n-button>
            <n-button type="primary" @click="confirmPickerSelect(picker.level)">{{ __t('common.confirm') }}</n-button>
          </div>
        </template>
      </n-modal>

      <!-- LINK 多选关联弹窗 -->
      <n-modal v-model:show="linkPickerShow" preset="card" class="ref-picker-modal" :title="linkPickerTitle || __t('table.link_picker_title_default')" style="width:calc(100vw - 80px);max-width:1600px;margin-top:20px" :content-style="{ padding: '0' }" :z-index="3500">
        <div :style="{ height: 'calc(100vh - 180px)', maxHeight: '700px', overflow: 'hidden' }">
          <nova-table v-if="linkPickerShow" :picker-mode="true" :picker-multi="true" :nova-name-prop="linkPickerTargetNova" :source-nova-name-prop="novaName" :source-fields-prop="linkPickerSourceFields" @check="onLinkPickerPick" />
        </div>
        <template #footer>
          <div style="display:flex;justify-content:flex-end;gap:8px;width:100%">
            <n-button @click="closeLinkPicker">{{ __t('common.close') }} (Esc)</n-button>
            <n-button type="primary" @click="confirmLinkPickerSelect">{{ __t('common.confirm') }}</n-button>
          </div>
        </template>
      </n-modal>

      <!-- 操作表单弹窗（novaClassName） — 独立状态，不干扰主表单 -->
      <n-modal v-model:show="opFormShow" display-directive="if" preset="card"
        :title="(opFormBtn && opFormBtn.title) || __t('table.actions')"
        style="width:960px;margin-top:60px;max-height:calc(100vh - 120px);display:flex;flex-direction:column"
        :content-style="{padding:'0',overflow:'auto',flex:'1',minHeight:'0'}"
        :header-style="{paddingBottom:'8px'}">
        <n-tabs v-model:value="opFormTab" type="line"
          style="padding:0 20px;margin-top:-4px"
          @update:value="onOpFormTabChange">
          <!-- Tab 1: 基本信息 -->
          <n-tab-pane name="form" style="padding:16px 0 20px 0">
            <template #tab>
              <iconify-icon icon="mdi:pencil-outline" style="font-size:14px;vertical-align:-2px;margin-right:4px"></iconify-icon>{{ opFormTabTitle }}
              <span v-if="opFormTabRequiredCount('form') > 0" style="margin-left:4px;background:#d03050;color:#fff;border-radius:10px;padding:0 5px;font-size:11px;line-height:16px;display:inline-block;vertical-align:middle">{{ opFormTabRequiredCount('form') }}</span><span v-else-if="opFormTabTotalRequired('form') > 0" style="margin-left:4px;display:inline-block;width:7px;height:7px;background:#18a058;border-radius:50%;vertical-align:middle"></span>
            </template>
            <div :key="'opTab_' + opFormTab" style="animation:tabFadeIn .5s cubic-bezier(0.22,0.61,0.36,1)">
            <n-card v-for="sec in opFormSections" :key="sec.key" class="form-panel" size="small" :bordered="true">
              <template v-if="sec.title" #header>
                <span>{{ sec.title }}</span>
              </template>
              <div :style="'display:grid;gap:16px 24px;' + (opFormLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')">
              <template v-for="{field: f, visible: _vis} in sec.items" :key="f.field">
              <n-divider v-if="f.type === 'DIVIDE' && opFormLayout !== 'FULL_LINE'" v-show="_vis" style="grid-column:1/-1;margin:0">{{ f.title }}</n-divider>
              <div v-else-if="f.type === 'EMPTY' && opFormLayout !== 'FULL_LINE'" v-show="_vis"></div>
              <div v-else-if="f.type === 'BUTTON'" v-show="_vis" style="display:flex;flex-direction:column;gap:4px;justify-content:flex-end;align-items:flex-start">
                <n-button v-if="opFormButtons[f.field]" :color="opFormButtons[f.field].color" :id="opFormButtons[f.field].id"
                  :disabled="f.readonly === true || (typeof f.readonly === 'object' && f.readonly.add !== false)" :style="f.readonly === true || (typeof f.readonly === 'object' && f.readonly.add !== false) ? 'opacity:0.5;cursor:not-allowed' : undefined"
                  @click="f.readonly === true || (typeof f.readonly === 'object' && f.readonly.add !== false) ? undefined : handleFormButton(f, opFormButtons, opFormData)">
                  {{ f.title }}
                </n-button>
              </div>
              <div v-else-if="f.type !== 'DIVIDE' && f.type !== 'EMPTY'" v-show="_vis"
                :style="'display:flex;flex-direction:column;gap:4px' + ((f.type === 'TEXTAREA' || f.type === 'EDITOR') ? ';grid-column:1/-1' : '')">
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
                  v-model:value="opFormData[f.field]"
                  @update:value="onOpChoiceUpdate(f.field)">
                  <n-space><n-checkbox v-for="o in opFieldOpts(f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
                </n-checkbox-group>
                <n-radio-group
                  v-else-if="f.type === 'CHOICE' && opFormChoiceMap[f.field] && opFormChoiceMap[f.field].showType === 'RADIO'"
                  v-model:value="opFormData[f.field]"
                  @update:value="onOpChoiceUpdate(f.field)">
                  <n-space><n-radio v-for="o in opFieldOpts(f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
                </n-radio-group>
                <n-select
                  v-else-if="f.type === 'CHOICE' && opFormChoiceMap[f.field] && opFormChoiceMap[f.field].selectType === 'MULTI'"
                  v-model:value="opFormData[f.field]" :options="opFieldOpts(f)"
                  :placeholder="__t('table.select_field_placeholder', { name: f.title })" multiple clearable
                  @update:value="onOpChoiceUpdate(f.field)" />
                <n-select
                  v-else-if="f.type === 'CHOICE'"
                  v-model:value="opFormData[f.field]" :options="opFieldOpts(f)"
                  :placeholder="__t('table.select_field_placeholder', { name: f.title })" clearable
                  @update:value="onOpChoiceUpdate(f.field)" />
                <div v-else-if="f.type === 'BOOLEAN' && (opFormBooleanMap[f.field] || {}).type === 'SWITCH'"
                  style="display:flex;align-items:center;gap:8px;padding-top:2px">
                  <n-switch
                    :value="opFormData[f.field] === 'true'"
                    @update:value="(v) => opFormData[f.field] = v ? 'true' : 'false'" />
                  <span style="font-size:13px;color:#666">{{ opFormData[f.field] === 'true' ? __t('common.yes') : __t('common.no') }}</span>
                </div>
                <n-button-group v-else-if="f.type === 'BOOLEAN' && (opFormBooleanMap[f.field] || {}).type === 'SEGMENT'" size="small">
                  <n-button :type="opFormData[f.field] === 'true' ? 'primary' : 'default'" @click="opFormData[f.field] = 'true'">{{ __t('common.yes') }}</n-button>
                  <n-button :type="opFormData[f.field] === 'true' ? 'default' : 'primary'" @click="opFormData[f.field] = 'false'">{{ __t('common.no') }}</n-button>
                </n-button-group>
                <n-select
                  v-else-if="f.type === 'BOOLEAN'"
                  v-model:value="opFormData[f.field]"
                  :options="[{label:__t('table.yes'),value:'true'},{label:__t('table.no'),value:'false'}]"
                  :placeholder="__t('table.select_field_placeholder', { name: f.title })" clearable />
                <n-input-number
                  v-else-if="f.type === 'NUMBER'"
                  v-model:value="opFormData[f.field]" :placeholder="__t('table.search_field_placeholder', { name: f.title })"
                  :min="opFormNumberMap[f.field] && opFormNumberMap[f.field].min"
                  :max="opFormNumberMap[f.field] && opFormNumberMap[f.field].max"
                  :precision="opFormNumberMap[f.field] && opFormNumberMap[f.field].type === 'DECIMAL' ? (opFormNumberMap[f.field].decimal || 2) : 0"
                  :show-button="false" clearable style="width:100%" />
                <n-date-picker
                  v-else-if="f.type === 'DATE'"
                  v-model:value="opFormData[f.field]"
                  :type="opDateType(f.field)" :placeholder="__t('table.select_field_placeholder', { name: f.title })"
                  clearable style="width:100%" />
                <n-select
                  v-else-if="f.type === 'TAG'"
                  v-model:value="opFormData[f.field]" :options="opTagOpts(f.field)"
                  :placeholder="__t('table.input_or_select_field_placeholder', { name: f.title })"
                  :max-tag-count="opFormTagMap[f.field] && opFormTagMap[f.field].maxTagCount"
                  :tag="opFormTagMap[f.field] && opFormTagMap[f.field].allowExtension"
                  filterable multiple clearable />
                <n-input
                  v-else-if="f.type === 'TEXTAREA'"
                  v-model:value="opFormData[f.field]" type="textarea"
                  :autosize="{ minRows: 3 }" :placeholder="__t('table.search_field_placeholder', { name: f.title })" />
                <div v-else-if="f.type === 'REFERENCE' && opFormRefMap[f.field]"
                  @click="openOpReferenceModal(f)" style="cursor:pointer">
                  <n-input
                    :value="opFormData[f.field + '_display'] || opFormData[f.field]"
                    :placeholder="__t('table.select_field_placeholder', { name: f.title })" readonly clearable
                    @clear.stop="opFormData[f.field] = null; opFormData[f.field + '_display'] = ''">
                    <template #suffix><iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon></template>
                  </n-input>
                </div>
                <div v-else-if="f.type === 'ATTACHMENT'" style="display:flex;flex-direction:column;gap:4px">
                  <n-button-group>
                    <n-button style="flex:1"
                      :disabled="opFormAttachmentMap[f.field] && opFormAttachmentMap[f.field].maxLimit && (opFormData[f.field] || []).length >= opFormAttachmentMap[f.field].maxLimit"
                      @click="triggerOpFileUpload(f.field)">
                      <iconify-icon icon="mdi:upload" style="font-size:14px;margin-right:4px;color:#2563eb"></iconify-icon>
                      {{ __t('table.uploading') }}<span style="font-size:12px;opacity:0.7">{{ opFormAttachmentMap[f.field] && opFormAttachmentMap[f.field].maxLimit ? __t('common.count_n', { n: Math.max(0, opFormAttachmentMap[f.field].maxLimit - (opFormData[f.field] || []).length) }) : __t('common.count_n', { n: 0 }) }}</span>
                    </n-button>
                    <n-button style="flex:1" :disabled="!(opFormData[f.field] || []).length" @click="openPreview(f, null, true)">
                      <iconify-icon icon="mdi:eye-outline" style="font-size:14px;margin-right:4px"></iconify-icon>
                      {{ __t('table.viewing') }}<span style="font-size:12px;opacity:0.7">{{ __t('common.count_n', { n: (opFormData[f.field] || []).length }) }}</span>
                    </n-button>
                  </n-button-group>
                  <input :id="'upload-op-' + f.field" type="file" style="display:none"
                    :multiple="opFormAttachmentMap[f.field] && opFormAttachmentMap[f.field].maxLimit > 1"
                    @change="handleOpAttachmentChange(f, $event)" />
                </div>
                <div v-else-if="f.type === 'EDITOR'" class="form-field-editor"
                  :class="opFormErrors[f.field] ? 'has-error' : ''">
                  <div :ref="el => registerOpEditorHost('main', f.field, el)"
                    :data-editor-field="f.field"
                    class="nova-aieditor-host"></div>
                </div>
                <n-input v-else v-model:value="opFormData[f.field]" :placeholder="__t('table.search_field_placeholder', { name: f.title })" clearable />
                <span v-if="opFormErrors[f.field]" class="form-error-tip">{{ opFormErrors[f.field] }}</span>
              </div>
            </template>
          </div>
          </n-card>
          </div>
          </n-tab-pane>
          <!-- APPENDAGE 表单 Tab -->
          <n-tab-pane v-for="tab in opFormExtraTabs" :key="tab.tapNovaName"
            :name="'app_' + tab.tapNovaName" style="padding:16px 0 20px 0">
            <template #tab>
              <iconify-icon icon="mdi:note-outline" style="font-size:14px;vertical-align:-2px;margin-right:4px"></iconify-icon>{{ tab.tapTitle || tab.tapNovaName }}
              <span v-if="opFormTabRequiredCount('app_' + tab.tapNovaName) > 0" style="margin-left:4px;background:#d03050;color:#fff;border-radius:10px;padding:0 5px;font-size:11px;line-height:16px;display:inline-block;vertical-align:middle">{{ opFormTabRequiredCount('app_' + tab.tapNovaName) }}</span><span v-else-if="opFormTabTotalRequired('app_' + tab.tapNovaName) > 0" style="margin-left:4px;display:inline-block;width:7px;height:7px;background:#18a058;border-radius:50%;vertical-align:middle"></span>
            </template>
            <div :key="'opAppTab_' + opFormTab" style="animation:tabFadeIn .5s cubic-bezier(0.22,0.61,0.36,1)">
            <div v-if="!(opFormAppBuild(tab.tapNovaName).editFields || []).length" style="text-align:center;padding:40px;color:#aaa;font-size:13px">{{ __t('common.loading') }}</div>
            <div v-else>
              <n-card v-for="sec in opFormAppSections(tab.tapNovaName)" :key="sec.key" class="form-panel" size="small" :bordered="true">
                <template v-if="sec.title" #header>
                  <span>{{ sec.title }}</span>
                </template>
                <div :style="'display:grid;gap:16px 24px;' + ((opFormAppBuild(tab.tapNovaName).layout || {}).editLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')">
                <template v-for="f in sec.items" :key="f.field">
                <n-divider v-if="f.type === 'DIVIDE' && (opFormAppBuild(tab.tapNovaName).layout || {}).editLayout !== 'FULL_LINE'" style="grid-column:1/-1;margin:0">{{ f.title }}</n-divider>
                <div v-else-if="f.type === 'DIVIDE'" style="grid-column:1/-1;margin:0"><n-divider>{{ f.title }}</n-divider></div>
                <div v-else-if="f.type === 'EMPTY' && (opFormAppBuild(tab.tapNovaName).layout || {}).editLayout !== 'FULL_LINE'"></div>
                <div v-else-if="f.type === 'BUTTON'" style="display:flex;flex-direction:column;gap:4px;padding-top:25px;align-items:flex-start">
                  <n-button v-if="(opFormAppBuild(tab.tapNovaName).buttons || {})[f.field]" :color="(opFormAppBuild(tab.tapNovaName).buttons || {})[f.field].color" :id="(opFormAppBuild(tab.tapNovaName).buttons || {})[f.field].id" class="form-btn"
                    :disabled="f.readonly === true || (typeof f.readonly === 'object' && f.readonly.add !== false)" :style="f.readonly === true || (typeof f.readonly === 'object' && f.readonly.add !== false) ? 'opacity:0.5;cursor:not-allowed' : undefined"
                    @click="f.readonly === true || (typeof f.readonly === 'object' && f.readonly.add !== false) ? undefined : handleFormButton(f, opFormAppBuild(tab.tapNovaName).buttons, opFormData, tab.tapNovaName)">
                    {{ f.title }}
                  </n-button>
                </div>
                <div v-else-if="f.type !== 'DIVIDE' && f.type !== 'EMPTY' && f.type !== 'BUTTON'"
                  :style="'display:flex;flex-direction:column;gap:4px' + ((f.type === 'TEXTAREA' || f.type === 'EDITOR') ? ';grid-column:1/-1' : '')">
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
                    :placeholder="__t('table.select_field_placeholder', { name: f.title })"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    multiple clearable @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-select
                    v-else-if="f.type === 'CHOICE'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]" :options="opFormAppFieldOpts(tab.tapNovaName, f)"
                    :placeholder="__t('table.select_field_placeholder', { name: f.title })"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    clearable @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <div v-else-if="f.type === 'BOOLEAN' && ((opFormAppBuild(tab.tapNovaName).booleanMap || {})[f.field] || {}).type === 'SWITCH'"
                    style="display:flex;align-items:center;gap:8px;padding-top:2px">
                    <n-switch
                      :value="opFormAppData(tab.tapNovaName)[f.field] === 'true'"
                      @update:value="(v) => opFormAppSetFd(tab.tapNovaName, f.field, v ? 'true' : 'false')" />
                    <span style="font-size:13px;color:#666">{{ opFormAppData(tab.tapNovaName)[f.field] === 'true' ? __t('common.yes') : __t('common.no') }}</span>
                  </div>
                  <n-button-group v-else-if="f.type === 'BOOLEAN' && ((opFormAppBuild(tab.tapNovaName).booleanMap || {})[f.field] || {}).type === 'SEGMENT'" size="small">
                    <n-button :type="opFormAppData(tab.tapNovaName)[f.field] === 'true' ? 'primary' : 'default'" @click="opFormAppSetFd(tab.tapNovaName, f.field, 'true')">{{ __t('common.yes') }}</n-button>
                    <n-button :type="opFormAppData(tab.tapNovaName)[f.field] === 'true' ? 'default' : 'primary'" @click="opFormAppSetFd(tab.tapNovaName, f.field, 'false')">{{ __t('common.no') }}</n-button>
                  </n-button-group>
                  <n-select
                    v-else-if="f.type === 'BOOLEAN'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]" :options="[{label:__t('table.yes'),value:'true'},{label:__t('table.no'),value:'false'}]"
                    :placeholder="__t('table.select_field_placeholder', { name: f.title })"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    clearable @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-input-number
                    v-else-if="f.type === 'NUMBER'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    :placeholder="__t('table.search_field_placeholder', { name: f.title })" :show-button="false" style="width:100%"
                    :min="opFormAppNumInfo(tab.tapNovaName, f.field).min"
                    :max="opFormAppNumInfo(tab.tapNovaName, f.field).max"
                    :precision="opFormAppNumInfo(tab.tapNovaName, f.field).type === 'DECIMAL' ? (opFormAppNumInfo(tab.tapNovaName, f.field).decimal || 2) : 0"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    clearable @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-date-picker
                    v-else-if="f.type === 'DATE'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    :type="opFormAppDateType(tab.tapNovaName, f.field)"
                    :placeholder="__t('table.select_field_placeholder', { name: f.title })"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    clearable style="width:100%"
                    @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-select
                    v-else-if="f.type === 'TAG'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    :options="opFormAppTagOpts(tab.tapNovaName, f.field)"
                    :placeholder="__t('table.input_or_select_field_placeholder', { name: f.title })"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    filterable multiple clearable
                    @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <n-input
                    v-else-if="f.type === 'TEXTAREA'"
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    type="textarea" :autosize="{minRows:3}"
                    :placeholder="__t('table.search_field_placeholder', { name: f.title })"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <div v-else-if="f.type === 'REFERENCE' && opFormAppChoice(tab.tapNovaName, f.field) === null"
                    style="cursor:pointer"
                    @click="openOpAppReferenceModal(tab.tapNovaName, f)">
                    <n-input
                      :value="opFormAppData(tab.tapNovaName)[f.field + '_display'] || opFormAppData(tab.tapNovaName)[f.field]"
                      :placeholder="__t('table.select_field_placeholder', { name: f.title })" readonly clearable
                      @clear.stop="opFormAppSetFd(tab.tapNovaName, f.field, null); opFormAppSetFd(tab.tapNovaName, f.field + '_display', '')">
                      <template #suffix><iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon></template>
                    </n-input>
                  </div>
                  <div v-else-if="f.type === 'ATTACHMENT'" style="display:flex;flex-direction:column;gap:4px;grid-column:1/-1">
                    <n-button-group>
                      <n-button style="flex:1"
                        :disabled="((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]) && ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]).maxLimit && (opFormAppData(tab.tapNovaName)[f.field] || []).length >= ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]).maxLimit"
                        @click="triggerOpAppFileUpload(tab.tapNovaName, f.field)">
                        <iconify-icon icon="mdi:upload" style="font-size:14px;margin-right:4px;color:#2563eb"></iconify-icon>
                        {{ __t('table.uploading') }}<span style="font-size:12px;opacity:0.7">{{ ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]) && ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]).maxLimit ? __t('common.count_n', { n: Math.max(0, ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]).maxLimit - (opFormAppData(tab.tapNovaName)[f.field] || []).length) }) : __t('common.count_n', { n: 0 }) }}</span>
                      </n-button>
                      <n-button style="flex:1" :disabled="!(opFormAppData(tab.tapNovaName)[f.field] || []).length" @click="openPreview(f, tab.tapNovaName, true)">
                        <iconify-icon icon="mdi:eye-outline" style="font-size:14px;margin-right:4px"></iconify-icon>
                        {{ __t('table.viewing') }}<span style="font-size:12px;opacity:0.7">{{ __t('common.count_n', { n: (opFormAppData(tab.tapNovaName)[f.field] || []).length }) }}</span>
                      </n-button>
                    </n-button-group>
                    <input :id="'upload-opApp-' + tab.tapNovaName + '-' + f.field" type="file" style="display:none"
                      :multiple="((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]) && ((opFormAppBuild(tab.tapNovaName).attachmentMap || {})[f.field]).maxLimit > 1"
                      @change="handleOpAppAttachmentChange(tab.tapNovaName, f, $event)" />
                  </div>
                  <div v-else-if="f.type === 'EDITOR'" class="form-field-editor"
                    :class="opFormAppErrors(tab.tapNovaName)[f.field] ? 'has-error' : ''">
                    <div :ref="el => registerOpEditorHost('app:' + tab.tapNovaName, f.field, el)"
                      :data-editor-field="f.field"
                      class="nova-aieditor-host"></div>
                  </div>
                  <n-input
                    v-else
                    :value="opFormAppData(tab.tapNovaName)[f.field]"
                    :placeholder="__t('table.search_field_placeholder', { name: f.title })"
                    :status="opFormAppErrors(tab.tapNovaName)[f.field] ? 'error' : undefined"
                    clearable @update:value="opFormAppSetFd(tab.tapNovaName, f.field, $event)" />
                  <span v-if="opFormAppErrors(tab.tapNovaName)[f.field]" class="form-error-tip">{{ opFormAppErrors(tab.tapNovaName)[f.field] }}</span>
                </div>
              </template>
              </div>
            </n-card>
            </div>
            </div>
          </n-tab-pane>
        </n-tabs>
        <template #footer>
          <n-space justify="end">
            <n-button @click="closeOpForm">{{ __t('common.cancel') }}</n-button>
            <n-button type="primary" @click="submitOpForm">{{ __t('common.confirm') }}</n-button>
          </n-space>
        </template>
      </n-modal>

      <!-- TPL 对话框模式：宽高为 vw/vh 视口单位，100% = 撑满页面 -->
      <n-modal v-model:show="tplModalShow" display-directive="if" preset="card" :title="tplTitle" :style="'width:' + tplWidth + ';height:' + tplHeight + ';display:flex;flex-direction:column'" :content-style="{padding:'0',overflow:'hidden',flex:'1',minHeight:'0'}" :header-style="{paddingBottom:'8px'}">
        <iframe v-if="tplUrl" :src="tplUrl" style="width:100%;height:100%;border:none;flex:1"></iframe>
      </n-modal>

      <!-- TPL 抽屉模式 -->
      <n-drawer v-model:show="tplDrawerShow" :placement="tplDrawerPlacement" display-directive="if" :style="tplDrawerPlacement === 'top' || tplDrawerPlacement === 'bottom' ? 'height:' + tplDrawerSize : 'width:' + tplDrawerSize">
        <n-drawer-content :title="tplTitle" :header-style="{borderBottom:'none'}" :body-content-style="{padding:'0',overflow:'hidden',display:'flex',flexDirection:'column'}">
          <iframe v-if="tplUrl" :src="tplUrl" style="width:100%;height:100%;border:none;flex:1"></iframe>
        </n-drawer-content>
      </n-drawer>

      <!-- 双表视图右面板：Teleport 到 .page-content 作为 flex 兄弟元素 -->
      <Teleport to=".page-content" v-if="(dualTableViewActive || dualTableClosing) && dualTableEnabled && dualTableCurrentNova">
        <div class="dual-right-panel" :class="{ 'is-open': dualTableViewActive && !dualTableClosing, 'is-closing': dualTableClosing }" :style="dualPanelStyle">
          <dual-link-table v-if="dualTableViewActive && isDualTableLink"
            ref="dualTableRef"
            :nova-name="dualTableCurrentNova"
            :parent-nova-name="novaName"
            :source-fields="dualTableSourceFields"
            :embed-key="dualTableCurrentKey"
            :label="dualTableCurrentLabel"
            :link-tab-build="(linkTabBuild[dualTableCurrentNova] || {})"
            :link-tree-loading="linkTreeLoading['__dual__'] || false"
            :link-tree-data="linkTreeData['__dual__'] || null"
            :link-tree-filtered-data="linkTreeFilteredData['__dual__'] || null"
            :link-tree-default-expanded-keys="linkTreeDefaultExpandedKeys['__dual__'] || []"
            :link-tree-expanded-keys="linkTreeExpandedKeys['__dual__'] || []"
            :link-tree-display-keys="linkTreeDisplayKeys['__dual__'] || []"
            :link-tree-search-keyword="linkTreeSearchKeyword['__dual__'] || ''"
            :loading-style="loadingStyle"
            @tree-search="(val) => { linkTreeSearchKeyword['__dual__'] = val; filterLinkTreeData('__dual__', dualTableCurrentNova); }"
            @tree-check="(keys) => onLinkTreeCheck(keys, '__dual__')"
            @save-tree="submitDualLinkTree"
            @link-add="handleDualLinkAdd"
          />
          <!-- DRILL / APPENDAGES 表格模式：直接使用 NovaTable，不重建实例 -->
          <nova-table v-else-if="dualTableViewActive && !isDualTableLink"
            ref="dualTableRef"
            :dual-mode="true"
            :readonly="isDualTableDrill"
            :nova-name-prop="dualTableCurrentNova"
            :source-nova-name-prop="novaName"
            :source-fields-prop="dualTableSourceFields"
          />
        </div>
      </Teleport>

      <!-- 表格附件预览弹窗（放到主 div 内，保持单根节点，避免 transition 死锁） -->
    <n-modal v-model:show="tableAttachPreviewShow" preset="card" style="width:760px;margin-top:60px;padding:0" :z-index="9999">
      <template #header>
        <div class="gallery-header">
          <span class="gallery-title">{{ tableAttachPreviewField ? (tableAttachPreviewField.title || __t('table.attach_preview')) : __t('table.attach_preview') }}</span>
        </div>
      </template>
      <!-- IMAGE -->
      <div v-if="tableAttachPreviewType === 'IMAGE' && tableAttachPreviewUrls.length > 0" class="gallery-wrap">
        <div class="gallery-body">
          <div class="gallery-sider">
            <div class="gallery-thumb-list">
              <div v-for="(url, idx) in tableAttachPreviewUrls" :key="idx" class="gallery-thumb-item" @click="tableAttachPreviewIndex = idx">
                <img :src="url" class="gallery-thumb-img" :class="{active: (tableAttachPreviewIndex || 0) === idx}" />
              </div>
            </div>
          </div>
          <div class="gallery-stage">
            <img :src="tableAttachPreviewUrls[tableAttachPreviewIndex || 0]" class="gallery-main-img" />
          </div>
        </div>
        <div class="gallery-url-wrap" :title="__t('table.click_copy') + ': ' + tableAttachPreviewUrls[tableAttachPreviewIndex || 0]" @click="copyText(tableAttachPreviewUrls[tableAttachPreviewIndex || 0])">
          <div class="gallery-url-label">{{ __t('table.image_url') }}</div>
          <div class="gallery-url-text">{{ tableAttachPreviewUrls[tableAttachPreviewIndex || 0] }}</div>
        </div>
      </div>
      <!-- VIDEO -->
      <div v-else-if="tableAttachPreviewType === 'VIDEO' && tableAttachPreviewUrls.length > 0" style="padding:16px;display:flex;flex-direction:column;height:100%;box-sizing:border-box">
        <!-- 大圆角包裹块 -->
        <div style="border-radius:12px;overflow:hidden;display:flex;flex-direction:column;height:100%;box-shadow:0 2px 12px rgba(0,0,0,0.12);border:1px solid var(--n-border-color)">
          <!-- 播放器块 -->
          <div style="background:#000;position:relative;height:340px;flex-shrink:0">
            <video :src="tableAttachPreviewUrls[tableAttachPreviewIndex || 0]" controls style="position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:contain" />
          </div>
          <!-- 列表块 -->
          <div style="background:var(--n-color);padding:14px 14px 14px 14px;flex-shrink:0">
          <div style="margin-bottom:10px;font-size:13px;color:var(--n-text-color-2);display:flex;align-items:center;gap:6px">
            <iconify-icon icon="mdi:playlist-music" style="font-size:16px;color:var(--n-text-color-3)"></iconify-icon>
            {{ __t('table.playlist') }}
            <span style="background:var(--n-border-color);color:var(--n-text-color-3);border-radius:10px;padding:0 6px;font-size:11px;font-weight:500">{{ tableAttachPreviewUrls.length }}</span>
          </div>
          <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin">
            <div v-for="(url, idx) in tableAttachPreviewUrls" :key="idx"
              @click="tableAttachPreviewIndex = idx"
              :style="{
                flexShrink: 0, width: '100px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                position: 'relative', transition: 'all .2s',
                border: (tableAttachPreviewIndex || 0) === idx ? '2px solid #2563eb' : '2px solid var(--n-border-color)',
                background: 'var(--n-color)',
                boxShadow: (tableAttachPreviewIndex || 0) === idx ? '0 2px 10px rgba(37,99,235,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
                marginTop: '2px'
              }"
              @mouseenter="startVideoPreview($event, idx)"
              @mouseleave="stopVideoPreview($event, idx)"
              :data-vidx="idx">
              <!-- 缩略图 -->
              <div style="position:relative;aspect-ratio:16/9;background:#111;overflow:hidden">
                <video class="nova-video-preview" muted playsinline preload="metadata"
                  :src="url"
                  style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none"
                  @loadedmetadata="onVideoPreviewLoaded($event, idx)"></video>
                <div class="vthumb-placeholder"
                  style="position:absolute;inset:0;background:linear-gradient(135deg,#e8edf5,#d5dce8);display:flex;align-items:center;justify-content:center;transition:opacity .3s">
                  <iconify-icon icon="mdi:video-outline" style="font-size:28px;color:#b0b8c8"></iconify-icon>
                </div>
                <div class="vplay-overlay"
                  style="position:absolute;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;z-index:2">
                  <span style="font-size:28px;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,0.6)">▶</span>
                </div>
              </div>
              <div :style="{
                padding:'6px 8px',fontSize:'12px',color: (tableAttachPreviewIndex || 0) === idx ? '#2563eb' : 'var(--n-text-color-2)',
                textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                borderTop:'1px solid var(--n-border-color)'
              }">{{ __t('table.video_n', { n: idx + 1 }) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- DIALOG / TEXT：文件 URL 列表（NovaFileList 组件，删除后本地移除，删空关闭弹窗） -->
      <NovaFileList
        v-else
        :file-list="tableAttachPreviewUrls" />
    </n-modal>

  </div>
  `
}

NovaTable.components = Object.assign(NovaTable.components || {}, { NovaTable })

window.NovaTable = NovaTable
})()
