package xyz.nova.view;

import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.*;
import xyz.nova.service.TestDemo3Service;
import lombok.Data;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "测试功能3",
        desc = "测试功能3描述",
        orderBy = "id desc",
        dataProxy = TestDemo3Service.class,
        conditionClass = void.class
)
public class TestDemo3View {

    @NovaId
    @NovaField(
            views = @View(title = "ID"),
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            edit = @Edit(
                    title = "用户信息",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            ref = "demoId"
                    )
            )
    )
    private TestDemoView testDemoView;

    @NovaField(
            views = @View(title = "post.name"),
            edit = @Edit(
                    title = "post.name",
                    notNull = true,
                    search = @Search
            )
    )
    private String name;

    @NovaField(
            views = @View(title = "说明"),
            edit = @Edit(
                    title = "说明",
                    notNull = true
            )
    )
    private String msg;

    @NovaField(
            views = @View(title = "文件"),
            edit = @Edit(
                    title = "文件",
                    type = Edit.Type.ATTACHMENT,
                    attachmentType = @AttachmentType(
                            type = AttachmentType.Type.IMAGE,
                            maxLimit = 5,
                            separator = "|"
                    )
            )
    )
    private String file;

    @NovaField(
            views = @View(title = "创建时间"),
            edit = @Edit(
                    title = "创建时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType,
                    search = @Search(vague = true),
                    readonly = @Readonly(edit = true, add = true)
            )
    )
    private LocalDateTime createTime;

    @NovaField(
            edit = @Edit(
                    title = "点击验证",
                    type = Edit.Type.BUTTON,
                    buttonType = @ButtonType(
                            handleJs = "js/test.js",
                            param = "check",
                            id = "check"
                    ),
                    readonly = @Readonly(add = true)
            )
    )
    private String button;

}
