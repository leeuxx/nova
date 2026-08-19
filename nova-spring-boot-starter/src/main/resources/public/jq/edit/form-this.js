// jq/form-this.js — thisForm 业务逻辑（formData 初始化、映射、验证、序列化）

window.NovaTableJQ_form = (function () {

  // ── 初始化空 formData（新增模式） ──────────────────────────────
  // editFields:   Array  字段定义列表
  // choiceMap:    Object CHOICE 字段配置 { fieldName: { values, selectType, showType } }
  // sourceFields: Object 嵌入模式外键预填值 { fieldName: value }
  // 返回: formData Object
  function initFormData(editFields, choiceMap, sourceFields) {
    var formData = {}
    editFields.forEach(function (f) {
      var dv = window.NovaTableJQ_form.convertDefaultValue(f)
      if (dv !== undefined) {
        formData[f.field] = dv
        if (f.type === 'REFERENCE') formData[f.field + '_display'] = ''
        return
      }
      var ci = choiceMap[f.field]
      var isMulti = f.type === 'CHOICE' && ci && ci.selectType === 'MULTI'
      var isSingle = f.type === 'CHOICE' && ci && ci.selectType === 'SINGLE'
      var isDate   = f.type === 'DATE'
      formData[f.field] = (isMulti || f.type === 'TAG' || f.type === 'ATTACHMENT') ? [] : (isSingle || isDate || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : '')
      if (f.type === 'REFERENCE') formData[f.field + '_display'] = ''
    })
    Object.keys(sourceFields || {}).forEach(function(sk) {
      formData[sk] = sourceFields[sk]
    })
    return formData
  }

  // ── 编辑模式：从 detailRow 映射到 formData ──────────────────────
  // detailRow:    Object  /nova/table/details 返回的一行数据
  // editFields:   Array  字段定义列表
  // choiceMap:    Object CHOICE 配置
  // referenceMap: Object REFERENCE 配置
  // extraFields:  Object 额外字段（如 PK）{ field: value }
  // 返回: formData Object（含 _display 值）
  function mapDetailToFormData(detailRow, editFields, choiceMap, referenceMap, extraFields) {
    var source = Object.assign({}, extraFields || {})
    editFields.forEach(function(f) {
      var val = detailRow[f.field]
      var choice = choiceMap[f.field]
      if (choice && choice.selectType === 'MULTI') {
        source[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
      } else if (f.type === 'TAG' || f.type === 'ATTACHMENT') {
        source[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
      } else if (f.type === 'DATE') {
        var ts = val !== null && val !== undefined ? Number(val) : null
        source[f.field] = (ts && !isNaN(ts)) ? ts : null
      } else if (f.type === 'BOOLEAN') {
        source[f.field] = (val === null || val === undefined) ? null : String(val)
      } else if (f.type === 'NUMBER') {
        source[f.field] = (val === null || val === undefined || val === '') ? null : Number(val)
      } else if (f.type === 'REFERENCE') {
        var refInfo = referenceMap[f.field] || {}
        var sf = refInfo.storageField
        source[f.field] = (val && typeof val === 'object')
          ? (sf && val[sf] !== undefined && val[sf] !== null ? String(val[sf]) : null)
          : (val !== null && val !== undefined && val !== '' ? String(val) : null)
        source[f.field + '_display'] = (val && typeof val === 'object' && refInfo.displayField)
          ? (val[refInfo.displayField] != null ? String(val[refInfo.displayField]) : '') : ''
      } else {
        source[f.field] = (val === null || val === undefined) ? '' : val
      }
    })
    return source
  }

  // ── 验证 thisForm 非空字段 ────────────────────────────────────
  // editFields:       Array  字段定义
  // visibleEditFields Array  { field, visible }[] 由 computed 生成
  // formData:         Object 当前数据
  // 返回: errors Object { fieldName: 'xxx不能为空' }
  function validateThisForm(editFields, visibleEditFields, formData) {
    var visibleSet = new Set((visibleEditFields || []).filter(function(v) { return v.visible }).map(function(v) { return v.field.field }))
    var errors = {}
    editFields.forEach(function (f) {
      if (f.type === 'DIVIDE' || f.type === 'EMPTY' || !f.notNull) return
      if (!visibleSet.has(f.field)) return
      var val = formData[f.field]
      var empty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
      if (empty) errors[f.field] = f.title + '不能为空'
    })
    return errors
  }

  // ── 构建 thisForm 提交数据 ────────────────────────────────────
  // editFields:     Array  字段定义
  // formData:       Object 当前数据
  // referenceMap:   Object REFERENCE 配置
  // options:        Object { currentRow, novaIdField, sourceRefFields, skipEmpty }
  //   skipEmpty=true  新增模式（空值字段不上传）
  //   skipEmpty=false 编辑模式（上传所有字段，含空值）
  //   currentRow + novaIdField  编辑模式自动添加 PK
  //   sourceRefFields           嵌入模式自动添加外键 REFERENCE 字段
  // 返回: formInfo Array { field, value, type, reference? }
  function buildFormInfo(editFields, formData, referenceMap, options) {
    var opts = options || {}
    var formInfo = editFields.filter(function (f) { return f.type !== 'DIVIDE' && f.type !== 'EMPTY' }).map(function (f) {
      var val = formData[f.field]
      var strVal
      if (val === null || val === undefined || val === '') {
        strVal = ''
      } else if (Array.isArray(val)) {
        strVal = val.join(',')
      } else {
        strVal = String(val)
      }
      var item = { field: f.field, value: strVal, type: f.type }
      if (f.type === 'REFERENCE') {
        var refInfo = (referenceMap && referenceMap[f.field]) || {}
        if (refInfo.referenceField) item.reference = { field: refInfo.referenceField }
      }
      return item
    })
    if (opts.skipEmpty) formInfo = formInfo.filter(function(item) { return item.value !== '' })
    if (opts.currentRow && opts.novaIdField) {
      formInfo.unshift({ field: opts.novaIdField, value: String(opts.currentRow[opts.novaIdField]), type: '' })
    }
    ;(opts.sourceRefFields || []).forEach(function(rf) {
      if (!formInfo.some(function(i) { return i.field === rf.field }) && rf.value != null && rf.value !== '') {
        formInfo.push({ field: rf.field, value: String(rf.value), type: 'REFERENCE', reference: { field: rf.referenceField } })
      }
    })
    return formInfo
  }

  // ── 将 defaultValue 按字段类型转换 ──────────────────────────────
  // 返回该字段应填充的默认值，无默认值时返回 undefined
  function convertDefaultValue(f) {
    if (f.defaultValue == null || f.defaultValue === '') return undefined
    if (f.type === 'NUMBER') {
      var num = Number(f.defaultValue)
      return isNaN(num) ? null : num
    } else if (f.type === 'TAG' || f.type === 'ATTACHMENT') {
      return String(f.defaultValue).split(',')
    } else if (f.type === 'BOOLEAN') {
      return String(f.defaultValue)
    } else if (f.type === 'DATE') {
      var ts = Number(f.defaultValue)
      return isNaN(ts) ? null : ts
    }
    return f.defaultValue
  }

  return { initFormData, mapDetailToFormData, validateThisForm, buildFormInfo, convertDefaultValue }
})()
