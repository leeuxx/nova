// pages/table.js — 通用表格页 Vue 组件，所有表格菜单共用此模板
;(function () {
const { h } = Vue
const { NPopconfirm, NSpace, NTooltip } = naive

// 将后端百分比宽度（"25%"）转为像素，基准 1200px
function parseWidth(w) {
  if (!w) return 150
  if (String(w).endsWith('%')) return Math.round(parseFloat(w) * 12)
  return parseInt(w) || 150
}

const NovaTable = {
  name: 'NovaTable',

  data() {
    return {
      novaName:       '',
      pkFieldName:    'id',
      tableData:      [],
      tableColumns:   [],
      sortStates:     {},
      filterExpanded: true,
      checkedRowKeys: [],
      searchFields:   [],
      filterForm:     {},
      showForm:       false,
      currentRow:     null,
      formData:       {},
      editFields:     [],
      editLayout:     'DEFAULT',
      formErrors:     {},
      striped:        true,
      tableSize:      'medium',
      pageSize:       10,
      pageSizes:      [10, 20, 50, 100],
      loading:        false,
      paginationConfig: {
        page:            1,
        itemCount:       0,
        pageSize:        10,
        showSizePicker:  true,
        pageSizes:       [10, 20, 50, 100],
        showQuickJumper: true
      }
    }
  },

  computed: {
    scrollX() {
      if (!this.tableColumns.length) return 1200
      return 50 + 140 + this.tableColumns.reduce((sum, col) => sum + parseWidth(col.width), 0)
    },

    filteredData() {
      return this.tableData
    },

    columns() {
      const vm   = this
      const cols = [
        { type: 'selection', title: '', key: 'selection', width: 50 }
      ]

      this.tableColumns.forEach(col => {
        const colDef = {
          key:   col.field,
          width: parseWidth(col.width),
          title: col.title
        }

        if (col.desc || col.sortable) {
          colDef.title = () => {
            const parts = [h('span', col.title)]
            if (col.desc) {
              parts.push(
                h(NTooltip, { trigger: 'hover', placement: 'top' }, {
                  default: () => col.desc,
                  trigger: () => h('span', {
                    style: 'margin-left:4px;color:#aaa;cursor:help;display:inline-flex;align-items:center',
                    onClick: (e) => e.stopPropagation()
                  }, [
                    h('iconify-icon', { icon: 'material-symbols:help-outline', style: 'font-size:16px' })
                  ])
                })
              )
            }
            if (col.sortable) {
              const state = vm.sortStates[col.field]
              parts.push(
                h('span', {
                  style: 'margin-left:5px;display:inline-flex;flex-direction:column;gap:0'
                }, [
                  h('span', { style: `display:block;font-size:7px;line-height:1;transform:scaleX(1.5);color:${state === 'asc'  ? '#2563eb' : '#ccc'}` }, '▲'),
                  h('span', { style: `display:block;font-size:7px;line-height:1;transform:scaleX(1.5);color:${state === 'desc' ? '#2563eb' : '#ccc'}` }, '▼')
                ])
              )
            }
            return h('span', {
              style: `display:inline-flex;align-items:center;${col.sortable ? 'cursor:pointer;width:100%' : ''}`,
              onClick: col.sortable ? () => vm.toggleSort(col.field) : undefined
            }, parts)
          }
        }

        cols.push(colDef)
      })

      cols.push({
        title: '操作', key: 'actions', width: 140, fixed: 'right',
        render(row) {
          return h(NSpace, { size: 8 }, {
            default: () => [
              h('span', { style: { color: '#2080f0', cursor: 'pointer', fontSize: '13px' }, onClick: () => vm.handleEdit(row) }, '编辑'),
              h(NPopconfirm,
                { onPositiveClick: () => vm.handleDelete(row), positiveText: '确定', negativeText: '取消' },
                {
                  default: () => '确定删除吗？',
                  trigger:  () => h('span', { style: { color: '#d03050', cursor: 'pointer', fontSize: '13px' } }, '删除')
                }
              )
            ]
          })
        }
      })

      return cols
    }
  },

  watch: {
    '$route.params.novaName'(newVal) {
      if (newVal && window.NovaTableJQ) window.NovaTableJQ.onRouteChange(newVal)
    }
  },

  mounted() {
    window.vmMap = window.vmMap || {}
    this.novaName = this.$route.params.novaName || ''
    window.vmMap[this.novaName] = this
    window.activeNovaName = this.novaName
    // 挂载分页回调（需要 this，不能在 data 里写）
    this.paginationConfig.onUpdatePage     = this.handlePageChange
    this.paginationConfig.onUpdatePageSize = this.handlePageSizeChange
    this.paginationConfig.suffix           = ({ itemCount }) => `共 ${itemCount} 条`
    if (window.NovaTableJQ) window.NovaTableJQ.onMounted(this.novaName)
  },

  activated() {
    window.activeNovaName = this.novaName
    setTimeout(() => window.NovaTableJQ && window.NovaTableJQ.updateTableHeight(), 80)
  },

  beforeUnmount() {
    if (window.vmMap) delete window.vmMap[this.novaName]
    if (window.activeNovaName === this.novaName) window.activeNovaName = null
    $(window).off('resize.novaTable')
  },

  methods: {
    toggleSort(field) {
      const cur  = this.sortStates[field]
      const next = cur == null ? 'asc' : cur === 'asc' ? 'desc' : null
      this.sortStates = Object.assign({}, this.sortStates, { [field]: next })
      window.NovaTableJQ.onSortChange(this.novaName)
    },
    toggleFilter() {
      this.filterExpanded = !this.filterExpanded
      this.$nextTick(() => window.NovaTableJQ && window.NovaTableJQ.updateTableHeight())
    },
    fieldOptions(field) {
      if (!field.choiceInfo || !field.choiceInfo.values) return []
      return Object.entries(field.choiceInfo.values).map(([value, label]) => ({ label, value }))
    },
    editFieldOptions(f) {
      if (!f.choiceInfo || !f.choiceInfo.values) return []
      return Object.entries(f.choiceInfo.values).map(([value, label]) => ({ label, value }))
    },
    handleCheck(keys)   { this.checkedRowKeys = keys },
    handleReset()       { window.NovaTableJQ.handleReset() },
    handleQuery()       { window.NovaTableJQ.loadData(this.novaName) },
    handleAdd()         { window.NovaTableJQ.handleAdd() },
    handleEdit(row)     { window.NovaTableJQ.handleEdit(row) },
    handleDelete(row)   { window.NovaTableJQ.handleDelete(row) },
    handleBatchDelete() { window.NovaTableJQ.handleBatchDelete() },
    handleFormSubmit()  { window.NovaTableJQ.handleFormSubmit() },
    handlePageChange(current) {
      window.NovaTableJQ.onPageChange(this.novaName, current)
    },
    handlePageSizeChange(pageSize) {
      window.NovaTableJQ.onPageSizeChange(this.novaName, pageSize)
    }
  },

  template: `
    <div style="padding:16px">

      <!-- 筛选卡片 -->
      <n-card :bordered="false" class="page-card filter-card">
        <div class="filter-grid">
          <template v-for="field in searchFields" :key="field.field">
            <div v-if="!field.vague || filterExpanded" style="display:flex;align-items:center;gap:8px;width:100%">
              <span class="form-label">{{ field.title }}</span>
              <n-select v-if="field.type === 'CHOICE' && field.choiceInfo && field.choiceInfo.selectType === 'SINGLE'"
                v-model:value="filterForm[field.field]"
                :options="fieldOptions(field)"
                :placeholder="'请选择' + field.title"
                clearable style="flex:1"
              />
              <n-select v-else-if="field.type === 'CHOICE' && field.choiceInfo && field.choiceInfo.selectType === 'MULTI'"
                v-model:value="filterForm[field.field]"
                :options="fieldOptions(field)"
                :placeholder="'请选择' + field.title"
                multiple clearable style="flex:1"
              />
              <n-input v-else
                v-model:value="filterForm[field.field]"
                :placeholder="'请输入' + field.title"
                clearable style="flex:1"
              />
            </div>
          </template>
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;grid-column:4">
            <n-button @click="handleReset">重 置</n-button>
            <n-button type="primary" @click="handleQuery">查 询</n-button>
            <n-button dashed @click="toggleFilter">
              <template #icon>
                <n-icon><iconify-icon :icon="filterExpanded ? 'material-symbols:keyboard-arrow-up' : 'material-symbols:keyboard-arrow-down'"></iconify-icon></n-icon>
              </template>
              {{ filterExpanded ? '收 起' : '展 开' }}
            </n-button>
          </div>
        </div>
      </n-card>

      <!-- 表格卡片 -->
      <n-card :bordered="false" class="page-card table-card">
        <div class="table-card-header">
          <span style="font-size:16px;font-weight:500">数据列表</span>
          <div style="display:flex;gap:8px">
            <n-button v-if="checkedRowKeys.length > 0" type="error" @click="handleBatchDelete">
              <template #icon><n-icon><iconify-icon icon="material-symbols:delete-outline"></iconify-icon></n-icon></template>
              删 除
            </n-button>
            <n-button type="primary" @click="handleAdd">
              <template #icon><n-icon><iconify-icon icon="material-symbols:add"></iconify-icon></n-icon></template>
              新 增
            </n-button>
            <n-button circle class="btn-circle" style="background:transparent">
              <template #icon><n-icon size="15"><iconify-icon icon="lucide:refresh-cw" style="font-size:15px"></iconify-icon></n-icon></template>
            </n-button>
            <n-popover trigger="click" placement="bottom-end">
              <template #trigger>
                <n-button circle class="btn-circle" style="background:transparent">
                  <template #icon><n-icon size="15"><iconify-icon icon="lucide:settings" style="font-size:15px"></iconify-icon></n-icon></template>
                </n-button>
              </template>
              <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;min-width:160px">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
                  <span>斑马纹</span>
                  <n-switch v-model:value="striped" />
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
                  <span>表格大小</span>
                  <n-radio-group v-model:value="tableSize" size="small">
                    <n-radio-button value="small">紧凑</n-radio-button>
                    <n-radio-button value="medium">默认</n-radio-button>
                    <n-radio-button value="large">宽松</n-radio-button>
                  </n-radio-group>
                </div>
              </div>
            </n-popover>
          </div>
        </div>
        <div id="table-wrapper">
          <n-data-table
            :data="filteredData"
            :columns="columns"
            :row-key="row => row[pkFieldName]"
            :checked-row-keys="checkedRowKeys"
            @update:checked-row-keys="handleCheck"
            :loading="loading"
            :remote="true"
            :pagination="paginationConfig"
            :striped="striped"
            :size="tableSize"
            :scroll-x="scrollX"
            :flex-height="true"
            style="width:100%;height:100%"
          />
        </div>
      </n-card>

      <!-- 新增/编辑弹窗 -->
      <n-modal v-model:show="showForm" preset="card" :title="currentRow ? '编辑' : '新增'" style="width:760px;margin-top:80px">
        <div :style="'display:grid;gap:16px 24px;' + (editLayout === 'FULL_LINE' ? 'grid-template-columns:1fr' : 'grid-template-columns:1fr 1fr 1fr')">
          <template v-for="f in editFields" :key="f.field">
            <div style="display:flex;flex-direction:column;gap:4px">
              <span style="font-size:13px;color:#333">
                <span v-if="f.notNull" style="color:#d03050;margin-right:2px">*</span>{{ f.title }}
              </span>
              <n-select
                v-if="f.type === 'CHOICE' && f.choiceInfo && f.choiceInfo.selectType === 'MULTI'"
                v-model:value="formData[f.field]"
                :options="editFieldOptions(f)"
                :placeholder="'请选择' + f.title"
                :status="formErrors[f.field] ? 'error' : undefined"
                multiple clearable
                @update:value="delete formErrors[f.field]"
              />
              <n-select
                v-else-if="f.type === 'CHOICE'"
                v-model:value="formData[f.field]"
                :options="editFieldOptions(f)"
                :placeholder="'请选择' + f.title"
                :status="formErrors[f.field] ? 'error' : undefined"
                clearable
                @update:value="delete formErrors[f.field]"
              />
              <n-input
                v-else
                v-model:value="formData[f.field]"
                :placeholder="'请输入' + f.title"
                :status="formErrors[f.field] ? 'error' : undefined"
                clearable
                @update:value="delete formErrors[f.field]"
              />
              <span v-if="formErrors[f.field]" style="font-size:12px;color:#d03050">{{ formErrors[f.field] }}</span>
            </div>
          </template>
        </div>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showForm = false">取 消</n-button>
            <n-button type="primary" @click="handleFormSubmit">确 定</n-button>
          </n-space>
        </template>
      </n-modal>

    </div>
  `
}

window.NovaTable = NovaTable
})()
