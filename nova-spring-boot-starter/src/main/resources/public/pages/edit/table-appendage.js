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
      attachmentDropdownKey: null
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
        }).catch(function(err) {
          if (window.$message) window.$message.error(err.message || '请求失败')
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
    }
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
      :style="'display:flex;flex-direction:column;gap:4px' + (f.type === 'TEXTAREA' ? ';grid-column:1/-1' : '')">
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
      <div v-else-if="f.type === 'ATTACHMENT'" class="attachment-field"
        @mouseenter="attachmentDropdownKey = f.field" @mouseleave="attachmentDropdownKey = null">
        <div class="attachment-btn">
          <iconify-icon icon="mdi:paperclip" style="font-size:13px"></iconify-icon>附件管理
          <iconify-icon icon="mdi:chevron-down" :style="'font-size:12px;transition:transform .2s ease;transform:' + (attachmentDropdownKey === f.field ? 'rotate(180deg)' : 'rotate(0deg)')"></iconify-icon>
        </div>
        <transition name="dropdown-fade">
          <div v-if="attachmentDropdownKey === f.field" :class="'attachment-dropdown' + ((buildData.attachmentMap||{})[f.field] && (buildData.attachmentMap||{})[f.field].showType === 'DOWN' ? ' down' : '')">
            <div class="attachment-dropdown-inner">
              <label v-if="!isReadonly(f) && (!(buildData.attachmentMap||{})[f.field] || !(buildData.attachmentMap||{})[f.field].maxLimit || (formData[f.field]||[]).length < (buildData.attachmentMap||{})[f.field].maxLimit)"
                class="attachment-dropdown-item" :for="'upload-app-'+appNovaName+'-'+f.field">
                <iconify-icon icon="mdi:upload" style="font-size:13px"></iconify-icon>
                上传文件{{ (buildData.attachmentMap||{})[f.field] && (buildData.attachmentMap||{})[f.field].maxLimit ? '\\uff08\\u5171'+((buildData.attachmentMap||{})[f.field].maxLimit-(formData[f.field]||[]).length)+'\\u4e2a\\uff09' : '' }}
                <input :id="'upload-app-'+appNovaName+'-'+f.field" type="file" style="display:none"
                  :multiple="(buildData.attachmentMap||{})[f.field] && (buildData.attachmentMap||{})[f.field].maxLimit > 1"
                  @change="$emit('attachment-change', f, $event)" />
              </label>
              <div v-if="(formData[f.field]||[]).length > 0" class="attachment-dropdown-item" @click="$emit('preview-click', f)">
                <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>查看文件（共{{ (formData[f.field]||[]).length }}个）
              </div>
              <div v-else class="attachment-dropdown-item attachment-disabled">
                <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>查看文件（共0个）
              </div>
            </div>
          </div>
        </transition>
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
