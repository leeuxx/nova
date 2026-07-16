// jq/dual/table-appendages.js — 双表视图 APPENDAGES 业务逻辑层
// 接收 hostVm（主表格 Vue 实例）作为首个参数，通过 hostVm.$refs.dualTableRef 访问子组件

window.NovaDualAppendagesJQ = (function () {

  // ── 构建 APPENDAGES 的 sourceFields ─────────────────────────────
  function buildSourceFields(hostVm) {
    const row = hostVm._dualSelectedRow
    if (!row) { hostVm.dualTableSourceFields = {}; return }
    const sub = (hostVm.dualTableSubTables || []).find(s => s.novaName === hostVm.dualTableCurrentNova)
    if (!sub) { hostVm.dualTableSourceFields = {}; return }
    const appInfo = sub.fieldInfo || {}
    const storageField = appInfo.storageField || 'id'
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
    if (sourceKeys.length > 0) {
      var refMap = target.referenceMap || {}
      for (var field in refMap) {
        var refInfo = refMap[field]
        if (refInfo.storageField && sourceKeys.indexOf(refInfo.storageField) !== -1) {
          sourceRefFields.push({ field: field, type: 'REFERENCE', referenceField: refInfo.referenceField || 'id', value: embSourceFields[refInfo.storageField] })
        }
      }
    }
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
  function onSubChange(hostVm, novaName) {
    hostVm.dualTableCurrentNova = novaName
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
