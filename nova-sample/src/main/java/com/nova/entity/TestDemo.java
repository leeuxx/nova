package com.nova.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.sub.Edit;
import com.nova.annotation.sub.Layout;
import com.nova.annotation.sub.View;
import com.nova.annotation.sub.edit.*;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Getter
@Setter
@Service
@Accessors(chain = true)
@TableName("test_demo")
@Nova(
        name = "测试功能",
        desc = "测试功能描述",
        orderBy = "id asc",
        layout = @Layout(
                editLayout = Layout.EditLayout.FULL_LINE
        )
)
public class TestDemo implements ChoiceType.ChoiceFetchHandler {

    @TableId(type = IdType.AUTO)
    @NovaField(
            views = @View(title = "ID", width = "20%"),
            edit = @Edit(
                    title = "ID",
                    show = false
            )
    )
    private Long id;

    @NovaField(
            views = @View(title = "用户名", width = "10%"),
            edit = @Edit(
                    title = "用户名",
                    notNull = true,
                    search = @Search
            )
    )
    private String name;

    @NovaField(
            views = @View(title = "用户昵称", width = "10%"),
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
                    type = EditType.CHOICE,
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
            views = @View(title = "爱好", width = "20%", sortable = true),
            edit = @Edit(
                    title = "爱好",
                    notNull = true,
                    type = EditType.CHOICE,
                    choiceType = @ChoiceType(
                            selectType = ChoiceType.SelectType.MULTI,
                            fetchHandler = TestDemo.class
                    ),
                    search = @Search(vague = true)
            )
    )
    private String hobby;

    @NovaField(
            views = @View(title = "创建时间", width = "20%"),
            edit = @Edit(
                    title = "创建时间",
                    type = EditType.DATE,
                    dateType = @DateType,
                    search = @Search(vague = true)
            )
    )
    private LocalDateTime createTime;

    @Override
    public List<VLModel> fetch(String[] params) {
        return Arrays.asList(
                new VLModel().setValue("1").setLabel("篮球"),
                new VLModel().setValue("2").setLabel("羽毛球").setColor("#fe6767"),
                new VLModel().setValue("3").setLabel("LOL")
        );
    }
}
