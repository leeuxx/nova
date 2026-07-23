// jq/edit/form-appendages.js — 编辑弹窗 appendagesTable 业务逻辑

window.NovaTableJQ_appendages = (function () {

  // ── 构建 APPENDAGES 子表的外键条件 ─────────────────────────────
  // hostVm: 主表格 Vue 实例
  // tab:    当前 tab 配置（{ tapNovaName }）
  function buildEmbSourceFields(hostVm, tab) {
    const appendageMap = hostVm.appendageMap || {}
    for (const k in appendageMap) {
      if (appendageMap[k].referenceName === tab.tapNovaName) {
        const appInfo = appendageMap[k]
        const storageField = appInfo.storageField
        const pkVal = hostVm.currentRow && hostVm.currentRow[storageField]
        if (!pkVal) return {}
        return { [storageField]: String(pkVal) }
      }
    }
    return {}
  }

  return { buildEmbSourceFields: buildEmbSourceFields }
})()
