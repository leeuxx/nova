// jq/form-link.js — linkForm 业务逻辑（添加关联、刷新嵌入式表格）

window.NovaTableJQ_link = (function () {

  // ── 查找嵌入式 vmKey ─────────────────────────────────────────────
  function findEmbVmKey(novaName) {
    var keys = Object.keys(window.vmMap || {})
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('__emb_' + novaName) === 0) return keys[i]
    }
    return null
  }

  // ── 添加关联（中间表写入 + 刷新嵌入式表格）───────────────────────
  function handleLinkAdd(novaName, linkNovaName, sourceField, sourceValue, targetField, targetIds, vmKey, refreshVmKey) {
    var key = vmKey || novaName
    var formInfo = [
      { field: sourceField, value: String(sourceValue), type: 'LINK_TARGET' },
      { field: targetField, value: JSON.stringify(targetIds.map(String)), type: 'LINK_TARGET' }
    ]
    window.fetchApi.post('/nova/table/addLinkTarget', { novaName: linkNovaName, formInfo: formInfo }).then(function (resp) {
      var t = window.vmMap && window.vmMap[key]
      if (!t) return
      if (window.$message) window.$message.success('新增成功')
      // 刷新目标表格：优先使用传入的 refreshVmKey，否则查找嵌入式 vmKey
      var embVmKey = refreshVmKey || findEmbVmKey(linkNovaName)
      if (embVmKey && window.NovaTableJQ) window.NovaTableJQ.loadData(embVmKey)
    }).catch(function () {
      console.info('[Nova] link add接口请求失败，novaName:', linkNovaName)
    })
  }

  return {
    handleLinkAdd: handleLinkAdd
  }

})()
