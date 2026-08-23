package xyz.nova.nova;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.DateType;
import xyz.nova.annotation.sub.nova.field.edit.ReferenceType;
import xyz.nova.annotation.sub.nova.field.edit.Search;
import xyz.nova.nova.condition.DictItemCondition;
import xyz.nova.service.DictItemServiceImpl;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "字典项",
        dataProxy = DictItemServiceImpl.class,
        conditionClass = DictItemCondition.class,
        orderBy = "create_time desc"
)
public class DictItemNova {

    @NovaId
    @NovaField(
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            views = @View(title = "编码"),
            edit = @Edit(
                    title = "编码",
                    notNull = true
            )
    )
    private String code;

    @NovaField(
            views = @View(title = "字典值"),
            edit = @Edit(
                    title = "字典值",
                    notNull = true
            )
    )
    private String val;

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
                    show = false
            )
    )
    private LocalDateTime createTime;

    @NovaField(
            edit = @Edit(
                    title = "关联字典",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            ref = "dictId"
                    )
            )
    )
    private DictNova dictNova;

}
