package com.nova.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.Layout;
import com.nova.annotation.sub.nova.field.View;
import com.nova.annotation.sub.nova.field.edit.ChoiceType;
import com.nova.annotation.sub.nova.field.edit.DateType;
import com.nova.annotation.sub.nova.field.edit.Search;
import com.nova.annotation.sub.nova.field.edit.VL;
import com.nova.service.TestDemoService;
import lombok.Data;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "测试功能",
        desc = "测试功能描述",
        orderBy = "id desc",
        layout = @Layout(
                editLayout = Layout.EditLayout.FULL_LINE
        ),
        dataProxy = TestDemoService.class
)
public class TestDemo {

    @TableId(type = IdType.AUTO)
    @NovaField(
            views = @View(title = "ID", width = "10%"),
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            views = @View(title = "用户名", width = "15%"),
            edit = @Edit(
                    title = "用户名",
                    notNull = true,
                    search = @Search
            )
    )
    private String name;

    @NovaField(
            views = @View(title = "用户昵称", width = "15%"),
            edit = @Edit(
                    title = "用户昵称",
                    search = @Search(vague = true)
            )
    )
    private String nick;

    @NovaField(
            views = @View(title = "性别", width = "10%", sortable = true),
            edit = @Edit(
                    title = "性别",
                    notNull = true,
                    type = Edit.Type.CHOICE,
                    choiceType = @ChoiceType(
                            vl = {
                                    @VL(value = "1", label = "男", color = "#28f439"),
                                    @VL(value = "2", label = "女", color = "#fe6767")
                            }
                    ),
                    search = @Search(vague = true)
            )
    )
    private String sex;

    @NovaField(
            views = @View(title = "手机号", width = "10%", desc = "+86"),
            edit = @Edit(
                    title = "手机号"
            )
    )
    private String tel;

    @NovaField(
            views = @View(title = "爱好", width = "25%", sortable = true),
            edit = @Edit(
                    title = "爱好",
                    notNull = true,
                    type = Edit.Type.CHOICE,
                    choiceType = @ChoiceType(
                            selectType = ChoiceType.SelectType.MULTI,
                            fetchHandler = TestDemoService.class
                    ),
                    search = @Search(vague = true)
            )
    )
    private String hobby;

    @NovaField(
            views = @View(title = "创建时间", width = "15%"),
            edit = @Edit(
                    title = "创建时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType,
                    search = @Search(vague = true)
            )
    )
    private LocalDateTime createTime;

    @NovaField(
            views = @View(title = "绑定时间", width = "10%"),
            edit = @Edit(
                    title = "绑定时间",
                    type = Edit.Type.DATE,
                    dateType = @DateType(
                            type = DateType.Type.DATE
                    ),
                    search = @Search(vague = true)
            )
    )
    private LocalDateTime bindTime;

}
