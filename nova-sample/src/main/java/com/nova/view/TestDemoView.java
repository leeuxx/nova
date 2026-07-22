package com.nova.view;

import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.config.NovaId;
import com.nova.annotation.sub.nova.Drill;
import com.nova.annotation.sub.nova.Layout;
import com.nova.annotation.sub.nova.TreeType;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.View;
import com.nova.annotation.sub.nova.field.edit.*;
import com.nova.annotation.sub.nova.row.ExprBool;
import com.nova.annotation.sub.nova.row.RowOperation;
import com.nova.service.TestDemoService;
import com.nova.service.authority.RowAuthExpr;
import com.nova.utils.VoidDataProxy;
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
        tree = @TreeType(
                searchField = "name"
        ),
        dataProxy = TestDemoService.class,
        rowOperation = {
                @RowOperation(
                        title = "下发指令",
                        tip = "测试功能是否正常",
                        callHint = "确认执行操作？",
                        mode = RowOperation.Mode.SINGLE,
                        ifExpr = "sex == '男'",
                        novaClass = TestDemoView.TestRow.class,
                        operationHandler = TestDemoService.class,
                        param = "1",
                        show = @ExprBool(
                                exprHandler = RowAuthExpr.class,
                                params = "sendCmd"
                        )
                ),
                @RowOperation(
                        title = "完结订单",
                        icon = "material-symbols:amp-stories-rounded",
                        mode = RowOperation.Mode.SINGLE,
                        operationHandler = TestDemoService.class
                ),
                @RowOperation(
                        title = "关闭支付分",
                        callHint = "关闭操作不可逆！",
                        icon = "material-symbols:amend-rounded",
                        mode = RowOperation.Mode.SINGLE,
                        novaClass = TestDemoView.TestRow.class,
                        operationHandler = TestDemoService.class,
                        group = "订单管理"
                ),
                @RowOperation(
                        title = "下载报表",
                        callHint = "这是异步操作！",
                        icon = "material-symbols:arrow-circle-down-outline",
                        mode = RowOperation.Mode.BUTTON,
                        operationHandler = TestDemoService.class
                ),
                @RowOperation(
                        title = "修改价格",
                        icon = "material-symbols:apk-install-outline-sharp",
                        mode = RowOperation.Mode.MULTI,
                        operationHandler = TestDemoService.class,
                        group = "订单管理"
                ),
                @RowOperation(
                        title = "工具按钮",
                        icon = "material-symbols:arrow-circle-down-outline",
                        mode = RowOperation.Mode.BUTTON,
                        operationHandler = TestDemoService.class,
                        group = "支付分管理"
                ),
                @RowOperation(
                        title = "批量导出",
                        callHint = "确定导出吗？",
                        icon = "material-symbols:archive-rounded",
                        mode = RowOperation.Mode.MULTI_ONLY,
                        operationHandler = TestDemoService.class
                ),
                @RowOperation(
                        title = "测试按钮",
                        icon = "material-symbols:amp-stories-rounded",
                        mode = RowOperation.Mode.SINGLE,
                        operationHandler = TestDemoService.class
                ),
                @RowOperation(
                        title = "打开tpl",
                        icon = "material-symbols:amp-stories-rounded",
                        mode = RowOperation.Mode.SINGLE,
                        type = RowOperation.Type.TPL,
                        tpl = @RowOperation.Tpl(
                                path = "tpl/test.html"
                        ),
                        param = "tplParam"
                )
        },
        drills = {
                @Drill(
                        title = "薪资钻取",
                        link = @Drill.Link(
                                column = "id",
                                joinColumn = "demoId",
                                linkNova = TestDemo4View.class
                        )
                ),
                @Drill(
                        title = "用户钻取",
                        link = @Drill.Link(
                                column = "id",
                                joinColumn = "demoId",
                                linkNova = TestDemoRef2View.class
                        )
                )
        }
)
public class TestDemoView {

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
            views = {
                    @View(title = "部门名称", column = "name", width = "10%"),
                    @View(title = "部门说明", column = "msg", width = "10%")
            },
            edit = @Edit(
                    title = "部门信息",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            referenceField = "demo2Id",
                            tapShow = true
                    ),
                    search = @Search(vague = true),
                    notNull = true
            )
    )
    private TestDemo2View testDemo2View;

    @NovaField(
            views = {
                    @View(title = "岗位ID", column = "id", width = "10%"),
                    @View(title = "岗位名称", column = "name", width = "10%")
            },
            edit = @Edit(
                    title = "岗位信息",
                    type = Edit.Type.APPENDAGE,
                    appendageType = @AppendageType(
                            referenceField = "demoId"
                    ),
                    search = @Search(vague = true)
            )
    )
    private TestDemo3View testDemo3View;

    @NovaField(
            edit = @Edit(
                    title = "薪资信息",
                    type = Edit.Type.APPENDAGES,
                    appendageType = @AppendageType(
                            referenceField = "demoId"
                    ),
                    search = @Search
            )
    )
    private TestDemo4View testDemo4View;

    @NovaField(
            edit = @Edit(
                    title = "引用薪资",
                    type = Edit.Type.LINK,
                    linkType = @LinkType(
                            referenceTransmitField = {
                                    "name"
                            }
                    ),
                    search = @Search(vague = true)
            )
    )
    private TestDemoRefView testDemoRefView;

    @NovaField(
            edit = @Edit(
                    title = "用户树节点",
                    type = Edit.Type.LINK,
                    linkType = @LinkType(
                            referenceTransmitField = {
                                    "nick"
                            }
                    ),
                    search = @Search(vague = true)
            )
    )
    private TestDemoRef2View testDemoRef2View;

    @NovaField(
            edit = @Edit(
                    title = "上级信息",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            referenceField = "testDemoView",
                            tapShow = true
                    ),
                    search = @Search
            )
    )
    private TestDemoView testDemoView;

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
                            fetchHandler = TestDemoService.class,
                            tapSearch = @TapSearch(value = true)
                    ),
                    search = @Search(vague = true)
            )
    )
    private String hobby;

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


    @Data
    @Accessors(chain = true)
    @Nova(
            name = "测试行",
            layout = @Layout(
                    editLayout = Layout.EditLayout.FULL_LINE
            ),
            dataProxy = VoidDataProxy.class
    )
    public static class TestRow {

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
                        title = "部门信息",
                        type = Edit.Type.REFERENCE,
                        referenceType = @ReferenceType(
                                referenceField = ""
                        ),
                        notNull = true
                )
        )
        private TestDemo2View testDemo2View;

        @NovaField(
                edit = @Edit(
                        title = "岗位信息",
                        type = Edit.Type.APPENDAGE,
                        appendageType = @AppendageType(
                                referenceField = ""
                        )
                )
        )
        private TestDemo3View testDemo3View;

        @NovaField(
                edit = @Edit(
                        title = "爱好",
                        notNull = true,
                        type = Edit.Type.CHOICE,
                        choiceType = @ChoiceType(
                                selectType = ChoiceType.SelectType.MULTI,
                                fetchHandler = TestDemoService.class
                        )
                )
        )
        private String hobby;

        @NovaField(
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
                edit = @Edit(
                        title = "说明"
                )
        )
        private String msg;

        @NovaField(
                edit = @Edit(
                        title = "创建时间",
                        type = Edit.Type.DATE,
                        dateType = @DateType
                )
        )
        private LocalDateTime createTime;

    }

}
