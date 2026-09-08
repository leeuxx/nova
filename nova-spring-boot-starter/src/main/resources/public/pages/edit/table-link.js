// pages/edit/table-link.js — linkForm（中间表嵌入式表格 / linkTree 树）Vue 子组件

;(function () {

window.NovaLinkForm = {
  name: 'NovaLinkForm',

  components: {
    NovaTable: window.NovaTable,
    NovaImagePreview: window.NovaImagePreview,
    NTooltip: naive.NTooltip
  },

  props: {
    linkNovaName:  { type: String,  required: true },
    novaName:      { type: String,  default: '' },
    tapTitle:      { type: String,  default: '' },
    visible:       { type: Boolean, default: false },
    embedKey:      { type: String,  default: '' },
    isEmbTab:      { type: Boolean, default: false },
    sourceFields:  { type: Object,  default: function() { return {} } },

    // 父级响应式数据（全量对象，组件内部按 linkNovaName 索引）
    linkTabBuild:           { type: Object, default: function() { return {} } },
    linkTreeData:           { type: Object, default: function() { return {} } },
    linkTreeFilteredData:   { type: Object, default: function() { return {} } },
    linkTreeDefaultExpandedKeys: { type: Object, default: function() { return {} } },
    linkTreeExpandedKeys:   { type: Object, default: function() { return {} } },
    linkTreeDisplayKeys:    { type: Object, default: function() { return {} } },
    linkTreeNodeMap:        { type: Object, default: function() { return {} } },
    linkTreeLoading:        { type: Object, default: function() { return {} } },
    linkTreeSearchKeyword:  { type: Object, default: function() { return {} } },
    loadingStyle:           { type: String, default: 'spinner' },
  },

  emits: ['init', 'link-add', 'tree-check', 'tree-search', 'save-tree'],

  data: function() {
    return {
      // LINK 树加载动画：与首屏/普通表一致的跳跃方块（NovaLoading.html）
      novaLoadingHtml: (window.NovaLoading && window.NovaLoading.html) ? window.NovaLoading.html() : '',
      selectedNodeKey: null,
      // 缓存上一次的 checked keys，diff 出"用户新勾选的"作为详情选中节点
      _lastCheckedKeys: []
    }
  },

  mounted() {
    this.$emit('init', this.linkNovaName)
  },

  computed: {
    hasAddPermission() {
      return window.__hasButton(this.linkNovaName, 'add')
    },
    selectedNode() {
      if (!this.selectedNodeKey) return null
      var map = this.linkTreeNodeMap[this.linkNovaName] || {}
      return map[this.selectedNodeKey] || null
    },
    // 目标表完整 build（choice/date/edit/layout 等元信息）
    linkTreeTargetBuild() {
      return (this.linkTabBuild[this.linkNovaName] || {}).linkTreeTargetBuild || {}
    },
    // 详情面板字段列表：来自目标表 edit[].thisForms（含 group，跟 NovaRefForm 一致）
    linkTreeFields() {
      var b = this.linkTreeTargetBuild
      var edit = b.edit || []
      return edit.filter(function(e) { return e.tapType === 'thisForm' })
                 .reduce(function(acc, e) { return acc.concat(e.thisForms || []) }, [])
    },
    // ── 以下与 NovaRefForm 完全一致，保证右侧详情面板的视觉/逻辑一致 ──
    editLayout() {
      var b = this.linkTreeTargetBuild
      return (b.layout && b.layout.editLayout) || 'DEFAULT'
    },
    // 按 group 值分组：同组字段归入一个面板，未分组字段归入无标题面板
    sections() {
      var seen  = {}
      var order = []
      var map   = {}
      var fields = this.linkTreeFields || []
      fields.forEach(function(f) {
        var g = (f && f.group) || ''
        if (!seen[g]) {
          seen[g] = true
          order.push(g)
          map[g] = []
        }
        map[g].push(f)
      })
      return order.map(function(g) {
        var items = map[g]
        var visibleIndex = 0
        return {
          key: g || '__ungrouped__',
          title: g || '',
          items: items.map(function(f) {
            return { field: f, rowIndex: visibleIndex++ }
          })
        }
      })
    },
    gridStyle() {
      return 'display:grid;gap:20px 24px;' + (this.editLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')
    }
  },
  methods: {
    linkTreeSearchPlaceholder() {
      const config = (this.linkTabBuild[this.linkNovaName] || {}).linkTreeTargetConfig
      if (!config) return window.__t('table.search_placeholder')
      const cols = config.tableColumns || []
      const searchField = config.treeSearchField
      for (var i = 0; i < cols.length; i++) {
        if (cols[i].field === searchField) {
          return window.__t('table.search_field_placeholder', { name: cols[i].title || searchField })
        }
      }
      return window.__t('table.search_field_placeholder', { name: searchField })
    },

    linkTreeRenderLabel() {
      var self = this
      var novaName = this.linkNovaName
      return function(info) {
        var node = info.option
        var config = (self.linkTabBuild[novaName] || {}).linkTreeTargetConfig
        var label = config ? (node[config.treeSearchField] || '') : ''
        var keyword = (self.linkTreeSearchKeyword[novaName] || '').trim()
        if (!keyword || !label) return label
        var lower = label.toLowerCase()
        var kw = keyword.toLowerCase()
        var parts = []
        var last = 0
        var idx = lower.indexOf(kw)
        while (idx !== -1) {
          if (idx > last) parts.push(Vue.h('span', {}, label.slice(last, idx)))
          parts.push(Vue.h('span', { style: { color: '#d03050' } }, label.slice(idx, idx + kw.length)))
          last = idx + kw.length
          idx = lower.indexOf(kw, last)
        }
        if (last < label.length) parts.push(Vue.h('span', {}, label.slice(last)))
        return parts.length > 0 ? Vue.h('span', {}, parts) : label
      }
    },

    onSearchUpdate(val) {
      this.$emit('tree-search', this.linkNovaName, val)
    },

    onTreeCheck(keys) {
      // 勾选也算点击：diff 出新勾选的节点，更新详情选中（cascade 下取第一个 = 用户实际点的父节点）
      const prev = this._lastCheckedKeys || []
      const added = (keys || []).filter(k => prev.indexOf(k) === -1)
      if (added.length) {
        this.selectedNodeKey = added[0]
      }
      this._lastCheckedKeys = (keys || []).slice()
      this.$emit('tree-check', this.linkNovaName, keys)
    },

    onTreeSelected(keys) {
      // n-tree 默认再次点击会取消选择；保持当前选中节点，确保右侧详情不会因为点同节点而清空
      if (keys && keys.length) this.selectedNodeKey = keys[0]
    },

    // ── 字段展示（与 NovaRefForm 字段渲染逻辑一致） ────────────────
    _getVal(col, row) {
      var v = row[col.field]
      return v != null ? v : ''
    },

    _formatDateTs(ts, type) {
      var d = new Date(ts)
      var p = function(n) { return String(n).padStart(2, '0') }
      if (type === 'YEAR')       return String(d.getFullYear())
      if (type === 'YEAR_MONTH') return d.getFullYear() + '-' + p(d.getMonth() + 1)
      if (type === 'DATE')       return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
      if (type === 'TIME')       return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
             p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
    },

    formatText(col, row) {
      var val = this._getVal(col, row)
      if (val === null || val === undefined || val === '') return ''

      var b = this.linkTreeTargetBuild

      // REFERENCE
      if (col.type === 'REFERENCE') {
        var displayVal = row[col.field + '_display']
        if (displayVal !== null && displayVal !== undefined && displayVal !== '') return String(displayVal)
        if (val && typeof val === 'object') {
          var refInfo = (b.reference || {})[col.field] || {}
          if (refInfo.displayField && val[refInfo.displayField] != null) return String(val[refInfo.displayField])
          return ''
        }
        return val != null ? String(val) : ''
      }

      var s = String(val)
      if (!s) return ''

      // BOOLEAN
      if (col.type === 'BOOLEAN') {
        return s.toLowerCase() === 'true' ? window.__t('common.yes') : window.__t('common.no')
      }

      // CHOICE
      if (col.type === 'CHOICE') {
        var choice = (b.choice || {})[col.field]
        if (choice && choice.values) {
          var valMap = {}
          if (Array.isArray(choice.values)) {
            choice.values.forEach(function(item) {
              if (item && item.value !== undefined) valMap[String(item.value)] = item.label || String(item.value)
            })
          } else {
            for (var k in choice.values) valMap[k] = choice.values[k]
          }
          if (choice.selectType === 'MULTI') {
            return s.split(',').map(function(v) {
              return valMap[v.trim()] || v.trim()
            }).filter(Boolean).join('、')
          }
          return valMap[s] || s
        }
        return s
      }

      // TAG
      if (col.type === 'TAG') {
        return s.split(',').map(function(t) { return t.trim() }).filter(Boolean).join('、')
      }

      // DATE
      if (col.type === 'DATE') {
        var ts = Number(val)
        if (!isNaN(ts)) {
          var dateInfo = (b.date || {})[col.field]
          return this._formatDateTs(ts, dateInfo && dateInfo.type)
        }
      }

      return s
    },

    formatBoolean(col, row) {
      var val = row[col.field]
      if (val === null || val === undefined || val === '') return ''
      return String(val).toLowerCase() === 'true' ? window.__t('common.yes') : window.__t('common.no')
    },

    booleanValue(f) {
      var v = this._getVal(f, this.selectedNode || {})
      if (v === true || v === 1) return true
      if (v === false || v === 0) return false
      return String(v).toLowerCase() === 'true'
    },

    displayText(f) {
      if (!this.selectedNode) return ''
      if (f.type === 'BOOLEAN') return this.formatBoolean(f, this.selectedNode)
      return this.formatText(f, this.selectedNode)
    },

    isImageAttach(col) {
      var attInfo = ((this.linkTreeTargetBuild.attachment) || {})[col.field]
      return attInfo && attInfo.tableShowType === 'IMAGE'
    },

    getAttachUrls(col, row) {
      var val = row[col.field]
      if (!val) return []
      var sep = ((this.linkTreeTargetBuild.attachment || {})[col.field] || {}).separator
      if (!sep) return []
      return String(val).split(sep).map(function(u) { return u.trim() }).filter(Boolean)
    },

    getChoiceColor(col, row) {
      var val = row[col.field]
      if (!val) return null
      var s = String(val)
      var choice = (this.linkTreeTargetBuild.choice || {})[col.field]
      if (choice && choice._colors && choice._colors[s]) return choice._colors[s]
      return null
    },

    getChoiceTags(col, row) {
      var val = row[col.field]
      if (!val) return []
      var choice = (this.linkTreeTargetBuild.choice || {})[col.field]
      if (!choice || !choice.values) return []

      var valMap = {}
      var colorMap = {}
      if (Array.isArray(choice.values)) {
        choice.values.forEach(function(item) {
          if (item && item.value !== undefined) {
            valMap[String(item.value)] = item.label || String(item.value)
            if (item.color) colorMap[String(item.value)] = item.color
          }
        })
      } else {
        for (var k in choice.values) {
          valMap[k] = choice.values[k]
        }
      }

      var isMulti = choice.selectType === 'MULTI'
      var rawLabels = isMulti ? String(val).split(',').map(function(s) { return s.trim() }).filter(Boolean) : [String(val)]

      return rawLabels.map(function(rawVal) {
        var label = valMap[rawVal] || rawVal
        var color = colorMap[rawVal] || null
        return { label: label, color: color }
      })
    },

    darkenHex(hex, amount) {
      if (!hex) return 'inherit'
      var num = parseInt(hex.replace('#', ''), 16)
      var r = Math.max(0, (num >> 16) - Math.round(255 * amount))
      var g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount))
      var b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount))
      return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
    },

    getChoiceRest(col, row) {
      var tags = this.getChoiceTags(col, row)
      return tags.length > 2 ? tags.length - 2 : 0
    },

    getChoiceRestTags(col, row) {
      var tags = this.getChoiceTags(col, row)
      return tags.slice(2)
    },

    getTagTags(col, row) {
      var val = row[col.field]
      if (!val) return []
      var tags = String(val).split(',').map(function(t) { return t.trim() }).filter(Boolean)
      return tags.map(function(tag) {
        return { label: tag }
      })
    },

    getTagRest(col, row) {
      var tags = this.getTagTags(col, row)
      return tags.length > 2 ? tags.length - 2 : 0
    },

    getTagRestTags(col, row) {
      var tags = this.getTagTags(col, row)
      return tags.slice(2)
    },

    getAttachmentRest(col, row) {
      var urls = this.getAttachUrls(col, row)
      return urls.length > 2 ? urls.length - 2 : 0
    },

    containsHtml(str) {
      return /<[a-z]+[\s>]/i.test(String(str))
    },

    openEditorPreview(f) {
      if (!this.selectedNode) return
      var html = this.selectedNode[f.field]
      if (html === null || html === undefined || html === '') return
      if (!window.popup || !window.popup.modal) {
        window.alert(window.__t('table.popup_not_ready'))
        return
      }
      var encoded = ''
      try { encoded = btoa(unescape(encodeURIComponent(String(html)))) } catch (e) { encoded = '' }
      window.popup.modal('/editor-preview.html#' + encoded, {
        title: f.title || window.__t('table.rich_preview'),
        width: '60%',
        height: '60%'
      })
    },

    onSave() {
      this.$emit('save-tree', this.linkNovaName)
    },

    onLinkAdd() {
      this.$emit('link-add', this.linkNovaName, this.tapTitle)
    }
  },

  template: `
<div v-if="visible"
  :style="'display:flex;flex-direction:column;overflow:hidden;' + (linkTreeData[linkNovaName] ? 'max-height:500px' : 'height:' + (isEmbTab ? 'calc(100vh - 240px)' : '460px'))">
  <!-- 加载中：跳跃方块动画 -->
  <div v-if="linkTreeLoading[linkNovaName] && !linkTabBuild[linkNovaName]"
    style="display:flex;align-items:center;justify-content:center;padding:60px">
    <div v-html="novaLoadingHtml"></div>
  </div>
  <!-- 树模式（含加载遮罩）：build 返回后立即占据树区域，避免空白 -->
  <div v-else-if="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig"
    style="position:relative;display:flex;flex-direction:column;flex:1;min-height:200px">
    <!-- 树数据加载遮罩：跳跃方块动画 -->
    <div v-if="linkTreeLoading[linkNovaName]"
      style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:10;pointer-events:none">
      <div v-html="novaLoadingHtml"></div>
    </div>
    <template v-if="linkTreeData[linkNovaName]">
      <div style="display:flex;gap:16px;flex:1;min-height:0;overflow:hidden">
        <!-- 左侧：搜索框 + 树 -->
        <div style="flex:1;min-width:0;display:flex;flex-direction:column">
          <div v-if="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.treeSearchField" style="flex-shrink:0;padding:12px 0 8px 0">
            <n-input
              :value="linkTreeSearchKeyword[linkNovaName]"
              :placeholder="linkTreeSearchPlaceholder()"
              clearable
              @update:value="onSearchUpdate"
              style="width:100%" />
          </div>
          <div class="link-tree-scroll" style="flex:1;overflow:auto;padding:0 0 12px 0">
            <n-tree v-if="!linkTreeFilteredData[linkNovaName] && linkTreeData[linkNovaName]"
              :default-expanded-keys="linkTreeDefaultExpandedKeys[linkNovaName] || []"
              :data="linkTreeData[linkNovaName]"
              :checked-keys="linkTreeDisplayKeys[linkNovaName]"
              :selected-keys="selectedNodeKey ? [selectedNodeKey] : []"
              :cascade="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.treeCascade !== false"
              :key-field="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.linkStorageField"
              :label-field="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.treeSearchField"
              checkable block-line
              @update:checked-keys="onTreeCheck"
              @update:selected-keys="onTreeSelected"
            />
            <n-tree v-if="linkTreeFilteredData[linkNovaName]"
              :key="'linkTreeSearch_' + linkNovaName + '_' + (linkTreeSearchKeyword[linkNovaName] || '')"
              :data="linkTreeFilteredData[linkNovaName]"
              :checked-keys="linkTreeDisplayKeys[linkNovaName]"
              :selected-keys="selectedNodeKey ? [selectedNodeKey] : []"
              :expanded-keys="linkTreeExpandedKeys[linkNovaName] || []"
              :cascade="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.treeCascade !== false"
              :key-field="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.linkStorageField"
              :label-field="(linkTabBuild[linkNovaName] || {}).linkTreeTargetConfig.treeSearchField"
              :render-label="linkTreeRenderLabel()"
              checkable block-line
              @update:checked-keys="onTreeCheck"
              @update:selected-keys="onTreeSelected"
            />
          </div>
          <div style="flex-shrink:0;padding:8px 0;display:flex;justify-content:flex-end;border-top:1px solid #eee">
            <n-button v-if="hasAddPermission" type="primary" @click="onSave">{{ __t('common.save') }}</n-button>
          </div>
        </div>
        <!-- 右侧：节点详情面板（与 NovaRefForm 完全一致的反显风格） -->
        <div style="width:1px;background:#eee;margin:8px 0;flex-shrink:0"></div>
        <div class="ref-detail link-tree-detail" style="flex:1;min-width:0;display:flex;flex-direction:column;overflow:auto;padding:0 4px">
          <div v-if="!selectedNode" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;gap:8px">
            <iconify-icon icon="mdi:file-tree-outline" style="font-size:48px;color:#ccc"></iconify-icon>
            <span>{{ __t('table.link_tree_detail_empty') }}</span>
          </div>
          <div v-else>
            <n-card v-for="sec in sections" :key="sec.key" class="form-panel" size="small" :bordered="true">
              <template v-if="sec.title" #header>
                <span>{{ sec.title }}</span>
              </template>
              <div :style="gridStyle">
                <template v-for="(item, idx) in sec.items" :key="item.field.field">
                  <n-divider v-if="item.field.type === 'DIVIDE' && editLayout !== 'FULL_LINE'" style="grid-column:1/-1;margin:0">{{ item.field.title }}</n-divider>
                  <div v-else-if="item.field.type === 'EMPTY' && editLayout !== 'FULL_LINE'"></div>
                  <div v-else-if="item.field.type !== 'DIVIDE' && item.field.type !== 'EMPTY' && item.field.type !== 'BUTTON'"
                    :style="'display:flex;align-items:' + (item.field.type === 'BOOLEAN' ? 'center' : 'baseline') + ';gap:8px;min-width:0;overflow:hidden;padding:6px;border-radius:4px' + (item.field.type === 'TEXTAREA' ? ';grid-column:1/-1' : '')">
                    <span class="ref-desc-label">{{ item.field.title }}:</span>
                    <n-button-group v-if="item.field.type === 'BOOLEAN' && displayText(item.field) !== ''" size="small" style="pointer-events:none">
                      <n-button :type="booleanValue(item.field) ? 'primary' : 'default'">{{ __t('common.yes') }}</n-button>
                      <n-button :type="!booleanValue(item.field) ? 'primary' : 'default'">{{ __t('common.no') }}</n-button>
                    </n-button-group>
                    <div v-else-if="item.field.type === 'ATTACHMENT' && isImageAttach(item.field) && getAttachUrls(item.field, selectedNode).length > 0" class="ref-attach-wrap" style="display:inline-flex;gap:6px;align-items:center">
                      <NovaImagePreview :src-list="getAttachUrls(item.field, selectedNode)" :width="36" :height="36" :showAll="true" />
                    </div>
                    <div v-else-if="item.field.type === 'EDITOR' && displayText(item.field) !== ''" class="ref-desc-value">
                      <span class="cell-editor-preview" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;color:#2563eb;font-size:13px" @click="openEditorPreview(item.field)">
                        <iconify-icon icon="bi:filetype-html" style="font-size:16px"></iconify-icon>
                        <span>{{ __t('common.preview') }}</span>
                      </span>
                    </div>
                    <div v-else class="ref-desc-value" :style="item.field.type === 'TEXTAREA' ? 'display:block;width:100%;min-width:0' : ''">
                      <div v-if="item.field.type === 'TEXTAREA'" class="ref-textarea-box" style="background:rgba(0,0,0,0.02);border-left:3px solid #2563eb;padding:8px 12px;border-radius:4px;font-family:monospace;font-size:13px;white-space:pre-wrap;word-break:break-word;line-height:1.6;max-height:150px;overflow-y:auto">{{ displayText(item.field) || '-' }}</div>
                      <div v-else-if="item.field.type === 'CHOICE' && getChoiceTags(item.field, selectedNode).length > 0" style="display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center">
                        <template v-for="(tag, idx) in getChoiceTags(item.field, selectedNode).slice(0, 2)" :key="idx">
                          <span :style="'display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;background:' + (tag.color ? tag.color + '20' : 'rgba(128,128,128,0.1)') + ';color:' + (tag.color ? darkenHex(tag.color, 0.35) : 'inherit')">{{ tag.label }}</span>
                        </template>
                        <n-tooltip v-if="getChoiceRest(item.field, selectedNode) > 0" trigger="hover" placement="top">
                          <template #trigger>
                            <span style="flex-shrink:0;cursor:default;font-size:12px;color:#888;padding:2px 8px;background:rgba(128,128,128,0.1);border-radius:4px">+{{ getChoiceRest(item.field, selectedNode) }}</span>
                          </template>
                          <div style="max-width:400px">
                            <div v-for="(tag, idx) in getChoiceRestTags(item.field, selectedNode)" :key="idx" style="padding:4px 0">{{ tag.label }}</div>
                          </div>
                        </n-tooltip>
                      </div>
                      <div v-else-if="item.field.type === 'TAG' && getTagTags(item.field, selectedNode).length > 0" style="display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center">
                        <template v-for="(tag, idx) in getTagTags(item.field, selectedNode).slice(0, 2)" :key="idx">
                          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;background:rgba(37,99,235,0.08);color:#2563eb">{{ tag.label }}</span>
                        </template>
                        <n-tooltip v-if="getTagRest(item.field, selectedNode) > 0" trigger="hover" placement="top">
                          <template #trigger>
                            <span style="flex-shrink:0;cursor:default;font-size:12px;color:#888;padding:2px 8px;background:rgba(128,128,128,0.1);border-radius:4px">+{{ getTagRest(item.field, selectedNode) }}</span>
                          </template>
                          <div style="max-width:400px">
                            <div v-for="(tag, idx) in getTagRestTags(item.field, selectedNode)" :key="idx" style="padding:4px 0">{{ tag.label }}</div>
                          </div>
                        </n-tooltip>
                      </div>
                      <n-ellipsis v-else-if="item.field.type === 'ATTACHMENT' && getAttachUrls(item.field, selectedNode).length > 0" class="ref-form-value">{{ getAttachUrls(item.field, selectedNode).join(', ') }}</n-ellipsis>
                      <span v-else-if="containsHtml(displayText(item.field))" class="ref-form-html" v-html="displayText(item.field)"></span>
                      <n-ellipsis v-else-if="displayText(item.field) !== ''" class="ref-form-value">{{ displayText(item.field) }}</n-ellipsis>
                      <span v-else class="ref-form-value">-</span>
                    </div>
                  </div>
                </template>
              </div>
            </n-card>
          </div>
        </div>
      </div>
    </template>
  </div>
  <!-- 普通模式：内嵌中间表 -->
  <nova-table v-else-if="linkTabBuild[linkNovaName] && !linkTreeLoading[linkNovaName]"
    :key="embedKey"
    :embedded-mode="true"
    :link-mode="true"
    :nova-name-prop="linkNovaName"
    :source-nova-name-prop="novaName"
    :source-fields-prop="sourceFields"
    @link-add="onLinkAdd"
  />
</div>
  `
}

})()

// 自注册到 NovaTable 的 components
if (window.NovaTable) {
  window.NovaTable.components = Object.assign(
    window.NovaTable.components || {},
    { NovaLinkForm: window.NovaLinkForm }
  )
}