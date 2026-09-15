// jq/dual/table-link.js — 双表视图 LINK 业务逻辑层
// 所有函数接收 hostVm（主表格 Vue 实例）作为首个参数

window.NovaDualLinkJQ = (function () {

  // ── 初始化双表 LINK 树 tab ─────────────────────────────────────
  // callback(isTreeMode): 是否为树模式
  function initDualLinkTreeTab(hostVm, callback) {
    const tapNovaName = hostVm.dualTableCurrentNova
    if (!tapNovaName) { if (callback) callback(false); return }

    // 清除之前的双表树状态
    delete hostVm.linkTreeData['__dual__']
    hostVm.linkTreeCheckedKeys['__dual__'] = null
    hostVm.linkTreeDisplayKeys['__dual__'] = null
    hostVm.linkTreeFilteredData['__dual__'] = null

    // linkTabBuild 已由内层 nova-table 的 build 响应回填（applyNow → _dualHost.applyDualLinkBuildResp）
    var build = hostVm.linkTabBuild[tapNovaName]
    if (build && build.linkTarget) {
      if (build.linkTarget.linkTree) {
        // loadLinkTreeData 内部会设置 loading=true
        hostVm.loadLinkTreeData(tapNovaName, { row: hostVm._dualSelectedRow, stateKey: '__dual__' })
        if (callback) callback(true)
      } else {
        if (callback) callback(false)
      }
      return
    }

    // linkTabBuild 尚未就绪：内层 nova-table 仍在 build 中，标记 loading 并等待回填；
    // 不再单独请求 build，由内层响应统一回填，避免同一 novaName 的重复 build 请求
    hostVm.linkTreeLoading['__dual__'] = true
    if (callback) callback(false)
  }

  // ── 提交双表 LINK 树勾选 ──────────────────────────────────────
  function submitDualLinkTree(hostVm) {
    const tapNovaName = hostVm.dualTableCurrentNova
    const build = hostVm.linkTabBuild[tapNovaName]
    if (!build || !build.linkTarget) return

    const lt = build.linkTarget
    const checkedIds = Array.from(hostVm.linkTreeCheckedKeys['__dual__'] || [])

    if (checkedIds.length === 0) {
      if (window.$message) window.$message.warning(window.__t('table.select_at_least_one_node'))
      return
    }

    const sourceField = build.sourceFieldName
    const targetField = build.targetFieldName
    const refField = lt.thisReferenceField
    const storageField = lt.thisStorageField || refField

    if (!sourceField || !targetField) {
      if (window.$message) window.$message.error(window.__t('table.link_param_missing_field'))
      return
    }

    const row = hostVm._dualSelectedRow
    if (!row) {
      if (window.$message) window.$message.error(window.__t('table.select_master_row_first'))
      return
    }
    const sourceValue = row[storageField]
    if (sourceValue == null) {
      if (window.$message) window.$message.error(window.__t('table.link_param_missing_source_id'))
      return
    }

    window.NovaTableJQ_link.handleLinkAdd(
      hostVm.novaName, tapNovaName,
      sourceField, String(sourceValue),
      targetField, checkedIds,
      hostVm._vmKey || hostVm.novaName,
      null
    )
  }

  // ── 双表 LINK 非树模式：打开选择器 ────────────────────────────
  function handleDualLinkAdd(hostVm) {
    var dualVm = hostVm.$refs.dualTableRef
    if (!dualVm) return
    var lt = dualVm.linkTargetInfo || {}
    var targetNova = lt.linkReferenceName
    if (!targetNova) {
      if (window.$message) window.$message.warning(window.__t('table.target_table_not_found'))
      return
    }
    hostVm.linkPickerTargetNova = targetNova
    hostVm.linkPickerCurrentTab = hostVm.dualTableCurrentNova
    hostVm.linkPickerSelectedKeys = []
    hostVm.linkPickerSourceFields = {}
    hostVm.linkPickerTitle = window.__t('table.link_picker_title', { name: hostVm.dualTableCurrentLabel || window.__t('table.link_data') })
    hostVm.linkPickerShow = true
  }

  return {
    initDualLinkTreeTab: initDualLinkTreeTab,
    submitDualLinkTree: submitDualLinkTree,
    handleDualLinkAdd: handleDualLinkAdd
  }
})()
