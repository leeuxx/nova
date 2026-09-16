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

    // 已有 linkTarget：直接判断是否树模式；非树模式让 nova-table 复用缓存的 build 响应
    var build = hostVm.linkTabBuild[tapNovaName]
    if (build && build.linkTarget) {
      if (build.linkTarget.linkTree) {
        hostVm.loadLinkTreeData(tapNovaName, { row: hostVm._dualSelectedRow, stateKey: '__dual__' })
        if (callback) callback(true)
      } else {
        if (callback) callback(false)
      }
      return
    }

    // 树模式判断依赖 linkTarget，而 linkTabBuild 只有 nova-table /build 响应回填。
    // 双表 LINK 树模式本身不渲染 nova-table，需要这里直接请求一次 /build：
    //   树模式：拿到 linkTarget 后 loadLinkTreeData（树分支渲染，不触发 nova-table 挂载）
    //   非树模式：响应回填 linkTabBuild 并缓存 _cachedResp；后续 nova-table mounted 触发的
    //            buildTable 会读 _cachedResp 复用，跳过第二次 /build
    hostVm.linkTreeLoading['__dual__'] = true
    window.fetchApi.post('/nova/table/build', { novaName: tapNovaName }, window.__novaMenuCode(tapNovaName)).then(function (resp) {
      if (!resp || !resp.data) {
        hostVm.linkTreeLoading['__dual__'] = false
        if (callback) callback(false)
        return
      }
      const bd = resp.data
      const lt = bd.linkTarget || {}
      // 回填 linkTabBuild：与 applyLinkBuildResp 保持一致；附 _cachedResp 给 buildTable 复用
      const ltEditFields = (bd.edit || []).filter(function (e) { return e.tapType === 'thisForm' })
        .reduce(function (acc, e) { return acc.concat(e.thisForms || []) }, [])
      const newBuild = Object.assign({}, hostVm.linkTabBuild)
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
        attachmentMap: bd.attachment || {},
        _cachedResp: resp
      }
      hostVm.linkTabBuild = newBuild

      if (lt.linkTree) {
        hostVm.loadLinkTreeData(tapNovaName, { row: hostVm._dualSelectedRow, stateKey: '__dual__' })
        if (callback) callback(true)
      } else {
        // 非树模式：loadLinkTreeData 已设置 loading=true，清掉让 nova-table 渲染
        hostVm.linkTreeLoading['__dual__'] = false
        if (callback) callback(false)
      }
    }).catch(function () {
      hostVm.linkTreeLoading['__dual__'] = false
      if (callback) callback(false)
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
