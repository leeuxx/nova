package xyz.nova.nova;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.Layout;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.BooleanType;
import xyz.nova.annotation.sub.nova.field.edit.DateType;
import xyz.nova.annotation.sub.nova.field.edit.LinkType;
import xyz.nova.annotation.sub.nova.field.edit.Search;
import xyz.nova.nova.condition.RoleCondition;
import xyz.nova.service.RoleServiceImpl;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "角色管理",
        layout = @Layout(
                editLayout = Layout.EditLayout.FULL_LINE
        ),
        dataProxy = RoleServiceImpl.class,
        conditionClass = RoleCondition.class
)
public class RoleNova {

    @NovaId
    @NovaField(
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            views = @View(title = "名称"),
            edit = @Edit(
                    title = "名称",
                    notNull = true,
                    search = @Search(vague = true)
            )
    )
    private String name;

    @NovaField(
            views = @View(title = "编码"),
            edit = @Edit(
                    title = "编码",
                    notNull = true,
                    search = @Search(vague = true)
            )
    )
    private String code;

    @NovaField(
            views = @View(title = "启用状态"),
            edit = @Edit(
                    title = "启用状态",
                    booleanType = @BooleanType(
                            type = BooleanType.Type.SEGMENT,
                            tableType = BooleanType.Type.SWITCH
                    ),
                    defaultValue = "true",
                    search = @Search
            )
    )
    private Boolean status;

    @NovaField(
            views = @View(title = "创建时间"),
            edit = @Edit(
                    title = "创建时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType,
                    show = false
            )
    )
    private LocalDateTime createTime;

    @NovaField(
            edit = @Edit(
                    title = "菜单授权",
                    type = Edit.Type.LINK,
                    linkType = @LinkType
            )
    )
    private RoleMenuNova roleMenuNova;

}
