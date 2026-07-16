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

    // 需要先加载 build
    hostVm.linkTreeLoading['__dual__'] = true
    var self = hostVm
    $.ajax({
      url: '/nova/table/build',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ novaName: tapNovaName }),
      success: function(resp) {
        if (resp.code !== 200) {
          hostVm.linkTreeLoading['__dual__'] = false
          if (callback) callback(false)
          return
        }
        var bd = resp.data || {}
        var lt = bd.linkTarget || {}
        var ltEditFields = (bd.edit || []).filter(function(e) { return e.tapType === 'thisForm' }).reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
        var newBuild = Object.assign({}, hostVm.linkTabBuild)
        newBuild[tapNovaName] = {
          linkTarget: lt,
          sourceFieldName: lt.thisFieldName || '',
          targetFieldName: lt.linkFieldName || '',
          editFields: ltEditFields,
          tableColumns: bd.tableColumns || [],
          novaIdFieldName: bd.novaIdFieldName,
          choiceMap: bd.choice || {},
          referenceMap: bd.reference || {},
          linkMap: bd.link || {}
        }
        hostVm.linkTabBuild = newBuild
        hostVm.linkTreeLoading['__dual__'] = false
        if (lt.linkTree) {
          hostVm.loadLinkTreeData(tapNovaName, { row: hostVm._dualSelectedRow, stateKey: '__dual__' })
          if (callback) callback(true)
        } else {
          if (callback) callback(false)
        }
      },
      error: function() {
        hostVm.linkTreeLoading['__dual__'] = false
        if (callback) callback(false)
      }
    })
  }

  // ── 提交双表 LINK 树勾选 ──────────────────────────────────────
  function submitDualLinkTree(hostVm) {
    const tapNovaName = hostVm.dualTableCurrentNova
    const build = hostVm.linkTabBuild[tapNovaName]
    if (!build || !build.linkTarget) return

    const lt = build.linkTarget
    const checkedIds = Array.from(hostVm.linkTreeCheckedKeys['__dual__'] || [])

    if (checkedIds.length === 0) {
      if (window.$message) window.$message.warning('请至少选择一个节点')
      return
    }

    const sourceField = build.sourceFieldName
    const targetField = build.targetFieldName
    const refField = lt.thisReferenceField
    const storageField = lt.thisStorageField || refField

    if (!sourceField || !targetField) {
      if (window.$message) window.$message.error('关联参数不完整: 缺少字段名')
      return
    }

    const row = hostVm._dualSelectedRow
    if (!row) {
      if (window.$message) window.$message.error('请先选择一行主表数据')
      return
    }
    const sourceValue = row[storageField]
    if (sourceValue == null) {
      if (window.$message) window.$message.error('关联参数不完整: 缺少源记录ID')
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
      if (window.$message) window.$message.warning('未找到目标表')
      return
    }
    hostVm.linkPickerTargetNova = targetNova
    hostVm.linkPickerCurrentTab = hostVm.dualTableCurrentNova
    hostVm.linkPickerSelectedKeys = []
    hostVm.linkPickerSourceFields = {}
    hostVm.linkPickerTitle = '选择 ' + (hostVm.dualTableCurrentLabel || '关联数据')
    hostVm.linkPickerShow = true
  }

  return {
    initDualLinkTreeTab: initDualLinkTreeTab,
    submitDualLinkTree: submitDualLinkTree,
    handleDualLinkAdd: handleDualLinkAdd
  }
})()
