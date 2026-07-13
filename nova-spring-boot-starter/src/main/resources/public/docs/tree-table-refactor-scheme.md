# 树形表格改版方案

## 一、背景与问题

当前树形表格复用 data 接口（分页查询），采用懒加载模式，存在以下问题：

1. **无法渲染整棵树**：只能点一级加载一级，用户无法一次性看到完整结构
2. **筛选无法查到子节点**：data 接口只查顶级节点，条件筛选命中子节点时无法返回结果
3. **树引用选取困难**：懒加载模式下，如果引用目标在深层，需要逐层展开才能选到

## 二、整体思路

- **一个接口**：新增 `tree` 接口，返回全量扁平列表（前端只调一次，增删改后刷新）
- **扁平返回**：后端返回扁平列表，前端根据上下级字段组装树
- **前端搜索**：树搜索由前端本地实现，基于配置指定的搜索字段做字符串匹配
- **无分页**：树形模式下隐藏分页器

## 三、接口设计

### 3.1 tree 接口

```
POST /nova/table/tree
Content-Type: application/json
```

**请求参数：**

```json
{
  "novaName": "xxx",
  "sourceNovaName": "xxx",
  "sourceFields": {}
}
```

- 不传 conditions（筛选前端做），不传 pageBean（无分页）
- 始终返回全量扁平列表

**响应格式：**

```json
{
  "code": 200,
  "data": [
    { "id": 1, "parentId": null, "name": "根节点A", "field1": "..." },
    { "id": 2, "parentId": 1, "name": "子节点B", "field1": "..." }
  ]
}
```

- 扁平列表，每条记录包含所有字段
- 包含上下级关联字段（字段名由配置决定）
- 无需组装 children，由前端组装

## 四、配置读取

### 4.1 build 接口的 tree 对象

```json
{
  "tree": {
    "value": true,            // 是否树结构
    "searchField": "name",    // 搜索条件字段
    "rootExpr": "parentId == null" // 根节点表达式（类似 @ShowBy）
  }
}
```

前端处理：
- 判断树模式：`resp.data.tree.value === true`
- 搜索字段：`resp.data.tree.searchField`
- 根节点判断：解析 `rootExpr` 表达式（复用 `evalShowExpr` 逻辑）

### 4.2 reference 中 isThisObj=true 的配置

从 `reference` 配置中找出 `isThisObj === true` 的字段：

```json
{
  "reference": {
    "parentId": {
      "isThisObj": true,
      "referenceField": "parentId",  // 子级存入父级的字段名（组装树用）
      "storageField": "id"           // 父级被子级关联的字段名（父表主键）
    }
  }
}
```

| 字段 | 含义 | 用途 |
|------|------|------|
| `referenceField` | 子级存入父级的字段名 | 组装树时作为 parentField，子节点通过此字段找父节点 |
| `storageField` | 父级被子级关联的字段名 | 父表主键字段，用于判断节点关系 |
| `isThisObj` | 是否自身树引用 | 标识这是树结构的上下级关联配置 |

### 4.3 搜索字段 displayName

从 `tableColumns` 中匹配 `field === tree.searchField`，取对应的 `title` 作为搜索输入框的 placeholder。

## 五、前端实现

### 5.1 新增状态

| 变量 | 说明 |
|------|------|
| `rawTreeData` | 完整树结构（全量），首次加载后缓存 |
| `treeNodeMap` | `pk → node` 映射，便于快速查节点 |
| `treeParentMap` | `pk → parentPk` 映射，便于查祖先链 |
| `treeSearchKeyword` | 当前搜索关键词 |
| `treeParentField` | 上下级关联字段名（从 reference.isThisObj.referenceField 读取） |
| `treeRootExpr` | 根节点表达式（从 tree.rootExpr 读取） |

### 5.2 首次加载流程

1. build 接口返回后，判断 `resp.data.tree.value === true`
2. 从 `reference` 中找出 `isThisObj === true` 的配置，提取 `referenceField` 作为 `treeParentField`
3. 调用 tree 接口
4. 拿到全量扁平列表
5. 调用 `translateRecords` 做字段翻译（choice/reference/appendage 等）
6. 调用 `buildTree` 组装完整树：
   - 根节点判断：对每个节点执行 `evalShowExpr(treeRootExpr, node)`，返回 true 的为根节点
   - 子节点挂载：根据 `treeParentField` 找到父节点，挂到父节点的 children 下
7. 存到 `rawTreeData`，构建 `treeNodeMap` 和 `treeParentMap`
8. `tableData = rawTreeData`（全部折叠）
9. `expandedRowKeys = []`

