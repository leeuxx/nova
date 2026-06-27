package com.nova.view;

import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.config.NovaId;
import com.nova.annotation.sub.nova.Layout;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.View;
import com.nova.annotation.sub.nova.field.edit.DateType;
import com.nova.annotation.sub.nova.field.edit.ReferenceType;
import com.nova.annotation.sub.nova.field.edit.Search;
import com.nova.service.TestDemo2Service;
import lombok.Data;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "测试功能2",
        desc = "测试功能2描述",
        orderBy = "id desc",
        layout = @Layout(
                editLayout = Layout.EditLayout.FULL_LINE
        ),
        dataProxy = TestDemo2Service.class
)
public class TestDemo2View {

    @NovaId
    @NovaField(
            views = @View(title = "ID", width = "25%"),
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            views = {
                    @View(title = "用户名", column = "name", width = "25%")
            },
            edit = @Edit(
                    title = "用户信息",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            type = ReferenceType.Type.MANY_TO_ONE,
                            referenceField = "demoId"
                    ),
                    search = @Search
            )
    )
    private TestDemoView testDemoView;

    @NovaField(
            views = @View(title = "部门名称", width = "25%"),
            edit = @Edit(
                    title = "部门名称",
                    notNull = true,
                    search = @Search
            )
    )
    private String name;

    @NovaField(
            views = @View(title = "说明", width = "25%"),
            edit = @Edit(
                    title = "说明",
                    notNull = true
            )
    )
    private String msg;

    @NovaField(
            views = @View(title = "创建时间", width = "25%"),
            edit = @Edit(
                    title = "创建时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType,
                    search = @Search(vague = true)
            )
    )
    private LocalDateTime createTime;

}
