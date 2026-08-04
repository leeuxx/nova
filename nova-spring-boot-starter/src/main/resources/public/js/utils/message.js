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

  created() {
    this._seq = 0
    this.fetchMessages()
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
      this.messages.splice(i, 1)
      this.count = this.messages.length
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
    },

    // 内容较长才需要展开/收起（粗略按字符数判断）
    isLong(i) {
      const msg = this.messages[i]
      return !!(msg && String(msg.content || '').length > 60)
    }
  },

  template: `
    <div class="header-action">
      <n-badge :value="count" :max="99" :show="count > 0">
        <n-icon size="20" :class="{ 'bell-ring': count > 0 }" style="cursor:pointer" @click="openDrawer">
          <iconify-icon icon="mdi:bell-outline"></iconify-icon>
        </n-icon>
      </n-badge>

      <n-drawer v-model:show="showDrawer" placement="right" :width="400" class="msg-drawer">
        <n-drawer-content title="消息中心">
          <div v-if="loading" class="msg-center-loading">加载中...</div>
          <div v-else-if="messages.length === 0" class="msg-center-empty">暂无消息</div>
          <transition-group v-else tag="div" name="msg" class="msg-center-list">
            <div v-for="(msg, i) in messages" :key="msg._key" class="msg-center-item" :class="{ expanded: expandedMap[i] }" @click="toggleExpand(i, $event)">
              <n-button v-if="msg.close" class="msg-center-x" size="tiny" text @click.stop="removeMessage(i)">
                <iconify-icon icon="material-symbols:close"></iconify-icon>
              </n-button>
              <div v-if="msg.title" class="msg-center-title">{{ msg.title }}</div>
              <div class="msg-center-content">{{ msg.content }}</div>
              <div v-if="isLong(i)" class="msg-center-foot">
                <span class="msg-center-hint">{{ expandedMap[i] ? '收起' : '展开' }}</span>
              </div>
            </div>
          </transition-group>
        </n-drawer-content>
      </n-drawer>
    </div>
  `
}

})()
