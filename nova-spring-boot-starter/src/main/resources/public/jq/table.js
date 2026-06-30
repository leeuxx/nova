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
        target.appendageMap   = resp.data.appendage   || {}
        var fields = resp.data.search || []
        target.searchFields = fields
        var form = {}
        fields.forEach(function (f) {
          var choiceInfo = target.choiceMap[f.field]
          var isMultiChoice = f.type === 'CHOICE' && (choiceInfo && choiceInfo.selectType === 'MULTI' || f.vague)
          var isSingleChoice = f.type === 'CHOICE' && choiceInfo && choiceInfo.selectType === 'SINGLE' && !f.vague
          var isDate = f.type === 'DATE'
          form[f.field] = (isMultiChoice || f.type === 'TAG') ? [] : (f.type === 'NUMBER' && f.vague ? [null, null] : (isSingleChoice || isDate || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : ''))
          // REFERENCE / APPENDAGE 字段初始化 _display 字段
          if (f.type === 'REFERENCE' || f.type === 'APPENDAGE') {
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
        var allEdit = resp.data.edit || []
        target.editFields = allEdit.filter(function(e) { return e.tapType === 'thisForm' }).reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
        target.editReferenceTabs = allEdit.filter(function(e) { return e.tapType === 'referenceForm' && e.tapShow !== false })
        target.editAppendageTabs = allEdit.filter(function(e) { return e.tapType === 'appendageForm' && e.tapShow !== false })
        target.editExtraTabs = allEdit.filter(function(e) { return (e.tapType === 'referenceForm' || e.tapType === 'appendageForm') && e.tapShow !== false })
        var refMap = resp.data.reference || {}
        target.editReferenceTabs.forEach(function(tab) {
          if (!tab.tapNovaName) return
          target.editFields.forEach(function(f) {
            if (!tab.tapParamField && f.type === 'REFERENCE' && (refMap[f.field] || {}).referenceName === tab.tapNovaName)
              tab.tapParamField = f.field
          })
        })
        target.editAppendageTabs = allEdit.filter(function(e) { return e.tapType === 'appendageForm' && e.tapShow !== false })
        if (resp.data.novaIdFieldName) target.novaIdFieldName = resp.data.novaIdFieldName
        // 构建完成后加载数据
        loadData(novaName)
      },
      error: function () {
        console.info('[Nova] build接口未就绪，novaName:', novaName)
      }
    })
  }

  // ── 填充 appendage 表单数据（从 rec 对象）────────────────────────
  function fillAppendageData(t, appNovaName, rec) {
    if (!rec || typeof rec !== 'object') return
    var curBuild = (t.appendageTabBuild || {})[appNovaName] || {}
    var fields = curBuild.editFields || []
    var cm = curBuild.choiceMap || {}
    var fd = {}
    fields.forEach(function(f) {
      var val = rec[f.field]
      var ci = cm[f.field]
      if (f.type === 'CHOICE' && ci && ci.selectType === 'MULTI') {
        fd[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
      } else if (f.type === 'TAG' || f.type === 'ATTACHMENT') {
        fd[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
      } else if (f.type === 'DATE') {
        var ts = val !== null && val !== undefined ? Number(val) : null
        fd[f.field] = (ts && !isNaN(ts)) ? ts : null
      } else if (f.type === 'BOOLEAN') {
        fd[f.field] = (val === null || val === undefined) ? null : String(val)
      } else if (f.type === 'NUMBER') {
        fd[f.field] = (val === null || val === undefined || val === '') ? null : Number(val)
      } else if (f.type === 'REFERENCE') {
        var refInfo = ((t.appendageTabBuild[appNovaName] || {}).referenceMap || {})[f.field] || {}
        var rsf = refInfo.storageField || 'id'
        fd[f.field] = (val && typeof val === 'object')
          ? (val[rsf] !== undefined && val[rsf] !== null ? String(val[rsf]) : null)
          : (val !== null && val !== undefined && val !== '' ? String(val) : null)
        fd[f.field + '_display'] = (val && typeof val === 'object' && refInfo.displayField)
          ? (val[refInfo.displayField] != null ? String(val[refInfo.displayField]) : '') : ''
      } else {
        fd[f.field] = (val === null || val === undefined) ? '' : val
      }
    })
    var newFds = Object.assign({}, t.appendageFormData)
    newFds[appNovaName] = fd
    t.appendageFormData = newFds
  }

  // ── view 模式填 formData 的共用函数 ────────────────────────────────
  function fillViewFormData(viewVm, row) {
    var fields = viewVm.editFields || []
    var choiceMap    = viewVm.choiceMap    || {}
    var referenceMap = viewVm.referenceMap || {}
    var source = {}
    row = row || {}
    fields.forEach(function(f) {
      var val = row[f.field]
      var choice = choiceMap[f.field]
      if (choice && choice.selectType === 'MULTI') {
        source[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
      } else if (f.type === 'TAG' || f.type === 'ATTACHMENT') {
        source[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
      } else if (f.type === 'DATE') {
        var ts = val !== null && val !== undefined ? Number(val) : null
        source[f.field] = (ts && !isNaN(ts)) ? ts : null
      } else if (f.type === 'BOOLEAN') {
        source[f.field] = (val === null || val === undefined) ? null : String(val)
      } else if (f.type === 'NUMBER') {
        source[f.field] = (val === null || val === undefined || val === '') ? null : Number(val)
      } else if (f.type === 'REFERENCE') {
        var refInfo = referenceMap[f.field] || {}
        var sf = refInfo.storageField || 'id'
        source[f.field] = (val && typeof val === 'object')
          ? (val[sf] !== undefined && val[sf] !== null ? String(val[sf]) : null)
          : (val !== null && val !== undefined && val !== '' ? String(val) : null)
        source[f.field + '_display'] = (val && typeof val === 'object' && refInfo.displayField)
          ? (val[refInfo.displayField] != null ? String(val[refInfo.displayField]) : '') : ''
      } else {
        source[f.field] = (val === null || val === undefined) ? '' : val
      }
    })
    viewVm.formData   = source
    viewVm.currentRow = source
  }

  // ── 点击 referenceForm tab：立即展示组件，/build 与 /details 并行 ──
  function loadReferenceDetails(novaName, refNovaName) {
    var target = window.vmMap && window.vmMap[novaName]
    if (!target) return
    var referenceMap = target.referenceMap || {}
    var storageVal = null
    for (var field in referenceMap) {
      if ((referenceMap[field] || {}).referenceName === refNovaName) {
        storageVal = target.formData && target.formData[field]
        if (!storageVal && target._rawDetailRow) {
          var rawNested = target._rawDetailRow[field]
          var sf = (referenceMap[field] || {}).storageField || 'id'
          if (rawNested && typeof rawNested === 'object') storageVal = rawNested[sf]
        }
        break
      }
    }
    // 立即展示 nova-table，触发 /build
    var nd = Object.assign({}, target.refTabData)
    nd[refNovaName] = {}
    target.refTabData = nd
    if (!storageVal) return
    // 初始化并行协调状态
    target._refCoord = target._refCoord || {}
    target._refCoord[refNovaName] = { data: null, buildVmKey: null }
    $.ajax({
      url: '/nova/table/details', method: 'POST', contentType: 'application/json',
      data: JSON.stringify({ novaName: refNovaName, storageFieldValue: String(storageVal) }),
      success: function(resp) {
        var t = window.vmMap && window.vmMap[novaName]
        if (!t || !t._refCoord || !t._refCoord[refNovaName]) return
        var data = (resp.code === 200 && resp.data) ? resp.data : {}
        t._refCoord[refNovaName].data = data
        var buildVmKey = t._refCoord[refNovaName].buildVmKey
        if (buildVmKey) {
          var viewVm = window.vmMap && window.vmMap[buildVmKey]
          if (viewVm) fillViewFormData(viewVm, data)
        }
      }
    })
  }

  // ── 懒加载 appendage sub-build（首次打开弹窗时调用）──────────────
  function loadAppendageDetails(novaName, appNovaName) {
    var target = window.vmMap && window.vmMap[novaName]
    if (!target) return
    var appendageMap = target.appendageMap || {}
    var appField = null
    Object.keys(appendageMap).forEach(function(k) {
      if (appendageMap[k].referenceName === appNovaName) appField = k
    })
    if (!appField) return
    var storageField = (appendageMap[appField].storageField) || 'id'
    var storageVal = target.formData && target.formData[storageField]
    var loaded = Object.assign({}, target.appendageDetailsLoaded)
    loaded[appNovaName] = true
    target.appendageDetailsLoaded = loaded
    if (!storageVal) return
    $.ajax({
      url: '/nova/table/details', method: 'POST', contentType: 'application/json',
      data: JSON.stringify({ novaName: appNovaName, storageFieldValue: String(storageVal) }),
      success: function(resp) {
        if (resp.code !== 200 || !resp.data) return
        var t = window.vmMap && window.vmMap[novaName]
        if (!t) return
        fillAppendageData(t, appNovaName, resp.data)
      }
    })
  }

  function buildAppendageTabs(novaName, rowData) {
    var target = window.vmMap && window.vmMap[novaName]
    if (!target) return
    ;(target.editAppendageTabs || []).forEach(function(appTab) {
      if (!appTab.tapNovaName) return
      var appNovaName = appTab.tapNovaName
      $.ajax({
        url: '/nova/table/build', method: 'POST', contentType: 'application/json',
        data: JSON.stringify({ novaName: appNovaName }),
        success: function(br) {
          if (br.code !== 200) return
          var t2 = window.vmMap && window.vmMap[novaName]
          if (!t2) return
          var bd = br.data
          var editFields = (bd.edit || []).filter(function(e) { return e.tapType === 'thisForm' }).reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
          var newBuild = Object.assign({}, t2.appendageTabBuild)
          var cm = bd.choice || {}
          newBuild[appNovaName] = {
            editFields: editFields, choiceMap: cm, numberMap: bd.number || {},
            dateMap: bd.date || {}, booleanMap: bd.booleanInfo || {},
            referenceMap: bd.reference || {}, tagMap: bd.tag || {},
            attachmentMap: bd.attachment || {},
            editLayout: (bd.layout && bd.layout.editLayout) || 'DEFAULT'
          }
          t2.appendageTabBuild = newBuild
          var fd = {}
          editFields.forEach(function(f) {
            var ci = cm[f.field]
            var isMulti = f.type === 'CHOICE' && ci && ci.selectType === 'MULTI'
            var isSingle = f.type === 'CHOICE' && ci && ci.selectType === 'SINGLE'
            fd[f.field] = (isMulti || f.type === 'TAG' || f.type === 'ATTACHMENT') ? [] : (isSingle || f.type === 'DATE' || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : '')
            if (f.type === 'REFERENCE') fd[f.field + '_display'] = ''
          })
          var newFds = Object.assign({}, t2.appendageFormData)
          newFds[appNovaName] = fd
          t2.appendageFormData = newFds
          if (rowData) {
            var appendageMap = t2.appendageMap || {}
            var appFieldKey = null
            Object.keys(appendageMap).forEach(function(k) { if (appendageMap[k].referenceName === appNovaName) appFieldKey = k })
            if (appFieldKey) fillAppendageData(t2, appNovaName, rowData[appFieldKey])
          }
          loadAppendageDetails(novaName, appNovaName)
        }
      })
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
      // REFERENCE 字段：使用 referenceField 作为实际查询字段
      var actualField = fieldDef.field
      if (fieldDef.type === 'REFERENCE') {
        var refInfo = (target.referenceMap && target.referenceMap[fieldDef.field]) || {}
        actualField = refInfo.referenceField || refInfo.storageField || fieldDef.field
      }
      // APPENDAGE 字段：使用 storageField 作为实际查询字段
      if (fieldDef.type === 'APPENDAGE') {
        var appInfo = (target.appendageMap && target.appendageMap[fieldDef.field]) || {}
        actualField = appInfo.storageField || fieldDef.field
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
      data:        JSON.stringify({ novaName: queryName, sourceNovaName: target._sourceNovaName || queryName, sourceFields: target._sourceFields || {}, pageBean: pageBean, conditions: conditions }),
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
        if (resp.data.novaIdFieldName)     t.novaIdFieldName          = resp.data.novaIdFieldName
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
  function translateData(vmKey) {
    var target = window.vmMap && window.vmMap[vmKey]
    if (!target) return
    var records = target.tableData
    if (!records || records.length === 0) return
    var choiceCols = (target.tableColumns || []).filter(function (c) { return c.type === 'CHOICE' })
    // CHOICE 翻译（原逻辑不变）
    if (choiceCols.length > 0) {
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
        if (localLookups[col.field]) localTranslate[col.field] = { lookup: localLookups[col.field], isMulti: isMulti }
      })
      if (Object.keys(localTranslate).length > 0) {
        target.tableData = target.tableData.map(function (row) {
          var updated = $.extend({}, row)
          for (var field in localTranslate) {
            if (!localTranslate.hasOwnProperty(field)) continue
            var lk = localTranslate[field].lookup
            var isMulti = localTranslate[field].isMulti
            var raw = (row[field] === null || row[field] === undefined) ? '' : String(row[field])
            if (!raw) continue
            updated[field] = isMulti
              ? raw.split(',').map(function (v) { return lk[v.trim()] || v.trim() }).join(',')
              : (lk[raw] || raw)
          }
          return updated
        })
      }
    }
    // REFERENCE + APPENDAGE 翻译（VIEW 模式：行数据中已含嵌套对象，直接读取）
    var referenceMap = target.referenceMap || {}
    var appendageMap = target.appendageMap || {}
    var refCols = (target.tableColumns || []).filter(function(col) {
      return col.type === 'REFERENCE' || col.type === 'APPENDAGE'
    })
    if (refCols.length === 0) return
    target.tableData = target.tableData.map(function(row) {
      var updated = $.extend({}, row)
      refCols.forEach(function(col) {
        var dotIdx = col.field.indexOf('.')
        var refKey = dotIdx > -1 ? col.field.slice(0, dotIdx) : col.field
        var nestedObj = row[refKey]
        if (!nestedObj || typeof nestedObj !== 'object') {
          updated[col.field + '_display'] = ''
          return
        }
        var propKey
        if (dotIdx > -1) {
          propKey = col.field.slice(dotIdx + 1)
        } else if (col.type === 'REFERENCE') {
          propKey = (referenceMap[refKey] && referenceMap[refKey].displayField) || 'name'
        } else {
          var ai = appendageMap[refKey]
          propKey = (ai && ai.displayField) || 'name'
        }
        var val = nestedObj[propKey]
        updated[col.field + '_display'] = (val !== null && val !== undefined) ? val : ''
      })
      return updated
    })
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
      // REFERENCE / APPENDAGE 字段重置 _display 字段
      if (f.type === 'REFERENCE' || f.type === 'APPENDAGE') {
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
    vm().currentRow              = null
    vm()._rawDetailRow           = null
    vm().appendageDetailsLoaded  = {}
    vm().formMode                = 'add'
    vm().formData   = formData
    vm().formErrors = {}
    vm().refTabData = {}
    vm()._refCoord  = {}
    var appFds = {}
    var appBuild = vm().appendageTabBuild || {}
    ;(vm().editAppendageTabs || []).forEach(function(appTab) {
      var bd = appBuild[appTab.tapNovaName] || {}
      var fd = {}
      var cm = bd.choiceMap || {}
      ;(bd.editFields || []).forEach(function(f) {
        var ci = cm[f.field]
        var isMulti = f.type === 'CHOICE' && ci && ci.selectType === 'MULTI'
        var isSingle = f.type === 'CHOICE' && ci && ci.selectType === 'SINGLE'
        fd[f.field] = (isMulti || f.type === 'TAG' || f.type === 'ATTACHMENT') ? [] : (isSingle || f.type === 'DATE' || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : '')
        if (f.type === 'REFERENCE') fd[f.field + '_display'] = ''
      })
      appFds[appTab.tapNovaName] = fd
    })
    vm().appendageFormData   = appFds
    vm().appendageFormErrors = {}
    vm().formTab    = 'form'
    buildAppendageTabs(vm().novaName)
    vm().showForm   = true
  }

  // ── 打开编辑弹窗 ──────────────────────────────────────────────
  function handleEdit(row) {
    var target = vm()
    var novaName = target.novaName
    var novaIdField = target.novaIdFieldName
    var pkVal = String(row[novaIdField])

    $.ajax({
      url: '/nova/table/details',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ novaName: novaName, storageFieldValue: pkVal }),
      success: function(resp) {
        if (resp.code !== 200) return
        var t = window.vmMap && window.vmMap[novaName]
        if (!t) return
        var detailRow = resp.data
        if (!detailRow) return

        var choiceMap    = t.choiceMap    || {}
        var referenceMap = t.referenceMap || {}
        var source = {}
        source[novaIdField] = pkVal

        ;(t.editFields || []).forEach(function(f) {
          var val = detailRow[f.field]
          var choice = choiceMap[f.field]
          if (choice && choice.selectType === 'MULTI') {
            source[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
          } else if (f.type === 'TAG' || f.type === 'ATTACHMENT') {
            source[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
          } else if (f.type === 'DATE') {
            var ts = val !== null && val !== undefined ? Number(val) : null
            source[f.field] = (ts && !isNaN(ts)) ? ts : null
          } else if (f.type === 'BOOLEAN') {
            source[f.field] = (val === null || val === undefined) ? null : String(val)
          } else if (f.type === 'NUMBER') {
            source[f.field] = (val === null || val === undefined || val === '') ? null : Number(val)
          } else if (f.type === 'REFERENCE') {
            var refInfo = referenceMap[f.field] || {}
            var sf = refInfo.storageField || 'id'
            source[f.field] = (val && typeof val === 'object')
              ? (val[sf] !== undefined && val[sf] !== null ? String(val[sf]) : null)
              : (val !== null && val !== undefined && val !== '' ? String(val) : null)
            source[f.field + '_display'] = (val && typeof val === 'object' && refInfo.displayField)
              ? (val[refInfo.displayField] != null ? String(val[refInfo.displayField]) : '') : ''
          } else {
            source[f.field] = (val === null || val === undefined) ? '' : val
          }
        })

        t.currentRow            = $.extend({}, source)
        t._rawDetailRow         = detailRow
        t.appendageDetailsLoaded = {}
        t.formMode              = 'edit'
        t.formData   = $.extend({}, source)
        t.formErrors = {}
        t.refTabData = {}
        t._refCoord  = {}
        t.formTab    = 'form'
        buildAppendageTabs(novaName, detailRow)
        t.showForm   = true
      }
    })
  }

  // ── 删除单条 ──────────────────────────────────────────────────
  function handleDelete(row) {
    var target = vm()
    var novaIdField = target.novaIdFieldName
    doDelete(target.novaName, novaIdField, [String(row[novaIdField])])
  }

  // ── 批量删除 ──────────────────────────────────────────────────
  function handleBatchDelete() {
    var target = vm()
    var novaIdField = target.novaIdFieldName
    var keys = target.checkedRowKeys.map(function (k) { return String(k) })
    if (!window.$dialog) {
      doDelete(target.novaName, novaIdField, keys)
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
        doDelete(target.novaName, novaIdField, keys)
      }
    })
  }

  // ── 删除公共逻辑 ──────────────────────────────────────────────
  function doDelete(novaName, novaIdFieldName, novaIdValues) {
    $.ajax({
      url:         '/nova/table/delete',
      method:      'POST',
      contentType: 'application/json',
      data:        JSON.stringify({ novaName: novaName, novaIdFieldName: novaIdFieldName, novaIdValues: novaIdValues }),
      success: function (resp) {
        var t = window.vmMap && window.vmMap[novaName]
        if (!t) return
        if (resp.code !== 200) { if (window.$message) window.$message.error(resp.msg || '删除失败'); return }
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
    var visibleSet = new Set((target.visibleEditFields || []).filter(function(v) { return v.visible }).map(function(v) { return v.field.field }))
    var errors     = {}
    editFields.forEach(function (f) {
      if (f.type === 'DIVIDE' || f.type === 'EMPTY' || !f.notNull) return
      if (!visibleSet.has(f.field)) return
      var val = formData[f.field]
      var empty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
      if (empty) errors[f.field] = f.title + '不能为空'
    })
    target.formErrors = errors
    if (Object.keys(errors).length > 0) { target.formTab = 'form'; return }

    // 校验附属表单
    var appErrors = {}
    var firstErrAppTab = null
    ;(target.editAppendageTabs || []).forEach(function(appTab) {
      var n = appTab.tapNovaName
      if (appTab.tapShow === false || (appTab.tapShowByExpr && window.evalShowExpr && !window.evalShowExpr(appTab.tapShowByExpr, formData))) return
      var build = (target.appendageTabBuild || {})[n] || {}
      var fd = (target.appendageFormData || {})[n] || {}
      var refMap = build.referenceMap || {}
      var evalFd = Object.assign({}, fd)
      for (var k in refMap) { var rf = refMap[k] && refMap[k].referenceField; if (rf) evalFd[k] = fd[rf] !== undefined ? fd[rf] : null }
      var errs = {}
      ;(build.editFields || []).forEach(function(f) {
        if (!f.notNull) return
        if (f.type === 'REFERENCE' && refMap[f.field] && refMap[f.field].referenceName === target.novaName) return
        if (f.showByExpr && window.evalShowExpr && !window.evalShowExpr(f.showByExpr, evalFd)) return
        var val = fd[f.field]
        var empty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
        if (empty) errs[f.field] = f.title + '不能为空'
      })
      appErrors[n] = errs
      if (!firstErrAppTab && Object.keys(errs).length > 0) firstErrAppTab = n
    })
    var newAppErrors = Object.assign({}, target.appendageFormErrors, appErrors)
    target.appendageFormErrors = newAppErrors
    if (firstErrAppTab) { target.formTab = 'app_' + firstErrAppTab; return }

    // 组装附属表单数据
    var appendageFormInfo = {}
    ;(target.editAppendageTabs || []).forEach(function(appTab) {
      var n = appTab.tapNovaName
      if (appTab.tapShow === false || (appTab.tapShowByExpr && window.evalShowExpr && !window.evalShowExpr(appTab.tapShowByExpr, formData))) return
      var build = (target.appendageTabBuild || {})[n] || {}
      var fd = (target.appendageFormData || {})[n] || {}
      var refMap = build.referenceMap || {}
      appendageFormInfo[n] = (build.editFields || []).filter(function(f) { return f.type !== 'DIVIDE' && f.type !== 'EMPTY' }).map(function(f) {
        var val = fd[f.field]
        var strVal = (val === null || val === undefined || val === '') ? '' : (Array.isArray(val) ? val.join(',') : String(val))
        var item = { field: f.field, value: strVal, type: f.type }
        if (f.type === 'REFERENCE') {
          var refInfo = refMap[f.field] || {}
          if (refInfo.referenceField) item.reference = { field: refInfo.referenceField }
        }
        return item
      })
    })

    if (target.currentRow) {
      // 编辑
      var novaName = target.novaName
      var novaIdField = target.novaIdFieldName
      var pkValue = String(target.currentRow[novaIdField])
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
        var item = { field: f.field, value: strVal, type: f.type }
        if (f.type === 'REFERENCE') {
          var refInfo = (target.referenceMap && target.referenceMap[f.field]) || {}
          if (refInfo.referenceField) item.reference = { field: refInfo.referenceField }
        }
        return item
      })
      formInfo.unshift({ field: novaIdField, value: pkValue, type: '' })
      $.ajax({
        url:         '/nova/table/update',
        method:      'POST',
        contentType: 'application/json',
        data:        JSON.stringify({ novaName: novaName, formInfo: formInfo, appendageFormInfo: appendageFormInfo }),
        success: function (resp) {
          var t = window.vmMap && window.vmMap[novaName]
          if (!t) return
          if (resp.code !== 200) { if (window.$message) window.$message.error(resp.msg || '修改失败'); return }
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
        var item = { field: f.field, value: strVal, type: f.type }
        if (f.type === 'REFERENCE') {
          var refInfo = (target.referenceMap && target.referenceMap[f.field]) || {}
          if (refInfo.referenceField) item.reference = { field: refInfo.referenceField }
        }
        return item
      }).filter(function (item) { return item.value !== '' })
      $.ajax({
        url:         '/nova/table/add',
        method:      'POST',
        contentType: 'application/json',
        data:        JSON.stringify({ novaName: novaName, formInfo: formInfo, appendageFormInfo: appendageFormInfo }),
        success: function (resp) {
          var t = window.vmMap && window.vmMap[novaName]
          if (!t) return
          if (resp.code !== 200) { if (window.$message) window.$message.error(resp.msg || '新增失败'); return }
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
  function onPickerMounted(novaName, vmKey, sourceNovaName, sourceFields) {
    buildTableForKey(novaName, vmKey, sourceNovaName, sourceFields)
  }

  // ── picker 专用 buildTable，用 vmKey 索引而非 novaName ─────────
  function buildTableForKey(novaName, vmKey, sourceNovaName, sourceFields) {
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
        target._sourceNovaName = sourceNovaName || novaName
        target._sourceFields   = sourceFields || {}
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
          if (f.type === 'REFERENCE' || f.type === 'APPENDAGE') form[f.field + '_display'] = ''
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
        if (resp.data.novaIdFieldName) target.novaIdFieldName = resp.data.novaIdFieldName
        loadData(vmKey)
      },
      error: function () {
        console.info('[Nova Picker] build接口未就绪，novaName:', novaName)
      }
    })
  }

  // ── view 模式初始化：/build，数据由 _refCoord 或 rawRow 提供 ───────
  function onViewMounted(novaName, vmKey, rawRow, parentNovaName) {
    if (!novaName || !vmKey) return
    $.ajax({
      url: '/nova/table/build', method: 'POST', contentType: 'application/json',
      data: JSON.stringify({ novaName: novaName }),
      success: function(resp) {
        if (resp.code !== 200) return
        var target = window.vmMap && window.vmMap[vmKey]
        if (!target) return
        var d = resp.data
        target.choiceMap     = d.choice      || {}
        target.tagMap        = d.tag         || {}
        target.dateMap       = d.date        || {}
        target.numberMap     = d.number      || {}
        target.booleanMap    = d.booleanInfo || {}
        target.attachmentMap = d.attachment  || {}
        target.referenceMap  = d.reference   || {}
        target.editLayout    = (d.layout && d.layout.editLayout) || 'DEFAULT'
        var allEdit = d.edit || []
        var fields = allEdit.filter(function(e){ return e.tapType === 'thisForm' }).reduce(function(acc, e){ return acc.concat(e.thisForms || []) }, [])
        target.editFields = fields
        if (d.novaIdFieldName) target.novaIdFieldName = d.novaIdFieldName
        target.formMode = 'edit'
        // 尝试从并行协调状态获取 /details 数据
        var parentVm = parentNovaName && window.vmMap && window.vmMap[parentNovaName]
        var coord = parentVm && parentVm._refCoord && parentVm._refCoord[novaName]
        if (coord) {
          if (coord.data !== null) {
            fillViewFormData(target, coord.data)
          } else {
            coord.buildVmKey = vmKey  // /details 还未回来，登记等候
          }
        } else {
          fillViewFormData(target, rawRow)  // 非 tab 场景直接用 rawRow
        }
      }
    })
  }

  return {
    onMounted, onRouteChange, buildTable, updateTableHeight,
    handleReset, handleAdd, handleEdit, handleDelete,
    handleBatchDelete, handleFormSubmit,
    loadData, onPageChange, onPageSizeChange, onSortChange,
    onPickerMounted, onViewMounted,
    loadReferenceDetails, loadAppendageDetails
  }

})(jQuery)
