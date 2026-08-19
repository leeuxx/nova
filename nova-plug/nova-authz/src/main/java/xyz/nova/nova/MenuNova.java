package xyz.nova.nova;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.TreeType;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.*;
import xyz.nova.service.MenuServiceImpl;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "菜单管理",
        desc = "菜单功能管理",
        orderBy = "sort asc",
        dataProxy = MenuServiceImpl.class,
        conditionClass = void.class,
        tree = @TreeType(
                label = "name"
        )
)
public class MenuNova {

    @NovaId
    @NovaField(
            views = @View(title = "ID", width = "10%"),
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            views = @View(title = "名称", width = "10%"),
            edit = @Edit(
                    title = "名称",
                    notNull = true
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
            views = @View(title = "图标", width = "10%"),
            edit = @Edit(
                    title = "图标",
                    notNull = true
            )
    )
    private String icon;

    @NovaField(
            edit = @Edit(
                    title = "上级菜单",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            ref = "parentId"
                    )
            )
    )
    private MenuNova menuNova;

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
                    notNull = true
            )
    )
    private String type;

    @NovaField(
            views = @View(title = "类型值", width = "10%"),
            edit = @Edit(
                    title = "类型值",
                    notNull = true,
                    showBy = @ShowBy("type == 'NOVA' || type == 'TPL'")
            )
    )
    private String value;

    @NovaField(
            views = @View(title = "排序", width = "10%"),
            edit = @Edit(
                    title = "排序"
            )
    )
    private Integer sort;

    @NovaField(
            views = @View(title = "显示状态", width = "10%"),
            edit = @Edit(
                    title = "显示状态",
                    booleanType = @BooleanType(
                            type = BooleanType.Type.SEGMENT,
                            tableType = BooleanType.Type.SWITCH
                    )
            )
    )
    private Boolean status;

    @NovaField(
            views = @View(title = "自定义参数", width = "10%"),
            edit = @Edit(
                    title = "自定义参数",
                    type = Edit.Type.TEXTAREA
            )
    )
    private String param;

    @NovaField(
            views = @View(title = "创建时间", width = "10%"),
            edit = @Edit(
                    title = "创建时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType,
                    show = false
            )
    )
    private LocalDateTime createTime;

}
