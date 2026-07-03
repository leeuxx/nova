package com.nova.view;

import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.config.NovaId;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.View;
import com.nova.annotation.sub.nova.field.edit.LinkTargetType;
import com.nova.annotation.sub.nova.field.edit.ReferenceType;
import com.nova.service.TestDemoRefService;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
@Nova(
        name = "测试关联",
        desc = "测试关联",
        orderBy = "id desc",
        dataProxy = TestDemoRefService.class
)
public class TestDemoRefView {

    @NovaId
    @NovaField(
            views = @View(title = "ID", width = "10%"),
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
                            referenceField = "demoId"
                    )
            )
    )
    private TestDemoView testDemoView;

    @NovaField(
            edit = @Edit(
                    title = "引用薪资",
                    type = Edit.Type.LINK,
                    linkTargetType = @LinkTargetType(
                            referenceField = "demo4Id"
                    )
            )
    )
    private List<TestDemo4View> testDemo4Views;

}
