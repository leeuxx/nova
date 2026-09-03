package xyz.nova.view;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.sub.nova.Drill;
import xyz.nova.annotation.sub.nova.Layout;
import xyz.nova.annotation.sub.nova.Tooltip;
import xyz.nova.annotation.sub.nova.TreeType;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.View;
import xyz.nova.annotation.sub.nova.field.edit.*;
import xyz.nova.annotation.sub.nova.field.view.Pop;
import xyz.nova.annotation.sub.nova.row.ExprBool;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.service.TestDemo2Service;
import xyz.nova.service.TestDemoService;
import xyz.nova.service.data.DefaultDataProxy;
import xyz.nova.utils.RowAuthExpr;
import xyz.nova.view.query.TestDemoCondition;

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
                value = false,
                label = "name"
        ),
        dataProxy = TestDemoService.class,
        conditionClass = TestDemoCondition.class,
        rowOperation = {
                @RowOperation(
                        title = "send.cmd",
                        tip = "send.tip",
                        callHint = "send.callHint",
                        mode = RowOperation.Mode.SINGLE,
                        ifExpr = "sex == '男'",
                        novaClass = TestDemoView.TestRow.class,
                        operationHandler = TestDemoService.class,
                        param = "1",
                        show = @ExprBool(
                                exprHandler = RowAuthExpr.class,
                                param = "8AQ66JQW5H"
                        )
                ),
                @RowOperation(
                        title = "success.order",
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
                                path = "tpl/test.html",
                                openWay = RowOperation.Tpl.OpenWay.DRAWER
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
        },
        tooltip = @Tooltip(
                value = "<h2>血娘子</h2>" +
                        "村东头的老槐树三年前被雷劈过，焦黑的树干上长满了白蘑菇，有人说是死人的手指。每逢初一十五的夜里，树下就会出现一个穿红嫁衣的女人，对着树根梳头，梳一下，就有一朵白蘑菇掉下来。\n" +
                        "\n" +
                        "柳嫂的闺女素云就是在那棵树下没的。\n" +
                        "\n" +
                        "记得是去年中秋前的事，素云从城里打工回来，穿着时髦的吊带裙，染着栗色的卷发。村人背地里都说，这姑娘在城里做的不是什么正经营生。素云也不恼，见人就笑，还塞给柳嫂一沓钱，说要把家里的老屋翻修一下。\n" +
                        "\n" +
                        "柳嫂把钱攥在手里，眼泪就下来了。\n" +
                        "\n" +
                        "翻修那几天，素云天天在工地上盯着，生怕匠人偷工减料。隔壁王婶子路过，啐了一口：“一个闺女家，抛头露面，成何体统。”素云听见了，只是笑笑。\n" +
                        "\n" +
                        "老屋修好那天晚上，素云没回家。\n" +
                        "\n" +
                        "柳嫂找了一夜，天蒙蒙亮时，在老槐树下看见了素云的红头绳，缠在一朵白蘑菇上，蘑菇芯里渗着血，像胭脂。\n" +
                        "\n" +
                        "村里老人说，这是招了“血娘子”。传说百年前有个新娘子，过门那天发现丈夫早已病死，婆家要她抱着灵位拜堂。她不从，逃到老槐树下吊死了。从此那棵树就有了灵性，专勾年轻女子的魂。\n" +
                        "\n" +
                        "“你闺女是不是在城里有了相好的？”村长抽着旱烟问柳嫂，“血娘子容不得别的女子有姻缘，见了就要把魂勾走。”\n" +
                        "\n" +
                        "柳嫂摇头，她也不知道。素云从没提过有对象的事。\n" +
                        "\n" +
                        "头七那天，柳嫂在老槐树下烧纸，忽听见树洞里有人喊“娘”。她扒开树洞口的蜘蛛网，里面空空的，只有一朵最大的白蘑菇，已经烂了，流出黑色的汁。汁液里裹着一张照片，是素云和一个男人的合影，背后写着一行字：“娘，我要结婚了。他是城里人，不嫌我家穷。”\n" +
                        "\n" +
                        "柳嫂把照片揣进怀里，又在树根下挖了半天，挖出一块红布，是嫁衣的碎片，上面有用血写的字：“凭什么她们都能嫁出去？”\n" +
                        "\n" +
                        "后来柳嫂把老槐树砍了，树根下挖出一具枯骨，穿着嫁衣，头骨上还插着一根银簪子。\n" +
                        "\n" +
                        "骨殖移走后，村里再没人见过红嫁衣的女人。\n" +
                        "\n" +
                        "只是每年中秋，柳嫂都会在原来那棵树的位置摆一碗饺子，素云最爱吃的韭菜鸡蛋馅。饺子凉了也不收，第二天去看，碗底总有一汪清水，像眼泪。"
        )
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
            views = @View(title = "user.name", width = "10%"),
            edit = @Edit(
                    title = "user.name",
                    notNull = true,
                    search = @Search,
                    group = "user.info"
            )
    )
    private String name;

    @NovaField(
            views = @View(title = "用户昵称", width = "10%",
                    pop = @Pop(
                            title = "测试信息",
                            param = "3",
                            popHandler = TestDemo2Service.class
                    )
            ),
            edit = @Edit(
                    title = "用户昵称",
                    search = @Search(vague = true),
                    group = "user.info"
            )
    )
    private String nick;

    @NovaField(
            views = {
                    @View(title = "部门名称", column = "name", width = "10%", defaultValue = "-"),
                    @View(title = "部门状态", column = "status", width = "10%", defaultValue = "-")
            },
            edit = @Edit(
                    title = "部门信息",
                    type = Edit.Type.REFERENCE,
                    referenceType = @ReferenceType(
                            ref = "demo2Id",
                            tapShow = true,
                            context = {
                                    "name"
                            }
                    ),
                    search = @Search(vague = true),
                    notNull = true,
                    group = "引用信息"
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
                            ref = "demoId",
                            refReference = "testDemoView"
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
                            ref = "demoId",
                            refReference = "testDemoView"
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
                            context = {
                                    "name"
                            }
                    ),
                    search = @Search
            )
    )
    private TestDemoRefView testDemoRefView;

    @NovaField(
            edit = @Edit(
                    title = "用户树节点",
                    type = Edit.Type.LINK,
                    linkType = @LinkType(
                            context = {
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
                            ref = "parentId",
                            tapShow = true
                    ),
                    search = @Search,
                    group = "引用信息"
            )
    )
    private TestDemoView testDemoView;

    @NovaField(
            views = @View(title = "手机号", width = "10%", desc = "+86"),
            edit = @Edit(
                    title = "手机号",
                    defaultValue = "13162880890",
                    group = "user.info"
            )
    )
    private String tel;

    @NovaField(
            views = @View(title = "性别", width = "10%", sortable = true),
            edit = @Edit(
                    title = "性别",
                    notNull = true,
                    type = Edit.Type.CHOICE,
                    choiceType = @ChoiceType(
                            vl = {
                                    @VL(value = "1", label = "user.sex.man", color = "#28f439"),
                                    @VL(value = "2", label = "user.sex.woman", color = "#fe6767")
                            }
                    ),
                    search = @Search(vague = true),
                    group = "user.info",
                    defaultValue = "2"
            )
    )
    private String sex;

    @NovaField(
            views = @View(title = "爱好", width = "10%", sortable = true, defaultValue = "-"),
            edit = @Edit(
                    title = "爱好",
                    notNull = true,
                    type = Edit.Type.CHOICE,
                    choiceType = @ChoiceType(
                            selectType = ChoiceType.SelectType.MULTI,
                            fetchHandler = TestDemoService.class,
                            tapSearch = @TapSearch(value = true),
                            refChoice = "sex"
                    ),
                    search = @Search(vague = true),
                    group = "user.info",
                    defaultValue = "2"
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
                    search = @Search(vague = true),
                    defaultValue = "1784131200000"
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
                    search = @Search(vague = true),
                    defaultValue = "1784164589000"
            )
    )
    private LocalDateTime bindTime;

    @NovaField(
            edit = @Edit(
                    title = "发送短信",
                    type = Edit.Type.BUTTON,
                    buttonType = @ButtonType(
                            //handle = TestDemoService.class,
                            handleJs = "js/test.js",
                            param = "test",
                            transmitParams = {
                                    "name",
                                    "sex"
                            },
                            id = "sms"
                    )
            )
    )
    private String button;


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
                    desc = "文本描述",
                    defaultValue = "这是第撒啊完全"
            )
    )
    private String text;

    @NovaField(
            views = @View(title = "状态", width = "10%", defaultValue = "-"),
            edit = @Edit(
                    title = "状态",
                    type = Edit.Type.BOOLEAN,
                    booleanType = @BooleanType(
                            type = BooleanType.Type.SEGMENT,
                            tableType = BooleanType.Type.SWITCH
                    ),
                    search = @Search,
                    defaultValue = "true"
            )
    )
    private Boolean status;

    @NovaField(
            views = @View(title = "长度", width = "10%", defaultValue = "-"),
            edit = @Edit(
                    title = "长度",
                    type = Edit.Type.NUMBER,
                    numberType = @NumberType(
                            type = NumberType.Type.DECIMAL,
                            decimal = 3,
                            roll = true
                    ),
                    search = @Search(vague = true),
                    defaultValue = "28.6"
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
            views = @View(title = "标签", width = "10%", defaultValue = "-"),
            edit = @Edit(
                    title = "标签",
                    type = Edit.Type.TAG,
                    tagType = @TagType(
                            tags = {
                                    "user.wrister",
                                    "user.necklace",
                                    "user.ring",
                                    "user.bracelet"
                            }
                    ),
                    search = @Search(vague = true),
                    defaultValue = "user.necklace,user.bracelet"
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
                            maxLimit = 7,
                            tableShowType = AttachmentType.TableShowType.IMAGE,
                            separator = "|"
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
                            maxLimit = 3,
                            tableShowType = AttachmentType.TableShowType.VIDEO,
                            separator = "|"
                    )
            )
    )
    private String file2;

    @NovaField(
            views = @View(title = "user.editor", width = "10%"),
            edit = @Edit(
                    title = "user.editor",
                    type = Edit.Type.EDITOR
            )
    )
    private String editor;


    @Data
    @Accessors(chain = true)
    @Nova(
            name = "测试行",
            layout = @Layout(
                    editLayout = Layout.EditLayout.FULL_LINE
            ),
            dataProxy = DefaultDataProxy.class,
            conditionClass = void.class,
            power = false
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
                                ref = ""
                        ),
                        notNull = true,
                        group = "其他信息"
                )
        )
        private TestDemo2View testDemo2View;

        @NovaField(
                edit = @Edit(
                        title = "岗位信息",
                        type = Edit.Type.APPENDAGE,
                        appendageType = @AppendageType(
                                ref = "",
                                refReference = ""
                        )
                )
        )
        private TestDemo3View testDemo3View;

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
                edit = @Edit(
                        title = "爱好",
                        notNull = true,
                        type = Edit.Type.CHOICE,
                        choiceType = @ChoiceType(
                                selectType = ChoiceType.SelectType.MULTI,
                                fetchHandler = TestDemoService.class,
                                refChoice = "sex"
                        ),
                        group = "其他信息"
                )
        )
        private String hobby;

        @NovaField(
                edit = @Edit(
                        title = "文件",
                        type = Edit.Type.ATTACHMENT,
                        attachmentType = @AttachmentType(
                                type = AttachmentType.Type.IMAGE,
                                maxLimit = 7
                        ),
                        group = "其他信息"
                )
        )
        private String file;

        @NovaField(
                edit = @Edit(
                        title = "说明",
                        desc = "测试说明"
                )
        )
        private String msg;

        @NovaField(
                edit = @Edit(
                        title = "状态",
                        type = Edit.Type.BOOLEAN,
                        booleanType = @BooleanType
                )
        )
        private Boolean status;

        @NovaField(
                edit = @Edit(
                        title = "创建时间",
                        type = Edit.Type.DATE,
                        dateType = @DateType
                )
        )
        private LocalDateTime createTime;

        @NovaField(
                edit = @Edit(
                        title = "倒计时",
                        type = Edit.Type.BUTTON,
                        buttonType = @ButtonType(
                                handle = TestDemoService.class,
                                param = "timeout",
                                transmitParams = {
                                        "name"
                                },
                                id = "timeout"
                        ),
                        readonly = @Readonly(add = true, edit = true)
                )
        )
        private String button;

    }

}
