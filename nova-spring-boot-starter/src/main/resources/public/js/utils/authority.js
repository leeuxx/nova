// js/utils/authority.js — 权限工具：菜单 code 查找 + 按钮权限控制
// 请求参数中的 novaName 对应菜单的 value，遍历整个菜单匹配找 code

;(function () {

var menuCodeMap = {}
var buttonCodes = null  // Set<string>

// 用菜单列表初始化映射（value → code），递归遍历树形结构
window.__initMenuCodeMap = function (menuList) {
  menuCodeMap = {}
  ;(function walk(items) {
    ;(items || []).forEach(function (item) {
      if (item.value) {
        menuCodeMap[item.value] = item.code
      }
      if (item.children && item.children.length) {
        walk(item.children)
      }
    })
  })(menuList)
}

// 根据 novaName 获取请求头 { menuCode: 'xxx' }，找不到返回 {}
window.__novaMenuCode = function (novaName) {
  var code = menuCodeMap[novaName]
  return code ? { menuCode: code } : {}
}

// ─── 按钮权限 ────────────────────────────────────────────────

// 初始化按钮权限集：遍历菜单，收集每个 NOVA 菜单的 systemButton 配置
// 按 {novaName}@{action} 格式构建 button code 集合
window.__initButtonCodes = function (menuList) {
  buttonCodes = new Set()
  ;(function walk(items) {
    ;(items || []).forEach(function (item) {
      if (item.type === 'NOVA' && item.value && item.systemButton) {
        var sb = item.systemButton
        if (sb.add)   buttonCodes.add(item.value + '@add')
        if (sb.edit)  buttonCodes.add(item.value + '@edit')
        if (sb.delete) buttonCodes.add(item.value + '@delete')
      }
      if (item.children && item.children.length) {
        walk(item.children)
      }
    })
  })(menuList)
}

// 检查当前用户是否有某按钮权限
// novaName: 当前表的 novaName（即菜单 value），action: 'add' | 'edit' | 'delete'
// 返回 true/false
window.__hasButton = function (novaName, action) {
  if (!buttonCodes) return false
  return buttonCodes.has(novaName + '@' + action)
}

})()
