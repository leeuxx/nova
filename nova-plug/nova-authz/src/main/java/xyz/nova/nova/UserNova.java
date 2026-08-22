package xyz.nova.nova;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.Layout;
import xyz.nova.annotation.sub.nova.SysBtnHide;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.*;
import xyz.nova.annotation.sub.nova.row.ExprBool;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.nova.condition.UserCondition;
import xyz.nova.service.RoleServiceImpl;
import xyz.nova.service.UserServiceImpl;
import xyz.nova.service.data.DefaultDataProxy;
import xyz.nova.utils.RowAuthExpr;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "用户管理",
        orderBy = "create_time desc",
        dataProxy = UserServiceImpl.class,
        conditionClass = UserCondition.class,
        sysBtnHide = @SysBtnHide(
                edit = @ShowBy("account == 'nova'"),
                delete = @ShowBy("account == 'nova'")
        ),
        rowOperation = {
                @RowOperation(
                        title = "重置密码",
                        mode = RowOperation.Mode.SINGLE,
                        param = "user_reset_pwd",
                        novaClass = UserNova.UserResetPwdNova.class,
                        operationHandler = UserServiceImpl.class,
                        show = @ExprBool(
                                param = "user_reset_pwd",
                                exprHandler = RowAuthExpr.class
                        )
                )
        }
)
public class UserNova {

    @NovaId
    @NovaField(
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
                    notNull = true,
                    search = @Search(vague = true),
                    group = "主要信息"
            )
    )
    private String name;

    @NovaField(
            views = @View(title = "账号", width = "10%"),
            edit = @Edit(
                    title = "账号",
                    notNull = true,
                    readonly = @Readonly(edit = true),
                    group = "主要信息"
            )
    )
    private String account;

    @NovaField(
            edit = @Edit(
                    title = "密码",
                    notNull = true,
                    readonly = @Readonly(edit = true),
                    group = "主要信息"
            )
    )
    private String password;

    @NovaField(
            views = @View(
                    title = "超管用户",
                    sortable = true, width = "10%"
            ),
            edit = @Edit(
                    title = "超管用户",
                    booleanType = @BooleanType(
                            type = BooleanType.Type.SEGMENT
                    ),
                    defaultValue = "false",
                    search = @Search,
                    group = "主要信息"
            )
    )
    private Boolean isAdmin;

    @NovaField(
            views = @View(
                    title = "可用状态",
                    sortable = true, width = "10%"
            ),
            edit = @Edit(
                    title = "可用状态",
                    booleanType = @BooleanType(
                            type = BooleanType.Type.SEGMENT
                    ),
                    defaultValue = "true",
                    group = "主要信息"
            )
    )
    private Boolean status;

    @NovaField(
            views = {
                    @View(title = "组织名称", column = "name", width = "10%", defaultValue = "-")
            },
            edit = @Edit(
                    title = "所属组织",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            ref = "orgId"
                    ),
                    search = @Search,
                    group = "其他信息"
            )
    )
    private OrgNova orgNova;

    @NovaField(
            views = @View(
                    title = "角色授权", width = "10%", defaultValue = "-"
            ),
            edit = @Edit(
                    title = "角色授权（多选）",
                    type = Edit.Type.CHOICE,
                    choiceType = @ChoiceType(
                            selectType = ChoiceType.SelectType.MULTI,
                            fetchHandler = RoleServiceImpl.class
                    ),
                    showBy = @ShowBy("isAdmin == false"),
                    group = "其他信息"
            )
    )
    private String roles;

    @NovaField(
            views = @View(title = "备注", width = "10%", defaultValue = "-"),
            edit = @Edit(
                    title = "备注",
                    type = Edit.Type.TEXTAREA,
                    group = "其他信息"
            )
    )
    private String remark;

    @NovaField(
            views = @View(
                    title = "重置密码时间",
                    sortable = true, width = "15%", defaultValue = "-"
            ),
            edit = @Edit(
                    title = "重置密码时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType,
                    show = false
            )
    )
    private LocalDateTime resetPwdTime;

    @NovaField(
            views = @View(
                    title = "创建时间",
                    sortable = true, width = "15%"
            ),
            edit = @Edit(
                    title = "创建时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType,
                    show = false,
                    search = @Search(vague = true)
            )
    )
    private LocalDateTime createTime;

    @Data
    @Accessors(chain = true)
    @Nova(
            name = "重置密码",
            layout = @Layout(
                    editLayout = Layout.EditLayout.FULL_LINE
            ),
            dataProxy = DefaultDataProxy.class,
            conditionClass = void.class,
            power = false
    )
    public static class UserResetPwdNova {

        @NovaId
        @NovaField(
                edit = @Edit(
                        title = "ID",
                        show = false
                )
        )
        private Long id;

        @NovaField(
                edit = @Edit(
                        title = "新密码",
                        notNull = true
                )
        )
        private String password;

        @NovaField(
                edit = @Edit(
                        title = "确认密码",
                        notNull = true
                )
        )
        private String confirmPassword;
    }
}
