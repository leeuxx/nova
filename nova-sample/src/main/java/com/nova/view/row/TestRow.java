package com.nova.view.row;

import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.config.NovaId;
import com.nova.annotation.sub.nova.Layout;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.service.TestDemoService;
import lombok.Data;
import lombok.experimental.Accessors;

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
                    title = "说明"
            )
    )
    private String msg;
}
