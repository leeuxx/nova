// jq/dual/table-appendages.js — 双表视图 APPENDAGES 业务逻辑层
// 接收 hostVm（主表格 Vue 实例）作为首个参数，通过 hostVm.$refs.dualTableRef 访问子组件

window.NovaDualAppendagesJQ = (function () {

  // ── 构建 sourceFields ────────────────────────────────────────────
  // APPENDAGES: key = storageField, value = row[storageField]
  // DRILL:      key = joinColumn,   value = row[column]
  function buildSourceFields(hostVm) {
    const row = hostVm._dualSelectedRow
    if (!row) { hostVm.dualTableSourceFields = {}; return }
    const sub = (hostVm.dualTableSubTables || []).find(s => s.id === hostVm.dualTableCurrentSubId)
    if (!sub) { hostVm.dualTableSourceFields = {}; return }

    // DRILL 类型：key 用 joinColumn，value 用当前行[column]的值
    if (sub.type === 'drill') {
      const drillInfo = sub.fieldInfo || {}
      const column = drillInfo.column
      const joinColumn = drillInfo.joinColumn
      if (!column || !joinColumn) { hostVm.dualTableSourceFields = {}; return }
      const val = row[column]
      if (val == null) { hostVm.dualTableSourceFields = {}; return }
      hostVm.dualTableSourceFields = { [joinColumn]: String(val) }
      return
    }

    // APPENDAGES 类型：key 用 storageField，value 用当前行对应字段值
    const appInfo = sub.fieldInfo || {}
    const storageField = appInfo.storageField
    const val = row[storageField]
    if (val == null) { hostVm.dualTableSourceFields = {}; return }
    hostVm.dualTableSourceFields = { [storageField]: String(val) }
  }

  // ── 应用 sourceFields 到 JQ 层 ─────────────────────────────────
  function applySourceFields(hostVm, target) {
    var embSourceFields = hostVm.dualTableSourceFields || {}
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
    // 未命中 refMap 的 source key 直接作为条件列（drill 的 joinColumn 等）
    sourceKeys.forEach(function(k) {
      if (embSourceFields[k] != null && consumedKeys.indexOf(k) === -1) {
        sourceRefFields.push({ field: k, referenceField: k, value: String(embSourceFields[k]) })
      }
    })
    target._sourceRefFields = sourceRefFields
  }

  // ── 打开双表视图（APPENDAGES 部分）────────────────────────────
  function openView(hostVm, novaName) {
    hostVm.dualTableViewActive = true
    hostVm._dualTableVersion++
    hostVm.dualTableCurrentNova = novaName
    hostVm.dualTableCurrentKey = '__dual_' + novaName + '_v' + hostVm._dualTableVersion
    buildSourceFields(hostVm)
    syncTableClass(hostVm)
  }

  // ── 主表行点击 ─────────────────────────────────────────────────
  function onRowClick(hostVm, row) {
    if (!hostVm.dualTableViewActive) return
    hostVm._dualSelectedRow = row
    var ref = hostVm.$refs.dualTableRef
    if (ref) ref._dualReloading = true
    buildSourceFields(hostVm)
    var self = hostVm
    hostVm.$nextTick(function () {
      var r = self.$refs.dualTableRef
      if (r && r._vmKey) {
        r._dualReloading = false
        var target = window.vmMap && window.vmMap[r._vmKey]
        if (target) {
          applySourceFields(self, target)
          window.NovaTableJQ.loadData(r._vmKey)
        }
      }
    })
  }

  // ── 切换子表 ────────────────────────────────────────────────────
  // subId: 子表条目的唯一标识 (type:novaName)，用于设置 dualTableCurrentSubId
  function onSubChange(hostVm, novaName, subId) {
    hostVm.dualTableCurrentNova = novaName
    if (subId != null) hostVm.dualTableCurrentSubId = subId
    buildSourceFields(hostVm)
    var self = hostVm
    hostVm.$nextTick(function () {
      var r = self.$refs.dualTableRef
      if (r) {
        r._dualReloading = false
        r.reloadDual(novaName, self.dualTableSourceFields)
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
  }

  // ── CSS 类同步 ────────────────────────────────────────────────
  function syncTableClass(hostVm) {
    const el = document.querySelector('.page-content')
    if (el) {
      if (hostVm.dualTableViewActive || hostVm.dualTableClosing) {
        el.classList.add('dual-mode')
      } else {
        el.classList.remove('dual-mode')
      }
    }
  }

  return {
    buildSourceFields: buildSourceFields,
    applySourceFields: applySourceFields,
    openView: openView,
    onRowClick: onRowClick,
    onSubChange: onSubChange,
    syncTableClass: syncTableClass
  }
})()
