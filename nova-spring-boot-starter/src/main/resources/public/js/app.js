// js/app.js — 路由 + 布局组件，先加载菜单再挂载 Vue 应用
;(function () {

// ─── 独立页面快速退出：404 页面不加载任何资源 ──────────────────────
if (window.location.hash === '#/404') {
  document.getElementById('app').innerHTML = window._404_TEMPLATE || '404'
  return
}

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
  NMessageProvider, NDialogProvider, NNotificationProvider,
  useDialog, useMessage,
  darkTheme, zhCN, dateZhCN
} = naive

// 登录页面组件
const LoginPage = window.LoginPage
// 404 页面组件
const NotFoundPage = window.NotFoundPage

// ─── 图标辅助 ────────────────────────────────────────────────────
function iconNode(iconName) {
  return () => h(NIcon, { size: 18 }, {
    default: () => h('iconify-icon', { icon: iconName, style: 'font-size:1em;display:block' })
  })
}

// ─── 将后端平铺菜单列表转为 NMenu 树 + routeMeta + bcIconMap ────
function processMenus(list) {
  var nodeMap    = {}
  var routeMeta  = { '/home': { title: '首页', icon: 'material-symbols:home-outline', breadcrumb: null } }
  var bcIconMap  = { '首页': 'material-symbols:home-outline' }
  var defaultPath = '/home'

  // 第一遍：建 nodeMap（show===false 的菜单不加入导航树）
  list.forEach(function (item) {
    if (item.show === false) return
    // type=NOVA 才有路由，其他类型key 用 code 占位且不可点击
    var key      = item.type === 'NOVA' ? '/nova/' + item.value : item.code
    var disabled = item.type === 'DIR'  ? false  // 目录：不禁用（可展开）
                 : item.type === 'NOVA'            ? false  // nova视图：可点击
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

  return { menuTree: roots, routeMeta: routeMeta, bcIconMap: bcIconMap, defaultPath: defaultPath, parentKeyMap: parentKeyMap }
}

// ─── themeOverrides ──────────────────────────────────────────────
const themeOverrides = {
  common: {
    borderRadius: '6px', borderRadiusSmall: '4px',
    primaryColor: '#2563eb', primaryColorHover: '#1d4ed8', primaryColorPressed: '#1e40af'
  }
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
  // 无 token：直接挂载空菜单，显示登录页
  mountApp([], { theme: { default: 'daytime' }, menu: { toggle: { default: 'down' } } })
}

function mountApp(menuList, config, loginExpired) {
  var processed   = processMenus(menuList)
  var menuTree    = processed.menuTree
  var routeMeta   = processed.routeMeta
  var bcIconMap   = processed.bcIconMap
  var defaultPath = processed.defaultPath
  var parentKeyMap = processed.parentKeyMap

  // 初始化菜单 code 映射（供 build/data 接口添加 menuCode 请求头）
  window.__initMenuCodeMap(menuList)
  // 初始化按钮权限集（供按钮权限校验）
  window.__initButtonCodes(menuList)

  // ── 桥接组件：从 provider 内部获取 dialog/message，天然继承主题 ──
  const DialogBridge = {
    setup() {
      window.$dialog  = useDialog()
      window.$message = useMessage()
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
      // 优先读取前端缓存的主题，未缓存时回退到配置默认值
      const savedTheme = localStorage.getItem('nova-theme')
      const isDark     = ref(savedTheme !== null ? savedTheme === 'night' : config.theme.default === 'night')
      const togglePos = config.menu.toggle.default
      const openedTabs = ref([])
      const activeTab  = ref('')
      const tabsKey    = ref(0)
      const expandedKeys = ref([])

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
      watch(() => route.path, (path) => {
        if (path === '/' || path === '/login') return
        const meta = routeMeta[path] || { title: path, icon: null }
        if (!openedTabs.value.find(t => t.key === path)) {
          openedTabs.value.push({ key: path, title: meta.title, icon: meta.icon, closable: path !== '/home' })
        }
        activeTab.value = path
        // 自动展开当前路由的祖先菜单节点
        const ancestors = []
        let cur = parentKeyMap[path]
        while (cur) { ancestors.push(cur); cur = parentKeyMap[cur] }
        if (ancestors.length) {
          expandedKeys.value = [...new Set([...expandedKeys.value, ...ancestors])]
        }
      }, { immediate: true })

      // 面包屑
      const breadcrumbItems = computed(() => {
        const meta  = routeMeta[route.path]
        const items = [{ label: '首页', icon: 'material-symbols:home-outline' }]
        if (meta && meta.breadcrumb) {
          meta.breadcrumb.forEach(label => items.push({ label, icon: bcIconMap[label] || null }))
        }
        return items
      })

      const handleMenuSelect = (key) => { if (key.startsWith('/')) router.push(key) }

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

      const routeKey = Vue.computed(() =>
        route.path + '_' + (tabVersions.value[route.path] || 0)
      )

      const handleTabClick = (key) => router.push(key)
      const userDropdown   = [{ label: '个人中心', key: 'profile' }, { label: '退出登录', key: 'logout' }]

      // 用户信息（从 localStorage 读取）
      const userName   = ref(localStorage.getItem('nova_user') || '未登录')
      const userAlias  = ref(localStorage.getItem('nova_alias') || '')
      const userAvatar = ref(localStorage.getItem('nova_avatar') || '')

      // 右上角用户菜单
      const handleUserMenuSelect = (key) => {
        if (key === 'logout') {
          window.msg.confirm('warning', '退出登录', '确定要退出登录吗？', () => {
            window.fetchApi.post('/nova/authority/logout').finally(() => {
              // 清空本地登录态
              localStorage.removeItem('nova_token')
              localStorage.removeItem('nova_user')
              localStorage.removeItem('nova_alias')
              localStorage.removeItem('nova_avatar')
              // 跳到登录页并刷新
              window.location.hash = '#/login'
              window.location.reload()
            })
          })
        }
      }

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
        menuTree, breadcrumbItems, zhCN, dateZhCN, routeKey, isStandaloneRoute,
        handleMenuSelect, handleTabClose, handleTabClick, userDropdown, handleUserMenuSelect,
        barStyle, barReady, tabBarRef, userName, userAlias, userAvatar
      }
    },

    template: `
      <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
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
                    <div style="height:50px;display:flex;align-items:center;justify-content:center">
                      <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:28px;height:28px;background:linear-gradient(135deg,#2563eb,#3b82f6);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                          <iconify-icon icon="material-symbols:bolt" style="color:#fff;font-size:18px"></iconify-icon>
                        </div>
                        <span v-show="!collapsed" class="logo-text">Nova Admin</span>
                      </div>
                    </div>
                    <n-menu
                      :value="activeTab"
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
                  <n-layout>

                    <!-- 顶部 Header -->
                    <n-layout-header bordered style="height:50px;padding:0 16px;display:flex;align-items:center;justify-content:space-between">
                      <div style="display:flex;align-items:center;gap:12px">
                        <n-icon v-if="togglePos !== 'down'" size="20" style="cursor:pointer" @click="collapsed=!collapsed">
                          <iconify-icon icon="material-symbols:menu"></iconify-icon>
                        </n-icon>
                        <n-breadcrumb separator="»">
                          <n-breadcrumb-item v-for="item in breadcrumbItems" :key="item.label">
                            <n-icon :size="14" style="margin-right:4px;vertical-align:middle" v-if="item.icon">
                              <iconify-icon :icon="item.icon"></iconify-icon>
                            </n-icon>
                            {{ item.label }}
                          </n-breadcrumb-item>
                        </n-breadcrumb>
                      </div>
                      <n-space align="center" :size="4">
                        <div class="header-action">
                          <n-badge :value="3" :max="9">
                            <n-icon size="20"><iconify-icon icon="material-symbols:notifications-outline"></iconify-icon></n-icon>
                          </n-badge>
                        </div>
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
                    <div class="tab-bar tab-bar-wrap" style="padding:8px 16px 0;display:flex;align-items:flex-start;gap:4px" ref="tabBarRef">
                      <n-tabs type="line" :key="tabsKey" :value="activeTab" :tabs-padding="0" @update:value="handleTabClick" style="flex:1;min-width:0">
                        <n-tab
                          v-for="tab in openedTabs" :key="tab.key" :name="tab.key"
                          :closable="tab.closable && openedTabs.length > 1" @close.stop="handleTabClose(tab.key)"
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
                    <n-layout-content class="page-content">
                      <router-view v-slot="{ Component }">
                        <transition name="page-fade" mode="out-in">
                          <keep-alive :max="20">
                            <component :is="Component" :key="routeKey" />
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
      </n-config-provider>
    `
  }

  // ── 路由 ────────────────────────────────────────────────────────
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/',                    redirect: '/login' },
      { path: '/login',               component: LoginPage, meta: { loginRequired: false } },
      { path: '/home',                component: { template: '<div style="padding:24px"><h2>欢迎使用 Nova Admin</h2><p>请从左侧菜单进入各功能模块。</p></div>' } },
      { path: '/404',                 component: NotFoundPage, meta: { loginRequired: false } },
      { path: '/:pathMatch(.*)*',     redirect: '/404' },
      { path: '/nova/:novaName',      component: window.NovaTable }
    ]
  })

  // 登录过期：挂载后立即跳到登录页
  if (loginExpired) {
    router.push('/login')
  }

  // 路由守卫：未登录拦截
  router.beforeEach((to, from, next) => {
    var token = localStorage.getItem('nova_token')
    if (to.path !== '/login' && to.path !== '/404' && !token) {
      next('/login')
    } else {
      next()
    }
  })

  // ── 挂载 ────────────────────────────────────────────────────────
  const app = createApp(App)
  app.use(naive)
  app.use(router)
  // 暴露 router 供 LoginPage 等独立组件使用
  window.__novaRouter = router
  app.mount('#app')
}

})()
