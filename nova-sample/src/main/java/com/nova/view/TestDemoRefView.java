package com.nova.view;

import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.config.NovaId;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.View;
import com.nova.annotation.sub.nova.field.edit.LinkTargetType;
import com.nova.service.TestDemoRefService;
import lombok.Data;
import lombok.experimental.Accessors;

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
            views = @View(title = "ID", width = "25%"),
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            views = {
                    @View(title = "用户名称", column = "name", width = "25%")
            },
            edit = @Edit(
                    title = "用户信息",
                    type = Edit.Type.LINK_TARGET,
                    linkTargetType = @LinkTargetType(
                            referenceField = "demoId"
                    )
            )
    )
    private TestDemoView testDemoView;

    @NovaField(
            views = {
                    @View(title = "薪资名称", column = "name", width = "25%"),
                    @View(title = "薪资说明", column = "msg", width = "25%"),
            },
            edit = @Edit(
                    title = "引用薪资",
                    type = Edit.Type.LINK_TARGET,
                    linkTargetType = @LinkTargetType(
                            referenceField = "demo4Id",
                            type = LinkTargetType.Type.SELECT
                    )
            )
    )
    private TestDemo4View testDemo4View;

}
