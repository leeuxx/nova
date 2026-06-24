// js/app.js — 路由 + 布局组件，先加载菜单再挂载 Vue 应用
;(function () {
const { createApp, ref, h, computed, watch, nextTick } = Vue
const { createRouter, createWebHashHistory, useRoute, useRouter } = VueRouter
const {
  NConfigProvider, NLayout, NLayoutSider, NLayoutHeader, NLayoutContent,
  NMenu, NIcon, NDropdown, NSpace, NTabs, NTab, NSpin, NSwitch,
  NBreadcrumb, NBreadcrumbItem, NBadge,
  NMessageProvider, NDialogProvider, NNotificationProvider,
  darkTheme, zhCN, dateZhCN
} = naive

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

  // 第一遍：建 nodeMap
  list.forEach(function (item) {
    // type=table 才有路由，其他类型（目录/未实现）key 用 code 占位且不可点击
    var key      = item.type === 'table' ? '/nova/' + item.value : item.code
    var disabled = !item.type || item.type === ''  ? false  // 目录：不禁用（可展开）
                 : item.type === 'table'            ? false  // 表格：可点击
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

  // 第二遍：组装树
  var roots = []
  list.forEach(function (item) {
    var node = nodeMap[item.id]
    if (item.pid && nodeMap[item.pid]) {
      var parent = nodeMap[item.pid]
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // 第三遍：只给 type=table 的叶子节点构建 routeMeta（含面包屑路径）
  list.forEach(function (item) {
    if (item.type !== 'table' || !item.value) return
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

  return { menuTree: roots, routeMeta: routeMeta, bcIconMap: bcIconMap, defaultPath: defaultPath }
}

// ─── themeOverrides ──────────────────────────────────────────────
const themeOverrides = {
  common: {
    borderRadius: '6px', borderRadiusSmall: '4px',
    primaryColor: '#2563eb', primaryColorHover: '#1d4ed8', primaryColorPressed: '#1e40af'
  }
}

// ─── 挂载入口：先拉菜单，再创建 Vue 应用 ────────────────────────
$.ajax({
  url:         '/nova/user/getMenu',
  method:      'POST',
  contentType: 'application/json',
  data:        '{}',
  success:  function (resp) { mountApp((resp.code === 200 && resp.data) ? resp.data : []) },
  error:    function ()      { mountApp([]) }
})

function mountApp(menuList) {
  var processed   = processMenus(menuList)
  var menuTree    = processed.menuTree
  var routeMeta   = processed.routeMeta
  var bcIconMap   = processed.bcIconMap
  var defaultPath = processed.defaultPath

  // ── 布局组件 ──────────────────────────────────────────────────
  const App = {
    setup() {
      const router = useRouter()
      const route  = useRoute()

      const collapsed  = ref(false)
      const isDark     = ref(false)
      const openedTabs = ref([])
      const activeTab  = ref('')

      const theme = computed(() => isDark.value ? darkTheme : null)

      watch(isDark, (val) => { document.body.classList.toggle('dark', val) })

      // 暴露黑夜模式状态给子组件
      window.__appDarkMode = isDark

      // 监听路由变化，维护 tab 列表
      watch(() => route.path, (path) => {
        if (path === '/') return
        const meta = routeMeta[path] || { title: path, icon: null }
        if (!openedTabs.value.find(t => t.key === path)) {
          openedTabs.value.push({ key: path, title: meta.title, icon: meta.icon, closable: path !== '/home' })
        }
        activeTab.value = path
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

      const handleTabClose = (key) => {
        const idx = openedTabs.value.findIndex(t => t.key === key)
        if (idx > -1) {
          openedTabs.value.splice(idx, 1)
          if (activeTab.value === key) {
            const last = openedTabs.value[openedTabs.value.length - 1]
            if (last) router.push(last.key)
          }
        }
      }

      const handleTabClick = (key) => router.push(key)
      const userDropdown   = [{ label: '个人中心', key: 'profile' }, { label: '退出登录', key: 'logout' }]

      return {
        collapsed, isDark, theme, themeOverrides, openedTabs, activeTab,
        menuTree, breadcrumbItems, zhCN, dateZhCN,
        handleMenuSelect, handleTabClose, handleTabClick, userDropdown
      }
    },

    template: `
      <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
        <n-message-provider>
          <n-dialog-provider>
            <n-notification-provider>
              <n-layout has-sider style="height:100vh">

                <!-- 侧边栏 -->
                <n-layout-sider bordered :collapsed="collapsed" collapse-mode="width" :collapsed-width="64" :width="220">
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
                    @update:value="handleMenuSelect"
                  />
                </n-layout-sider>

                <!-- 右侧主区域 -->
                <n-layout>

                  <!-- 顶部 Header -->
                  <n-layout-header bordered style="height:50px;padding:0 16px;display:flex;align-items:center;justify-content:space-between">
                    <div style="display:flex;align-items:center;gap:12px">
                      <n-icon size="20" style="cursor:pointer" @click="collapsed=!collapsed">
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
                      <n-dropdown :options="userDropdown" trigger="hover">
                        <div class="header-action user-info">
                          <iconify-icon icon="material-symbols:account-circle" style="font-size:22px"></iconify-icon>
                          <span style="font-size:14px">Super</span>
                        </div>
                      </n-dropdown>
                    </n-space>
                  </n-layout-header>

                  <!-- Tab 栏 -->
                  <div class="tab-bar" style="padding:8px 16px 0;display:flex;align-items:flex-start;gap:4px">
                    <n-tabs type="line" :value="activeTab" :tabs-padding="0" @update:value="handleTabClick" style="flex:1;min-width:0">
                      <n-tab
                        v-for="tab in openedTabs" :key="tab.key" :name="tab.key"
                        :closable="tab.closable" @close.stop="handleTabClose(tab.key)"
                        style="padding:6px 12px;font-size:13px"
                      >
                        <span style="display:inline-flex;align-items:center;gap:4px">
                          <n-icon :size="14" v-if="tab.icon"><iconify-icon :icon="tab.icon"></iconify-icon></n-icon>
                          {{ tab.title }}
                          <n-icon v-if="tab.closable" :size="12" style="cursor:pointer;margin-left:4px" @click.stop="handleTabClose(tab.key)">
                            <iconify-icon icon="material-symbols:close"></iconify-icon>
                          </n-icon>
                        </span>
                      </n-tab>
                    </n-tabs>
                  </div>

                  <!-- 内容区 -->
                  <n-layout-content class="page-content">
                    <router-view v-slot="{ Component }">
                      <transition name="page-fade" mode="out-in">
                        <keep-alive>
                          <component :is="Component" :key="$route.path" />
                        </keep-alive>
                      </transition>
                    </router-view>
                  </n-layout-content>

                </n-layout>
              </n-layout>
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
      { path: '/',              redirect: defaultPath },
      { path: '/home',          component: { template: '<div style="padding:24px"><h2>欢迎使用 Nova Admin</h2><p>请从左侧菜单进入各功能模块。</p></div>' } },
      { path: '/nova/:novaName', component: window.NovaTable }
    ]
  })

  // ── 挂载 ────────────────────────────────────────────────────────
  const { message, dialog } = naive.createDiscreteApi(
    ['message', 'dialog'],
    { configProviderProps: { themeOverrides: themeOverrides } }
  )
  window.$message = message
  window.$dialog  = dialog

  const app = createApp(App)
  app.use(naive)
  app.use(router)
  app.mount('#app')
}

})()
