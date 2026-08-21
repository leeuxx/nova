package xyz.nova.nova;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.TreeType;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.DateType;
import xyz.nova.annotation.sub.nova.field.edit.ReferenceType;
import xyz.nova.annotation.sub.nova.row.ExprBool;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.service.OrgServiceImpl;
import xyz.nova.utils.RowAuthExpr;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "组织架构",
        dataProxy = OrgServiceImpl.class,
        conditionClass = void.class,
        tree = @TreeType(
                label = "name",
                level = 1
        ),
        rowOperation = {
                @RowOperation(
                        title = "添加",
                        mode = RowOperation.Mode.SINGLE,
                        param = "org_add",
                        novaClass = OrgNova.class,
                        operationHandler = OrgServiceImpl.class,
                        show = @ExprBool(
                                param = "org_add",
                                exprHandler = RowAuthExpr.class
                        )
                )
        }
)
public class OrgNova {

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
                    notNull = true
            )
    )
    private String name;

    @NovaField(
            views = @View(title = "编码"),
            edit = @Edit(
                    title = "编码",
                    notNull = true
            )
    )
    private String code;

    @NovaField(
            edit = @Edit(
                    title = "上级组织",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            ref = "parentId"
                    )
            )
    )
    private OrgNova orgNova;

    @NovaField(
            views = @View(title = "组织说明", defaultValue = "-"),
            edit = @Edit(
                    title = "组织说明",
                    type = Edit.Type.TEXTAREA
            )
    )
    private String msg;

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

}
