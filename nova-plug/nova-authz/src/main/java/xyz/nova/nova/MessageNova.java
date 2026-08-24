package xyz.nova.nova;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.*;
import xyz.nova.nova.condition.MessageCondition;
import xyz.nova.service.MessageServiceImpl;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "字典项",
        dataProxy = MessageServiceImpl.class,
        conditionClass = MessageCondition.class,
        orderBy = "create_time desc"
)
public class MessageNova {

    @NovaId
    @NovaField(
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            views = @View(title = "标题", defaultValue = "-"),
            edit = @Edit(
                    title = "标题"
            )
    )
    private String title;

    @NovaField(
            views = @View(title = "消息内容"),
            edit = @Edit(
                    title = "消息内容",
                    type = Edit.Type.TEXTAREA,
                    notNull = true
            )
    )
    private String content;

    @NovaField(
            views = @View(title = "消息类型"),
            edit = @Edit(
                    title = "消息类型",
                    type = Edit.Type.CHOICE,
                    choiceType = @ChoiceType(
                            vl = {
                                    @VL(value = "INFO", label = "普通", color = "#0000FF"),
                                    @VL(value = "FOLLOW", label = "关注", color = "#FFFF00"),
                                    @VL(value = "CRITICAL", label = "重要", color = "#FF0000")
                            }
                    ),
                    notNull = true,
                    search = @Search,
                    defaultValue = "INFO"
            )
    )
    private String type;

    @NovaField(
            views = @View(title = "接收用户", column = "name", defaultValue = "-"),
            edit = @Edit(
                    title = "接收用户",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            ref = "userId"
                    ),
                    search = @Search
            )
    )
    private UserNova userNova;

    @NovaField(
            views = @View(title = "允许关闭"),
            edit = @Edit(
                    title = "允许关闭",
                    booleanType = @BooleanType(
                            type = BooleanType.Type.SEGMENT,
                            tableType = BooleanType.Type.SWITCH
                    ),
                    defaultValue = "true",
                    search = @Search
            )
    )
    private Boolean allowClose;

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
