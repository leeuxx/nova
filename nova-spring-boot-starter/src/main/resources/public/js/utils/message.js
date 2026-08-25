// js/utils/message.js - 消息铃铛 + 右侧消息抽屉组件
;(function () {

window.NovaMessage = {
  name: 'NovaMessage',

  data() {
    return {
      count: 0,          // 未读消息数（角标）
      showDrawer: false, // 右侧抽屉是否打开
      messages: [],
      loading: false,
      expandedMap: {}    // 每条消息是否展开（按索引）
    }
  },

  computed: {
    clearableCount() {
      return this.messages.filter((m) => m.close).length
    }
  },

  created() {
    this._seq = 0
    // 未登录（登录页）时不请求消息接口
    if (localStorage.getItem('nova_token')) {
      this.fetchMessages()
    }
  },

  methods: {
    fetchMessages() {
      this.loading = true
      window.fetchApi.post('/nova/message/getMessages')
        .then((resp) => {
          if (resp && Array.isArray(resp.data)) {
            this.messages = resp.data.map((m) => ({ ...m, _key: 'm' + (++this._seq) }))
            this.count = resp.data.length
          }
        })
        .catch(() => {})
        .finally(() => { this.loading = false })
    },

    openDrawer() {
      this.showDrawer = true
      // 每次打开重新拉取最新消息，角标同步
      this.fetchMessages()
    },

    removeMessage(i) {
      const msg = this.messages[i]
      if (!msg) return
      // 调用后端关闭接口，成功后再从列表移除（触发过渡动画）
      window.fetchApi.post('/nova/message/closeMessages', { ids: [msg.id] })
        .then(() => {
          this.messages.splice(i, 1)
          this.count = this.messages.length
        })
        .catch(() => {
          if (window.$message) window.$message.error('关闭消息失败')
        })
    },

    clearAll() {
      // 只关闭有 x 按钮（close=true）的消息
      const ids = this.messages.filter((m) => m.close).map((m) => m.id)
      if (ids.length === 0) {
        if (window.$message) window.$message.info('没有可关闭的消息')
        return
      }
      window.fetchApi.post('/nova/message/closeMessages', { ids })
        .then(() => {
          this.messages = this.messages.filter((m) => !m.close)
          this.count = this.messages.length
        })
        .catch(() => {
          if (window.$message) window.$message.error('清除失败')
        })
    },

    toggleExpand(i, e) {
      const expanding = !this.expandedMap[i]
      this.expandedMap[i] = expanding
      const card = e && e.currentTarget
      const el = card ? card.querySelector('.msg-center-content') : null
      if (!el) return
      // 等 DOM 更新（展开态 display/line-clamp 生效）后先解除 max-height 读取真实高度，再设回触发过渡
      this.$nextTick(() => {
        if (expanding) {
          el.style.maxHeight = 'none'
          const h = el.scrollHeight
          el.style.maxHeight = h + 'px'
        } else {
          el.style.maxHeight = '46px'
        }
      })
    }
  },

  template: `
    <div class="header-action" style="cursor:pointer" @click="openDrawer">
      <n-badge :value="count" :max="99" :show="count > 0">
        <n-icon size="20" :class="{ 'bell-ring': count > 0 }">
          <iconify-icon icon="mdi:bell-outline"></iconify-icon>
        </n-icon>
      </n-badge>

      <n-drawer v-model:show="showDrawer" placement="right" width="30%" class="msg-drawer">
        <n-drawer-content>
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
              <span>消息中心</span>
              <span v-if="clearableCount > 0" class="msg-clear-link" @click="clearAll">一键清除</span>
            </div>
          </template>
          <div v-if="loading" class="msg-center-loading">加载中...</div>
          <div v-else-if="messages.length === 0" class="msg-center-empty">暂无消息</div>
          <transition-group v-else tag="div" name="msg" class="msg-center-list">
            <div v-for="(msg, i) in messages" :key="msg._key" class="msg-center-item" :class="{ expanded: expandedMap[i] }" @click="toggleExpand(i, $event)">
              <n-button v-if="msg.close" class="msg-center-x" size="tiny" text @click.stop="removeMessage(i)">
                <iconify-icon icon="material-symbols:close"></iconify-icon>
              </n-button>
              <div v-if="msg.title" class="msg-center-title">
                <iconify-icon class="msg-ring" :class="{ 'bell-ring': msg.type === 'CRITICAL', 'ring-follow': msg.type === 'FOLLOW', 'ring-critical': msg.type === 'CRITICAL' }" icon="mdi:bell-ring-outline"></iconify-icon>
                {{ msg.title }}
              </div>
              <div class="msg-center-content" :style="(!msg.title && msg.close) ? 'padding-right:14px' : ''">
                <iconify-icon v-if="!msg.title" class="msg-ring" :class="{ 'bell-ring': msg.type === 'CRITICAL', 'ring-follow': msg.type === 'FOLLOW', 'ring-critical': msg.type === 'CRITICAL' }" icon="mdi:bell-ring-outline"></iconify-icon>
                {{ msg.content }}
              </div>
            </div>
          </transition-group>
        </n-drawer-content>
      </n-drawer>
    </div>
  `
}

})()
