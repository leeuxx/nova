// js/utils/authority.js — 权限工具：菜单 code 查找
// 请求参数中的 novaName 对应菜单的 value，遍历整个菜单匹配找 code

;(function () {

var menuCodeMap = {}

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

})()
