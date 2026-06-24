// jq/table.js — 通用表格页 jQuery 业务逻辑层

// 时间戳转本地时间字符串（MySQL DATETIME 格式）
function toLocalDateStr(ts) {
  var d = new Date(ts)
  var p = function (n) { return String(n).padStart(2, '0') }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
         p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
}

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

  // ── 路由切换（同一组件实例复用，novaName 变了）────────────────
  function onRouteChange(novaName) {
    var target = window.vmMap && window.vmMap[window.activeNovaName]
    if (target) {
      // 从旧 key 迁移到新 key
      delete window.vmMap[window.activeNovaName]
      window.vmMap[novaName] = target
    }
    window.activeNovaName = novaName
    buildTable(novaName)
    setTimeout(updateTableHeight, 80)
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
        target.choiceMap  = resp.data.choice  || {}
        target.tagMap     = resp.data.tag     || {}
        target.dateMap    = resp.data.date    || {}
        target.numberMap  = resp.data.number  || {}
        target.booleanMap = resp.data.booleanInfo || {}
        target.attachmentMap  = resp.data.attachment  || {}
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
  // vmKey: vmMap 中的 key（普通表格 = novaName，picker = __picker_xxx）
  function loadData(vmKey) {
    var target = window.vmMap && window.vmMap[vmKey]
    if (!target) return
    // 实际请求后端用的表名，picker 模式下 vmKey 不等于 novaName
    var queryName = target.novaName || vmKey
    // 过滤空值条件，按后端结构组装
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
      } else if (fieldDef.type === 'DATE') {
        strVal = Array.isArray(val) ? val.join(',') : String(val)
      } else {
        strVal = Array.isArray(val) ? val.join(',') : String(val)
      }
      // REFERENCE 字段：使用 storageField 作为实际查询字段
      var actualField = fieldDef.field
      if (fieldDef.type === 'REFERENCE') {
        var refInfo = (target.referenceMap && target.referenceMap[fieldDef.field]) || {}
        actualField = refInfo.referenceField || refInfo.storageField || fieldDef.field
      }
      conditions[actualField] = {
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
      data:        JSON.stringify({ novaName: queryName, pageBean: pageBean, conditions: conditions }),
      success: function (resp) {
        var t = window.vmMap && window.vmMap[vmKey]
        if (!t) return
        t.loading = false
        if (resp.code !== 200) return
        t.tableData                    = resp.data.records    || []
        t.rawTableData                 = resp.data.records    || []
        t.paginationConfig.itemCount   = resp.data.total      || 0
        t.paginationConfig.page        = resp.data.current    || pageBean.current
        t.paginationConfig.pageSize    = resp.data.size       || pageBean.size
        if (resp.data.pkFieldName)     t.pkFieldName          = resp.data.pkFieldName
        translateData(vmKey)
      },
      error: function () {
        var t = window.vmMap && window.vmMap[vmKey]
        if (t) t.loading = false
        console.info('[Nova] data接口未就绪，novaName:', queryName)
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
  function onPageChange(vmKey, current) {
    var target = window.vmMap && window.vmMap[vmKey]
    if (!target) return
    target.paginationConfig.page = current
    loadData(vmKey)
  }

  // ── 每页数量变化时重新加载 ────────────────────────────────────
  function onPageSizeChange(vmKey, pageSize) {
    var target = window.vmMap && window.vmMap[vmKey]
    if (!target) return
    target.paginationConfig.pageSize = pageSize
    target.paginationConfig.page     = 1
    loadData(vmKey)
  }

  // ── 排序变化时重新加载 ───────────────────────────────────────
  function onSortChange(vmKey) {
    loadData(vmKey)
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
    var activeVm = window.vmMap && window.vmMap[window.activeNovaName]
    if (activeVm) activeVm.tableWrapperWidth = $wrapper[0].clientWidth
  }

  // ── 翻译 CHOICE 类型列 ────────────────────────────────────────
  function translateData(novaName) {
    var target = window.vmMap && window.vmMap[novaName]
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
    // 从 choiceMap 构建本地查找表
    var localLookups = {}
    for (var fk in choiceMap) {
      if (choiceMap.hasOwnProperty(fk)) {
        var lookup = {}
        ;(choiceMap[fk].values || []).forEach(function (v) { lookup[v.value] = v.label })
        localLookups[fk] = lookup
      }
    }
    // 构建翻译表
    var localTranslate = {}
    choiceCols.forEach(function (col) {
      var isMulti = choiceMap[col.field] && choiceMap[col.field].selectType === 'MULTI'
      if (localLookups[col.field]) {
        localTranslate[col.field] = { lookup: localLookups[col.field], isMulti: isMulti }
      }
    })
    // 本地翻译立即回填
    function applyLookups(lookups, tableData) {
      return tableData.map(function (row) {
        var updated = $.extend({}, row)
        for (var field in lookups) {
          if (!lookups.hasOwnProperty(field)) continue
          var lookup = lookups[field].lookup
          var isMulti = lookups[field].isMulti
          var raw = (row[field] === null || row[field] === undefined) ? '' : String(row[field])
          if (!raw) continue
          updated[field] = isMulti
            ? raw.split(',').map(function (v) { return lookup[v.trim()] || v.trim() }).join(',')
            : (lookup[raw] || raw)
        }
        return updated
      })
    }
    if (Object.keys(localTranslate).length > 0) {
      target.tableData = applyLookups(localTranslate, target.tableData)
    }
  }

  // ── 重置筛选条件 ──────────────────────────────────────────────
  function handleReset() {
    var form = {}
    var target = vm()
    var choiceMap = (target && target.choiceMap) || {}
    target.searchFields.forEach(function (f) {
      var choiceInfo = choiceMap[f.field]
      var isMultiChoice = f.type === 'CHOICE' && (choiceInfo && choiceInfo.selectType === 'MULTI' || f.vague)
      var isSingleChoice = f.type === 'CHOICE' && choiceInfo && choiceInfo.selectType === 'SINGLE' && !f.vague
      var isDate = f.type === 'DATE'
      form[f.field] = (isMultiChoice || f.type === 'TAG') ? [] : (f.type === 'NUMBER' && f.vague ? [null, null] : (isSingleChoice || isDate || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : ''))
      // REFERENCE 字段重置 _display 字段
      if (f.type === 'REFERENCE') {
        form[f.field + '_display'] = ''
      }
    })
    target.filterForm = form
    target.paginationConfig.page = 1
  }

  // ── 打开新增弹窗 ──────────────────────────────────────────────
  function handleAdd() {
    var formData = {}
    var target = vm()
    var choiceMap = (target && target.choiceMap) || {}
    var editFields = target.editFields || []
    editFields.forEach(function (f) {
      var choiceInfo = choiceMap[f.field]
      var isMulti = f.type === 'CHOICE' && choiceInfo && choiceInfo.selectType === 'MULTI'
      var isSingle = f.type === 'CHOICE' && choiceInfo && choiceInfo.selectType === 'SINGLE'
      var isDate   = f.type === 'DATE'
      formData[f.field] = (isMulti || f.type === 'TAG' || f.type === 'ATTACHMENT') ? [] : (isSingle || isDate || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : '')
      // REFERENCE 字段初始化 _display 字段
      if (f.type === 'REFERENCE') {
        formData[f.field + '_display'] = ''
      }
    })
    vm().currentRow = null
    vm().formMode   = 'add'
    vm().formData   = formData
    vm().formErrors = {}
    vm().showForm   = true
  }

  // ── 打开编辑弹窗 ──────────────────────────────────────────────
  function handleEdit(row) {
    var target = vm()
    var pkField = target.pkFieldName || 'id'
    var pkVal = row[pkField]
    // 从 rawTableData 找对应原始行（翻译前的值）
    var rawRow = null
    ;(target.rawTableData || []).forEach(function (r) {
      if (String(r[pkField]) === String(pkVal)) rawRow = r
    })
    var source = rawRow ? $.extend({}, rawRow) : $.extend({}, row)
    // MULTI 类型的值转为数组；DATE 类型的字符串转为时间戳
    var choiceMap = target.choiceMap || {}
    var dateMap   = target.dateMap   || {}
    ;(target.editFields || []).forEach(function (f) {
      var choice = choiceMap[f.field]
      if (choice && choice.selectType === 'MULTI') {
        var val = source[f.field]
        source[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
      } else if (f.type === 'TAG') {
        var tv = source[f.field]
        source[f.field] = (tv && String(tv).length > 0) ? String(tv).split(',') : []
      } else if (f.type === 'ATTACHMENT') {
        var av = source[f.field]
        source[f.field] = (av && String(av).length > 0) ? String(av).split(',') : []
      } else if (f.type === 'DATE' && source[f.field]) {
        var ts = new Date(source[f.field]).getTime()
        source[f.field] = isNaN(ts) ? null : ts
      } else if (f.type === 'BOOLEAN') {
        var bv = source[f.field]
        source[f.field] = (bv === null || bv === undefined) ? null : String(bv)
      } else if (f.type === 'NUMBER') {
        var nv = source[f.field]
        source[f.field] = (nv === null || nv === undefined || nv === '') ? null : Number(nv)
      } else if (f.type === 'REFERENCE') {
        // REFERENCE 字段：提取展示列的值
        var refInfo = (target.referenceMap && target.referenceMap[f.field]) || {}
        var displayField = refInfo.displayField
        if (displayField) {
          // 方式1: 扁平化格式，如 row['testDemo2.name']
          var displayKey = f.field + '.' + displayField
          if (row[displayKey] !== undefined) {
            source[f.field + '_display'] = row[displayKey]
          }
          // 方式2: 直接有 _display 字段
          else if (row[f.field + '_display'] !== undefined) {
            source[f.field + '_display'] = row[f.field + '_display']
          }
          // 方式3: 嵌套对象格式，如 row['testDemo2'] = { id: 123, name: '张三' }
          else if (row[f.field] && typeof row[f.field] === 'object' && row[f.field][displayField] !== undefined) {
            source[f.field + '_display'] = row[f.field][displayField]
            // 提取存储列的值（通常是 id）
            var storageField = refInfo.storageField || 'id'
            source[f.field] = row[f.field][storageField]
          }
        }
      }
    })
    target.currentRow = source
    target.formMode   = 'edit'
    target.formData   = $.extend({}, source)
    target.formErrors = {}
    target.showForm   = true
  }

  // ── 删除单条 ──────────────────────────────────────────────────
  function handleDelete(row) {
    var target = vm()
    var pkField = target.pkFieldName || 'id'
    doDelete(target.novaName, pkField, [String(row[pkField])])
  }

  // ── 批量删除 ──────────────────────────────────────────────────
  function handleBatchDelete() {
    var target = vm()
    var pkField = target.pkFieldName || 'id'
    var keys = target.checkedRowKeys.map(function (k) { return String(k) })
    if (!window.$dialog) {
      doDelete(target.novaName, pkField, keys)
      return
    }
    window.$dialog.create({
      type:                'warning',
      title:               '确认删除',
      content:             '确定删除选中的 ' + keys.length + ' 条数据吗？',
      positiveText:        '确定',
      negativeText:        '取消',
      style:               'margin-top:80px',
      positiveButtonProps: { type: 'primary', size: 'medium' },
      negativeButtonProps: { size: 'medium' },
      onPositiveClick: function () {
        doDelete(target.novaName, pkField, keys)
      }
    })
  }

  // ── 删除公共逻辑 ──────────────────────────────────────────────
  function doDelete(novaName, pkFieldName, pkValues) {
    $.ajax({
      url:         '/nova/table/delete',
      method:      'POST',
      contentType: 'application/json',
      data:        JSON.stringify({ novaName: novaName, pkFieldName: pkFieldName, pkValues: pkValues }),
      success: function (resp) {
        var t = window.vmMap && window.vmMap[novaName]
        if (!t) return
        if (resp.code !== 200) return
        t.checkedRowKeys = []
        if (window.$message) window.$message.success('删除成功')
        loadData(novaName)
      },
      error: function () {
        console.info('[Nova] delete接口请求失败，novaName:', novaName)
      }
    })
  }

  // ── 提交表单 ──────────────────────────────────────────────────
  function handleFormSubmit() {
    var target     = vm()
    var formData   = target.formData
    var editFields = target.editFields || []
    var errors     = {}
    editFields.forEach(function (f) {
      if (f.type === 'DIVIDE' || f.type === 'EMPTY' || !f.notNull) return
      var val = formData[f.field]
      var empty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
      if (empty) errors[f.field] = f.title + '不能为空'
    })
    target.formErrors = errors
    if (Object.keys(errors).length > 0) return
    if (target.currentRow) {
      // 编辑
      var novaName = target.novaName
      var pkField = target.pkFieldName || 'id'
      var pkValue = String(target.currentRow[pkField])
      var formInfo = editFields.filter(function (f) { return f.type !== 'DIVIDE' && f.type !== 'EMPTY' }).map(function (f) {
        var val = formData[f.field]
        var strVal
        if (val === null || val === undefined || val === '') {
          strVal = ''
        } else if (Array.isArray(val)) {
          strVal = val.join(',')
        } else {
          strVal = String(val)
        }
        // REFERENCE 字段：使用 referenceField 作为实际提交字段
        var actualField = f.field
        if (f.type === 'REFERENCE') {
          var refInfo = (target.referenceMap && target.referenceMap[f.field]) || {}
          actualField = refInfo.referenceField || refInfo.storageField || f.field
        }
        return { field: actualField, value: strVal, type: f.type }
      })
      formInfo.unshift({ field: pkField, value: pkValue, type: '' })
      $.ajax({
        url:         '/nova/table/update',
        method:      'POST',
        contentType: 'application/json',
        data:        JSON.stringify({ novaName: novaName, formInfo: formInfo }),
        success: function (resp) {
          var t = window.vmMap && window.vmMap[novaName]
          if (!t) return
          if (resp.code !== 200) return
          t.showForm = false
          if (window.$message) window.$message.success('修改成功')
          loadData(novaName)
        },
        error: function () {
          console.info('[Nova] update接口请求失败，novaName:', novaName)
        }
      })
    } else {
      // 新增
      var novaName = target.novaName
      var formInfo = editFields.filter(function (f) { return f.type !== 'DIVIDE' && f.type !== 'EMPTY' }).map(function (f) {
        var val = formData[f.field]
        var strVal
        if (val === null || val === undefined || val === '') {
          strVal = ''
        } else if (Array.isArray(val)) {
          strVal = val.join(',')
        } else {
          strVal = String(val)
        }
        // REFERENCE 字段：使用 referenceField 作为实际提交字段
        var actualField = f.field
        if (f.type === 'REFERENCE') {
          var refInfo = (target.referenceMap && target.referenceMap[f.field]) || {}
          actualField = refInfo.referenceField || refInfo.storageField || f.field
        }
        return { field: actualField, value: strVal, type: f.type }
      }).filter(function (item) { return item.value !== '' })
      $.ajax({
        url:         '/nova/table/add',
        method:      'POST',
        contentType: 'application/json',
        data:        JSON.stringify({ novaName: novaName, formInfo: formInfo }),
        success: function (resp) {
          var t = window.vmMap && window.vmMap[novaName]
          if (!t) return
          if (resp.code !== 200) return
          t.showForm = false
          if (window.$message) window.$message.success('新增成功')
          loadData(novaName)
        },
        error: function () {
          console.info('[Nova] add接口请求失败，novaName:', novaName)
        }
      })
    }
  }

  // ── picker 模式初始化（不更新 tableHeight，不绑 resize） ────────
  function onPickerMounted(novaName, vmKey) {
    buildTableForKey(novaName, vmKey)
  }

  // ── picker 专用 buildTable，用 vmKey 索引而非 novaName ─────────
  function buildTableForKey(novaName, vmKey) {
    if (!novaName || !vmKey) return
    $.ajax({
      url:         '/nova/table/build',
      method:      'POST',
      contentType: 'application/json',
      data:        JSON.stringify({ novaName: novaName }),
      success: function (resp) {
        if (resp.code !== 200) return
        var target = window.vmMap && window.vmMap[vmKey]
        if (!target) return
        target.choiceMap     = resp.data.choice      || {}
        target.tagMap        = resp.data.tag         || {}
        target.dateMap       = resp.data.date        || {}
        target.numberMap     = resp.data.number      || {}
        target.booleanMap    = resp.data.booleanInfo || {}
        target.attachmentMap = resp.data.attachment  || {}
        target.referenceMap  = resp.data.reference   || {}
        var fields = resp.data.search || []
        target.searchFields = fields
        var form = {}
        fields.forEach(function (f) {
          var choiceInfo = target.choiceMap[f.field]
          var isMultiChoice = f.type === 'CHOICE' && (choiceInfo && choiceInfo.selectType === 'MULTI' || f.vague)
          var isSingleChoice = f.type === 'CHOICE' && choiceInfo && choiceInfo.selectType === 'SINGLE' && !f.vague
          var isDate = f.type === 'DATE'
          form[f.field] = (isMultiChoice || f.type === 'TAG') ? [] : (f.type === 'NUMBER' && f.vague ? [null, null] : (isSingleChoice || isDate || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : ''))
          if (f.type === 'REFERENCE') form[f.field + '_display'] = ''
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
        loadData(vmKey)
      },
      error: function () {
        console.info('[Nova Picker] build接口未就绪，novaName:', novaName)
      }
    })
  }

  return {
    onMounted, onRouteChange, buildTable, updateTableHeight,
    handleReset, handleAdd, handleEdit, handleDelete,
    handleBatchDelete, handleFormSubmit,
    loadData, onPageChange, onPageSizeChange, onSortChange,
    onPickerMounted
  }

})(jQuery)
