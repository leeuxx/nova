// jq/form-appendage.js — appendageForm 业务逻辑（tab 构建、数据填充、详情加载）

window.NovaTableJQ_app = (function () {

  // ── 填充 appendage 表单数据（从 rec 对象）────────────────────────
  function fillAppendageData(t, appNovaName, rec) {
    if (!rec || typeof rec !== 'object') return
    var curBuild = (t.appendageTabBuild || {})[appNovaName] || {}
    var fields = curBuild.editFields || []
    var cm = curBuild.choiceMap || {}
    var am = curBuild.attachmentMap || {}
    var fd = {}
    fields.forEach(function(f) {
      var val = rec[f.field]
      var ci = cm[f.field]
      if (f.type === 'CHOICE' && ci && ci.selectType === 'MULTI') {
        fd[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
      } else if (f.type === 'TAG') {
        fd[f.field] = (val && String(val).length > 0) ? String(val).split(',') : []
      } else if (f.type === 'ATTACHMENT') {
        var sep = (am[f.field] || {}).separator
        fd[f.field] = (val && String(val).length > 0 && sep != null) ? String(val).split(sep) : []
      } else if (f.type === 'DATE') {
        var ts = val !== null && val !== undefined ? Number(val) : null
        fd[f.field] = (ts && !isNaN(ts)) ? ts : null
      } else if (f.type === 'BOOLEAN') {
        fd[f.field] = (val === null || val === undefined) ? null : String(val)
      } else if (f.type === 'NUMBER') {
        fd[f.field] = (val === null || val === undefined || val === '') ? null : Number(val)
      } else if (f.type === 'REFERENCE') {
        var refInfo = ((t.appendageTabBuild[appNovaName] || {}).referenceMap || {})[f.field] || {}
        var rsf = refInfo.storageField
        fd[f.field] = (val && typeof val === 'object')
          ? (rsf && val[rsf] !== undefined && val[rsf] !== null ? String(val[rsf]) : null)
          : (val !== null && val !== undefined && val !== '' ? String(val) : null)
        fd[f.field + '_display'] = (val && typeof val === 'object' && refInfo.displayField)
          ? (val[refInfo.displayField] != null ? String(val[refInfo.displayField]) : '') : ''
      } else {
        fd[f.field] = (val === null || val === undefined) ? '' : val
      }
    })
    var newFds = Object.assign({}, t.appendageFormData)
    newFds[appNovaName] = fd
    t.appendageFormData = newFds
  }

  // ── 懒加载 appendage 详情（/details 接口）────────────────────────
  function loadAppendageDetails(novaName, appNovaName, vmKey) {
    var key = vmKey || novaName
    var target = window.vmMap && window.vmMap[key]
    if (!target) return
    var appendageMap = target.appendageMap || {}
    var appField = null
    Object.keys(appendageMap).forEach(function(k) {
      if (appendageMap[k].referenceName === appNovaName) appField = k
    })
    if (!appField) return
    var storageField = appendageMap[appField].storageField
    var storageVal = target.formData && target.formData[storageField]
    var loaded = Object.assign({}, target.appendageDetailsLoaded)
    loaded[appNovaName] = true
    target.appendageDetailsLoaded = loaded
    if (!storageVal) return
    window.fetchApi.post('/nova/table/details', { novaName: appNovaName, storageFieldValue: String(storageVal) }).then(function(resp) {
      if (!resp.data) return
      var t = window.vmMap && window.vmMap[key]
      if (!t) return
      fillAppendageData(t, appNovaName, resp.data)
    })
  }

  // ── 构建 appendage tabs（/build + /details）────────────────────
  function buildAppendageTabs(novaName, rowData, vmKey) {
    var key = vmKey || novaName
    var target = window.vmMap && window.vmMap[key]
    if (!target) return
    ;(target.editAppendageTabs || []).forEach(function(appTab) {
      if (!appTab.tapNovaName) return
      var appNovaName = appTab.tapNovaName
      window.fetchApi.post('/nova/table/build', { novaName: appNovaName }, window.__novaMenuCode(appNovaName)).then(function(br) {
        if (br.code !== 200) return
        var t2 = window.vmMap && window.vmMap[key]
        if (!t2) return
        var bd = br.data
        var editFields = (bd.edit || []).filter(function(e) { return e.tapType === 'thisForm' }).reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
        var newBuild = Object.assign({}, t2.appendageTabBuild)
        var cm = bd.choice || {}
        newBuild[appNovaName] = {
          editFields: editFields, choiceMap: cm, numberMap: bd.number || {},
          dateMap: bd.date || {}, booleanMap: bd.booleanInfo || {},
          referenceMap: bd.reference || {}, tagMap: bd.tag || {},
          attachmentMap: bd.attachment || {},
          buttons: bd.buttons || {},
          editLayout: (bd.layout && bd.layout.editLayout) || 'DEFAULT'
        }
        t2.appendageTabBuild = newBuild
        // 保留用户已输入的值，不覆盖
        var existingFd = (t2.appendageFormData || {})[appNovaName] || {}
        var fd = {}
        editFields.forEach(function(f) {
          if (existingFd[f.field] !== undefined) {
            fd[f.field] = existingFd[f.field]
          } else {
            var dv = window.NovaTableJQ_form.convertDefaultValue(f, cm, am)
            if (dv !== undefined) {
              fd[f.field] = dv
            } else {
              var ci = cm[f.field]
              var isMulti = f.type === 'CHOICE' && ci && ci.selectType === 'MULTI'
              var isSingle = f.type === 'CHOICE' && ci && ci.selectType === 'SINGLE'
              fd[f.field] = (isMulti || f.type === 'TAG' || f.type === 'ATTACHMENT') ? [] : (isSingle || f.type === 'DATE' || f.type === 'BOOLEAN' || f.type === 'NUMBER' ? null : '')
            }
          }
          if (f.type === 'REFERENCE') fd[f.field + '_display'] = existingFd[f.field + '_display'] || ''
        })
        var newFds = Object.assign({}, t2.appendageFormData)
        newFds[appNovaName] = fd
        t2.appendageFormData = newFds
        if (rowData) {
          var appendageMap = t2.appendageMap || {}
          var appFieldKey = null
          Object.keys(appendageMap).forEach(function(k) { if (appendageMap[k].referenceName === appNovaName) appFieldKey = k })
          if (appFieldKey) fillAppendageData(t2, appNovaName, rowData[appFieldKey])
        }
        // APPENDAGE 组件的 /details 立即加载
        loadAppendageDetails(novaName, appNovaName, key)
      })
    })
  }

  return {
    buildAppendageTabs: buildAppendageTabs,
    fillAppendageData: fillAppendageData,
    loadAppendageDetails: loadAppendageDetails
  }
})()
