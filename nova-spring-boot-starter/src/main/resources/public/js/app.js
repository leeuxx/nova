// js/app.js — 路由 + 布局组件，先加载菜单再挂载 Vue 应用
;(function () {

// ─── 配置项 ──────────────────────────────────────────────────────
// true = 离线模式：禁止 iconify 请求外网 CDN，图标数据全部走 icons-offline.js
// false = 在线模式：iconify 自动从 api.iconify.design 拉取图标数据
var ICON_OFFLINE_MODE = false

if (ICON_OFFLINE_MODE) {
  try {
    var _iconifyEl = customElements.get('iconify-icon')
    if (_iconifyEl && _iconifyEl._api && _iconifyEl._api.setFetch) {
      _iconifyEl._api.setFetch(function () {
        return Promise.reject(new Error('offline'))
      })
    }
  } catch (e) {}
}

const { createApp, ref, h, computed, watch, nextTick } = Vue
const { createRouter, createWebHashHistory, useRoute, useRouter } = VueRouter
const {
  NConfigProvider, NLayout, NLayoutSider, NLayoutHeader, NLayoutContent,
  NMenu, NIcon, NDropdown, NSpace, NTabs, NTab, NSpin, NSwitch,
  NBreadcrumb, NBreadcrumbItem, NBadge,
  NMessageProvider, NDialogProvider, NNotificationProvider, NAvatar,
  useDialog, useMessage, useLoadingBar,
  darkTheme, zhCN, dateZhCN
} = naive

// 登录页面组件
const LoginPage = window.LoginPage
// 404 页面组件
const NotFoundPage = window.NotFoundPage
const HomePage = window.HomePage

// ─── TPL 嵌入页组件 ───────────────────────────────────────────────
const TplPage = {
  name: 'TplPage',
  computed: {
    iframeUrl() {
      const info = window.__tplMeta && window.__tplMeta[this.$route.params.code]
      const url = info && info.url
      if (!url) return ''
      const token = localStorage.getItem('nova_token') || ''
      const sep = url.includes('?') ? '&' : '?'
      return url + sep + 'token=' + encodeURIComponent(token)
    }
  },
  template: '<div style="height:calc(100vh - 130px);padding:16px;box-sizing:border-box"><iframe :src="iframeUrl" style="width:100%;height:100%;border:none;border-radius:4px"></iframe></div>'
}

// ─── 图标辅助 ────────────────────────────────────────────────────
function iconNode(iconName) {
  return () => h(NIcon, { size: 18 }, {
    default: () => h('iconify-icon', { icon: iconName, style: 'font-size:1em;display:block' })
  })
}

// ─── 将后端平铺菜单列表转为 NMenu 树 + routeMeta + bcIconMap ────
function processMenus(list) {
  var nodeMap    = {}
  var routeMeta  = {}
  var bcIconMap  = {}
  var defaultPath = '/home'

  // 第一遍：建 nodeMap（show===false 或 type=BUTTON 的菜单不加入导航树）
  list.forEach(function (item) {
    if (item.show === false) return
    if (item.type === 'BUTTON') return
    // type=NOVA 才有路由，其他类型key 用 code 占位且不可点击
    var key      = item.type === 'NOVA' ? '/nova/' + item.value : item.code
    var disabled = item.type === 'DIR'  ? false  // 目录：不禁用（可展开）
                 : item.type === 'NOVA'            ? false  // nova视图：可点击
                 : item.type === 'TPL'             ? false  // TPL嵌入页：可点击
                 : true                                      // 其他：禁用
    nodeMap[item.id] = {
      label:    item.name,
      key:      key,
      icon:     iconNode(item.icon || 'material-symbols:circle-outline'),
      disabled: disabled,
      _raw:     item
    }
    if (item.icon) bcIconMap[item.name] = item.icon
  })

  // 第二遍：组装树（不在 nodeMap 中的跳过）
  var roots = []
  list.forEach(function (item) {
    var node = nodeMap[item.id]
    if (!node) return
    if (item.pid && nodeMap[item.pid]) {
      var parent = nodeMap[item.pid]
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // 第三遍：只给 type=NOVA 的叶子节点构建 routeMeta（含面包屑路径）
  list.forEach(function (item) {
    if (item.type !== 'NOVA' || !item.value) return
    var key        = '/nova/' + item.value
    var breadcrumb = [item.name]
    var cur        = item
    while (cur.pid && nodeMap[cur.pid]) {
      cur = nodeMap[cur.pid]._raw
      breadcrumb.unshift(cur.name)
    }
    routeMeta[key] = { title: item.name, icon: item.icon, breadcrumb: breadcrumb }
    if (defaultPath === '/home') defaultPath = key
  })

  // 构建 childKey → parentKey 的映射，用于自动展开父级菜单
  var parentKeyMap = {}
  list.forEach(function (item) {
    if (item.pid && nodeMap[item.id] && nodeMap[item.pid]) {
      var childKey  = nodeMap[item.id].key
      var parentKey = nodeMap[item.pid].key
      parentKeyMap[childKey] = parentKey
    }
  })

  // 构建 TPL 菜单元数据（面包屑、图标）
  var tplMeta = {}
  list.forEach(function (item) {
    if (item.type !== 'TPL' || !item.value) return
    var breadcrumb = [item.name]
    var cur = item
    while (cur.pid && nodeMap[cur.pid]) {
      cur = nodeMap[cur.pid]._raw
      breadcrumb.unshift(cur.name)
    }
    tplMeta[item.code] = { title: item.name, icon: item.icon, breadcrumb: breadcrumb, url: item.value, name: item.name }
  })

  return { menuTree: roots, routeMeta: routeMeta, bcIconMap: bcIconMap, defaultPath: defaultPath, parentKeyMap: parentKeyMap, tplMeta: tplMeta }
}

// ─── themeOverrides ──────────────────────────────────────────────
const themeOverrides = {
  common: {
    borderRadius: '6px', borderRadiusSmall: '4px',
    primaryColor: '#2563eb', primaryColorHover: '#1d4ed8', primaryColorPressed: '#1e40af'
  }
}

// 从脚本开始执行起计时（此时首屏 loading 已在 DOM 中显示）
var _bootLoadingStart = Date.now()

function hideBootLoading(immediate) {
  var el = document.getElementById('__nova-boot-loading__')
  if (!el) return
  var finish = function () {
    el.classList.add('hidden')
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el)
    }, 600)
  }
  // immediate=true（如登录页）：不做最短时长等待，立即开始淡出
  var remain = (immediate ? 0 : window.NovaLoading.minDuration.boot) - (Date.now() - _bootLoadingStart)
  if (remain > 0) setTimeout(finish, remain)
  else finish()
}

// 首屏 boot loading 是否仍在 DOM 中（整页加载阶段）：此阶段表格不显示自身动画，由全屏动画覆盖；点菜单切 tab 时已移除，正常显示
window.__bootLoadingInDom = function () {
  return !!document.getElementById('__nova-boot-loading__')
}
// boot 是否已开始淡出（加 hidden 类）：表格 loading 可提前衔接，与全屏动画淡出重叠
window.__bootFadingOut = function () {
  var el = document.getElementById('__nova-boot-loading__')
  return !!el && el.classList.contains('hidden')
}

// ─── 挂载入口：未登录直接挂载（显示登录页），有 token 才拉菜单 ──
var _startToken = localStorage.getItem('nova_token')
if (_startToken) {
  window.loadJSON('json/index.json', function (config) {
    window.fetchApi.post('/nova/authority/getMenu', {}).then(function (resp) {
      mountApp(resp.data || [], config)
    }).catch(function () { mountApp([], config) })
  })
} else {
  // 无 token：登录页直接显示，不需要加载动画，直接移除 boot（index.html 内联已移除，此处兜底）
  var bootEl0 = document.getElementById('__nova-boot-loading__')
  if (bootEl0 && bootEl0.parentNode) bootEl0.parentNode.removeChild(bootEl0)
  mountApp([], { theme: { default: 'daytime' }, menu: { toggle: { default: 'down' } } })
}

function mountApp(menuList, config, loginExpired) {
  // 品牌文字（index.json logoText）：供网页标题、左上角 logo、加载动画标题、home 页读取
  var logoText = config.logoText
  window.__novaLogText = logoText
  document.title = logoText
  // 加载动画标题：boot 尚未淡出时更新为配置文字
  var btEl = document.querySelector('.nova-jump-title')
  if (btEl) btEl.textContent = logoText
  var processed   = processMenus(menuList)
  var menuTree    = processed.menuTree
  var routeMeta   = processed.routeMeta
  var bcIconMap   = processed.bcIconMap
  var defaultPath = processed.defaultPath
  var parentKeyMap = processed.parentKeyMap
  var tplMeta      = processed.tplMeta || {}
  window.__tplMeta = tplMeta

  // 初始化菜单 code 映射（供 build/data 接口添加 menuCode 请求头）
  window.__initMenuCodeMap(menuList)
  // 初始化按钮权限集（供按钮权限校验）
  window.__initButtonCodes(menuList)

  // ── 桥接组件：从 provider 内部获取 dialog/message，天然继承主题 ──
  const DialogBridge = {
    setup() {
      window.$dialog  = useDialog()
      window.$message = useMessage()
      // 页面顶部加载条：由真实接口触发 start/finish（首屏被全屏 boot 覆盖，不显示）
      // finish 仅在 start 后生效，避免 embedded/弹窗等无路由切换场景误结束
      var _lbStarted = false
      window.$loadingBar = useLoadingBar()
      window.__novaPageLoading = {
        start: function () {
          if (!window.$loadingBar) return
          _lbStarted = true
          window.$loadingBar.start()
        },
        finish: function () {
          if (!window.$loadingBar || !_lbStarted) return
          _lbStarted = false
          window.$loadingBar.finish()
        }
      }
    },
    template: '<div style="display:none"></div>'
  }

  // ── 布局组件 ──────────────────────────────────────────────────
  const App = {
    components: { DialogBridge },
    setup() {
      const router = useRouter()
      const route  = useRoute()

      const collapsed  = ref(false)
      // 左上角品牌文字（index.json logoText）
      const logoText = ref(config.logoText)
      // 优先读取前端缓存的主题，未缓存时回退到配置默认值
      const savedTheme = localStorage.getItem('nova-theme')
      const isDark     = ref(savedTheme !== null ? savedTheme === 'night' : config.theme.default === 'night')
      const togglePos = config.menu.toggle.default
      const openedTabs = ref([])
      const activeTab  = ref('')
      const tabsKey    = ref(0)
      const expandedKeys = ref([])

      // ── 右键菜单 ──────────────────────────────────────────────────
      const contextMenuShow = ref(false)     // v-if 控制容器
      const contextMenuInner = ref(false)    // :show 控制 n-dropdown 弹出
      const contextMenuX = ref(0)
      const contextMenuY = ref(0)
      const contextMenuTabKey = ref('')

      // 下拉/右键菜单项图标辅助
      const mi = (icon) => () => h(NIcon, { size: 14 }, { default: () => h('iconify-icon', { icon }) })

      const contextMenuOptions = computed(() => {
        const idx = openedTabs.value.findIndex(t => t.key === contextMenuTabKey.value)
        const hasLeft = idx > 0
        const hasRight = idx >= 0 && idx < openedTabs.value.length - 1
        const hasOther = openedTabs.value.length > 1
        return [
          { label: '关闭', key: 'close', icon: mi('material-symbols:close'), disabled: !hasOther },
          { label: '重新加载', key: 'reload', icon: mi('material-symbols:refresh') },
          { type: 'divider', key: 'd1' },
          { label: '关闭左侧标签页', key: 'closeLeft', icon: mi('material-symbols:chevron-left'), disabled: !hasLeft },
          { label: '关闭右侧标签页', key: 'closeRight', icon: mi('material-symbols:chevron-right'), disabled: !hasRight },
          { label: '关闭其他标签页', key: 'closeOther', icon: mi('material-symbols:close'), disabled: !hasOther },
        ]
      })

      const theme = computed(() => isDark.value ? darkTheme : null)
      // 是否为独立页面（登录/404 等，无布局）
      const isStandaloneRoute = computed(() => route.path === '/login' || route.path === '/404')

      watch(isDark, (val) => {
        document.body.classList.toggle('dark', val)
        localStorage.setItem('nova-theme', val ? 'night' : 'daytime')
      }, { immediate: true })

      // 暴露黑夜模式状态给子组件
      window.__appDarkMode = isDark

      // 监听路由变化，维护 tab 列表
      watch(() => route.fullPath, (fullPath) => {
        const path = route.path
        if (path === '/' || path === '/login') return
        // noTab 路由（如首页）：仅切换显示，不生成 tab，不展开菜单
        if (route.meta && route.meta.noTab) {
          activeTab.value = path
          return
        }
        // TPL 嵌入页：path 已包含 code（如 /tpl/localTpl），直接用 path 做 tab key
        const tplCode = route.params.code
        const tabKey = path
        const tplInfo = tplCode ? tplMeta[tplCode] : null
        const meta = tplInfo
          ? { title: tplInfo.title, icon: tplInfo.icon }
          : (routeMeta[path] || { title: path, icon: null })
        if (!openedTabs.value.find(t => t.key === tabKey)) {
          openedTabs.value.push({
            key: tabKey, title: meta.title, icon: meta.icon, closable: true,
            // 组件唯一名：配合 keep-alive include 精确控制缓存（关闭 tab 即移出 include → 实例被销毁）
            cmpName: tplCode ? ('TplPage_' + tplCode) : (path.indexOf('/nova/') === 0 ? ('NovaPage_' + path.slice('/nova/'.length)) : undefined)
          })
        }
        activeTab.value = tabKey
        // 自动展开当前路由的祖先菜单节点（支持 TPL）
        const ancestors = []
        const menuKey = tplCode || path
        let cur = menuKey ? parentKeyMap[menuKey] : undefined
        while (cur) { ancestors.push(cur); cur = parentKeyMap[cur] }
        if (ancestors.length) {
          expandedKeys.value = [...new Set([...expandedKeys.value, ...ancestors])]
        }
      }, { immediate: true })

      // 面包屑
      const breadcrumbItems = computed(() => {
        const tplCode = route.params.code
        if (tplCode) {
          const tpl = tplMeta[tplCode]
          if (tpl && tpl.breadcrumb) {
            return tpl.breadcrumb.map(label => ({ label, icon: bcIconMap[label] || null }))
          }
        }
        const meta = routeMeta[route.path]
        if (meta && meta.breadcrumb) {
          return meta.breadcrumb.map(label => ({ label, icon: bcIconMap[label] || null }))
        }
        return []
      })

      // 菜单选中值：NOVA 用 path，TPL 用 code
      const menuSelectedKey = Vue.computed(() => {
        const tplCode = route.params.code
        if (tplCode) return tplCode
        return route.path
      })

      const handleMenuSelect = (key, item) => {
        if (item && item._raw && item._raw.type === 'TPL' && item._raw.value) {
          router.push('/tpl/' + item._raw.code)
        } else if (key.startsWith('/')) {
          router.push(key)
        }
      }

      const tabVersions = Vue.ref({})

      const handleTabClose = (key) => {
        const idx = openedTabs.value.findIndex(t => t.key === key)
        if (idx > -1) {
          openedTabs.value.splice(idx, 1)
          tabVersions.value = { ...tabVersions.value, [key]: (tabVersions.value[key] || 0) + 1 }
          if (activeTab.value === key) {
            const last = openedTabs.value[openedTabs.value.length - 1]
            if (last) router.push(last.key)
          }
        }
      }

      // ── Tab 右键菜单 ──────────────────────────────────────────────
      const handleTabContextMenu = (e, tabKey) => {
        e.preventDefault()
        const rect = e.currentTarget.getBoundingClientRect()
        contextMenuX.value = rect.left
        contextMenuY.value = rect.bottom
        contextMenuTabKey.value = tabKey
        contextMenuInner.value = false
        contextMenuShow.value = true
        // 下一帧再显示，触发 n-dropdown 内置淡入动画
        nextTick(() => { contextMenuInner.value = true })
      }

      const handleContextMenuSelect = (menuKey) => {
        const tabKey = contextMenuTabKey.value
        if (!tabKey) return
        const idx = openedTabs.value.findIndex(t => t.key === tabKey)
        if (idx < 0) return

        if (menuKey === 'close') {
          handleTabClose(tabKey)
        } else if (menuKey === 'reload') {
          tabVersions.value = { ...tabVersions.value, [tabKey]: (tabVersions.value[tabKey] || 0) + 1 }
        } else if (menuKey === 'closeLeft' && idx > 0) {
          const remaining = openedTabs.value.slice(idx)
          const closed = openedTabs.value.slice(0, idx)
          openedTabs.value = remaining
          closed.forEach(t => { tabVersions.value = { ...tabVersions.value, [t.key]: (tabVersions.value[t.key] || 0) + 1 } })
          if (!remaining.find(t => t.key === activeTab.value)) {
            router.push(remaining[remaining.length - 1].key)
          }
        } else if (menuKey === 'closeRight' && idx < openedTabs.value.length - 1) {
          const remaining = openedTabs.value.slice(0, idx + 1)
          const closed = openedTabs.value.slice(idx + 1)
          openedTabs.value = remaining
          closed.forEach(t => { tabVersions.value = { ...tabVersions.value, [t.key]: (tabVersions.value[t.key] || 0) + 1 } })
          if (!remaining.find(t => t.key === activeTab.value)) {
            router.push(remaining[remaining.length - 1].key)
          }
        } else if (menuKey === 'closeOther') {
          const kept = openedTabs.value.filter(t => t.key === tabKey)
          const closed = openedTabs.value.filter(t => t.key !== tabKey)
          openedTabs.value = kept
          closed.forEach(t => { tabVersions.value = { ...tabVersions.value, [t.key]: (tabVersions.value[t.key] || 0) + 1 } })
          if (activeTab.value !== tabKey) router.push(tabKey)
        }
        hideContextMenu()
      }

      // 关闭菜单（带淡出动画）
      const hideContextMenu = () => {
        contextMenuInner.value = false
        setTimeout(() => { contextMenuShow.value = false }, 200)
      }

      // 菜单关闭：window resize 时直接移除
      window.addEventListener('resize', function () { contextMenuShow.value = false })

      const routeKey = Vue.computed(() =>
        route.path + '_' + (tabVersions.value[route.path] || 0)
      )

      // ── 页面组件包装：为每个表页/模板页生成唯一 name 的包装组件，
      // 配合 keep-alive include 精确控制缓存——关闭 tab 后其 name 移出 include，实例被真正销毁
      const novaPageWraps = {}
      const tplPageWraps = {}
      const pageComponent = Vue.computed(() => {
        const p = route.path
        if (p.indexOf('/nova/') === 0) {
          const n = p.slice('/nova/'.length)
          const key = 'NovaPage_' + n
          if (!novaPageWraps[key]) {
            novaPageWraps[key] = { name: key, render: () => h(window.NovaTable) }
          }
          return novaPageWraps[key]
        }
        if (p.indexOf('/tpl/') === 0) {
          const code = route.params.code
          const key = 'TplPage_' + code
          if (!tplPageWraps[key]) {
            tplPageWraps[key] = { name: key, render: () => h(TplPage) }
          }
          return tplPageWraps[key]
        }
        return undefined
      })
      // keep-alive 缓存白名单：仅当前打开的 tab（关闭后自动移出，实例销毁）
      const cachedNames = Vue.computed(() => openedTabs.value.map(t => t.cmpName))

      const handleTabClick = (key) => router.push(key)
      const goHome = () => {
        // replaceState 改 hash 不触发 SPA 导航，直接整页刷新，避免先闪主页元素再出动画
        history.replaceState(null, '', '#/home')
        window.location.reload()
      }
      // 用户信息（从 localStorage 读取）
      const userName   = ref(localStorage.getItem('nova_user') || '未登录')
      const userAlias  = ref(localStorage.getItem('nova_alias') || '')
      const userAvatar = ref(localStorage.getItem('nova_avatar') || '')

      // 右上角用户下拉：第一列用户信息头（头像+名称/昵称），下面个人中心/退出登录带图标
      const userDropdown = [
        {
          type: 'render',
          key: 'user-header',
          render: () => h('div', {
            style: 'display:flex;align-items:center;gap:12px;padding:4px 12px;width:150px;box-sizing:border-box'
          }, [
            h(NAvatar, {
              size: 40,
              round: true,
              style: 'flex-shrink:0',
              ...(userAvatar.value ? { src: userAvatar.value } : {})
            }, userAvatar.value ? {} : { default: () => h(NIcon, { size: 40 }, { default: () => h('iconify-icon', { icon: 'material-symbols:account-circle' }) }) }),
            h('div', { style: 'display:flex;flex-direction:column;justify-content:center;min-width:0;flex:1' }, [
              h('span', { class: 'user-drop-header-alias' }, userAlias.value || '-'),
              h('span', { class: 'user-drop-header-name', style: 'margin-top:3px' }, userName.value)
            ])
          ])
        },
        { type: 'divider', key: 'd1' },
        { label: '个人中心', key: 'profile', icon: mi('material-symbols:person-outline') },
        { label: '退出登录', key: 'logout', icon: mi('material-symbols:logout') }
      ]

      // 个人中心弹窗状态
      const showProfile = ref(false)
      const profileSaving = ref(false)
      const profileFormRef = ref(null)
      const profileForm = ref({ token: '', avatar: '', name: '', alias: '' })
      const avatarFileList = ref([])
      const profileRules = {
        name: { required: true, message: '请输入名称', trigger: ['blur', 'input'] }
      }

      // 右上角用户菜单
      const handleUserMenuSelect = (key) => {
        if (key === 'profile') {
          // 反显当前用户信息（token 只读）
          const ava = localStorage.getItem('nova_avatar') || ''
          profileForm.value = {
            token: localStorage.getItem('nova_token') || '',
            avatar: ava,
            name: localStorage.getItem('nova_user') || '',
            alias: localStorage.getItem('nova_alias') || ''
          }
          // n-upload 按文件名后缀判断是否图片，反显需带图片扩展名才能显示缩略图
          avatarFileList.value = ava ? [{ name: 'avatar.jpg', url: ava, status: 'finished' }] : []
          showProfile.value = true
        }
        if (key === 'logout') {
          window.msg.confirm('warning', '退出登录', '确定要退出登录吗？', () => {
            window.fetchApi.post('/nova/authority/logout').finally(() => {
              // 清空本地登录态
              localStorage.removeItem('nova_token')
              localStorage.removeItem('nova_user')
              localStorage.removeItem('nova_alias')
              localStorage.removeItem('nova_avatar')
              // 跳到登录页并刷新（replaceState 改 hash 不触发 SPA 导航，避免先闪页面元素再出动画）
              history.replaceState(null, '', '#/login')
              window.location.reload()
            })
          })
        }
      }

      // 提交个人中心更新：调用后端更新接口，成功后同步本地与右上角
      const submitProfile = () => {
        profileFormRef.value.validate((errors) => {
          if (errors) return
          profileSaving.value = true
          window.fetchApi.post('/nova/authority/editUser', {
            name: profileForm.value.name,
            alias: profileForm.value.alias || '',
            avatar: profileForm.value.avatar || ''
          }).then(function (resp) {
            if (resp.code !== 200) return
            localStorage.setItem('nova_user', profileForm.value.name)
            localStorage.setItem('nova_alias', profileForm.value.alias || '')
            localStorage.setItem('nova_avatar', profileForm.value.avatar || '')
            userName.value = profileForm.value.name
            userAlias.value = profileForm.value.alias || ''
            userAvatar.value = profileForm.value.avatar || ''
            if (window.$message) window.$message.success('更新成功')
            showProfile.value = false
          }).catch(function () {
            if (window.$message) window.$message.error('更新失败')
          }).finally(() => {
            profileSaving.value = false
          })
        })
      }

      // 头像图片上传（复用 /nova/attachment/upload 现成接口）
      const handleAvatarUpload = ({ file, onFinish, onError }) => {
        var formData = new FormData()
        formData.append('novaName', 'user')
        formData.append('files', file.file)
        window.fetchApi.upload('/nova/attachment/upload', formData).then(function(resp) {
          if (resp.data && resp.data.length) {
            profileForm.value.avatar = resp.data[0]
            if (window.$message) window.$message.success('上传成功')
            onFinish()
          } else {
            if (window.$message) window.$message.error('上传失败')
            onError()
          }
        }).catch(function() {
          if (window.$message) window.$message.error('上传失败')
          onError()
        })
      }
      // 删除头像时清空必填值
      const onAvatarRemove = () => { profileForm.value.avatar = '' }

      // 自定义下横线
      const barStyle = ref({ transform: 'translateX(0px)', width: '0px', opacity: 0 })
      const barReady = ref(false)
      const tabBarRef = ref(null)

      const updateBar = (animate) => {
        nextTick(() => {
          if (!tabBarRef.value) return
          const wrapEl   = tabBarRef.value
          const activeEl = wrapEl.querySelector('.n-tabs-tab--active')
          if (!activeEl) return
          let left = 0
          let el   = activeEl
          while (el && el !== wrapEl) {
            left += el.offsetLeft
            el    = el.offsetParent
          }
          if (!animate) barReady.value = false
          barStyle.value = { transform: 'translateX(' + left + 'px)', width: activeEl.offsetWidth + 'px', opacity: 1 }
          if (!animate) nextTick(() => { barReady.value = true })
        })
      }

      watch(activeTab, () => updateBar(true))
      watch(openedTabs, () => updateBar(true), { deep: true })
      // 首次定位不播动画
      watch(tabBarRef, (el) => { if (el) updateBar(false) }, { once: true })

      return {
        collapsed, isDark, togglePos, theme, themeOverrides, openedTabs, activeTab, expandedKeys, tabsKey,
        menuTree, breadcrumbItems, zhCN, dateZhCN, routeKey, isStandaloneRoute, menuSelectedKey,
        pageComponent, cachedNames,
        handleMenuSelect, handleTabClose, handleTabClick, goHome, userDropdown, handleUserMenuSelect,
        contextMenuShow, contextMenuInner, contextMenuX, contextMenuY, contextMenuOptions, handleTabContextMenu, handleContextMenuSelect, hideContextMenu,
        barStyle, barReady, tabBarRef, userName, userAlias, userAvatar, logoText,
        showProfile, profileSaving, profileFormRef, profileForm, profileRules, submitProfile,
        avatarFileList, handleAvatarUpload, onAvatarRemove
      }
    },

    template: `
      <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
        <n-loading-bar-provider>
        <n-message-provider>
          <n-dialog-provider>
            <dialog-bridge />
            <n-notification-provider>

              <!-- 独立页面（登录/404 等）：无侧边栏/头部/tab 布局 -->
              <router-view v-if="isStandaloneRoute" v-slot="{ Component }">
                <component :is="Component" />
              </router-view>

              <!-- 主布局：带侧边栏/头部/tab -->
              <div v-else>
                <n-layout has-sider style="height:100vh">

                  <!-- 侧边栏 -->
                  <n-layout-sider bordered :collapsed="collapsed" collapse-mode="width" :collapsed-width="64" :width="220" :show-trigger="togglePos === 'down' ? 'bar' : false" @update:collapsed="collapsed = $event">
                    <div style="height:50px;display:flex;align-items:center;justify-content:center;cursor:pointer" @click="goHome">
                      <div style="display:flex;align-items:center;gap:8px">
                        <img src="logo.png" class="sidebar-logo" />
                        <span v-show="!collapsed" class="logo-text">{{ logoText }}</span>
                      </div>
                    </div>
                    <n-menu
                      :value="menuSelectedKey"
                      :options="menuTree"
                      :collapsed="collapsed"
                      :collapsed-width="64"
                      :collapsed-icon-size="22"
                      :expanded-keys="expandedKeys"
                      @update:expanded-keys="expandedKeys = $event"
                      @update:value="handleMenuSelect"
                    />
                  </n-layout-sider>

                  <!-- 右侧主区域 -->
                  <n-layout content-style="display:flex;flex-direction:column;overflow:hidden">

                    <!-- 顶部 Header -->
                    <n-layout-header bordered style="height:50px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
                      <div style="display:flex;align-items:center;gap:12px">
                        <n-icon v-if="togglePos !== 'down'" size="20" style="cursor:pointer" @click="collapsed=!collapsed">
                          <iconify-icon icon="material-symbols:menu"></iconify-icon>
                        </n-icon>
                        <n-breadcrumb separator=">">
                          <n-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="item.label" class="breadcrumb-slide-in" :style="{ '--i': index }">
                            <n-icon :size="14" style="margin-right:4px;vertical-align:middle" v-if="item.icon">
                              <iconify-icon :icon="item.icon"></iconify-icon>
                            </n-icon>
                            {{ item.label }}
                          </n-breadcrumb-item>
                        </n-breadcrumb>
                      </div>
                      <n-space align="center" :size="4">
                        <nova-message />
                        <div class="header-action theme-switch">
                          <n-icon size="18"><iconify-icon icon="material-symbols:dark-mode-outline"></iconify-icon></n-icon>
                          <n-switch v-model:value="isDark" />
                          <n-icon size="18"><iconify-icon icon="material-symbols:light-mode-outline"></iconify-icon></n-icon>
                        </div>
                        <n-dropdown :options="userDropdown" trigger="hover" @select="handleUserMenuSelect">
                          <div class="header-action user-info">
                            <n-avatar
                              v-if="userAvatar"
                              :src="userAvatar"
                              size="small"
                              round
                              style="width:28px;height:28px"
                            />
                            <n-icon v-else size="22"><iconify-icon icon="material-symbols:account-circle"></iconify-icon></n-icon>
                            <span style="font-size:14px">{{ userAlias || userName }}</span>
                          </div>
                        </n-dropdown>
                      </n-space>
                    </n-layout-header>

                    <!-- Tab 栏 -->
                    <div class="tab-bar tab-bar-wrap" style="padding:8px 16px 0;display:flex;align-items:flex-start;gap:4px;flex-shrink:0" ref="tabBarRef">
                      <n-tabs type="line" :key="tabsKey" :value="activeTab" :tabs-padding="0" @update:value="handleTabClick" style="flex:1;min-width:0">
                        <n-tab
                          v-for="tab in openedTabs" :key="tab.key" :name="tab.key"
                          :closable="tab.closable && openedTabs.length > 1" @close.stop="handleTabClose(tab.key)"
                          @contextmenu.prevent="handleTabContextMenu($event, tab.key)"
                          style="padding:6px 12px;font-size:13px"
                        >
                          <span style="display:inline-flex;align-items:center;gap:4px">
                            <n-icon :size="14" v-if="tab.icon"><iconify-icon :icon="tab.icon"></iconify-icon></n-icon>
                            {{ tab.title }}
                            <n-icon v-if="tab.closable && openedTabs.length > 1" :size="12" style="cursor:pointer;margin-left:4px" @click.stop="handleTabClose(tab.key)">
                              <iconify-icon icon="material-symbols:close"></iconify-icon>
                            </n-icon>
                          </span>
                        </n-tab>
                      </n-tabs>
                      <div class="tab-bar-line" :class="{ 'bar-ready': barReady }" :style="barStyle"></div>
                    </div>

                    <!-- 内容区 -->
                    <n-layout-content class="page-content" style="flex:1 1 auto;min-height:0">
                      <router-view v-slot="{ Component }">
                        <transition name="page-fade" mode="out-in">
                          <keep-alive :include="cachedNames" :max="20">
                            <component :is="pageComponent || Component" :key="routeKey" />
                          </keep-alive>
                        </transition>
                      </router-view>
                    </n-layout-content>

                  </n-layout>
                </n-layout>
              </div>

            </n-notification-provider>
          </n-dialog-provider>
        </n-message-provider>
        </n-loading-bar-provider>

        <!-- 个人中心弹窗 -->
        <n-modal v-model:show="showProfile" preset="card" title="个人中心" style="width:420px;margin-top:60px">
          <n-form ref="profileFormRef" :model="profileForm" :rules="profileRules"
            label-placement="left" label-width="70" style="margin-top:4px">
            <n-form-item label="Token" path="token">
              <n-input v-model:value="profileForm.token" disabled />
            </n-form-item>
            <n-form-item label="头像" path="avatar">
              <n-upload
                v-model:file-list="avatarFileList"
                :max="1"
                list-type="image-card"
                accept="image/*"
                :custom-request="handleAvatarUpload"
                @remove="onAvatarRemove"
              />
            </n-form-item>
            <n-form-item label="昵称" path="alias">
              <n-input v-model:value="profileForm.alias" placeholder="请输入昵称" />
            </n-form-item>
            <n-form-item label="名称" path="name">
              <n-input v-model:value="profileForm.name" placeholder="请输入名称" />
            </n-form-item>
          </n-form>
          <template #footer>
            <div style="display:flex;justify-content:flex-end">
              <n-button type="primary" :loading="profileSaving" @click="submitProfile">更新信息</n-button>
            </div>
          </template>
        </n-modal>

        <!-- Tab 右键菜单 -->
        <div v-if="contextMenuShow" :key="contextMenuTabKey"
             :style="{ position:'fixed', left:contextMenuX+'px', top:contextMenuY+'px', width:0, height:0 }">
          <n-dropdown trigger="manual" :show="contextMenuInner" :options="contextMenuOptions"
            placement="bottom-start"
            @select="handleContextMenuSelect"
            @clickoutside="hideContextMenu">
            <div style="width:1px;height:1px;pointer-events:none"></div>
          </n-dropdown>
        </div>
      </n-config-provider>
    `
  }

  // ── 路由 ────────────────────────────────────────────────────────
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      // 已登录直接进首页，避免经过登录页触发的整页刷新（否则首屏 loading 会播两遍）
      { path: '/',                    redirect: () => localStorage.getItem('nova_token') ? '/home' : '/login' },
      { path: '/login',               component: LoginPage, meta: { loginRequired: false } },
      { path: '/home',                component: HomePage, meta: { noTab: true } },
      { path: '/404',                 component: NotFoundPage, meta: { loginRequired: false } },
      { path: '/tpl/:code',           component: TplPage },
      { path: '/nova/:novaName',      component: window.NovaTable },
      { path: '/:pathMatch(.*)*',     redirect: '/404' },
    ]
  })

  // 登录过期：挂载后立即跳到登录页
  if (loginExpired) {
    router.push('/login')
  }

  // 路由守卫：未登录拦截；独立页面（登录/404）不显示顶部加载条
  router.beforeEach((to, from, next) => {
    if (to.path !== '/login' && to.path !== '/404') {
      if (window.__novaPageLoading) window.__novaPageLoading.start()
    }
    var token = localStorage.getItem('nova_token')
    if (to.path !== '/login' && to.path !== '/404' && !token) {
      next('/login')
    } else {
      next()
    }
  })

  // 页面切换顶部加载条：表格页由 build 完成触发 finish；非表格页（home/TPL 等无 build）兜底结束
  router.afterEach((to) => {
    if (!to.path || to.path.indexOf('/nova/') !== 0) {
      if (window.__novaPageLoading) {
        setTimeout(function () { window.__novaPageLoading.finish() }, 300)
      }
    }
  })

  // ── 挂载 ────────────────────────────────────────────────────────
  const app = createApp(App)
  app.use(naive)
  app.use(router)
  // 全局注册消息铃铛组件（模板中使用 <nova-message />）
  app.component('NovaMessage', window.NovaMessage)
  // 暴露 router 供 LoginPage 等独立组件使用
  window.__novaRouter = router
  app.mount('#app')
  // 挂载完成后淡出首屏 loading：此时主线程空闲，过渡动画不被打断
  hideBootLoading()
}

})()
