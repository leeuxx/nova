// pages/table-app.js — appendageForm（附属表单）Vue 子组件

;(function () {

const { NInput, NSelect, NInputNumber, NDatePicker, NCheckboxGroup, NCheckbox,
       NRadioGroup, NRadio, NSpace, NDivider, NTooltip, NSwitch } = naive

window.NovaAppForm = {
  name: 'NovaAppForm',

  props: {
    appNovaName:    { type: String,  required: true },
    parentNovaName: { type: String,  default: '' },
    formData:       { type: Object,  required: true },
    formErrors:     { type: Object,  default: function() { return {} } },
    buildData:      { type: Object,  default: function() { return {} } },
    formMode:       { type: String,  default: 'add' },
    readonly:       { type: Boolean, default: false }
  },

  emits: ['field-change', 'reference-click', 'preview-click', 'attachment-change'],

  data() {
    return {
      _editorHosts: {},
      _editorToolbars: {},
      _editors: {},
      _toolbars: {},
      _editorLastSynced: {}
    }
  },

  computed: {
    // 按 group 值分组：同组字段归入一个面板，未分组字段归入无标题面板，面板按首次出现顺序排列
    sections() {
      var seen  = {}
      var order = []
      var map   = {}
      ;(this.buildData.editFields || []).forEach(function(f) {
        var g = (f && f.group) || ''
        if (!seen[g]) {
          seen[g] = true
          order.push(g)
          map[g] = []
        }
        map[g].push(f)
      })
      var self = this
      return order.map(function(g) {
        return { key: g || '__ungrouped__', title: g || '', items: map[g] }
      }).filter(function(sec) {
        return sec.items.some(function(f) { return self.fieldVisible(f) })
      })
    }
  },

  methods: {
    // ── 字段只读判断 ──────────────────────────────────────────────
    isReadonly(f) {
      if (!f) return false
      if (f.readonly === true || (typeof f.readonly === 'object' && f.readonly.add !== false && f.readonly.edit !== false)) return true
      if (typeof f.readonly === 'object') {
        return this.formMode === 'add' ? !!f.readonly.add : !!f.readonly.edit
      }
      return false
    },

    // ── 字段辅助方法 ──────────────────────────────────────────────
    fieldOptions(f) {
      var choice = (this.buildData.choiceMap || {})[f.field]
      if (!choice || !choice.values) return []
      if (choice.refChoice) {
        var parentVal = this.formData[choice.refChoice]
        if (!parentVal || (Array.isArray(parentVal) && !parentVal.length)) return []
        return choice.values.filter(function(v) { return Array.isArray(parentVal) ? parentVal.includes(v.refValue) : v.refValue === parentVal }).map(function(v) { return { label: v.label, value: v.value } })
      }
      return choice.values.map(function(v) { return { label: v.label, value: v.value } })
    },
    tagOptions(field) {
      var tag = (this.buildData.tagMap || {})[field]
      if (!tag || !tag.tags) return []
      return tag.tags.map(function(t) { return { label: t, value: t } })
    },
    datePickerType(field) {
      var dateInfo = (this.buildData.dateMap || {})[field]
      if (!dateInfo) return 'date'
      return dateInfo.type === 'DATE_TIME' ? 'datetime' : 'date'
    },
    fieldVisible(f) {
      if (!f.showByExpr) return true
      var fd = this.formData
      var refMap = (this.buildData.referenceMap || {})
      var evalFd = Object.assign({}, fd)
      for (var k in refMap) { var rf = refMap[k] && refMap[k].referenceField; if (rf) evalFd[k] = fd[rf] !== undefined ? fd[rf] : null }
      return window.evalShowExpr(f.showByExpr, evalFd)
    },
    onFieldUpdate(field, value) {
      this.$emit('field-change', { field: field, value: value })
    },
    handleFormButton(field) {
      var buttons = this.buildData.buttons || {}
      var cfg = buttons[field.field]
      if (!cfg) return
      var transmit = {}
      if (cfg.transmitParams) {
        cfg.transmitParams.forEach(function(key) {
          var val = this.formData[key]
          if (val != null) transmit[key] = val
        }.bind(this))
      }
      var param = cfg.param || ''
      var handleJs = cfg.handleJs || ''
      var handleName = cfg.handleName || ''

      if (handleJs) {
        window.fetch(handleJs).then(function(resp) {
          if (!resp.ok) throw new Error('加载 JS 失败: ' + handleJs)
          return resp.text()
        }).then(function(code) {
          var $btn = cfg.id ? $(window.parent.document).find('#' + cfg.id) : null
          var fn = new Function('param', 'transmitParams', '$btn', code)
          fn(param, transmit, $btn)
        })
      } else if (handleName) {
        window.fetchApi.post('/nova/table/buttonClick', {
          novaName: this.appNovaName,
          handleName: handleName,
          param: param,
          transmitParams: transmit
        }).then(function(resp) {
          var data = resp.data || {}
          if (data.status !== false) {
            if (window.$message) window.$message.success(data.message || '操作成功')
          } else {
            if (window.$message) window.$message.error(data.message || '操作失败')
          }
        }).catch(function(err) {
          if (!err || !err.code) { if (window.$message) window.$message.error('请求失败') }
        })
      }
    },
    referenceDisplayLabel(field) {
      var displayVal = this.formData[field + '_display']
      if (displayVal !== null && displayVal !== undefined && displayVal !== '') return String(displayVal)
      var val = this.formData[field]
      if (val === null || val === undefined || val === '') return ''
      return String(val)
    },
    triggerFileUpload(fieldKey) {
      var input = document.getElementById('upload-app-' + this.appNovaName + '-' + fieldKey)
      if (input) input.click()
    },

    // ── 富文本编辑器：注册 host + 挂载/同步/销毁 ─────────────────
    registerEditorHost(field, el) {
      if (!field) return
      if (el) {
        this._editorHosts[field] = el
        this.maybeMountEditor(field)
      } else {
        if (this._editors[field] && window.NovaAiEditor) {
          window.NovaAiEditor.destroy(this._editors[field])
        }
        delete this._editorHosts[field]
        delete this._editorToolbars[field]
        delete this._editors[field]
        delete this._editorLastSynced[field]
      }
    },
    registerEditorToolbar(field, el) {
      if (!field) return
      this._editorToolbars[field] = el
      if (!el) return
      this.maybeMountEditor(field)
    },
    maybeMountEditor(field) {
      if (this._editors[field]) return
      var host = this._editorHosts[field]
      if (!host) return
      if (!window.NovaAiEditor) return
      var self = this
      var initialHtml = (self.formData && self.formData[field]) || ''
      try {
        var editor = window.NovaAiEditor.createEditor(host, initialHtml, function (html) {
          self._editorLastSynced[field] = html
          self.$emit('field-change', { field: field, value: html })
        }, {
          uploadNovaName: self.appNovaName,
          editable: !self.isReadonly(f)
        })
        if (self._editors[field]) {
          try { window.NovaAiEditor.destroy(editor) } catch (e) {}
          return
        }
        self._editors[field] = editor
        self._editorLastSynced[field] = initialHtml
      } catch (err) {
        console.error('[NovaAppForm] aieditor mount failed:', err)
      }
    },
    destroyAllEditors() {
      var self = this
      Object.keys(this._editors).forEach(function (k) {
        if (self._editors[k] && window.NovaAiEditor) {
          window.NovaAiEditor.destroy(self._editors[k])
        }
      })
      this._editors = {}
      this._editorHosts = {}
      this._editorToolbars = {}
      this._editorLastSynced = {}
    }
  },

  // ── 生命周期 ──────────────────────────────────────────────────
  mounted() {
    // editor hosts are registered via :ref callbacks after mount
    var self = this
    if (window.__appDarkMode && window.Vue && typeof window.Vue.watch === 'function') {
      this._stopThemeWatch = window.Vue.watch(function () { return window.__appDarkMode.value }, function (val) {
        var theme = val ? 'dark' : 'light'
        Object.keys(self._editors).forEach(function (field) {
          if (self._editors[field] && window.NovaAiEditor) {
            window.NovaAiEditor.changeTheme(self._editors[field], theme)
          }
        })
      })
    }
  },
  updated() {
    var self = this
    Object.keys(this._editorHosts).forEach(function (field) {
      var rec = self._editors[field]
      if (!rec) return
      var editorApi = rec.editor
      if (!editorApi || typeof editorApi.commands.setContent !== 'function') return
      var external = (self.formData && self.formData[field]) || ''
      if (external !== self._editorLastSynced[field]) {
        editorApi.commands.setContent(external || '', false)
        self._editorLastSynced[field] = external
      }
    })
  },
  beforeUnmount() {
    if (this._stopThemeWatch) { try { this._stopThemeWatch() } catch (e) {} this._stopThemeWatch = null }
    this.destroyAllEditors()
  },

  template: `
<div :key="'app_' + appNovaName" style="animation:tabFadeIn .5s cubic-bezier(0.22,0.61,0.36,1)">
<div v-if="!(buildData.editFields || []).length" style="text-align:center;padding:40px;color:#aaa;font-size:13px">加载中…</div>
<div v-else>
  <n-card v-for="sec in sections" :key="sec.key" class="form-panel" size="small" :bordered="true">
    <template v-if="sec.title" #header>
      <span>{{ sec.title }}</span>
    </template>
    <div :style="'display:grid;gap:16px 24px;' + (buildData.editLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')">
    <template v-for="f in sec.items" :key="f.field">
    <n-divider v-if="f.type === 'DIVIDE' && buildData.editLayout !== 'FULL_LINE'" v-show="fieldVisible(f)" style="grid-column:1/-1;margin:0">{{ f.title }}</n-divider>
    <div v-else-if="f.type === 'EMPTY' && buildData.editLayout !== 'FULL_LINE'" v-show="fieldVisible(f)"></div>
    <div v-else-if="f.type === 'BUTTON'" v-show="fieldVisible(f)" style="display:flex;flex-direction:column;gap:4px;padding-top:25px;align-items:flex-start">
      <n-button v-if="(buildData.buttons || {})[f.field]" :color="(buildData.buttons || {})[f.field].color" :id="(buildData.buttons || {})[f.field].id" class="form-btn"
        :disabled="isReadonly(f)" :style="isReadonly(f) ? 'opacity:0.5;cursor:not-allowed' : undefined"
        @click="isReadonly(f) ? undefined : handleFormButton(f)">
        {{ f.title }}
      </n-button>
    </div>
    <div v-else-if="f.type !== 'DIVIDE' && f.type !== 'EMPTY' && f.type !== 'BUTTON' && !(f.type === 'REFERENCE' && (buildData.referenceMap || {})[f.field] && (buildData.referenceMap || {})[f.field].referenceName === parentNovaName)"
      v-show="fieldVisible(f)"
      :style="'display:flex;flex-direction:column;gap:4px' + ((f.type === 'TEXTAREA' || f.type === 'EDITOR') ? ';grid-column:1/-1' : '')">
      <span class="edit-form-label">
        <span v-if="f.notNull && !isReadonly(f)" class="form-label-required">*</span>{{ f.title }}
        <n-tooltip v-if="f.desc" trigger="hover" placement="top"><template #trigger><span class="form-label-help"><iconify-icon icon="material-symbols:help-outline" style="font-size:15px"></iconify-icon></span></template>{{ f.desc }}</n-tooltip>
      </span>
      <n-checkbox-group v-if="f.type === 'CHOICE' && (buildData.choiceMap || {})[f.field] && (buildData.choiceMap || {})[f.field].showType === 'RADIO' && (buildData.choiceMap || {})[f.field].selectType === 'MULTI'"
        :value="formData[f.field]" :disabled="isReadonly(f)"
        @update:value="onFieldUpdate(f.field, $event)">
        <n-space><n-checkbox v-for="o in fieldOptions(f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
      </n-checkbox-group>
      <n-radio-group v-else-if="f.type === 'CHOICE' && (buildData.choiceMap || {})[f.field] && (buildData.choiceMap || {})[f.field].showType === 'RADIO'"
        :value="formData[f.field]" :disabled="isReadonly(f)"
        @update:value="onFieldUpdate(f.field, $event)">
        <n-space><n-radio v-for="o in fieldOptions(f)" :key="o.value" :value="o.value" :label="o.label" /></n-radio-group>
      <n-select v-else-if="f.type === 'CHOICE' && (buildData.choiceMap || {})[f.field] && (buildData.choiceMap || {})[f.field].selectType === 'MULTI'"
        :value="formData[f.field]" :options="fieldOptions(f)"
        :placeholder="'请选择'+f.title" :status="formErrors[f.field]?'error':undefined"
        :disabled="isReadonly(f)" multiple clearable @update:value="onFieldUpdate(f.field, $event)" />
      <n-select v-else-if="f.type === 'CHOICE'"
        :value="formData[f.field]" :options="fieldOptions(f)"
        :placeholder="'请选择'+f.title" :status="formErrors[f.field]?'error':undefined"
        :disabled="isReadonly(f)" clearable @update:value="onFieldUpdate(f.field, $event)" />
      <div v-else-if="f.type === 'BOOLEAN' && (buildData.booleanMap || {})[f.field] && (buildData.booleanMap || {})[f.field].type === 'SWITCH'"
        style="display:flex;align-items:center;gap:8px;padding-top:2px">
        <n-switch
          :value="formData[f.field] === 'true'"
          :disabled="isReadonly(f)"
          @update:value="(v) => onFieldUpdate(f.field, v ? 'true' : 'false')" />
        <span style="font-size:13px;color:#666">{{ formData[f.field] === 'true' ? '是' : '否' }}</span>
      </div>
      <n-button-group v-else-if="f.type === 'BOOLEAN' && (buildData.booleanMap || {})[f.field] && (buildData.booleanMap || {})[f.field].type === 'SEGMENT'" size="small">
        <n-button :type="formData[f.field] === 'true' ? 'primary' : 'default'" :disabled="isReadonly(f)" @click="onFieldUpdate(f.field, 'true')">是</n-button>
        <n-button :type="formData[f.field] === 'true' ? 'default' : 'primary'" :disabled="isReadonly(f)" @click="onFieldUpdate(f.field, 'false')">否</n-button>
      </n-button-group>
      <n-select v-else-if="f.type === 'BOOLEAN'"
        :value="formData[f.field]" :options="[{label:'\\u662f',value:'true'},{label:'\\u5426',value:'false'}]"
        :placeholder="'请选择'+f.title" :status="formErrors[f.field]?'error':undefined"
        :disabled="isReadonly(f)" clearable @update:value="onFieldUpdate(f.field, $event)" />
      <n-input-number v-else-if="f.type === 'NUMBER'"
        :value="formData[f.field]"
        :placeholder="'请输入'+f.title" :show-button="false" style="width:100%"
        :min="(buildData.numberMap || {})[f.field] && (buildData.numberMap || {})[f.field].min"
        :max="(buildData.numberMap || {})[f.field] && (buildData.numberMap || {})[f.field].max"
        :precision="(buildData.numberMap || {})[f.field] && (buildData.numberMap || {})[f.field].type==='DECIMAL' ? ((buildData.numberMap || {})[f.field].decimal || 2) : 0"
        :status="formErrors[f.field]?'error':undefined"
        :disabled="isReadonly(f)" clearable @update:value="onFieldUpdate(f.field, $event)" />
      <n-date-picker v-else-if="f.type === 'DATE'"
        :value="formData[f.field]" :type="datePickerType(f.field)"
        :placeholder="'请选择'+f.title" :status="formErrors[f.field]?'error':undefined"
        :disabled="isReadonly(f)" clearable style="width:100%"
        @update:value="onFieldUpdate(f.field, $event)" />
      <n-select v-else-if="f.type === 'TAG'"
        :value="formData[f.field]" :options="tagOptions(f.field)"
        :placeholder="'请输入或选择'+f.title" :status="formErrors[f.field]?'error':undefined"
        :disabled="isReadonly(f)" filterable multiple clearable
        @update:value="onFieldUpdate(f.field, $event)" />
      <n-input v-else-if="f.type === 'TEXTAREA'"
        :value="formData[f.field]" type="textarea" :autosize="{minRows:3}"
        :placeholder="'请输入'+f.title" :status="formErrors[f.field]?'error':undefined"
        :disabled="isReadonly(f)" @update:value="onFieldUpdate(f.field, $event)" />
      <div v-else-if="f.type === 'REFERENCE' && (buildData.referenceMap || {})[f.field]"
        @click="!isReadonly(f) && $emit('reference-click', f)" style="cursor:pointer">
        <n-input
          :value="referenceDisplayLabel(f.field)"
          :placeholder="'请选择'+f.title" readonly clearable
          :status="formErrors[f.field]?'error':undefined"
          :disabled="isReadonly(f)"
          @clear.stop="onFieldUpdate(f.field, null);onFieldUpdate(f.field+'_display','')">
          <template #suffix><iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon></template>
        </n-input>
      </div>
      <div v-else-if="f.type === 'ATTACHMENT'" style="display:flex;flex-direction:column;gap:4px">
        <n-button-group>
          <n-button style="flex:1"
            :disabled="isReadonly(f) || ((buildData.attachmentMap||{})[f.field] && (buildData.attachmentMap||{})[f.field].maxLimit && (formData[f.field]||[]).length >= (buildData.attachmentMap||{})[f.field].maxLimit)"
            @click="triggerFileUpload(f.field)">
            <iconify-icon icon="mdi:upload" style="font-size:14px;margin-right:4px;color:#2563eb"></iconify-icon>
            上传<span style="font-size:12px;opacity:0.7">{{ (buildData.attachmentMap||{})[f.field] && (buildData.attachmentMap||{})[f.field].maxLimit ? '（共'+Math.max(0, (buildData.attachmentMap||{})[f.field].maxLimit-(formData[f.field]||[]).length)+'个）' : '（共0个）' }}</span>
          </n-button>
          <n-button style="flex:1" :disabled="!(formData[f.field]||[]).length" @click="$emit('preview-click', f)">
            <iconify-icon icon="mdi:eye-outline" style="font-size:14px;margin-right:4px"></iconify-icon>
            查看<span style="font-size:12px;opacity:0.7">（共{{(formData[f.field]||[]).length}}个）</span>
          </n-button>
        </n-button-group>
        </n-button-group>
        <input :id="'upload-app-'+appNovaName+'-'+f.field" type="file" style="display:none"
          :multiple="(buildData.attachmentMap||{})[f.field] && (buildData.attachmentMap||{})[f.field].maxLimit > 1"
          :accept="(buildData.attachmentMap||{})[f.field] && (buildData.attachmentMap||{})[f.field].fileTypes && (buildData.attachmentMap||{})[f.field].fileTypes.length ? (buildData.attachmentMap||{})[f.field].fileTypes.join(',') : undefined"
          @change="$emit('attachment-change', f, $event)" />
      </div>
      <div v-else-if="f.type === 'EDITOR'" class="form-field-editor"
        :class="formErrors[f.field] ? 'has-error' : ''">
        <div :ref="el => registerEditorHost(f.field, el)" :data-editor-field="f.field" class="nova-aieditor-host"></div>
      </div>
      <n-input v-else
        :value="formData[f.field]" :placeholder="'请输入'+f.title"
        :status="formErrors[f.field]?'error':undefined"
        :disabled="isReadonly(f)" clearable @update:value="onFieldUpdate(f.field, $event)" />
      <span v-if="formErrors[f.field]" class="form-error-tip">{{ formErrors[f.field] }}</span>
    </div>
    </template>
    </div>
  </n-card>
</div>
</div>
  `
}

})()

// 自注册到 NovaTable 的 components（table.js 加载后才执行此行）
if (window.NovaTable) {
  window.NovaTable.components = Object.assign(
    window.NovaTable.components || {},
    { NovaAppForm: window.NovaAppForm }
  )
}
