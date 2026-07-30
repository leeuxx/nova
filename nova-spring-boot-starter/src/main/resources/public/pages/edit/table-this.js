// pages/table-form.js — thisForm（基本信息）Vue 子组件
;(function () {

const { NInput, NSelect, NInputNumber, NDatePicker, NCheckboxGroup, NCheckbox,
       NRadioGroup, NRadio, NSpace, NDivider, NTooltip, NTag, NSwitch } = naive

window.NovaFormThis = {
  name: 'NovaFormThis',

  props: {
    formData:       { type: Object, required: true },
    formErrors:     { type: Object, default: function() { return {} } },
    editFields:     { type: Array,  default: function() { return [] } },
    editLayout:     { type: String, default: 'DEFAULT' },
    choiceMap:      { type: Object, default: function() { return {} } },
    referenceMap:   { type: Object, default: function() { return {} } },
    numberMap:      { type: Object, default: function() { return {} } },
    dateMap:        { type: Object, default: function() { return {} } },
    tagMap:         { type: Object, default: function() { return {} } },
    attachmentMap:  { type: Object, default: function() { return {} } },
    buttons:        { type: Object, default: function() { return {} } },
    booleanMap:     { type: Object, default: function() { return {} } },
    novaName:       { type: String, default: '' },
    formMode:       { type: String, default: 'add' },
    formTab:        { type: String, default: 'form' }
  },

  emits: ['field-change', 'reference-click', 'preview-click', 'attachment-change'],

  data() {
    return {
      attachmentDropdownKey: null
    }
  },

  computed: {
    visibleEditFields() {
      var fields = this.editFields
      var fd     = this.formData
      var evalFd = Object.assign({}, fd)
      for (var key in this.referenceMap) {
        var rf = this.referenceMap[key] && this.referenceMap[key].referenceField
        if (rf) evalFd[key] = fd[rf] !== undefined ? fd[rf] : null
      }
      return fields.map(function(f) { return {
        field: f,
        visible: !f.showByExpr || window.evalShowExpr(f.showByExpr, evalFd)
      }})
    },
    gridStyle() {
      return 'display:grid;gap:16px 24px;' + (this.editLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')
    }
  },

  methods: {
    // ── 字段事件 ──────────────────────────────────────────────────
    onFieldUpdate(field, value) {
      this.$emit('field-change', { field: field, value: value })
    },

    // ── 字段辅助方法 ──────────────────────────────────────────────
    isReadonly(f) {
      if (!f) return false
      if (f.readonly === true || (typeof f.readonly === 'object' && f.readonly.add !== false && f.readonly.edit !== false)) return true
      if (typeof f.readonly === 'object') {
        return this.formMode === 'add' ? !!f.readonly.add : !!f.readonly.edit
      }
      return false
    },
    editFieldOptions(f) {
      var choice = this.choiceMap[f.field]
      if (!choice || !choice.values) return []
      if (choice.refChoice) {
        var parentVal = this.formData[choice.refChoice]
        if (!parentVal || (Array.isArray(parentVal) && !parentVal.length)) return []
        return choice.values.filter(function(v) { return Array.isArray(parentVal) ? parentVal.includes(v.refValue) : v.refValue === parentVal }).map(function(v) { return { label: v.label, value: v.value } })
      }
      return choice.values.map(function(v) { return { label: v.label, value: v.value } })
    },
    tagOptions(field) {
      var tag = this.tagMap && this.tagMap[field]
      if (!tag || !tag.tags) return []
      return tag.tags.map(function(t) { return { label: t, value: t } })
    },
    datePickerType(field, vague, forEdit) {
      var dateInfo = this.dateMap && this.dateMap[field]
      var single = { DATE: 'date', TIME: 'time', DATE_TIME: 'datetime', MONTH: 'month', YEAR: 'year' }
      var range  = { DATE: 'daterange', TIME: 'time', DATE_TIME: 'datetimerange', MONTH: 'monthrange', YEAR: 'yearrange' }
      var map = vague ? range : single
      return (dateInfo && map[dateInfo.type]) || (vague ? 'daterange' : 'date')
    },
    datePickerDisabled(field, forEdit) {
      if (!forEdit) return undefined
      var dateInfo = this.dateMap && this.dateMap[field]
      if (!dateInfo || dateInfo.pickerMode === 'ALL') return undefined
      var today = new Date(); today.setHours(0, 0, 0, 0)
      var todayTs = today.getTime()
      if (dateInfo.pickerMode === 'FUTURE')  return function(ts) { return ts < todayTs }
      if (dateInfo.pickerMode === 'HISTORY') return function(ts) { return ts > todayTs }
      return undefined
    },
    referenceDisplayLabel(field) {
      var displayVal = this.formData[field + '_display']
      if (displayVal !== null && displayVal !== undefined && displayVal !== '') return String(displayVal)
      var val = this.formData[field]
      if (val === null || val === undefined || val === '') return ''
      return String(val)
    },
    setAttachmentDropdown(fieldKey) {
      this.attachmentDropdownKey = fieldKey
    },
    clearAttachmentDropdown() {
      this.attachmentDropdownKey = null
    },
    handleFormButton(field) {
      var cfg = this.buttons[field.field]
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
        // handleJs 优先：fetch js 文件，注入 param + transmitParams + $btn 执行
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
          novaName: this.novaName,
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
          if (window.$message) window.$message.error(err.message || '请求失败')
        })
      }
    },
  },

  template: `
<div :key="'tab_' + formTab" style="animation:tabFadeIn .5s cubic-bezier(0.22,0.61,0.36,1)">
<div :style="gridStyle">
  <template v-for="{field: f, visible: _vis} in visibleEditFields" :key="f.field">
    <n-divider v-if="f.type === 'DIVIDE' && editLayout !== 'FULL_LINE'" v-show="_vis" style="grid-column:1/-1;margin:0">{{ f.title }}</n-divider>
    <div v-else-if="f.type === 'EMPTY' && editLayout !== 'FULL_LINE'" v-show="_vis"></div>
    <div v-else-if="f.type === 'BUTTON'" v-show="_vis" style="display:flex;flex-direction:column;gap:4px;padding-top:25px;align-items:flex-start">
      <n-button v-if="buttons[f.field]" :color="buttons[f.field].color" :id="buttons[f.field].id" class="form-btn"
        :disabled="isReadonly(f)" :style="isReadonly(f) ? 'opacity:0.5;cursor:not-allowed' : undefined"
        @click="isReadonly(f) ? undefined : handleFormButton(f)">
        {{ f.title }}
      </n-button>
    </div>
    <div v-else-if="f.type !== 'DIVIDE' && f.type !== 'EMPTY' && f.type !== 'BUTTON'" v-show="_vis" :style="'display:flex;flex-direction:column;gap:4px' + (f.type === 'TEXTAREA' ? ';grid-column:1/-1' : '')"
         :aria-hidden="!_vis ? 'true' : undefined">
      <span class="edit-form-label">
        <span v-if="f.notNull && !isReadonly(f)" class="form-label-required">*</span>{{ f.title }}
        <n-tooltip v-if="f.desc" trigger="hover" placement="top">
          <template #trigger>
            <span class="form-label-help"><iconify-icon icon="material-symbols:help-outline" style="font-size:15px"></iconify-icon></span>
          </template>
          {{ f.desc }}
        </n-tooltip>
      </span>
      <n-checkbox-group
        v-if="f.type === 'CHOICE' && choiceMap[f.field] && choiceMap[f.field].showType === 'RADIO' && choiceMap[f.field].selectType === 'MULTI'"
        :value="formData[f.field]"
        :disabled="isReadonly(f)"
        @update:value="onFieldUpdate(f.field, $event)">
        <n-space><n-checkbox v-for="o in editFieldOptions(f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
      </n-checkbox-group>
      <n-radio-group
        v-else-if="f.type === 'CHOICE' && choiceMap[f.field] && choiceMap[f.field].showType === 'RADIO'"
        :value="formData[f.field]"
        :disabled="isReadonly(f)"
        @update:value="onFieldUpdate(f.field, $event)">
        <n-space><n-radio v-for="o in editFieldOptions(f)" :key="o.value" :value="o.value" :label="o.label" /></n-space>
      </n-radio-group>
      <n-select
        v-else-if="f.type === 'CHOICE' && choiceMap[f.field] && choiceMap[f.field].selectType === 'MULTI'"
        :value="formData[f.field]"
        :options="editFieldOptions(f)"
        :placeholder="'请选择' + f.title"
        :status="formErrors[f.field] ? 'error' : undefined"
        :disabled="isReadonly(f)"
        multiple clearable
        @update:value="onFieldUpdate(f.field, $event)" />
      <n-select
        v-else-if="f.type === 'CHOICE'"
        :value="formData[f.field]"
        :options="editFieldOptions(f)"
        :placeholder="'请选择' + f.title"
        :status="formErrors[f.field] ? 'error' : undefined"
        :disabled="isReadonly(f)"
        clearable
        @update:value="onFieldUpdate(f.field, $event)" />
      <div v-else-if="f.type === 'BOOLEAN' && (booleanMap[f.field] || {}).type === 'SWITCH'"
        style="display:flex;align-items:center;gap:8px;padding-top:2px">
        <n-switch
          :value="formData[f.field] === 'true'"
          :disabled="isReadonly(f)"
          @update:value="(v) => onFieldUpdate(f.field, v ? 'true' : 'false')" />
        <span style="font-size:13px;color:#666">{{ formData[f.field] === 'true' ? '是' : '否' }}</span>
      </div>
      <n-select
        v-else-if="f.type === 'BOOLEAN'"
        :value="formData[f.field]"
        :options="[{label:'\\u662f',value:'true'},{label:'\\u5426',value:'false'}]"
        :placeholder="'请选择' + f.title"
        :status="formErrors[f.field] ? 'error' : undefined"
        :disabled="isReadonly(f)"
        clearable
        @update:value="onFieldUpdate(f.field, $event)" />
      <n-input-number
        v-else-if="f.type === 'NUMBER'"
        :value="formData[f.field]"
        :placeholder="'请输入' + f.title"
        :min="numberMap[f.field] && numberMap[f.field].min"
        :max="numberMap[f.field] && numberMap[f.field].max"
        :precision="numberMap[f.field] && numberMap[f.field].type === 'DECIMAL' ? (numberMap[f.field].decimal || 2) : 0"
        :show-button="false"
        :status="formErrors[f.field] ? 'error' : undefined"
        :disabled="isReadonly(f)"
        clearable style="width:100%"
        @update:value="onFieldUpdate(f.field, $event)" />
      <n-date-picker
        v-else-if="f.type === 'DATE'"
        :value="formData[f.field]"
        :type="datePickerType(f.field, false, true)"
        :is-date-disabled="datePickerDisabled(f.field, true)"
        :placeholder="'请选择' + f.title"
        :status="formErrors[f.field] ? 'error' : undefined"
        :disabled="isReadonly(f)"
        clearable style="width:100%"
        @update:value="onFieldUpdate(f.field, $event)" />
      <n-select
        v-else-if="f.type === 'TAG'"
        :value="formData[f.field]"
        :options="tagOptions(f.field)"
        :placeholder="'请输入或选择' + f.title"
        :status="formErrors[f.field] ? 'error' : undefined"
        :disabled="isReadonly(f)"
        :max-tag-count="tagMap[f.field] && tagMap[f.field].maxTagCount"
        :tag="tagMap[f.field] && tagMap[f.field].allowExtension"
        filterable multiple clearable
        @update:value="onFieldUpdate(f.field, $event)" />
      <n-input
        v-else-if="f.type === 'TEXTAREA'"
        :value="formData[f.field]"
        type="textarea"
        :autosize="{ minRows: 3 }"
        :placeholder="'请输入' + f.title"
        :status="formErrors[f.field] ? 'error' : undefined"
        :disabled="isReadonly(f)"
        @update:value="onFieldUpdate(f.field, $event)" />
      <div v-else-if="f.type === 'REFERENCE' && referenceMap[f.field]"
        @click="!isReadonly(f) && $emit('reference-click', f)"
        style="cursor:pointer">
        <n-input
          :value="referenceDisplayLabel(f.field)"
          :placeholder="'请选择' + f.title"
          readonly
          clearable
          :status="formErrors[f.field] ? 'error' : undefined"
          :disabled="isReadonly(f)"
          @clear.stop="onFieldUpdate(f.field, null)">
          <template #suffix><iconify-icon icon="mdi:format-list-bulleted-square" style="color:#888;font-size:16px"></iconify-icon></template>
        </n-input>
      </div>
      <div v-else-if="f.type === 'ATTACHMENT'" class="attachment-field"
        @mouseenter="setAttachmentDropdown(f.field)" @mouseleave="clearAttachmentDropdown">
        <div class="attachment-btn">
          <iconify-icon icon="mdi:paperclip" style="font-size:13px"></iconify-icon>
          附件管理
          <iconify-icon icon="mdi:chevron-down" :style="'font-size:12px;transition:transform .2s ease;transform:' + (attachmentDropdownKey === f.field ? (attachmentMap[f.field] && attachmentMap[f.field].showType === 'DOWN' ? 'rotate(180deg)' : 'rotate(180deg)') : 'rotate(0deg)')"></iconify-icon>
        </div>
        <transition name="dropdown-fade">
          <div v-if="attachmentDropdownKey === f.field" :class="'attachment-dropdown' + (attachmentMap[f.field] && attachmentMap[f.field].showType === 'DOWN' ? ' down' : '')">
            <div class="attachment-dropdown-inner">
              <label v-if="!isReadonly(f) && (!attachmentMap[f.field] || !attachmentMap[f.field].maxLimit || (formData[f.field] || []).length < attachmentMap[f.field].maxLimit)"
                class="attachment-dropdown-item"
                :for="'upload-dd-' + f.field">
                <iconify-icon icon="mdi:upload" style="font-size:13px"></iconify-icon>
                上传文件{{ attachmentMap[f.field] && attachmentMap[f.field].maxLimit ? '（共' + (attachmentMap[f.field].maxLimit - (formData[f.field] || []).length) + '个）' : '' }}
                <input :id="'upload-dd-' + f.field" type="file" style="display:none"
                  :multiple="attachmentMap[f.field] && attachmentMap[f.field].maxLimit > 1"
                  :accept="attachmentMap[f.field] && attachmentMap[f.field].fileTypes && attachmentMap[f.field].fileTypes.length ? attachmentMap[f.field].fileTypes.join(',') : undefined"
                  @change="$emit('attachment-change', f, $event)" />
              </label>
              <div v-if="(formData[f.field] || []).length > 0" class="attachment-dropdown-item" @click="$emit('preview-click', f)">
                <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>
                查看文件（共{{ (formData[f.field] || []).length }}个）
              </div>
              <div v-else class="attachment-dropdown-item attachment-disabled">
                <iconify-icon icon="mdi:eye-outline" style="font-size:13px"></iconify-icon>
                查看文件（共0个）
              </div>
            </div>
          </div>
        </transition>
      </div>
      <n-input
        v-else
        :value="formData[f.field]"
        :placeholder="'请输入' + f.title"
        :status="formErrors[f.field] ? 'error' : undefined"
        :disabled="isReadonly(f)"
        clearable
        @update:value="onFieldUpdate(f.field, $event)" />
      <span v-if="formErrors[f.field]" class="form-error-tip">{{ formErrors[f.field] }}</span>
    </div>
  </template>
</div>
</div>
  `
}

})()
