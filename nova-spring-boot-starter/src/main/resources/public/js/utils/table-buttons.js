// js/utils/table-buttons.js — 按钮分类与渲染
// 将标准按钮（新增/编辑/删除/批量删除）和自定义按钮的逻辑集中管理
;(function () {

var h = Vue.h
var NPopconfirm = naive.NPopconfirm
var NDropdown = naive.NDropdown

// ─── 标准按钮定义元数据 ──────────────────────────────────────
var STANDARD = {
  ADD:          { key: 'add',         labelKey: 'common.add.spaced', icon: 'material-symbols:add',            btnType: 'primary' },
  BATCH_DELETE: { key: 'batchDelete', labelKey: 'common.delete.spaced', icon: 'material-symbols:delete-outline', btnType: 'error'   },
  LINK_ADD:     { key: 'linkAdd',     labelKey: 'common.add',         icon: 'material-symbols:add',            btnType: 'primary' },
  EDIT:         { key: 'edit',        labelKey: 'common.edit' },
  DELETE:       { key: 'delete',      labelKey: 'common.delete' },
}

// ─── 行操作区 VNode 构建 ────────────────────────────────────
function buildRowActions(vm, row) {
  var buttons = []
  var editLabel = window.__t('common.edit')
  var deleteLabel = window.__t('common.delete')
  var unavailableSuffix = window.__t('common.unavailable')

  // 编辑（只读模式不显示，sysBtnHide.edit表达式满足则禁用）
  var sysBtnHide = vm.sysBtnHide || {}
  var editDisabled = sysBtnHide.edit && window.evalShowExpr(sysBtnHide.edit, row)
  if (!vm.readonly && !vm.linkMode && window.__hasButton(vm.novaName, 'edit')) {
    if (editDisabled) {
      buttons.push(h('span', {
        class: 'row-action-btn',
        style: { color: '#ccc', cursor: 'not-allowed', fontSize: '13px' },
        title: window.__t('table.edit_unavailable')
      }, editLabel))
    } else {
      buttons.push(h('span', {
        class: 'row-action-btn',
        style: { color: '#2080f0', cursor: 'pointer', fontSize: '13px' },
        onClick: function() { vm.handleEdit(row) }
      }, editLabel))
    }
  }

  // 删除（只读模式不显示，sysBtnHide.delete表达式满足则禁用）
  var deleteDisabled = sysBtnHide.delete && window.evalShowExpr(sysBtnHide.delete, row)
  if (!vm.readonly && window.__hasButton(vm.novaName, 'delete')) {
    if (deleteDisabled) {
      buttons.push(h('span', {
        class: 'row-action-btn',
        style: { color: '#ccc', cursor: 'not-allowed', fontSize: '13px' },
        title: window.__t('table.delete_unavailable')
      }, deleteLabel))
    } else {
      buttons.push(h(NPopconfirm, {
        onPositiveClick: function() { vm.handleDelete(row) },
        onNegativeClick: function() {},
        positiveText: window.__t('common.confirm'),
        negativeText: window.__t('common.cancel')
      }, {
        default: function() { return window.__t('common.confirm_delete') },
        trigger: function() {
          return h('span', { class: 'row-action-btn', style: { color: '#d03050', cursor: 'pointer', fontSize: '13px' } }, deleteLabel)
        }
      }))
    }
  }

  // ── 自定义按钮：SINGLE / MULTI（行操作区）────────────────
  var rowBtns = filterRowCustomButtons(vm.rowOperations)
  var rowUnfolded = rowBtns.slice(0, 1)
  var rowFolded   = rowBtns.slice(1)

  rowUnfolded.forEach(function(btn) {
    var enabled = !btn.ifExpr || window.evalShowExpr(btn.ifExpr, row)
    var btnStyle = {
      color: enabled ? (btn.color || '#7c3aed') : '#ccc',
      cursor: enabled ? 'pointer' : 'not-allowed',
      fontSize: '13px'
    }
    var btnTitle = enabled ? (btn.tip || btn.title) : (btn.tip || btn.title) + unavailableSuffix
    var triggerEl = h('span', { class: 'row-action-btn', style: btnStyle, title: btnTitle }, btn.title)
    var handler = function() {
      if (btn.type === 'NOVA' && btn.novaClassName) { vm.openOpForm(btn, row); return }
      if (btn.type === 'TPL') { vm.openTpl(btn, row); return }
      vm.submitCustomBtn(btn, row)
    }
    if (enabled && btn.callHint) {
      buttons.push(h(NPopconfirm, {
        onPositiveClick: function() { handler() },
        onNegativeClick: function() {},
        positiveText: window.__t('common.confirm'),
        negativeText: window.__t('common.cancel')
      }, {
        default: function() { return btn.callHint },
        trigger: function() { return triggerEl }
      }))
    } else if (enabled) {
      buttons.push(h('span', { class: 'row-action-btn', style: btnStyle, title: btnTitle, onClick: handler }, btn.title))
    } else {
      buttons.push(triggerEl)
    }
  })

  if (rowFolded.length > 0) {
    var foldedOpts = buildFoldedOptions(rowFolded, function(btn) {
      return !(!btn.ifExpr || window.evalShowExpr(btn.ifExpr, row))
    })
    buttons.push(h(NDropdown, {
      options: foldedOpts,
      trigger: 'hover',
      showArrow: false,
      onSelect: function(key) {
        var btn = rowFolded.find(function(b) { return b.title === key })
        if (!btn) return
        var action = function() {
          if (btn.type === 'NOVA' && btn.novaClassName) { vm.openOpForm(btn, row); return }
          if (btn.type === 'TPL') { vm.openTpl(btn, row); return }
          vm.submitCustomBtn(btn, row)
        }
        if (btn.callHint) { window.modal.confirm(btn.callHint, { title: window.__t('dialog.confirm_action_title'), onConfirm: action }) }
        else { action() }
      }
    }, {
      default: function() {
        return h('iconify-icon', { icon: 'material-symbols:more-horiz', style: { color: '#888', cursor: 'pointer', fontSize: '18px' } })
      }
    }))
  }

  return h('span', { style: 'display:inline-flex;align-items:center;gap:8px' }, buttons)
}

// ─── 自定义按钮过滤 ────────────────────────────────────────
function filterRowCustomButtons(rowOperations) {
  return (rowOperations || []).filter(function(b) { return b.mode === 'SINGLE' || b.mode === 'MULTI' })
}

function filterToolbarCustomButtons(rowOperations) {
  return (rowOperations || []).filter(function(b) { return b.mode === 'MULTI' || b.mode === 'MULTI_ONLY' || b.mode === 'BUTTON' })
}

// ─── 行操作列是否有按钮（决定是否渲染操作列）────────────────
function hasRowActions(vm) {
  var hasEdit    = !vm.readonly && !vm.linkMode && window.__hasButton(vm.novaName, 'edit')
  var hasDelete  = !vm.readonly && window.__hasButton(vm.novaName, 'delete')
  var hasCustom  = filterRowCustomButtons(vm.rowOperations).length > 0
  return hasEdit || hasDelete || hasCustom
}

// ─── 文本像素测量（canvas measureText 缓存复用）────────────
var _measureCtx
function textWidth(text) {
  if (!_measureCtx) {
    var c = document.createElement('canvas')
    _measureCtx = c.getContext('2d')
  }
  _measureCtx.font = '13px -apple-system, "Microsoft YaHei", sans-serif'
  return _measureCtx.measureText(text || '').width
}

// ─── 行操作列宽度计算 ──────────────────────────────────────
// 用 canvas measureText 按当前 locale 实际字宽算，locale 切换整页刷新会自动重算
function calcRowActionColWidth(linkMode, rowOperations, novaName, readonly, sysBtnHide) {
  var hasEdit   = !readonly && !linkMode && window.__hasButton(novaName, 'edit')
  var hasDelete = !readonly && window.__hasButton(novaName, 'delete')
  var btns = filterRowCustomButtons(rowOperations)
  var unfolded = btns.length > 0 ? 1 : 0
  var hasFolded = btns.length > 1
  // 单按钮基宽：文字宽 + 8px padding；并列再加 4px 间隙
  var btnW = function(label) { return textWidth(label) + 8 }
  var w = 0
  if (hasEdit && hasDelete)   w = btnW(window.__t('common.edit')) + 4 + btnW(window.__t('common.delete'))
  else if (hasEdit)           w = btnW(window.__t('common.edit'))
  else if (hasDelete)         w = btnW(window.__t('common.delete'))
  if (btns.length > 0 && !hasFolded) {
    w += btnW(btns[0].title || '') + 4
  } else if (hasFolded) {
    w += btnW(btns[0].title || '') + 4 + 38  // 第一个展开 + 更多图标
  }
  // 安全 padding：给 cell 内边距留呼吸空间
  return Math.ceil(w + 16)
}

// ─── 工具栏标准按钮显示条件 ────────────────────────────────
function toolbarStandardShow(vm) {
  return {
    add:         !vm.readonly && !vm.linkMode && window.__hasButton(vm.novaName, 'add'),
    linkAdd:     vm.linkMode && !vm.readonly && window.__hasButton(vm.novaName, 'add'),
    batchDelete: vm.checkedRowKeys.length > 0 && !vm.readonly && window.__hasButton(vm.novaName, 'delete'),
  }
}

// ─── 构建折叠选项（用于 NDropdown）────────────────────────
function buildFoldedOptions(buttons, disabledFn) {
  var ungrouped = []
  var groupedMap = {}
  var groupOrder = []
  buttons.forEach(function(btn) {
    var item = {
      label: btn.title,
      key: btn.title,
      icon: btn.icon ? function() { return h('iconify-icon', { icon: btn.icon }) } : undefined,
      disabled: disabledFn ? disabledFn(btn) : false,
      props: btn.tip ? { title: btn.tip } : undefined
    }
    if (!btn.group) {
      ungrouped.push(item)
    } else {
      if (!groupedMap[btn.group]) {
        groupedMap[btn.group] = []
        groupOrder.push(btn.group)
      }
      groupedMap[btn.group].push(item)
    }
  })
  var result = ungrouped
  groupOrder.forEach(function(groupName) {
    result.push({
      label: groupName,
      key: '__group_' + groupName,
      icon: function() { return h('iconify-icon', { icon: 'material-symbols:folder-outline' }) },
      children: groupedMap[groupName]
    })
  })
  return result
}

// ─── 导出到全局 ──────────────────────────────────────────
window.NovaTableButtons = {
  STANDARD: STANDARD,
  buildRowActions: buildRowActions,
  hasRowActions: hasRowActions,
  filterRowCustomButtons: filterRowCustomButtons,
  filterToolbarCustomButtons: filterToolbarCustomButtons,
  calcRowActionColWidth: calcRowActionColWidth,
  toolbarStandardShow: toolbarStandardShow,
  buildFoldedOptions: buildFoldedOptions,
}

})()
