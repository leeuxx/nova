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
        const storageField = appInfo.storageField     // 主表字段（取值用）
        const referenceField = appInfo.referenceField  // 子表外键字段（查询条件 key）
        const pkVal = hostVm.currentRow && hostVm.currentRow[storageField]
        if (!pkVal) return {}
        return { [referenceField]: String(pkVal) }
      }
    }
    return {}
  }

  // ── 构建 APPENDAGES 子表新增时用的 refReference 外键 ───────────
  // 返回 { [refReference]: pkVal }，如 { dictNova: '123' }
  function buildRefReferenceFields(hostVm, tab) {
    const appendageMap = hostVm.appendageMap || {}
    for (const k in appendageMap) {
      if (appendageMap[k].referenceName === tab.tapNovaName) {
        const refReference = appendageMap[k].refReference
        const storageField = appendageMap[k].storageField
        const pkVal = hostVm.currentRow && hostVm.currentRow[storageField]
        if (refReference && pkVal != null) return { [refReference]: String(pkVal) }
        return {}
      }
    }
    return {}
  }

  return { buildEmbSourceFields: buildEmbSourceFields, buildRefReferenceFields: buildRefReferenceFields }
})()
