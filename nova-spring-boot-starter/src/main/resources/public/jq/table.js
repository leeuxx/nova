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
  var _resizeTimer = null
  function onResizeHandler() {
    // resize 期间全部延迟，结束后一次性更新高度和宽度
    clearTimeout(_resizeTimer)
    _resizeTimer = setTimeout(function() {
      updateTableHeight()
      updateTableWidth()
    }, 200)
  }

  function onMounted(novaName) {
    buildTable(novaName)
    // buildTable 完成后会调用 loadData，loadData 在 Vue nextTick 中会调用 safeUpdateTableHeight
    // 延迟 600ms 作为备用检查（给 loadData 足够时间完成）
    setTimeout(updateTableHeight, 600)
    setTimeout(updateTableWidth, 700)
    $(window).on('resize.novaTable', onResizeHandler)
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

  function setBuildLoading(target, val) {
    if (!target) return
    if (val === true) {
      // 整页加载阶段（首屏 boot loading 仍在 DOM）：不显示表格动画，由全屏动画覆盖；点菜单切 tab 时已移除，正常显示
      if (window.__bootLoadingInDom ? window.__bootLoadingInDom() : false) {
        target.buildLoading = false
        // boot 开始淡出（加 hidden 类）时若 build 仍未完成，提前恢复表格 loading 覆盖层，
        // 与全屏动画淡出重叠衔接，避免等 boot 完全移除后出现空白等待
        var iv = setInterval(function () {
          var gone = !(window.__bootLoadingInDom && window.__bootLoadingInDom())
          var fading = window.__bootFadingOut && window.__bootFadingOut()
          if (gone || fading) {
            clearInterval(iv)
            if (target && target._buildPending) {
              target.buildLoading = true
              target._buildLoadingStart = Date.now()
            }
          }
        }, 40)
        return
      }
      target._buildLoadingStart = Date.now()
      target.buildLoading = true
      return
    }
    var remain = window.NovaLoading.minDuration.build - (Date.now() - (target._buildLoadingStart || 0))
    if (remain > 0) {
      setTimeout(function () {
        if (target && target.buildLoading === true) target.buildLoading = false
      }, remain)
    } else {
      target.buildLoading = false
    }
  }

  // 等待首屏 boot loading 从 DOM 移除后再执行回调：整页加载阶段避免 build 接口处理
  // 与表格渲染占用主线程，导致全屏 CSS 动画掉帧（纯静态页不卡，接口页卡就是这个原因）
  function whenBootGone(cb) {
    if (!(window.__bootLoadingInDom && window.__bootLoadingInDom())) { cb(); return }
    var iv = setInterval(function () {
      if (!(window.__bootLoadingInDom && window.__bootLoadingInDom())) {
        clearInterval(iv)
        cb()
      }
    }, 80)
  }

  // 等待"整页 boot loading 移除 且 表格 buildLoading 遮罩关闭"后再执行回调：
  // 动画期间（首屏全屏动画或切 tab 表格加载动画）保持主线程空闲，动画结束后数据已就绪立即渲染
  function whenLoadingDone(target, cb) {
    if (!(window.__bootLoadingInDom && window.__bootLoadingInDom()) && !target.buildLoading) { cb(); return }
    var iv = setInterval(function () {
      if (!(window.__bootLoadingInDom && window.__bootLoadingInDom()) && !target.buildLoading) {
        clearInterval(iv)
        cb()
      }
    }, 80)
  }

  // ── 动态构建查询条件 + 表头列 ─────────────────────────────────
  // vmKey: 可选，embedded 模式下为 '__emb_xxx'；embSourceFields: embedded 模式下预注入的外键条件；sourceNovaName: 父表 novaName
  function buildTable(novaName, vmKey, embSourceFields, sourceNovaName, deferDataLoad) {
    if (!novaName) return
    var key = vmKey || novaName
    var t0 = window.vmMap && window.vmMap[key]
    if (t0) {
      t0._buildPending = true
      setBuildLoading(t0, true)
    }
    var fire = function () {
      window.fetchApi.post('/nova/table/build', { novaName: novaName }, window.__novaMenuCode(novaName)).then(function (resp) {
        var target = window.vmMap && window.vmMap[key]
        if (!target) return
        if (!resp.data) {
          target._buildPending = false
          setBuildLoading(target, false)
          return
        }
        if (target.dualMode) {
          // dual 右表（drill/appendage）：build 完成后遮罩持续到数据渲染完成再关闭，
          // 避免 buildLoading 关闭与 loadData 数据渲染之间的空窗露出空表格（闪一下）
          target._buildLoadingHold = true
        } else {
          setBuildLoading(target, false)
        }
        // 数据应用（设置响应式数据 + 渲染表格）是主线程重活：整页加载阶段延迟到 boot 移除后执行，
        // 避免动画期间掉帧；网络请求已并行完成，数据就绪后立即渲染，不留空表格空窗
        var applyNow = function () {
        target.choiceMap  = resp.data.choice  || {}
        target.tagMap     = resp.data.tag     || {}
        target.dateMap    = resp.data.date    || {}
        target.numberMap  = resp.data.number  || {}
        target.booleanMap = resp.data.booleanInfo || {}
        target.attachmentMap  = resp.data.attachment  || {}
        target.referenceMap   = resp.data.reference   || {}
        target.appendageMap   = resp.data.appendage   || {}
        target.linkMap        = resp.data.link        || {}
        target.drills         = resp.data.drills       || []
        target.linkTargetInfo = resp.data.linkTarget  || {}
        target.rowOperations  = resp.data.rowOperations || []
        target.buttons        = resp.data.buttons      || {}
        target.sysBtnHide     = resp.data.sysBtnHide   || {}
        target.popMap         = resp.data.pops         || {}
        var fields = resp.data.search || []
        // 提取 tapSearch 字段，从 searchFields 中移除
        var tapSearchField = null
        var normalFields = []
        fields.forEach(function(f) {
          if (f.tapSearch) { tapSearchField = f } else { normalFields.push(f) }
        })
        target.tapSearchField = tapSearchField
        // 默认选中：showAll=true 时选"全部"(null)，否则选第一个选项值
        if (tapSearchField) {
          var tsChoiceVals = ((target.choiceMap[tapSearchField.field] || {}).values || [])
          target.tapSearchValue = (tapSearchField.tapSearch && tapSearchField.tapSearch.showAll)
            ? null
            : (tsChoiceVals.length > 0 ? tsChoiceVals[0].value : null)
        } else {
          target.tapSearchValue = null
        }
        target.searchFields = normalFields
        var form = {}
        normalFields.forEach(function (f) {
          var choiceInfo = target.choiceMap[f.field]
          var isMultiChoice = f.type === 'CHOICE' && (choiceInfo && choiceInfo.selectType === 'MULTI' || f.vague)
          var isSingleChoice = f.type === 'CHOICE' && choiceInfo && choiceInfo.selectType === 'SINGLE' && !f.vague
          var isDate = f.type === 'DATE'
          form[f.field] = (isMultiChoice || f.type === 'TAG') ? [] : (f.type === 'NUMBER' && f.vague ? [null, null] : (isSingleChoice || isDate || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : ''))
          if (f.type === 'REFERENCE' || f.type === 'APPENDAGE' || f.type === 'APPENDAGES' || f.type === 'LINK') {
            form[f.field + '_display'] = ''
          }
        })
        target.filterForm = form
        var cols = resp.data.tableColumns || []
        target.tableColumns = cols
        var states = {}
        cols.forEach(function (c) { if (c.sortable) states[c.field] = null })
        target.sortStates = states
        // 嵌套字段（REFERENCE/APPENDAGE 引用子表属性）：收集去重的 refNovaName，
        // 逐个 build 子表并缓存元数据（choice/date/booleanInfo/attachment 等），供渲染规则匹配
        var refNames = []
        cols.forEach(function (c) { if (c.refNovaName && refNames.indexOf(c.refNovaName) === -1) refNames.push(c.refNovaName) })
        target.refBuildMeta = {}
        target.refBuildMetaLoading = {}
        refNames.forEach(function (name) {
          target.refBuildMetaLoading[name] = true
          window.fetchApi.post('/nova/table/build', { novaName: name }, window.__novaMenuCode(name)).then(function (r) {
            var t = window.vmMap && window.vmMap[key]
            if (!t) return
            if (!r.data) {
              var nl0 = Object.assign({}, t.refBuildMetaLoading)
              nl0[name] = false
              t.refBuildMetaLoading = nl0
              return
            }
            var nm = Object.assign({}, t.refBuildMeta)
            nm[name] = r.data
            t.refBuildMeta = nm
            var nl = Object.assign({}, t.refBuildMetaLoading)
            nl[name] = false
            t.refBuildMetaLoading = nl
            // 元数据就绪后重新翻译数据，让嵌套 CHOICE 列按子表元数据翻译 label/颜色
            translateData(key)
          })
        })
        var layout = resp.data.layout || {}
        if (layout.pageSize)  { target.pageSize = layout.pageSize; target.paginationConfig.pageSize = layout.pageSize }
        if (layout.pageSizes) {
          target.pageSizes = layout.pageSizes
          target.paginationConfig.pageSizes = layout.pageSizes.map(function (n) { return { label: n + ' 条/页', value: n } })
        }
        if (layout.editLayout) target.editLayout = layout.editLayout
        var allEdit = resp.data.edit || []
        var refMap = resp.data.reference || {}
        target.editFields = allEdit.filter(function(e) { return e.tapType === 'thisForm' }).reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
        target.editReferenceTabs = allEdit.filter(function(e) { return e.tapType === 'referenceForm' && e.tapShow !== false })
        target.editAppendageTabs = allEdit.filter(function(e) { return e.tapType === 'appendageForm' && e.tapShow !== false })
        target.editExtraTabs = allEdit.filter(function(e) { return (e.tapType === 'referenceForm' || e.tapType === 'appendageForm' || e.tapType === 'appendagesTable' || e.tapType === 'linkForm') && e.tapShow !== false })
        target.editReferenceTabs.forEach(function(tab) {
          if (!tab.tapNovaName) return
          target.editFields.forEach(function(f) {
            if (!tab.tapParamField && f.type === 'REFERENCE' && (refMap[f.field] || {}).referenceName === tab.tapNovaName)
              tab.tapParamField = f.field
          })
        })
        if (resp.data.novaIdFieldName) target.novaIdFieldName = resp.data.novaIdFieldName
        var treeInfo = resp.data.tree || {}
        target.isTree = treeInfo.value === true
        target.treeSearchField = treeInfo.searchField || ''
        target.treeLevel = treeInfo.level != null ? treeInfo.level : 0
        target.treeCascade = treeInfo.cascade === true
        if (treeInfo.sortField && target.sortStates && target.sortStates.hasOwnProperty(treeInfo.sortField)) {
          target.sortStates[treeInfo.sortField] = treeInfo.sortAsc ? 'asc' : 'desc'
        }
        for (var rfKey in refMap) {
          var rf = refMap[rfKey] || {}
          if (rf.isThisObj === true) {
            target.treeParentField = rfKey
            target.treeStorageField = rf.storageField || ''
            break
          }
        }
        if (!target.isTree && target.paginationConfig) {
          target.paginationConfig.showSizePicker = true
          target.paginationConfig.showQuickJumper = true
          target.paginationConfig.showPrev = true
          target.paginationConfig.showNext = true
          target.paginationConfig.showPageSize = true
        }
        target._sourceFields = embSourceFields || {}
        target._sourceNovaName = sourceNovaName || novaName
        // consumedKeys: 记录已被 refMap 匹配消费掉的 sourceField key，
        // 剩余的 key（LINK_TARGET 的 thisReferenceField / drill 的 joinColumn）直接用 key 本身作为条件列
        var consumedKeys = []
        if (embSourceFields && Object.keys(embSourceFields).length > 0) {
          var sourceKeys = Object.keys(embSourceFields)
          var hiddenRefNovas = []
          var sourceRefFields = []
          target.editFields = target.editFields.filter(function(f) {
            if (f.type !== 'REFERENCE') return true
            var refInfo = refMap[f.field] || {}
            // storageField = 引用表的值字段（父表PK），与 sourceFields 的 key 对应
            if (sourceKeys.indexOf(refInfo.storageField) !== -1) {
              hiddenRefNovas.push(refInfo.referenceName)
              consumedKeys.push(refInfo.storageField)
              sourceRefFields.push({ field: f.field, referenceField: refInfo.referenceField, value: embSourceFields[refInfo.storageField] })
              return false
            }
            return true
          })
          // 未命中 refMap 的 source key 直接作为条件列（类型由后端按字段注解适配）
          sourceKeys.forEach(function(k) {
            if (embSourceFields[k] != null && consumedKeys.indexOf(k) === -1) {
              sourceRefFields.push({ field: k, referenceField: k, value: String(embSourceFields[k]) })
            }
          })
          target._sourceRefFields = sourceRefFields
          // 同步过滤搜索条件中的外键 REFERENCE 字段
          target.searchFields = target.searchFields.filter(function(f) {
            if (f.type !== 'REFERENCE') return true
            var refInfo = refMap[f.field] || {}
            return sourceKeys.indexOf(refInfo.storageField) === -1
          })
          // 同步过滤对应的 referenceForm tab
          target.editExtraTabs = target.editExtraTabs.filter(function(tab) {
            return !(tab.tapType === 'referenceForm' && hiddenRefNovas.indexOf(tab.tapNovaName) !== -1)
          })
          target.editReferenceTabs = target.editReferenceTabs.filter(function(tab) {
            return hiddenRefNovas.indexOf(tab.tapNovaName) === -1
          })
        }
        // LINK embedded 模式：子组件 build 完成后，把 linkTarget 等元数据同步到父组件 linkTabBuild
        if (sourceNovaName && resp.data.linkTarget && resp.data.linkTarget.thisReferenceField) {
          var parentVm = window.vmMap && window.vmMap[sourceNovaName]
          if (parentVm && parentVm.linkTabBuild !== undefined) {
            var lt = resp.data.linkTarget
            var ltEditFields = target.editFields || []
            var newBuild = Object.assign({}, parentVm.linkTabBuild)
            newBuild[novaName] = {
              linkTarget: lt,
              sourceFieldName: lt.thisFieldName || '',
              targetFieldName: lt.linkFieldName || '',
              editFields: ltEditFields,
              tableColumns: resp.data.tableColumns || [],
              novaIdFieldName: resp.data.novaIdFieldName,
              choiceMap: resp.data.choice || {},
              referenceMap: resp.data.reference || {},
              linkMap: resp.data.link || {}
            }
            parentVm.linkTabBuild = newBuild
            // linkForm：同步完成后设置 sourceFields，然后 loadData
            if (!deferDataLoad && lt.thisReferenceField && parentVm && parentVm.currentRow) {
              var storageField = lt.thisStorageField || lt.thisReferenceField
              var refVal = parentVm.currentRow[storageField]
              target._sourceFields = refVal != null ? { [lt.thisReferenceField]: String(refVal) } : {}
              var srf = []
              if (refVal != null) {
                srf.push({ field: lt.thisReferenceField, referenceField: lt.thisReferenceField, value: String(refVal) })
              }
              target._sourceRefFields = srf
              loadData(key)
            }
          }
        }
        // 非 linkForm 的 embedded 模式仍走原来的 loadData
        // 注意：LINK 专属路径 (line 202) 仅在 parentVm.currentRow 存在时生效（编辑弹窗）；
        // 双表视图下 currentRow 为 null，需走此 fallback
        if (!deferDataLoad && !(sourceNovaName && resp.data.linkTarget && resp.data.linkTarget.thisReferenceField && parentVm && parentVm.currentRow)) {
          loadData(key)
        }
        }
        // 元数据应用（列头/搜索表单）相对轻量，build 响应后立即执行让数据请求并行拉取；
        // 重活（表格数据渲染）由 loadData 按动画状态（首屏 boot 或切 tab 遮罩）延迟到动画结束，动画期间不掉帧、动画结束不留空表格
        applyNow()
        target._buildPending = false
        // build 响应后容器布局变化（尤其树模式 isTree=true 时容器 height:100%、树搜索 filter-card 才渲染）：
        // mounted/activated 的高度计算早于 build 响应（build 慢时用的是 isTree=false 的错误布局），必须重算，
        // 否则树模式表格高度塌陷
        if (window.Vue && window.Vue.nextTick) window.Vue.nextTick(function () { updateTableHeight() })
        // 表格页面 build 完成 → 结束顶部加载条（仅路由切换后生效，embedded 等无 start 则空操作）
        if (window.__novaPageLoading) window.__novaPageLoading.finish()
      }).catch(function () {
        var target = window.vmMap && window.vmMap[key]
        if (target) {
          target._buildPending = false
          if (target._buildLoadingHold) target._buildLoadingHold = false
          setBuildLoading(target, false)
        }
        if (window.__novaPageLoading) window.__novaPageLoading.finish()
      })
    }
    // build 网络请求立即发出（并行，不占主线程）；响应后的数据应用延迟到 boot 移除后执行
    fire()
  }

  // ── 懒加载 link sub-build（首次打开弹窗时调用）─────────────────
  function buildLinkTabs(novaName, rowData, vmKey) {
    var key = vmKey || novaName
    var target = window.vmMap && window.vmMap[key]
    if (!target) return
    ;(target.editExtraTabs || []).forEach(function(linkTab) {
      if (linkTab.tapType !== 'linkForm' || !linkTab.tapNovaName) return
      var linkNovaName = linkTab.tapNovaName
      window.fetchApi.post('/nova/table/build', { novaName: linkNovaName }, window.__novaMenuCode(linkNovaName)).then(function(br) {
        if (br.code !== 200) return
          var t2 = window.vmMap && window.vmMap[key]
          if (!t2) return
          var bd = br.data
          var editFields = (bd.edit || []).filter(function(e) { return e.tapType === 'thisForm' }).reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
          var lt = bd.linkTarget || {}
          // buildLinkTabs: 构建 linkTab 元数据
          var newBuild = Object.assign({}, t2.linkTabBuild)
          newBuild[linkNovaName] = {
            editFields: editFields,
            tableColumns: bd.tableColumns || [],
            novaIdFieldName: bd.novaIdFieldName,
            linkTarget: lt,
            sourceFieldName: lt.thisFieldName || '',
            targetFieldName: lt.linkFieldName || '',
            choiceMap: bd.choice || {},
            referenceMap: bd.reference || {},
            linkMap: bd.link || {}
          }
          t2.linkTabBuild = newBuild
          var newFds = Object.assign({}, t2.linkFormData)
          newFds[linkNovaName] = { targetIds: [] }
          t2.linkFormData = newFds
      })
    })
  }

  // ── 加载表格数据 ──────────────────────────────────────────────
  // vmKey: vmMap 中的 key（普通表格 = novaName，picker = __picker_xxx）
  function loadData(vmKey) {
    var target = window.vmMap && window.vmMap[vmKey]
    if (!target) return
    target.loading = true
    if (target.isTree) {
      loadTreeData(vmKey)
      return
    }
    // 实际请求后端用的表名，picker 模式下 vmKey 不等于 novaName
    var queryName = target.novaName || vmKey
    // 过滤空值条件，按后端结构组装
    var conditions = {}
    var sourceFields = Object.assign({}, target._sourceFields || {})
    var sourceNovaName = target._sourceNovaName || queryName
    var form = target.filterForm || {}
    var searchFields = target.searchFields || []
    searchFields.forEach(function (fieldDef) {
      var val = form[fieldDef.field]
      if (val === null || val === undefined || val === '') return
      if (Array.isArray(val) && val.every(function(v){ return v === null || v === undefined })) return
      if (Array.isArray(val) && val.length === 0) return
      var arr
      if (fieldDef.type === 'NUMBER' && fieldDef.vague) {
        var lo = (val[0] === null || val[0] === undefined) ? null : String(val[0])
        var hi = (val[1] === null || val[1] === undefined) ? null : String(val[1])
        if (lo === null && hi === null) return
        arr = [lo, hi]
      } else if (Array.isArray(val)) {
        arr = val.map(function(v){ return v === null || v === undefined ? null : String(v) })
      } else {
        arr = [String(val)]
      }
      // 条件值统一为 JSON 数组字符串，后端据此还原标量或 List；元素先转 String（避免数字转科学计数法），空段保留为 null
      var strVal = JSON.stringify(arr)
      // LINK 字段：作为跨表条件放入 conditions；key 即 search 下的字段名，后端据此反查关联表
      if (fieldDef.type === 'LINK') {
        conditions[fieldDef.field] = strVal
        return
      }
      // REFERENCE 字段：使用 referenceField 作为实际查询字段
      var actualField = fieldDef.field
      if (fieldDef.type === 'REFERENCE') {
        var refInfo = (target.referenceMap && target.referenceMap[fieldDef.field]) || {}
        actualField = refInfo.referenceField || refInfo.storageField || fieldDef.field
      }
      // APPENDAGE / APPENDAGES 字段：使用 storageField 作为实际查询字段
      if (fieldDef.type === 'APPENDAGE' || fieldDef.type === 'APPENDAGES') {
        var appInfo = (target.appendageMap && target.appendageMap[fieldDef.field]) || {}
        actualField = appInfo.storageField || fieldDef.field
      }
      // 反向映射字段（APPENDAGE/APPENDAGES 的 by、REFERENCE 的 ref）可能落到同一键：已存在则数组合并
      var existingCond = conditions[actualField]
      if (existingCond) {
        conditions[actualField] = JSON.stringify(JSON.parse(existingCond).concat(arr))
      } else {
        conditions[actualField] = strVal
      }
    })
    var pageBean = {
      current: (target.paginationConfig && target.paginationConfig.page) || 1,
      size:    (target.paginationConfig && target.paginationConfig.pageSize) || 10,
      orders:  buildOrderItems(target.sortStates)
    }
    target.loading = true
    // tapSearch 字段：注入 tab 选中值到 conditions
    var tsf = target.tapSearchField
    if (tsf && target.tapSearchValue != null) {
      conditions[tsf.field] = JSON.stringify([String(target.tapSearchValue)])
    }
    // embedded 模式：把 _sourceRefFields 中的 referenceField 注入 conditions
    var sourceRefFields = target._sourceRefFields || []
    sourceRefFields.forEach(function(rf) {
      if (rf.referenceField && rf.value != null && rf.value !== '') {
        conditions[rf.referenceField] = JSON.stringify([String(rf.value)])
      }
    })
    window.fetchApi.post('/nova/table/data', { novaName: queryName, sourceNovaName: sourceNovaName, sourceFields: sourceFields, pageBean: pageBean, conditions: conditions }, window.__novaMenuCode(queryName)).then(function (resp) {
      var t = window.vmMap && window.vmMap[vmKey]
      if (!t) return
      // 动画期间（首屏 boot 或切 tab 表格加载动画）保持主线程空闲：
      // 数据响应延迟到动画结束（boot 移除且遮罩关闭）后应用，数据已提前并行拉取，动画结束立即渲染不留空表格
      // dual 右表 build 遮罩持续期间（_buildLoadingHold）不延迟：遮罩正是为衔接数据渲染而保持，数据就绪立即应用并关闭遮罩
      if ((window.__bootLoadingInDom && window.__bootLoadingInDom()) || (t.buildLoading && !t._buildLoadingHold)) {
        t._pendingDataResp = resp
        whenLoadingDone(t, function () {
          var tt = window.vmMap && window.vmMap[vmKey]
          if (tt && tt._pendingDataResp) {
            var r = tt._pendingDataResp
            tt._pendingDataResp = null
            applyDataResp(vmKey, r, pageBean)
          }
        })
        return
      }
      applyDataResp(vmKey, resp, pageBean)
    }).catch(function () {
      var t2 = window.vmMap && window.vmMap[vmKey]
      if (t2) {
        t2.loading = false
        if (t2._buildLoadingHold) {
          t2._buildLoadingHold = false
          setBuildLoading(t2, false)
        }
      }
    })
  }

  // 应用表格数据响应：设置表格数据 + 翻译，触发 Vue 渲染
  function applyDataResp(vmKey, resp, pageBean) {
    var t = window.vmMap && window.vmMap[vmKey]
    if (!t) return
    t.loading = false
    t.expandedRowKeys = []
    t.treeLoadingKeys = []
    var records = resp.data.records || []
    t.tableData                    = records
    t.rawTableData                 = resp.data.records    || []
    t.paginationConfig.itemCount   = resp.data.total      || 0
    t.paginationConfig.page        = resp.data.current    || pageBean.current
    t.paginationConfig.pageSize    = resp.data.size       || pageBean.size
    if (resp.data.novaIdFieldName)     t.novaIdFieldName          = resp.data.novaIdFieldName
    translateData(vmKey)
    // dual 右表 build 遮罩持续标记：数据已渲染，关闭遮罩，无缝衔接不露空表格
    if (t._buildLoadingHold) {
      t._buildLoadingHold = false
      setBuildLoading(t, false)
    }
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
  }

  function updateTableWidth() {
    var $wrapper = $('#table-wrapper')
    if (!$wrapper.length) return
    var activeVm = window.vmMap && window.vmMap[window.activeNovaName]
    if (activeVm) activeVm.tableWrapperWidth = $wrapper[0].clientWidth
  }

  // ── 翻译 CHOICE 类型列 ────────────────────────────────────────
  // 翻译 CHOICE + REFERENCE + APPENDAGE，返回新数组，不修改原对象
  function translateRecords(records, tableColumns, choiceMap, referenceMap, appendageMap, refBuildMeta) {
    if (!records || records.length === 0) return records
    var result = records
    choiceMap = choiceMap || {}
    referenceMap = referenceMap || {}
    appendageMap = appendageMap || {}
    refBuildMeta = refBuildMeta || {}

    // 合并子表元数据中的 choice（refNovaName 嵌套字段，按 col.field 归入查找表）
    var choiceMapFull = {}
    for (var fk0 in choiceMap) if (choiceMap.hasOwnProperty(fk0)) choiceMapFull[fk0] = choiceMap[fk0]
    ;(tableColumns || []).forEach(function (c) {
      if (c.type !== 'CHOICE' || !c.refNovaName || !refBuildMeta[c.refNovaName]) return
      var sm = refBuildMeta[c.refNovaName]
      var di = c.field.indexOf('.')
      var pk = di > -1 ? c.field.slice(di + 1) : c.field
      var ci = (sm.choice || {})[pk]
      if (ci) choiceMapFull[c.field] = ci
    })

    // CHOICE 翻译
    var choiceCols = (tableColumns || []).filter(function (c) { return c.type === 'CHOICE' })
    if (choiceCols.length > 0) {
      // 构建 value→color 查找表
      var colorLookups = {}
      for (var fk in choiceMapFull) {
        if (choiceMapFull.hasOwnProperty(fk)) {
          var cl = {}
          ;(choiceMapFull[fk].values || []).forEach(function (v) { if (v.color) cl[v.value] = v.color })
          if (Object.keys(cl).length > 0) colorLookups[fk] = cl
        }
      }
      var localLookups = {}
      for (var fkk in choiceMapFull) {
        if (choiceMapFull.hasOwnProperty(fkk)) {
          var lookup = {}
          ;(choiceMapFull[fkk].values || []).forEach(function (v) { lookup[v.value] = v.label })
          localLookups[fkk] = lookup
        }
      }
      result = result.map(function (row) {
        var updated = $.extend({}, row)
        var colors = {}
        choiceCols.forEach(function (col) {
          var lk = localLookups[col.field]
          if (!lk) return
          var isMulti = choiceMapFull[col.field] && choiceMapFull[col.field].selectType === 'MULTI'
          // 嵌套字段（如 "testDemo2View.status"）：从行数据的嵌套对象中取值
          var raw
          var dotIdx = col.field.indexOf('.')
          if (dotIdx > -1) {
            var base = col.field.slice(0, dotIdx)
            var propKey = col.field.slice(dotIdx + 1)
            var nestedObj = row[base]
            raw = (nestedObj && typeof nestedObj === 'object' && nestedObj[propKey] !== undefined && nestedObj[propKey] !== null)
              ? String(nestedObj[propKey]) : ''
          } else {
            raw = (row[col.field] === null || row[col.field] === undefined) ? '' : String(row[col.field])
          }
          if (!raw) return
          updated[col.field] = isMulti
            ? raw.split(',').map(function (v) { return lk[v.trim()] || v.trim() }).join(',')
            : (lk[raw] || raw)
          // 计算颜色（取第一个有颜色的值）
          var clk = colorLookups[col.field]
          if (clk) {
            colors[col.field] = isMulti
              ? (raw ? raw.split(',').map(function (v) { return clk[v.trim()] || null }) : [])
              : (clk[raw] || null)
          }
        })
        if (Object.keys(colors).length > 0) updated._colors = colors
        return updated
      })
    }

    // REFERENCE + APPENDAGE 翻译
    var refCols = (tableColumns || []).filter(function (col) {
      return col.type === 'REFERENCE' || col.type === 'APPENDAGE'
    })
    if (refCols.length > 0) {
      result = result.map(function (row) {
        var updated = $.extend({}, row)
        refCols.forEach(function (col) {
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
            propKey = referenceMap[refKey] && referenceMap[refKey].displayField
          } else {
            var ai = appendageMap[refKey]
            propKey = ai && ai.displayField
          }
          var val = nestedObj[propKey]
          updated[col.field + '_display'] = (val !== null && val !== undefined) ? val : ''
        })
        return updated
      })
    }
    return result
  }

  function translateData(vmKey) {
    var target = window.vmMap && window.vmMap[vmKey]
    if (!target) return
    var records = target.tableData
    if (!records || records.length === 0) return

    target.tableData = translateRecords(
      target.tableData,
      target.tableColumns,
      target.choiceMap,
      target.referenceMap,
      target.appendageMap,
      target.refBuildMeta
    )
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
      // REFERENCE / APPENDAGE / LINK 字段重置 _display 字段
      if (f.type === 'REFERENCE' || f.type === 'APPENDAGE' || f.type === 'APPENDAGES' || f.type === 'LINK') {
        form[f.field + '_display'] = ''
      }
    })
    target.filterForm = form
    target.paginationConfig.page = 1
  }

  // ── 打开新增弹窗 ──────────────────────────────────────────────
  function handleAdd(vmKey) {
    var target = vmKey ? (window.vmMap && window.vmMap[vmKey]) : vm()
    if (!target) return
    var formData = window.NovaTableJQ_form.initFormData(
      target.editFields || [],
      target.choiceMap || {},
      target._sourceFields || {}
    )
    target.currentRow              = null
    target.rawDetailRow           = null
    // appendageDetailsLoaded 需清空：让切换 tab 时能按需重新请求 /details
    target.appendageDetailsLoaded  = {}
    target.formMode                = 'add'
    target.formData   = formData
    target.formErrors = {}
    var appFds = {}
    var appBuild = target.appendageTabBuild || {}
    ;(target.editAppendageTabs || []).forEach(function(appTab) {
      var bd = appBuild[appTab.tapNovaName] || {}
      var fd = {}
      var cm = bd.choiceMap || {}
      ;(bd.editFields || []).forEach(function(f) {
        var dv = window.NovaTableJQ_form.convertDefaultValue(f, cm)
        if (dv !== undefined) {
          fd[f.field] = dv
          if (f.type === 'REFERENCE') fd[f.field + '_display'] = ''
          return
        }
        var ci = cm[f.field]
        var isMulti = f.type === 'CHOICE' && ci && ci.selectType === 'MULTI'
        var isSingle = f.type === 'CHOICE' && ci && ci.selectType === 'SINGLE'
        fd[f.field] = (isMulti || f.type === 'TAG' || f.type === 'ATTACHMENT') ? [] : (isSingle || f.type === 'DATE' || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : '')
        if (f.type === 'REFERENCE') fd[f.field + '_display'] = ''
      })
      appFds[appTab.tapNovaName] = fd
    })
    target.appendageFormData   = appFds
    target.appendageFormErrors = {}
    target.linkFormData  = {}
    target.linkTabBuild  = {}
    target.formTab    = 'form'
    // 立即：APPENDAGE /build + APPENDAGE /details（编辑弹窗里）
    window.NovaTableJQ_app.buildAppendageTabs(target.novaName, null, vmKey)
    // linkForm / referenceForm / appendagesTable 改为点击 tab 后由子 nova-table 自行 /build
    target.showForm   = true
  }

  // ── 打开编辑弹窗 ──────────────────────────────────────────────
  function handleEdit(row, vmKey) {
    var target = vmKey ? (window.vmMap && window.vmMap[vmKey]) : vm()
    if (!target) return
    var novaName = target.novaName
    var novaIdField = target.novaIdFieldName
    var pkVal = String(row[novaIdField])

    window.fetchApi.post('/nova/table/details', { novaName: novaName, storageFieldValue: pkVal }).then(function(resp) {
        var t = vmKey ? (window.vmMap && window.vmMap[vmKey]) : (window.vmMap && window.vmMap[novaName])
        if (!t) return
        var detailRow = resp.data
        if (!detailRow) return

        var source = window.NovaTableJQ_form.mapDetailToFormData(
          detailRow,
          t.editFields || [],
          t.choiceMap || {},
          t.referenceMap || {},
          { [novaIdField]: pkVal }
        )

        t.currentRow            = $.extend({}, source)
        t.rawDetailRow         = detailRow
        // appendageDetailsLoaded 需清空：让切换 tab 时能按需重新请求 /details
        t.appendageDetailsLoaded = {}
        t.formMode              = 'edit'
        t.formData   = $.extend({}, source)
        t.formErrors = {}
        t.linkFormData     = {}
        // 保留双表面板状态和所有子表构建数据（双表视图需要 linkTabBuild[novaName]，不是 linkTabBuild['__dual__']）
        ;['linkTreeData','linkTreeFilteredData','linkTreeDefaultExpandedKeys',
          'linkTreeExpandedKeys','linkTreeCheckedKeys','linkTreeDisplayKeys',
          'linkTreeLoading','linkTreeSearchKeyword','linkTreeNodeMap'].forEach(function(p) {
          var d = t[p]['__dual__']
          t[p] = {}
          if (d !== undefined) t[p]['__dual__'] = d
        })
        // 保存所有子表构建数据（key 不是 '__dual__'）
        var savedSubBuilds = {}
        for (var key in t.linkTabBuild) {
          if (key !== '__dual__') savedSubBuilds[key] = t.linkTabBuild[key]
        }
        // 清空 linkTabBuild
        t.linkTabBuild = {}
        // 恢复子表构建数据
        for (var key in savedSubBuilds) {
          t.linkTabBuild[key] = savedSubBuilds[key]
        }
        t.formTab    = 'form'
        // 立即：当前 nova /details + APPENDAGE /build + APPENDAGE /details
        window.NovaTableJQ_app.buildAppendageTabs(novaName, detailRow, vmKey)
        // LINK 的 build 改为点击 tab 后由 onFormTabChange 触发
        t.showForm   = true
      })
  }

  // ── 删除单条 ──────────────────────────────────────────────────
  function handleDelete(row, vmKey) {
    var target = vmKey ? (window.vmMap && window.vmMap[vmKey]) : vm()
    if (!target) return
    var novaIdField = target.novaIdFieldName
    doDelete(target.novaName, novaIdField, [String(row[novaIdField])], vmKey)
  }

  // ── 批量删除 ──────────────────────────────────────────────────
  function handleBatchDelete(vmKey) {
    var target = vmKey ? (window.vmMap && window.vmMap[vmKey]) : vm()
    if (!target) return
    var novaIdField = target.novaIdFieldName
    var keys = target.checkedRowKeys.map(function (k) { return String(k) })
    window.modal.confirm('确定删除选中的 ' + keys.length + ' 条数据吗？', {
      title: '确认删除',
      onConfirm: function () {
        doDelete(target.novaName, novaIdField, keys, vmKey)
      }
    })
  }

  // ── 删除公共逻辑 ──────────────────────────────────────────────
  function doDelete(novaName, novaIdFieldName, novaIdValues, vmKey) {
    window.fetchApi.post('/nova/table/delete', { novaName: novaName, novaIdFieldName: novaIdFieldName, novaIdValues: novaIdValues }).then(function (resp) {
      var t = vmKey ? (window.vmMap && window.vmMap[vmKey]) : (window.vmMap && window.vmMap[novaName])
      if (!t) return
      t.checkedRowKeys = []
      if (window.$message) window.$message.success('删除成功')
      loadData(vmKey || novaName)
    }).catch(function () {
      console.info('[Nova] delete接口请求失败，novaName:', novaName)
    })
  }

  // ── 校验 appendage 表单必填项 ──────────────────────────────────
  function validateAppendageForms(target) {
    var appErrors = {}
    var firstErrAppTab = null
    var formData = target.formData || {}
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
    return { appErrors: appErrors, firstErrAppTab: firstErrAppTab }
  }

  // ── 序列化 appendage 表单数据为提交格式 ──────────────────────────
  function buildAppendageFormInfo(target) {
    var appendageFormInfo = {}
    var formData = target.formData || {}
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
    return appendageFormInfo
  }

  // ── 提交表单 ──────────────────────────────────────────────────
  function handleFormSubmit(vmKey) {
    var target     = vmKey ? (window.vmMap && window.vmMap[vmKey]) : vm()
    var formData   = target.formData
    var editFields = target.editFields || []
    var errors = window.NovaTableJQ_form.validateThisForm(editFields, target.visibleEditFields || [], formData)
    target.formErrors = errors
    if (Object.keys(errors).length > 0) { target.formTab = 'form'; return }

    // 校验附属表单
    var appResult = validateAppendageForms(target)
    target.appendageFormErrors = Object.assign({}, target.appendageFormErrors, appResult.appErrors)
    if (appResult.firstErrAppTab) { target.formTab = 'app_' + appResult.firstErrAppTab; return }

    // 组装附属表单数据
    var appendageFormInfo = buildAppendageFormInfo(target)
    if (target.currentRow) {
      // 编辑
      var novaName = target.novaName
      var novaIdField = target.novaIdFieldName
      var pkValue = String(target.currentRow[novaIdField])
      var formInfo = window.NovaTableJQ_form.buildFormInfo(editFields, formData, target.referenceMap, {
        currentRow: target.currentRow,
        novaIdField: novaIdField,
        sourceRefFields: target._sourceRefFields || []
      })
      window.fetchApi.post('/nova/table/update', { novaName: novaName, formInfo: formInfo, appendageFormInfo: appendageFormInfo }).then(function (resp) {
        var t = vmKey ? (window.vmMap && window.vmMap[vmKey]) : (window.vmMap && window.vmMap[novaName])
        if (!t) return
        t.showForm = false
        if (window.$message) window.$message.success('修改成功')
        loadData(vmKey || novaName)
      }).catch(function () {
        console.info('[Nova] update接口请求失败，novaName:', novaName)
      })
    } else {
      // 新增
      var novaName = target.novaName
      var formInfo = window.NovaTableJQ_form.buildFormInfo(editFields, formData, target.referenceMap, {
        skipEmpty: true,
        sourceRefFields: target._sourceRefFields || []
      })
      window.fetchApi.post('/nova/table/add', { novaName: novaName, formInfo: formInfo, appendageFormInfo: appendageFormInfo }).then(function (resp) {
        var t = vmKey ? (window.vmMap && window.vmMap[vmKey]) : (window.vmMap && window.vmMap[novaName])
        if (!t) return
        t.showForm = false
        if (window.$message) window.$message.success('新增成功')
        loadData(vmKey || novaName)
      }).catch(function () {
        console.info('[Nova] add接口请求失败，novaName:', novaName)
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
    var t0 = window.vmMap && window.vmMap[vmKey]
    if (t0) setBuildLoading(t0, true)
    window.fetchApi.post('/nova/table/build', { novaName: novaName }, window.__novaMenuCode(novaName)).then(function (resp) {
        var target = window.vmMap && window.vmMap[vmKey]
        if (!target) return
        if (!resp.data) {
          setBuildLoading(target, false)
          return
        }
        setBuildLoading(target, false)
        target._sourceNovaName = sourceNovaName || novaName
        target._sourceFields   = sourceFields || {}
        target.choiceMap     = resp.data.choice      || {}
        target.tagMap        = resp.data.tag         || {}
        target.dateMap       = resp.data.date        || {}
        target.numberMap     = resp.data.number      || {}
        target.booleanMap    = resp.data.booleanInfo || {}
        target.attachmentMap = resp.data.attachment  || {}
        target.referenceMap  = resp.data.reference   || {}
        target.appendageMap  = resp.data.appendage   || {}
        target.linkMap       = resp.data.link        || {}
        target.drillMap      = resp.data.drill       || {}
        var fields = resp.data.search || []
        target.searchFields = fields
        var form = {}
        fields.forEach(function (f) {
          var choiceInfo = target.choiceMap[f.field]
          var isMultiChoice = f.type === 'CHOICE' && (choiceInfo && choiceInfo.selectType === 'MULTI' || f.vague)
          var isSingleChoice = f.type === 'CHOICE' && choiceInfo && choiceInfo.selectType === 'SINGLE' && !f.vague
          var isDate = f.type === 'DATE'
          form[f.field] = (isMultiChoice || f.type === 'TAG') ? [] : (f.type === 'NUMBER' && f.vague ? [null, null] : (isSingleChoice || isDate || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : ''))
          if (f.type === 'REFERENCE' || f.type === 'APPENDAGE' || f.type === 'LINK') form[f.field + '_display'] = ''
        })
        target.filterForm = form
        var cols = resp.data.tableColumns || []
        target.tableColumns = cols
        var states = {}
        cols.forEach(function (c) { if (c.sortable) states[c.field] = null })
        target.sortStates = states
        // 嵌套字段：收集去重的 refNovaName 并 build 子表缓存元数据（与主表一致）
        var refNames = []
        cols.forEach(function (c) { if (c.refNovaName && refNames.indexOf(c.refNovaName) === -1) refNames.push(c.refNovaName) })
        target.refBuildMeta = {}
        target.refBuildMetaLoading = {}
        refNames.forEach(function (name) {
          target.refBuildMetaLoading[name] = true
          window.fetchApi.post('/nova/table/build', { novaName: name }, window.__novaMenuCode(name)).then(function (r) {
            var t = window.vmMap && window.vmMap[vmKey]
            if (!t) return
            if (!r.data) {
              var nl0 = Object.assign({}, t.refBuildMetaLoading)
              nl0[name] = false
              t.refBuildMetaLoading = nl0
              return
            }
            var nm = Object.assign({}, t.refBuildMeta)
            nm[name] = r.data
            t.refBuildMeta = nm
            var nl = Object.assign({}, t.refBuildMetaLoading)
            nl[name] = false
            t.refBuildMetaLoading = nl
            translateData(vmKey)
          })
        })
        var layout = resp.data.layout || {}
        if (layout.pageSize)  { target.pageSize = layout.pageSize; target.paginationConfig.pageSize = layout.pageSize }
        if (layout.pageSizes) {
          target.pageSizes = layout.pageSizes
          target.paginationConfig.pageSizes = layout.pageSizes.map(function (n) { return { label: n + ' 条/页', value: n } })
        }
        if (resp.data.novaIdFieldName) target.novaIdFieldName = resp.data.novaIdFieldName
        var treeInfo = resp.data.tree || {}
        target.isTree = treeInfo.value === true
        target.treeSearchField = treeInfo.searchField || ''
        target.treeLevel = treeInfo.level != null ? treeInfo.level : 0
        target.treeCascade = treeInfo.cascade === true
        if (treeInfo.sortField && target.sortStates && target.sortStates.hasOwnProperty(treeInfo.sortField)) {
          target.sortStates[treeInfo.sortField] = treeInfo.sortAsc ? 'asc' : 'desc'
        }
        var refMap2 = resp.data.reference || {}
        for (var rfKey in refMap2) {
          var rf = refMap2[rfKey] || {}
          if (rf.isThisObj === true) {
            target.treeParentField = rfKey
            target.treeStorageField = rf.storageField || ''
            break
          }
        }
        loadData(vmKey)
      }).catch(function () {
        var target = window.vmMap && window.vmMap[vmKey]
        if (target) setBuildLoading(target, false)
      })
  }

  // ── view 模式：从 rawRow 填充 target.formData ───────────────────
  function fillViewFormData(target, rawRow) {
    var editFields = target.editFields || []
    var choiceMap = target.choiceMap || {}
    var referenceMap = target.referenceMap || {}
    var fd = {}
    editFields.forEach(function(f) {
      var val = rawRow[f.field]
      var choice = choiceMap[f.field]
      if (choice && choice.selectType === 'MULTI') {
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
        var refInfo = referenceMap[f.field] || {}
        var sf = refInfo.storageField
        fd[f.field] = (val && typeof val === 'object')
          ? (sf && val[sf] !== undefined && val[sf] !== null ? String(val[sf]) : null)
          : (val !== null && val !== undefined && val !== '' ? String(val) : null)
        fd[f.field + '_display'] = (val && typeof val === 'object' && refInfo.displayField)
          ? (val[refInfo.displayField] != null ? String(val[refInfo.displayField]) : '') : ''
      } else {
        fd[f.field] = (val === null || val === undefined) ? '' : val
      }
    })
    target.formData = fd
  }

  // ── view 模式初始化：/build，直接填充 rawRow ────────────────────
  function onViewMounted(novaName, vmKey, rawRow, parentNovaName) {
    if (!novaName || !vmKey) return
    var t0 = window.vmMap && window.vmMap[vmKey]
    if (t0) setBuildLoading(t0, true)
    window.fetchApi.post('/nova/table/build', { novaName: novaName }, window.__novaMenuCode(novaName)).then(function(resp) {
      var target = window.vmMap && window.vmMap[vmKey]
      if (!target) return
      var d = resp.data
      if (!d) {
        setBuildLoading(target, false)
        return
      }
      setBuildLoading(target, false)
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
      // 直接填充 viewRow 数据（referenceForm 已由 NovaRefForm 子组件自行加载）
      fillViewFormData(target, rawRow)
    }).catch(function () {
      var target = window.vmMap && window.vmMap[vmKey]
      if (target) setBuildLoading(target, false)
    })
  }

  // ── embedded 模式初始化（嵌入在父表编辑弹窗的 tab 里）──────────
  function onEmbeddedMounted(novaName, vmKey, sourceNovaName, sourceFields, deferDataLoad) {
    buildTable(novaName, vmKey, sourceFields || {}, sourceNovaName, deferDataLoad)
  }

  // ── 树形表格：加载全量树数据 ──────────────────────────────────
  function loadTreeData(vmKey) {
    var target = window.vmMap && window.vmMap[vmKey]
    if (!target) return
    var queryName = target.novaName || vmKey
    var sourceFields = Object.assign({}, target._sourceFields || {})
    var sourceNovaName = target._sourceNovaName || queryName
    target.loading = true
    window.fetchApi.post('/nova/table/tree', { novaName: queryName, sourceNovaName: sourceNovaName, sourceFields: sourceFields, orders: buildOrderItems(target.sortStates) }, window.__novaMenuCode(queryName)).then(function(resp) {
      var t = window.vmMap && window.vmMap[vmKey]
      if (!t) return
      // 动画期间（首屏 boot 或切 tab 表格加载动画）保持主线程空闲：
      // 树数据响应延迟到动画结束（boot 移除且遮罩关闭）后应用，与普通表 data 接口一致，动画期间不掉帧
      // dual 右表 build 遮罩持续期间（_buildLoadingHold）不延迟：遮罩为衔接数据渲染而保持，数据就绪立即应用并关闭遮罩
      if ((window.__bootLoadingInDom && window.__bootLoadingInDom()) || (t.buildLoading && !t._buildLoadingHold)) {
        t._pendingTreeResp = resp
        whenLoadingDone(t, function () {
          var tt = window.vmMap && window.vmMap[vmKey]
          if (tt && tt._pendingTreeResp) {
            var r = tt._pendingTreeResp
            tt._pendingTreeResp = null
            applyTreeDataResp(vmKey, r)
          }
        })
        return
      }
      applyTreeDataResp(vmKey, resp)
    }).catch(function() {
        var t = window.vmMap && window.vmMap[vmKey]
        if (t) {
          t.loading = false
          if (t._buildLoadingHold) {
            t._buildLoadingHold = false
            setBuildLoading(t, false)
          }
        }
      })
  }

  // ── 应用树表响应：翻译 + 构建树结构 + 计算展开 keys，触发 Vue 渲染 ──
  function applyTreeDataResp(vmKey, resp) {
    var t = window.vmMap && window.vmMap[vmKey]
    if (!t) return
    t.loading = false
    t.treeSearchHitKeys = new Set()
    var data = resp.data || {}
    var rootList = data.rootList || []
    var childrenList = data.childrenList || []
    var records = rootList.concat(childrenList)
    records = translateRecords(records, t.tableColumns, t.choiceMap, t.referenceMap, t.appendageMap, t.refBuildMeta)
    t.rawTreeData = records
    buildTreeData(t, records)
    t.treeSearchKeyword = ''
    t.expandedRowKeys = computeExpandKeysByLevel(t.tableData, t.treeLevel || 0, t.novaIdFieldName)
    t.treeLoadingKeys = []
    // 树数据渲染后重新计算表格高度（filter-card + 树行数变化，flex-height 表格依赖正确容器高度）
    if (window.Vue && window.Vue.nextTick) window.Vue.nextTick(function () { updateTableHeight() })
    // dual 右表 build 遮罩持续标记：树数据已渲染，关闭遮罩
    if (t._buildLoadingHold) {
      t._buildLoadingHold = false
      setBuildLoading(t, false)
    }
  }

  // ── 根据 treeLevel 计算初始展开的节点 key ──────────────────
  function computeExpandKeysByLevel(treeData, level, pkField) {
    if (!level || level <= 0 || !treeData || !treeData.length) return []
    var keys = []
    function walk(nodes, depth) {
      if (depth >= level) return
      nodes.forEach(function(node) {
        if (node.children && node.children.length > 0) {
          keys.push(String(node[pkField]))
          walk(node.children, depth + 1)
        }
      })
    }
    walk(treeData, 0)
    return keys
  }

  // ── 构建树结构数据 ──────────────────────────────────────────────
  function buildTreeData(t, records) {
    var pk = t.novaIdFieldName
    var parentField = t.treeParentField
    var storageField = t.treeStorageField
    var getParentId = function(node) {
      var parent = node[parentField]
      if (parent == null || parent === '') return null
      if (typeof parent === 'object') {
        return parent[storageField]
      }
      return parent
    }
    var nodeMap = {}
    var parentMap = {}
    records.forEach(function(node) {
      var nodeKey = String(node[pk])
      nodeMap[nodeKey] = node
      node.children = []
      var parentId = getParentId(node)
      if (parentId != null && parentId !== '') {
        var parentKey = String(parentId)
        if (!parentMap[parentKey]) parentMap[parentKey] = []
        parentMap[parentKey].push(node)
      }
    })
    records.forEach(function(node) {
      var nodeKey = String(node[pk])
      var children = parentMap[nodeKey] || []
      children.sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0) })
      node.children = children
    })
    var treeData = records.filter(function(node) {
      var parentId = getParentId(node)
      return parentId === null || parentId === undefined || parentId === ''
    })
    treeData.sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0) })
    t.treeNodeMap = nodeMap
    t.treeParentMap = parentMap
    t.tableData = treeData
    if (t.paginationConfig) {
      t.paginationConfig.itemCount = records.length
      t.paginationConfig.page = 1
      t.paginationConfig.pageSize = records.length > 0 ? records.length : 1
      t.paginationConfig.showSizePicker = false
      t.paginationConfig.showQuickJumper = false
      t.paginationConfig.showPrev = false
      t.paginationConfig.showNext = false
      t.paginationConfig.showPageSize = false
    }
  }

  return {
    onMounted, onRouteChange, buildTable, updateTableHeight, updateTableWidth,
    handleReset, handleAdd, handleEdit, handleDelete,
    handleBatchDelete, handleFormSubmit,
    loadData, onPageChange, onPageSizeChange, onSortChange,
    onPickerMounted, onViewMounted, onEmbeddedMounted,
    // loadAppendageDetails — 已移至 NovaTableJQ_app
    // handleLinkAdd — 已移至 NovaTableJQ_link
    buildLinkTabs, loadTreeData, whenBootGone
  }

})(jQuery)
