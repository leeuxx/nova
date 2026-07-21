package com.nova.view;

import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.config.NovaId;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.View;
import com.nova.annotation.sub.nova.field.edit.LinkTargetType;
import com.nova.service.TestDemoRef2Service;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
@Nova(
        name = "测试关联",
        desc = "测试关联",
        orderBy = "id desc",
        dataProxy = TestDemoRef2Service.class
)
public class TestDemoRef2View {

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
            views = {
                    @View(title = "用户名称", column = "name")
            },
            edit = @Edit(
                    title = "用户信息",
                    type = Edit.Type.LINK_TARGET,
                    linkTargetType = @LinkTargetType(
                            referenceField = "demoId",
                            type = LinkTargetType.Type.OPERATE
                    )
            )
    )
    private TestDemoView testDemoView;

    @NovaField(
            views = {
                    @View(title = "引用用户名称", column = "name")
            },
            edit = @Edit(
                    title = "引用用户信息",
                    type = Edit.Type.LINK_TARGET,
                    linkTargetType = @LinkTargetType(
                            referenceField = "demoId2",
                            type = LinkTargetType.Type.SELECT
                    )
            )
    )
    private TestDemoView testDemoView2;

}