### 5.3 搜索流程

1. 用户输入搜索词（防抖 300ms）
2. 关键词为空 → `tableData = rawTreeData`，`expandedRowKeys = []`，结束
3. 关键词非空：
   - 遍历 `rawTreeData` 所有节点，对 `tree.searchField` 字段做字符串包含匹配（不区分大小写）
   - 收集命中节点的 key → `hitKeys`
   - 对每个命中节点，从 `treeParentMap` 查祖先链
   - 收集可见节点 key → `visibleKeys` = 命中节点 + 所有祖先
   - 基于 `rawTreeData` 构建视图树：递归过滤，只保留 `visibleKeys` 中的节点
   - 命中节点本身**不带子树**（子节点不在 visibleKeys 中就裁掉）
   - `tableData = 视图树`
   - `expandedRowKeys = 所有祖先节点的 key`（命中节点本身不展开）

### 5.4 清除搜索

- 搜索词清空 → `tableData = rawTreeData`，`expandedRowKeys = []`
- 不重新请求，直接用缓存的全量树

### 5.5 新增/修改/删除后

- 重新调用 tree 接口刷新全量树
- 更新 `rawTreeData`、`treeNodeMap`、`treeParentMap`
- 如果当前有搜索词：重新执行搜索逻辑（基于新的全量树）
- 如果无搜索词：`tableData = rawTreeData`，全部折叠

### 5.6 辅助函数

**buildTree(list, parentField, rootExpr, pkField)**
- 输入：扁平列表、上下级字段名、根节点表达式、主键字段名
- 输出：嵌套树结构
- 步骤：
  1. 构建 `pk → node` 映射
  2. 对每个节点执行 `evalShowExpr(rootExpr, node)`，判断是否为根节点
  3. 非根节点：根据 `parentField` 找到父节点，挂到父节点的 children 下
  4. 孤儿节点（父不在列表中）作为根处理

**getAncestorKeys(nodeKey)**
- 输入：节点 key
- 输出：该节点所有祖先的 key 数组（从根到父节点，不含自身）
- 基于 `treeParentMap` 向上追溯

**buildViewTree(fullTree, visibleKeys)**
- 输入：完整树、可见节点 key 集合
- 输出：视图树（裁剪后的子树）
- 递归：当前节点在 visibleKeys 中则保留，子节点递归过滤

## 六、搜索入口 UI

- 树形模式下，搜索区**只显示一个输入框**（原有的多条件筛选隐藏）
- 输入框 placeholder：`搜索 + tableColumns中searchField对应的title`
- 输入实时搜索（防抖 300ms），不需要查询/重置按钮
- 输入框右侧有清空按钮（naive-ui n-input 原生支持）

## 七、展示规则

| 场景 | 展示内容 | 展开状态 |
|------|----------|----------|
| 首次加载 / 搜索为空 | 全量树，所有节点 | 全部折叠 |
| 搜索有结果 | 命中节点 + 祖先链，未命中兄弟不展示 | 祖先链展开，命中节点折叠 |

- 命中节点的兄弟节点：**不展示**
- 多个命中节点共享祖先：**合并到同一棵子树**
- 命中节点高亮：**暂不做**

## 八、分页器

- 树形模式下：`pagination = false`（隐藏分页器）
- 普通列表模式：保持现状

## 九、改动文件清单

| 文件 | 改动内容 |
|------|----------|
| `public/jq/table.js` | 修改 build 接口 tree 判断逻辑（`tree.value === true`）；新增 `loadTreeData` 函数调用 tree 接口；从 reference.isThisObj 提取 treeParentField |
| `public/pages/table.js` | 新增 rawTreeData / treeNodeMap / treeParentMap / treeSearchKeyword / treeParentField / treeRootExpr 等状态；新增 buildTree / getAncestorKeys / buildViewTree 方法；搜索区 UI 适配树形模式；分页器适配；增删改后刷新逻辑适配 |
| 后端 | tree 接口已实现，返回全量扁平列表 |

## 十、边界情况

1. **孤儿节点**：扁平列表中父节点不存在的节点，作为根节点处理
2. **空数据**：tree 接口返回空数组时，展示空状态
3. **搜索无命中**：展示"无匹配数据"
4. **根节点命中**：祖先链为空，直接展示该节点（折叠）
5. **搜索字段为空值**：某些节点搜索字段值为 null/undefined 时，视为不匹配
6. **rootExpr 表达式解析失败**：兜底处理，视为非根节点（挂到父节点下）
7. **数据量**：预期几百到一两千条，不做虚拟滚动；超量时由后端限制或后续优化