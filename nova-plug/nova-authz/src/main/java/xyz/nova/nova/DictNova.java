package xyz.nova.nova;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.AppendageType;
import xyz.nova.annotation.sub.nova.field.edit.DateType;
import xyz.nova.annotation.sub.nova.field.edit.Search;
import xyz.nova.annotation.sub.nova.row.ExprBool;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.nova.condition.DictCondition;
import xyz.nova.service.DictServiceImpl;
import xyz.nova.utils.RowAuthExpr;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "字典",
        dataProxy = DictServiceImpl.class,
        conditionClass = DictCondition.class,
        orderBy = "create_time desc",
        rowOperation = {
                @RowOperation(
                        title = "添加子项",
                        mode = RowOperation.Mode.SINGLE,
                        param = "dict_add_item",
                        novaClass = DictItemNova.class,
                        operationHandler = DictServiceImpl.class,
                        show = @ExprBool(
                                param = "dict_add_item",
                                exprHandler = RowAuthExpr.class
                        )
                )
        }
)
public class DictNova {

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
            views = @View(title = "说明", defaultValue = "-"),
            edit = @Edit(
                    title = "说明",
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
                    show = false,
                    search = @Search(vague = true)
            )
    )
    private LocalDateTime createTime;

    @NovaField(
            edit = @Edit(
                    title = "字典子项",
                    type = Edit.Type.APPENDAGES,
                    appendageType = @AppendageType(
                            ref = "dictId",
                            refReference = "dictNova"
                    )
            )
    )
    private DictItemNova dictItemNova;
}
