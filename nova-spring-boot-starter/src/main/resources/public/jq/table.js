// jq/table.js — 通用表格页 jQuery 业务逻辑层

window.NovaTableJQ = (function ($) {

  // 通过 vmMap 取当前激活的 Vue 实例
  function vm() {
    return window.vmMap && window.vmMap[window.activeNovaName]
  }

  // ── 页面初始化 ─────────────────────────────────────────────────
  function onMounted(novaName) {
    buildTable(novaName)
    setTimeout(updateTableHeight, 80)
    $(window).on('resize.novaTable', updateTableHeight)
  }

  // ── 动态构建查询条件 + 表头列 ─────────────────────────────────
  function buildTable(novaName) {
    if (!novaName) return
    $.ajax({
      url:         '/nova/table/build',
      method:      'POST',
      contentType: 'application/json',
      data:        JSON.stringify({ novaName: novaName }),
      success: function (resp) {
        if (resp.code !== 200) return
        // AJAX 回调用 novaName 直接索引，避免切 tab 后写错实例
        var target = window.vmMap && window.vmMap[novaName]
        if (!target) return
        var fields = resp.data.search || []
        target.searchFields = fields
        var form = {}
        fields.forEach(function (f) {
          var isMulti = f.type === 'CHOICE' && f.choiceInfo && f.choiceInfo.selectType === 'MULTI'
          var isSingle = f.type === 'CHOICE' && f.choiceInfo && f.choiceInfo.selectType === 'SINGLE'
          form[f.field] = isMulti ? [] : (isSingle ? null : '')
        })
        target.filterForm = form
        var cols = resp.data.tableColumns || []
        target.tableColumns = cols
        var states = {}
        cols.forEach(function (c) { if (c.sortable) states[c.field] = null })
        target.sortStates = states
        var layout = resp.data.layout || {}
        if (layout.pageSize)  { target.pageSize = layout.pageSize; target.paginationConfig.pageSize = layout.pageSize }
        if (layout.pageSizes) { target.pageSizes = layout.pageSizes; target.paginationConfig.pageSizes = layout.pageSizes }
        if (layout.editLayout) target.editLayout = layout.editLayout
        target.editFields = resp.data.edit || []
        // 构建完成后加载数据
        loadData(novaName)
      },
      error: function () {
        console.info('[Nova] build接口未就绪，novaName:', novaName)
      }
    })
  }

  // ── 加载表格数据 ──────────────────────────────────────────────
  function loadData(novaName) {
    var target = window.vmMap && window.vmMap[novaName]
    if (!target) return
    // 过滤空值条件，按后端结构组装
    var conditions = {}
    var form = target.filterForm || {}
    var searchFields = target.searchFields || []
    searchFields.forEach(function (fieldDef) {
      var val = form[fieldDef.field]
      if (val === null || val === undefined || val === '') return
      if (Array.isArray(val) && val.length === 0) return
      conditions[fieldDef.field] = {
        value: Array.isArray(val) ? val.join(',') : String(val),
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
        var t = window.vmMap && window.vmMap[novaName]
        if (!t) return
        t.loading = false
        if (resp.code !== 200) return
        t.tableData                    = resp.data.records    || []
        t.paginationConfig.itemCount   = resp.data.total      || 0
        t.paginationConfig.page        = resp.data.current    || pageBean.current
        t.paginationConfig.pageSize    = resp.data.size       || pageBean.size
        if (resp.data.pkFieldName)     t.pkFieldName          = resp.data.pkFieldName
      },
      error: function () {
        var t = window.vmMap && window.vmMap[novaName]
        if (t) t.loading = false
        console.info('[Nova] data接口未就绪，novaName:', novaName)
      }
    })
  }

  // ── 构建排序参数 ──────────────────────────────────────────────
  function buildOrderItems(sortStates) {
    var orders = []
    for (var field in sortStates) {
      if (sortStates.hasOwnProperty(field) && sortStates[field] != null) {
        orders.push({
          column: field,
          asc:    sortStates[field] === 'asc'
        })
      }
    }
    return orders
  }

  // ── 分页变化时重新加载 ────────────────────────────────────────
  function onPageChange(novaName, current) {
    var target = window.vmMap && window.vmMap[novaName]
    if (!target) return
    target.paginationConfig.page = current
    loadData(novaName)
  }

  // ── 每页数量变化时重新加载 ────────────────────────────────────
  function onPageSizeChange(novaName, pageSize) {
    var target = window.vmMap && window.vmMap[novaName]
    if (!target) return
    target.paginationConfig.pageSize = pageSize
    target.paginationConfig.page     = 1
    loadData(novaName)
  }

  // ── 排序变化时重新加载 ───────────────────────────────────────
  function onSortChange(novaName) {
    loadData(novaName)
  }

  // ── 动态计算表格高度 ──────────────────────────────────────────
  function updateTableHeight() {
    var $wrapper = $('#table-wrapper')
    if (!$wrapper.length) return
    var winH       = $(window).height()
    var headerH    = $('.n-layout-header').outerHeight(true) || 50
    var tabBarH    = $('.tab-bar').outerHeight(true)         || 41
    var outerPad   = 32
    var filterH    = $('.filter-card').outerHeight(true)     || 0
    var tblHeaderH = $('.table-card-header').outerHeight(true) || 50
    var cardPad    = 68
    var height = winH - headerH - tabBarH - outerPad - filterH - tblHeaderH - cardPad
    $wrapper.height(Math.max(height, 200))
  }

  // ── 重置筛选条件 ──────────────────────────────────────────────
  function handleReset() {
    var form = {}
    vm().searchFields.forEach(function (f) {
      var isMulti = f.type === 'CHOICE' && f.choiceInfo && f.choiceInfo.selectType === 'MULTI'
      var isSingle = f.type === 'CHOICE' && f.choiceInfo && f.choiceInfo.selectType === 'SINGLE'
      form[f.field] = isMulti ? [] : (isSingle ? null : '')
    })
    vm().filterForm = form
  }

  // ── 打开新增弹窗 ──────────────────────────────────────────────
  function handleAdd() {
    var formData = {}
    var editFields = vm().editFields || []
    editFields.forEach(function (f) {
      var isMulti = f.type === 'CHOICE' && f.choiceInfo && f.choiceInfo.selectType === 'MULTI'
      var isSingle = f.type === 'CHOICE' && f.choiceInfo && f.choiceInfo.selectType === 'SINGLE'
      formData[f.field] = isMulti ? [] : (isSingle ? null : '')
    })
    vm().currentRow = null
    vm().formData   = formData
    vm().formErrors = {}
    vm().showForm   = true
  }

  // ── 打开编辑弹窗 ──────────────────────────────────────────────
  function handleEdit(row) {
    vm().currentRow = $.extend({}, row)
    vm().formData   = $.extend({}, row)
    vm().formErrors = {}
    vm().showForm   = true
  }

  // ── 删除单条 ──────────────────────────────────────────────────
  function handleDelete(row) {
    var target = vm()
    var idx = target.tableData.indexOf(row)
    if (idx !== -1) target.tableData.splice(idx, 1)
  }

  // ── 批量删除 ──────────────────────────────────────────────────
  function handleBatchDelete() {
    var target = vm()
    var keys = target.checkedRowKeys.slice()
    target.tableData = target.tableData.filter(function (_, idx) { return !keys.includes(idx) })
    target.checkedRowKeys = []
  }

  // ── 提交表单 ──────────────────────────────────────────────────
  function handleFormSubmit() {
    var target     = vm()
    var formData   = target.formData
    var editFields = target.editFields || []
    var errors     = {}
    editFields.forEach(function (f) {
      if (!f.notNull) return
      var val = formData[f.field]
      var empty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
      if (empty) errors[f.field] = f.title + '不能为空'
    })
    target.formErrors = errors
    if (Object.keys(errors).length > 0) return
    var data = $.extend({}, formData)
    if (target.currentRow) {
      var idx = target.tableData.indexOf(target.currentRow)
      if (idx !== -1) target.tableData.splice(idx, 1, Object.assign({}, target.tableData[idx], data))
    } else {
      target.tableData.unshift(Object.assign({}, data))
    }
    target.showForm = false
  }

  return {
    onMounted, buildTable, updateTableHeight,
    handleReset, handleAdd, handleEdit, handleDelete,
    handleBatchDelete, handleFormSubmit,
    loadData, onPageChange, onPageSizeChange, onSortChange
  }

})(jQuery)
