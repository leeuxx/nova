// jq/picker.js — 关联引用选择页 jQuery 业务逻辑

window.NovaPickerJQ = (function ($) {

  function vm() {
    return window.pickerVm
  }

  function onMounted(novaName) {
    buildTable(novaName)
    setTimeout(updateTableHeight, 80)
    $(window).on('resize.novaPicker', updateTableHeight)
  }

  function buildTable(novaName) {
    if (!novaName) return
    $.ajax({
      url:         '/nova/table/build',
      method:      'POST',
      contentType: 'application/json',
      data:        JSON.stringify({ novaName: novaName }),
      success: function (resp) {
        if (resp.code !== 200) return
        var target = window.pickerVm
        if (!target) return
        target.choiceMap      = resp.data.choice      || {}
        target.tagMap         = resp.data.tag         || {}
        target.dateMap        = resp.data.date        || {}
        target.numberMap      = resp.data.number      || {}
        target.booleanMap     = resp.data.booleanInfo || {}
        target.referenceMap   = resp.data.reference   || {}
        var fields = resp.data.search || []
        target.searchFields = fields
        var form = {}
        fields.forEach(function (f) {
          var choiceInfo = target.choiceMap[f.field]
          var isMultiChoice = f.type === 'CHOICE' && (choiceInfo && choiceInfo.selectType === 'MULTI' || f.vague)
          var isSingleChoice = f.type === 'CHOICE' && choiceInfo && choiceInfo.selectType === 'SINGLE' && !f.vague
          var isDate = f.type === 'DATE'
          form[f.field] = (isMultiChoice || f.type === 'TAG') ? [] : (f.type === 'NUMBER' && f.vague ? [null, null] : (isSingleChoice || isDate || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : ''))
          // REFERENCE 字段初始化 _display 字段
          if (f.type === 'REFERENCE') {
            form[f.field + '_display'] = ''
          }
        })
        target.filterForm = form
        var cols = resp.data.tableColumns || []
        target.tableColumns = cols
        var states = {}
        cols.forEach(function (c) { if (c.sortable) states[c.field] = null })
        target.sortStates = states
        var layout = resp.data.layout || {}
        if (layout.pageSize)  { target.pageSize = layout.pageSize; target.paginationConfig.pageSize = layout.pageSize }
        if (layout.pageSizes) {
          target.pageSizes = layout.pageSizes
          target.paginationConfig.pageSizes = layout.pageSizes.map(function (n) { return { label: n + ' 条/页', value: n } })
        }
        if (resp.data.pkFieldName) target.pkFieldName = resp.data.pkFieldName
        loadData(novaName)
      },
      error: function () {
        console.info('[Nova Picker] build接口未就绪，novaName:', novaName)
      }
    })
  }

  function loadData(novaName) {
    var target = window.pickerVm
    if (!target) return
    var conditions = {}
    var form = target.filterForm || {}
    var searchFields = target.searchFields || []
    searchFields.forEach(function (fieldDef) {
      var val = form[fieldDef.field]
      if (val === null || val === undefined || val === '') return
      if (Array.isArray(val) && val.every(function(v){ return v === null || v === undefined })) return
      if (Array.isArray(val) && val.length === 0) return
      var strVal
      if (fieldDef.type === 'NUMBER' && fieldDef.vague) {
        var lo = (val[0] === null || val[0] === undefined) ? '' : String(val[0])
        var hi = (val[1] === null || val[1] === undefined) ? '' : String(val[1])
        if (!lo && !hi) return
        strVal = lo + ',' + hi
      } else {
        strVal = Array.isArray(val) ? val.join(',') : String(val)
      }
      conditions[fieldDef.field] = {
        value: strVal,
        type: fieldDef.type || '',
        ext: (target.choiceMap && target.choiceMap[fieldDef.field] && target.choiceMap[fieldDef.field].selectType) || '',
        vague: fieldDef.vague || false
      }
    })
    var pageBean = {
      current: (target.paginationConfig && target.paginationConfig.page) || 1,
      size:    (target.paginationConfig && target.paginationConfig.pageSize) || 10,
      orders:  buildOrderItems(target.sortStates)
    }
    target.loading = true
    $.ajax({
      url:         '/nova/table/data',
      method:      'POST',
      contentType: 'application/json',
      data:        JSON.stringify({ novaName: novaName, pageBean: pageBean, conditions: conditions }),
      success: function (resp) {
        var t = window.pickerVm
        if (!t) return
        t.loading = false
        if (resp.code !== 200) return
        t.tableData                  = resp.data.records  || []
        t.paginationConfig.itemCount = resp.data.total    || 0
        t.paginationConfig.page      = resp.data.current  || pageBean.current
        t.paginationConfig.pageSize  = resp.data.size     || pageBean.size
        if (resp.data.pkFieldName)   t.pkFieldName        = resp.data.pkFieldName
        translateData()
      },
      error: function () {
        var t = window.pickerVm
        if (t) t.loading = false
      }
    })
  }

  function buildOrderItems(sortStates) {
    var orders = []
    for (var field in sortStates) {
      if (sortStates.hasOwnProperty(field) && sortStates[field] != null) {
        orders.push({ column: field, asc: sortStates[field] === 'asc' })
      }
    }
    return orders
  }

  function translateData() {
    var target = window.pickerVm
    if (!target) return
    var records = target.tableData
    if (!records || records.length === 0) return
    var choiceCols = (target.tableColumns || []).filter(function (c) { return c.type === 'CHOICE' })
    if (choiceCols.length === 0) return

    // 翻译前按原始值计算颜色
    var choiceMap = target.choiceMap || {}
    var rowColors = []
    records.forEach(function (row, idx) {
      var colors = {}
      choiceCols.forEach(function (col) {
        var choiceEntry = choiceMap[col.field]
        if (!choiceEntry || !choiceEntry.values) return
        var colorLookup = {}
        choiceEntry.values.forEach(function (v) { if (v.color) colorLookup[v.value] = v.color })
        if (Object.keys(colorLookup).length === 0) return
        var raw = (row[col.field] === null || row[col.field] === undefined) ? '' : String(row[col.field])
        var isMulti = choiceEntry.selectType === 'MULTI'
        colors[col.field] = isMulti
          ? (raw ? raw.split(',').map(function (v) { return colorLookup[v.trim()] || null }) : [])
          : (colorLookup[raw] || null)
      })
      rowColors[idx] = colors
    })
    target.tableRowColors = rowColors

    // 构建翻译查找表
    var localLookups = {}
    for (var fk in choiceMap) {
      if (choiceMap.hasOwnProperty(fk)) {
        var lookup = {}
        ;(choiceMap[fk].values || []).forEach(function (v) { lookup[v.value] = v.label })
        localLookups[fk] = lookup
      }
    }
    var localTranslate = {}
    choiceCols.forEach(function (col) {
      var isMulti = choiceMap[col.field] && choiceMap[col.field].selectType === 'MULTI'
      if (localLookups[col.field]) {
        localTranslate[col.field] = { lookup: localLookups[col.field], isMulti: isMulti }
      }
    })
    if (Object.keys(localTranslate).length > 0) {
      target.tableData = records.map(function (row) {
        var updated = $.extend({}, row)
        for (var field in localTranslate) {
          if (!localTranslate.hasOwnProperty(field)) continue
          var lookup = localTranslate[field].lookup
          var isMulti = localTranslate[field].isMulti
          var raw = (row[field] === null || row[field] === undefined) ? '' : String(row[field])
          if (!raw) continue
          updated[field] = isMulti
            ? raw.split(',').map(function (v) { return lookup[v.trim()] || v.trim() }).join(',')
            : (lookup[raw] || raw)
        }
        return updated
      })
    }
  }

  function updateTableHeight() {
    var $wrapper = $('#picker-table-wrapper')
    if (!$wrapper.length) return
    var winH       = $(window).height()
    var filterH    = $('.filter-card').outerHeight(true) || 0
    var tblHeaderH = 0
    var outerPadTop = 8
    var outerPadBottom = 16
    var cardPad    = 32
    var height = winH - filterH - tblHeaderH - outerPadTop - outerPadBottom - cardPad
    $wrapper.height(Math.max(height, 200))
    if (window.pickerVm) window.pickerVm.tableWrapperWidth = $wrapper[0].clientWidth
  }

  function handleReset() {
    var target = vm()
    var form = {}
    var choiceMap = (target && target.choiceMap) || {}
    target.searchFields.forEach(function (f) {
      var choiceInfo = choiceMap[f.field]
      var isMultiChoice = f.type === 'CHOICE' && (choiceInfo && choiceInfo.selectType === 'MULTI' || f.vague)
      var isSingleChoice = f.type === 'CHOICE' && choiceInfo && choiceInfo.selectType === 'SINGLE' && !f.vague
      var isDate = f.type === 'DATE'
      form[f.field] = (isMultiChoice || f.type === 'TAG') ? [] : (f.type === 'NUMBER' && f.vague ? [null, null] : (isSingleChoice || isDate || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : ''))
    })
    target.filterForm = form
    target.paginationConfig.page = 1
  }

  function onPageChange(current) {
    var target = vm()
    if (!target) return
    target.paginationConfig.page = current
    loadData(target.novaName)
  }

  function onPageSizeChange(pageSize) {
    var target = vm()
    if (!target) return
    target.paginationConfig.pageSize = pageSize
    target.paginationConfig.page = 1
    loadData(target.novaName)
  }

  function onSortChange() {
    var target = vm()
    if (!target) return
    loadData(target.novaName)
  }

  return {
    onMounted, updateTableHeight,
    handleReset, loadData,
    onPageChange, onPageSizeChange, onSortChange
  }

})(jQuery)
