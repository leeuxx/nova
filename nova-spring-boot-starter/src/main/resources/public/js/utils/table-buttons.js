// js/utils/table-buttons.js — 按钮分类与渲染
// 将标准按钮（新增/编辑/删除/批量删除）和自定义按钮的逻辑集中管理
;(function () {

var h = Vue.h
var NPopconfirm = naive.NPopconfirm
var NDropdown = naive.NDropdown

// ─── 标准按钮定义元数据 ──────────────────────────────────────
var STANDARD = {
  ADD:          { key: 'add',         label: '新 增', icon: 'material-symbols:add',            btnType: 'primary' },
  BATCH_DELETE: { key: 'batchDelete', label: '删 除', icon: 'material-symbols:delete-outline', btnType: 'error'   },
  LINK_ADD:     { key: 'linkAdd',     label: '新增',   icon: 'material-symbols:add',            btnType: 'primary' },
  EDIT:         { key: 'edit',        label: '编辑' },
  DELETE:       { key: 'delete',      label: '删除' },
}

// ─── 行操作区 VNode 构建 ────────────────────────────────────
function buildRowActions(vm, row) {
  var buttons = []

  // 编辑（只读模式不显示）
  if (!vm.readonly && !vm.linkMode && window.__hasButton(vm.novaName, 'edit')) {
    buttons.push(h('span', {
      class: 'row-action-btn',
      style: { color: '#2080f0', cursor: 'pointer', fontSize: '13px' },
      onClick: function() { vm.handleEdit(row) }
    }, '编辑'))
  }

  // 删除（只读模式不显示）
  if (!vm.readonly && window.__hasButton(vm.novaName, 'delete')) {
    buttons.push(h(NPopconfirm, {
      onPositiveClick: function() { vm.handleDelete(row) },
      onNegativeClick: function() {},
      positiveText: '确定',
      negativeText: '取消'
    }, {
      default: function() { return '确定删除吗？' },
      trigger: function() {
        return h('span', { class: 'row-action-btn', style: { color: '#d03050', cursor: 'pointer', fontSize: '13px' } }, '删除')
      }
    }))
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
    var btnTitle = enabled ? (btn.tip || btn.title) : (btn.tip || btn.title) + ' (不可用)'
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
        positiveText: '确定',
        negativeText: '取消'
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
        if (btn.callHint) { window.modal.confirm(btn.callHint, { title: '确认操作', onConfirm: action }) }
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

// ─── 行操作列宽度计算 ──────────────────────────────────────
function calcRowActionColWidth(linkMode, rowOperations, novaName, readonly) {
  var hasEdit   = !readonly && !linkMode && window.__hasButton(novaName, 'edit')
  var hasDelete = !readonly && window.__hasButton(novaName, 'delete')
  var btns = filterRowCustomButtons(rowOperations)
  var unfolded = btns.length > 0 ? 1 : 0
  var hasFolded = btns.length > 1
  var w = 0
  if (hasEdit && hasDelete) w = 85
  else if (hasEdit)         w = 50
  else if (hasDelete)       w = 45
  w += unfolded * 60             // 每个非折叠按钮
  if (hasFolded) w += 38        // 更多图标
  return w
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
