// jq/form-ref.js — referenceForm 业务逻辑（外键查找、/details 请求）

window.NovaTableJQ_ref = (function () {

  // ── 查找外键值 ──────────────────────────────────────────────────
  // referenceMap: Object  主表的 referenceMap
  // formData:     Object  主表 formData（取外键值）
  // rawDetailRow: Object  主表原始详情行（嵌套对象外键回退）
  // refNovaName:  String  目标引用表名
  // 返回: String|null
  function findFkValue(referenceMap, formData, rawDetailRow, refNovaName) {
    referenceMap = referenceMap || {}
    for (var field in referenceMap) {
      if ((referenceMap[field] || {}).referenceName === refNovaName) {
        var storageVal = formData && formData[field]
        if (!storageVal && rawDetailRow) {
          var sf = (referenceMap[field] || {}).storageField || 'id'
          var rawNested = rawDetailRow[field]
          if (rawNested && typeof rawNested === 'object') storageVal = rawNested[sf]
        }
        return storageVal || null
      }
    }
    return null
  }

  // ── 请求 /nova/table/details ────────────────────────────────────
  // novaName:  String  引用表名
  // fkValue:   String  外键值
  // callback:  Function(data)  成功或失败均回调，data 可能为 {}
  function fetchRefDetails(novaName, fkValue, callback) {
    if (!fkValue) { callback && callback({}); return }
    $.ajax({
      url: '/nova/table/details', method: 'POST', contentType: 'application/json',
      data: JSON.stringify({ novaName: novaName, storageFieldValue: String(fkValue) }),
      success: function(resp) {
        var data = (resp.code === 200 && resp.data) ? resp.data : {}
        callback && callback(data)
      },
      error: function() {
        callback && callback({})
      }
    })
  }

  return { findFkValue, fetchRefDetails }
})()
