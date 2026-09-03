<h1 align="center">🚀 Nova 全栈协议框架</h1>

<p align="center">
  <strong>JDK 21 · Spring Boot 3.3.4 · Naive UI · 零前端代码的后台协议框架</strong>
</p>

<p align="center">
  <a href="https://www.yuque.com/laoshiren-bne7g/dg287r"><img src="https://img.shields.io/badge/📚-使用文档-4A90D9?style=flat-square" alt="文档"></a>
  <a href="https://nova-demo.example.com"><img src="https://img.shields.io/badge/🧪-在线体验-28f439?style=flat-square" alt="体验"></a>
  <a href="https://github.com/your-org/nova"><img src="https://img.shields.io/badge/🐙-GitHub-181717?style=flat-square" alt="GitHub"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/📄-Apache%202.0-blue?style=flat-square" alt="License"></a>
</p>

---

## ✨ 简介

**Nova** 是一款注解驱动的后台协议框架，帮助开发者**零前端代码**实现管理系统搭建！

### 核心理念

> 用 Java 注解描述视图 → Nova 编译为渲染协议 → 自动生成管理界面

❌ 不绑定任何数据源

❌ 不生成任何代码

❌ 不提供任何 CRUD 模板

**你写的不是页面，是页面的元数据。**

---

## 🧩 核心特性

| 特性 | 说明 |
|:---|:---|
| 🧬 **现代底座** | 基于 JDK 21 + Spring Boot 3.x + Naive UI |
| 📡 **视图全协议** | 后端注解驱动 UI，全程 0 前端代码 |
| 🧩 **多形态布局** | 支持表格、树、左右双表、Tab 视图等多种布局 |
| 🔐 **权限单点真理** | 菜单 / 操作 / 子表均由后端统一裁剪 |
| 🔗 **上下文联动** | 主从数据、交互状态可穿透传递 |
| 🚪 **可逃逸** | 内置能力覆盖不了的场景，可通过 Custom View 无缝接入原生自定义页面 |

---

## 📦 代码示例

```java
@Data
@Accessors(chain = true)
@Nova(
    name = "用户管理",
    dataProxy = UserServiceImpl.class,
    conditionClass = UserCondition.class
)
public class UserNova {

    @NovaId
    @NovaField(
        views = @View(title = "ID"),
        edit = @Edit(title = "ID", show = false)
    )
    private String id;

    @NovaField(
        views = @View(title = "用户名"),
        edit = @Edit(title = "用户名", notNull = true, search = @Search)
    )
    private String name;

    @NovaField(
        views = @View(title = "性别"),
        edit = @Edit(
            title = "性别",
            type = Edit.Type.CHOICE,
            choiceType = @ChoiceType(
                vl = {
                    @VL(value = "1", label = "男", color = "#28f439"),
                    @VL(value = "2", label = "女", color = "#fe6767")
                }
            ),
            notNull = true,
            search = @Search
        )
    )
    private Integer sex;

    @NovaField(
        views = @View(title = "技术栈"),
        edit = @Edit(
            title = "技术栈",
            type = Edit.Type.CHOICE,
            choiceType = @ChoiceType(
                selectType = ChoiceType.SelectType.MULTI,
                vl = {
                    @VL(value = "Java", label = "Java"),
                    @VL(value = "Python", label = "Python"),
                    @VL(value = "C++", label = "C++"),
                    @VL(value = "go", label = "Golang"),
                    @VL(value = "js", label = "JavaScript")
                }
            ),
            notNull = true,
            search = @Search(vague = true)
        )
    )
    private String skill;

    @NovaField(
        views = @View(title = "年龄"),
        edit = @Edit(title = "年龄")
    )
    private Integer age;

    @NovaField(
        views = @View(title = "邮箱"),
        edit = @Edit(title = "邮箱")
    )
    private String email;

    @NovaField(
        views = @View(title = "备注"),
        edit = @Edit(title = "备注", type = Edit.Type.TEXTAREA, desc = "这是说明")
    )
    private String remarks;

    @NovaField(
        views = @View(title = "创建时间"),
        edit = @Edit(title = "创建时间", type = Edit.Type.DATE, dateType = @DateType, show = false)
    )
    private LocalDateTime createTime;

}
```

---

## 🖥️ 页面预览

<p align="center">
  <img src="images/1.png" width="40%" style="margin: 12px;">
  <img src="images/2.png" width="40%" style="margin: 12px;">
</p>
<p align="center">
  <img src="images/3.png" width="40%" style="margin: 12px;">
  <img src="images/4.png" width="40%" style="margin: 12px;">
</p>

---