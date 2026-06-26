package com.nova.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.sub.nova.Layout;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.View;
import com.nova.annotation.sub.nova.field.edit.*;
import com.nova.service.TestDemoService;
import lombok.Data;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@Nova(
        name = "测试功能",
        desc = "测试功能描述",
        orderBy = "id desc",
        layout = @Layout(
                editLayout = Layout.EditLayout.DEFAULT
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
            edit = @Edit(
                    title = "部门ID",
                    show = false
            )
    )
    private Long demo2Id;

    @TableField(exist = false)
    @NovaField(
            views = {
                    @View(title = "部门名称", column = "name", width = "10%"),
                    @View(title = "部门说明", column = "msg", width = "10%")
            },
            edit = @Edit(
                    title = "部门信息",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            type = ReferenceType.Type.MANY_TO_ONE,
                            referenceField = "demo2Id"
                    ),
                    search = @Search(vague = true)
            )
    )
    private TestDemo2 testDemo2;

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
            views = @View(title = "爱好", width = "10%", sortable = true),
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


    @TableField(exist = false)
    @NovaField(
            edit = @Edit(
                    title = "华丽分割线1",
                    type = Edit.Type.DIVIDE
            )
    )
    public String divide1;


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


    @TableField(exist = false)
    @NovaField(
            edit = @Edit(
                    title = "华丽分割线2",
                    type = Edit.Type.DIVIDE
            )
    )
    public String divide2;


    @NovaField(
            views = @View(title = "文本", width = "10%"),
            edit = @Edit(
                    title = "文本",
                    type = Edit.Type.TEXTAREA,
                    desc = "文本描述"
            )
    )
    private String text;

    @NovaField(
            views = @View(title = "状态", width = "10%"),
            edit = @Edit(
                    title = "状态",
                    type = Edit.Type.BOOLEAN,
                    booleanType = @BooleanType(
                            type = BooleanType.Type.SWITCH
                    ),
                    search = @Search
            )
    )
    private Boolean status;

    @NovaField(
            views = @View(title = "长度", width = "10%"),
            edit = @Edit(
                    title = "长度",
                    type = Edit.Type.NUMBER,
                    numberType = @NumberType(
                            type = NumberType.Type.DECIMAL
                    ),
                    search = @Search(vague = true)
            )
    )
    private BigDecimal size;


    @TableField(exist = false)
    @NovaField(
            edit = @Edit(
                    title = "占位符",
                    type = Edit.Type.EMPTY
            )
    )
    public String empty;


    @NovaField(
            views = @View(title = "标签", width = "10%"),
            edit = @Edit(
                    title = "标签",
                    type = Edit.Type.TAG,
                    tagType = @TagType(
                            tags = {
                                    "护腕",
                                    "项链",
                                    "戒指",
                                    "手镯"
                            }
                    ),
                    search = @Search(vague = true)
            )
    )
    private String tags;

    @NovaField(
            views = @View(title = "文件", width = "10%"),
            edit = @Edit(
                    title = "文件",
                    type = Edit.Type.ATTACHMENT,
                    attachmentType = @AttachmentType(
                            type = AttachmentType.Type.IMAGE,
                            showType = AttachmentType.ShowType.TOP,
                            maxLimit = 7
                    )
            )
    )
    private String file;

    @NovaField(
            views = @View(title = "文件2", width = "10%"),
            edit = @Edit(
                    title = "文件2",
                    type = Edit.Type.ATTACHMENT,
                    attachmentType = @AttachmentType(
                            type = AttachmentType.Type.BASE,
                            showType = AttachmentType.ShowType.TOP,
                            maxLimit = 3
                    )
            )
    )
    private String file2;
}
