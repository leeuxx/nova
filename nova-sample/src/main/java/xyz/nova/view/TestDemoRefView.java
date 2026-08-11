package xyz.nova.view;

import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.LinkTargetType;
import xyz.nova.service.TestDemoRefService;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
@Nova(
        name = "测试关联",
        desc = "测试关联",
        orderBy = "id desc",
        dataProxy = TestDemoRefService.class,
        conditionClass = void.class
)
public class TestDemoRefView {

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
                            ref = "demoId",
                            type = LinkTargetType.Type.OPERATE
                    )
            )
    )
    private TestDemoView testDemoView;

    @NovaField(
            views = {
                    @View(title = "薪资名称", column = "name"),
                    @View(title = "薪资说明", column = "msg"),
            },
            edit = @Edit(
                    title = "引用薪资",
                    type = Edit.Type.LINK_TARGET,
                    linkTargetType = @LinkTargetType(
                            ref = "demo4Id",
                            type = LinkTargetType.Type.SELECT
                    )
            )
    )
    private TestDemo4View testDemo4View;

}
