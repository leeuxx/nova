package com.nova.view.row;

import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.config.NovaId;
import com.nova.annotation.sub.nova.Layout;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.View;
import com.nova.annotation.sub.nova.field.edit.*;
import com.nova.service.TestDemoService;
import com.nova.view.TestDemo2View;
import lombok.Data;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "测试行",
        layout = @Layout(
                editLayout = Layout.EditLayout.DEFAULT
        ),
        dataProxy = TestDemoService.class
)
public class TestRow {

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
                    title = "名称",
                    notNull = true
            )
    )
    private String name;

    @NovaField(
            edit = @Edit(
                    title = "部门信息",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            referenceField = "demo2Id"
                    ),
                    notNull = true
            )
    )
    private TestDemo2View testDemo2View;

    @NovaField(
            edit = @Edit(
                    title = "爱好",
                    notNull = true,
                    type = Edit.Type.CHOICE,
                    choiceType = @ChoiceType(
                            selectType = ChoiceType.SelectType.MULTI,
                            fetchHandler = TestDemoService.class
                    )
            )
    )
    private String hobby;

    @NovaField(
            edit = @Edit(
                    title = "文件",
                    type = Edit.Type.ATTACHMENT,
                    attachmentType = @AttachmentType(
                            type = AttachmentType.Type.IMAGE,
                            showType = AttachmentType.ShowType.TOP,
                            maxLimit = 7
                    )
            )
    )
    private String file;

    @NovaField(
            edit = @Edit(
                    title = "说明"
            )
    )
    private String msg;

    @NovaField(
            edit = @Edit(
                    title = "创建时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType
            )
    )
    private LocalDateTime createTime;

}
