package xyz.nova.nova;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.LinkTargetType;
import xyz.nova.service.RoleMenuServiceImpl;

@Data
@Accessors(chain = true)
@Nova(
        name = "角色菜单",
        dataProxy = RoleMenuServiceImpl.class,
        conditionClass = void.class
)
public class RoleMenuNova {

    @NovaId
    @NovaField(
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            views = {
                    @View(title = "角色名称", column = "name"),
                    @View(title = "用户编码", column = "code")
            },
            edit = @Edit(
                    title = "角色信息",
                    type = Edit.Type.LINK_TARGET,
                    linkTargetType = @LinkTargetType(
                            type = LinkTargetType.Type.OPERATE,
                            ref = "roleId"
                    )
            )
    )
    private RoleNova roleNova;

    @NovaField(
            views = {
                    @View(title = "菜单图标", column = "icon"),
                    @View(title = "菜单名称", column = "name"),
                    @View(title = "菜单类型", column = "type")
            },
            edit = @Edit(
                    title = "角色信息",
                    type = Edit.Type.LINK_TARGET,
                    linkTargetType = @LinkTargetType(
                            type = LinkTargetType.Type.SELECT,
                            ref = "menuId"
                    )
            )
    )
    private MenuNova menuNova;
}
