package xyz.nova.nova;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.DateType;
import xyz.nova.annotation.sub.nova.field.edit.LinkTargetType;
import xyz.nova.annotation.sub.nova.field.edit.Search;
import xyz.nova.nova.condition.UserRoleCondition;
import xyz.nova.service.UserRoleServiceImpl;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "用户角色",
        dataProxy = UserRoleServiceImpl.class,
        conditionClass = UserRoleCondition.class
)
public class UserRoleNova {

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
                    @View(title = "用户名称", column = "name")
            },
            edit = @Edit(
                    title = "用户信息",
                    type = Edit.Type.LINK_TARGET,
                    linkTargetType = @LinkTargetType(
                            type = LinkTargetType.Type.OPERATE,
                            ref = "userId"
                    )
            )
    )
    private UserNova userNova;

    @NovaField(
            views = {
                    @View(title = "角色名称", column = "name"),
                    @View(title = "角色编码", column = "code"),
                    @View(title = "角色状态", column = "status")
            },
            edit = @Edit(
                    title = "角色信息",
                    type = Edit.Type.LINK_TARGET,
                    linkTargetType = @LinkTargetType(
                            type = LinkTargetType.Type.SELECT,
                            ref = "roleId"
                    )
            )
    )
    private RoleNova roleNova;

    @NovaField(
            views = @View(
                    title = "创建时间"
            ),
            edit = @Edit(
                    title = "创建时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType,
                    show = false
            )
    )
    private LocalDateTime createTime;
}
