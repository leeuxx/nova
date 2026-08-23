package xyz.nova.nova;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.SysBtnHide;
import xyz.nova.annotation.sub.nova.TreeType;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.*;
import xyz.nova.annotation.sub.nova.row.ExprBool;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.service.MenuServiceImpl;
import xyz.nova.utils.RowAuthExpr;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "菜单管理",
        dataProxy = MenuServiceImpl.class,
        conditionClass = void.class,
        sysBtnHide = @SysBtnHide(
                edit = @ShowBy("id <= 31"),
                delete = @ShowBy("id <= 31"),
                rowSelect = @ShowBy("id <= 31")
        ),
        tree = @TreeType(
                label = "name",
                cascade = false
        ),
        rowOperation = {
                @RowOperation(
                        title = "添加",
                        mode = RowOperation.Mode.SINGLE,
                        param = "menu_add",
                        ifExpr = "id > 31",
                        novaClass = MenuNova.class,
                        operationHandler = MenuServiceImpl.class,
                        show = @ExprBool(
                                param = "menu_add",
                                exprHandler = RowAuthExpr.class
                        )
                )
        }
)
public class MenuNova {

    @NovaId
    @NovaField(
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            views = @View(title = "名称", width = "12%"),
            edit = @Edit(
                    title = "名称",
                    notNull = true,
                    group = "主要信息"
            )
    )
    private String name;

    @NovaField(
            views = @View(title = "编码", width = "10%"),
            edit = @Edit(
                    title = "编码",
                    show = false
            )
    )
    private String code;

    @NovaField(
            views = @View(title = "图标", width = "9%", desc = "图标参考：https://icon-sets.iconify.design/material-symbols"),
            edit = @Edit(
                    title = "图标",
                    desc = "图标参考：https://icon-sets.iconify.design/material-symbols",
                    type = Edit.Type.ICON,
                    defaultValue = "tdesign:system-2",
                    notNull = true,
                    group = "主要信息"
            )
    )
    private String icon;

    @NovaField(
            views = @View(title = "类型", width = "10%"),
            edit = @Edit(
                    title = "类型",
                    type = Edit.Type.CHOICE,
                    choiceType = @ChoiceType(
                            vl = {
                                    @VL(value = "DIR", label = "目录"),
                                    @VL(value = "NOVA", label = "Nova视图"),
                                    @VL(value = "TPL", label = "自定义视图"),
                                    @VL(value = "BUTTON", label = "按钮")
                            }
                    ),
                    notNull = true,
                    group = "主要信息"
            )
    )
    private String type;

    @NovaField(
            edit = @Edit(
                    title = "上级菜单",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            ref = "parentId"
                    ),
                    group = "主要信息"
            )
    )
    private MenuNova menuNova;

    @NovaField(
            views = @View(title = "类型值", width = "10%", defaultValue = "-"),
            edit = @Edit(
                    title = "类型值",
                    notNull = true,
                    showBy = @ShowBy("type == 'NOVA' || type == 'TPL'"),
                    group = "主要信息"
            )
    )
    private String value;

    @NovaField(
            views = @View(title = "系统按钮", width = "10%", defaultValue = "-"),
            edit = @Edit(
                    title = "系统按钮",
                    type = Edit.Type.CHOICE,
                    choiceType = @ChoiceType(
                            showType = ChoiceType.ShowType.RADIO,
                            selectType = ChoiceType.SelectType.MULTI,
                            vl = {
                                    @VL(value = "ADD", label = "新增", color = "#0000FF"),
                                    @VL(value = "EDIT", label = "编辑", color = "#FFFF00"),
                                    @VL(value = "DELETE", label = "删除", color = "#FF0000")
                            }
                    ),
                    showBy = @ShowBy("type == 'NOVA'"),
                    group = "主要信息"
            )
    )
    private String sysButton;

    @NovaField(
            views = @View(title = "排序", width = "5%", desc = "正序"),
            edit = @Edit(
                    title = "排序",
                    desc = "正序",
                    defaultValue = "0",
                    group = "扩展信息"
            )
    )
    private Integer sort;

    @NovaField(
            views = @View(title = "显示状态", width = "9%"),
            edit = @Edit(
                    title = "显示状态",
                    booleanType = @BooleanType(
                            type = BooleanType.Type.SEGMENT,
                            tableType = BooleanType.Type.SWITCH
                    ),
                    defaultValue = "true",
                    group = "主要信息"
            )
    )
    private Boolean status;

    @NovaField(
            views = @View(title = "自定义参数", width = "10%", defaultValue = "-"),
            edit = @Edit(
                    title = "自定义参数",
                    type = Edit.Type.TEXTAREA,
                    group = "扩展信息"
            )
    )
    private String param;

    @NovaField(
            views = @View(title = "创建时间", width = "15%"),
            edit = @Edit(
                    title = "创建时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType,
                    show = false
            )
    )
    private LocalDateTime createTime;

}
