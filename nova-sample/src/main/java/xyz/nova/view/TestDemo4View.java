package xyz.nova.view;

import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.service.TestDemo4Service;
import xyz.nova.service.TestDemoService;
import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.sub.nova.field.edit.*;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "测试功能4",
        desc = "测试功能4描述",
        orderBy = "id desc",
        dataProxy = TestDemo4Service.class,
        rowOperation = {
                @RowOperation(
                        title = "测试按钮",
                        icon = "material-symbols:amp-stories-rounded",
                        mode = RowOperation.Mode.SINGLE,
                        operationHandler = TestDemoService.class
                ),
                @RowOperation(
                        title = "龙之谷",
                        icon = "material-symbols:amp-stories-rounded",
                        mode = RowOperation.Mode.BUTTON,
                        operationHandler = TestDemoService.class
                ),
                @RowOperation(
                        title = "九阴真经",
                        icon = "material-symbols:amp-stories-rounded",
                        mode = RowOperation.Mode.MULTI,
                        operationHandler = TestDemoService.class
                )
        }
)
public class TestDemo4View {

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
            views = @View(title = "薪资名称"),
            edit = @Edit(
                    title = "薪资名称",
                    notNull = true,
                    search = @Search
            )
    )
    private String name;

    @NovaField(
            views = @View(title = "说明"),
            edit = @Edit(
                    title = "说明",
                    notNull = true,
                    search = @Search(vague = true)

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
                            showType = AttachmentType.ShowType.TOP,
                            maxLimit = 5
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
                    title = "新增查询",
                    type = Edit.Type.BUTTON,
                    buttonType = @ButtonType(
                            handleJs = "js/test.js",
                            param = "query",
                            id = "query"
                    ),
                    readonly = @Readonly(add = true)
            )
    )
    private String button;

}
