package com.nova.dto;

import com.nova.annotation.config.Comment;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTableBuild {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Data
    @Accessors(chain = true)
    public static class Vo {

        @Comment("novaId属性名")
        private String novaIdFieldName;

        @Comment("查询条件")
        private List<Search> search;

        @Comment("表头列")
        private List<TableColumn> tableColumns;

        @Comment("功能布局")
        private Layout layout;

        @Comment("编辑信息")
        private List<Edit> edit;

        @Comment("选择组件信息")
        private Map<String, Choice> choice;

        @Comment("标签组件信息")
        private Map<String, Tag> tag;

        @Comment("日期时间组件信息")
        private Map<String, Date> date;

        @Comment("数字组件信息")
        private Map<String, Number> number;

        @Comment("布尔值组件信息")
        private Map<String, BooleanInfo> booleanInfo;

        @Comment("文件上传组件信息")
        private Map<String, AttachmentType> attachment;

        @Comment("关联引用组件信息")
        private Map<String, ReferenceType> reference;

        @Comment("附属对象组件信息")
        private Map<String, AppendageType> appendage;

        @Comment("集合引用组件信息")
        private Map<String, Link> link;

        @Comment("集合引用目标组件信息")
        private LinkTarget linkTarget;

        @Data
        @Accessors(chain = true)
        public static class Search {

            @Comment("属性名")
            private String field;

            @Comment("名称")
            private String title;

            @Comment("类型")
            private String type;

            @Comment("是否高级查询")
            private Boolean vague;

            @Comment("表单提示信息")
            private String placeHolder;

            @Comment("CHOICE组件tap级搜索配置")
            private TapSearch tapSearch;

            @Data
            @Accessors(chain = true)
            public static class TapSearch {

                @Comment("是否显示全部项tap")
                private Boolean showAll;

            }
        }

        @Data
        @Accessors(chain = true)
        public static class TableColumn {

            @Comment("属性名")
            private String field;

            @Comment("名称")
            private String title;

            @Comment("详细说明")
            private String desc;

            @Comment("列宽度（%）")
            private String width;

            @Comment("排序列")
            private Boolean sortable;

            @Comment("类型")
            private String type;

        }

        @Data
        @Accessors(chain = true)
        public static class Layout {

            @Comment("编辑布局")
            private String editLayout;

            @Comment("分页大小")
            private Integer pageSize;

            @Comment("可选分页数")
            private List<Integer> pageSizes;

        }

        @Data
        @Accessors(chain = true)
        public static class Edit {

            @Comment("tap类型 thisForm=自身tap referenceForm=引用tap appendageForm=附属对象tap appendagesTable=附属集合tap linkForm=集合引用tap")
            private String tapType;

            @Comment("tap名称")
            private String tapTitle;

            @Comment("tapNovaName")
            private String tapNovaName;

            @Comment("tap页显示")
            private Boolean tapShow;

            @Comment("tap页动态显示表达式")
            private String tapShowByExpr;

            @Comment("自身详情表单编辑信息")
            private List<ThisForm> thisForms;

            @Data
            @Accessors(chain = true)
            public static class ThisForm {

                @Comment("属性名")
                private String field;

                @Comment("名称")
                private String title;

                @Comment("详细说明")
                private String desc;

                @Comment("类型")
                private String type;

                @Comment("是否必填")
                private Boolean notNull;

                @Comment("只读控制信息")
                private ReadonlyInfo readonly;

                @Comment("动态是否显示表达式")
                private String showByExpr;

                @Data
                @Accessors(chain = true)
                public static class ReadonlyInfo {

                    @Comment("新增只读")
                    private Boolean add;

                    @Comment("修改只读")
                    private Boolean edit;

                }

            }

        }

        @Data
        @Accessors(chain = true)
        public static class Choice {

            @Comment("选择类型")
            private String selectType;

            @Comment("显示类型")
            private String showType;

            @Comment("选择值")
            private List<Value> values;

            @Data
            @Accessors(chain = true)
            public static class Value {

                @Comment("值")
                private String value;

                @Comment("标签")
                private String label;

                @Comment("颜色信息")
                private String color;
            }

        }

        @Data
        @Accessors(chain = true)
        public static class Tag {

            @Comment("是否允许自定义标签")
            private Boolean allowExtension;

            @Comment("最大标签数")
            private Integer maxTagCount;

            @Comment("标签选择列表")
            private List<String> tags;

        }

        @Data
        @Accessors(chain = true)
        public static class Date {

            @Comment("格式类型")
            private String type;

            @Comment("选择模式")
            private String pickerMode;
        }

        @Data
        @Accessors(chain = true)
        public static class Number {

            @Comment("数值类型")
            private String type;

            @Comment("最大值")
            private Long max;

            @Comment("最小值")
            private Long min;

            @Comment("小数位数")
            private Integer decimal;

        }

        @Data
        @Accessors(chain = true)
        public static class BooleanInfo {

            @Comment("布尔值类型")
            private String type;

        }

        @Data
        @Accessors(chain = true)
        public static class AttachmentType {

            @Comment("附件类型")
            private String type;

            @Comment("附件显示类型")
            private String showType;

            @Comment("最大上传数")
            private Integer maxLimit;

            @Comment("单个文件最小文件大小,kb")
            private Integer minSize;

            @Comment("单个文件最大文件大小,kb")
            private Integer maxSize;

            @Comment("允许上传的文件类型")
            private List<String> fileTypes;

        }

        @Data
        @Accessors(chain = true)
        public static class ReferenceType {

            @Comment("关联类名")
            private String referenceName;

            @Comment("当前类存储引用类的关联属性名")
            private String referenceField;

            @Comment("引用类值属性名")
            private String storageField;

            @Comment("引用类显示属性名")
            private String displayField;

            @Comment("当前类获取引用类数据时，额外向引用类 DataProxy.fetch 传递的当前类表单上下文信息")
            private List<String> referenceTransmitField;

        }

        @Data
        @Accessors(chain = true)
        public static class AppendageType {

            @Comment("关联类名")
            private String referenceName;

            @Comment("附属类存储当前类的关联属性名")
            private String referenceField;

            @Comment("当前类属性名")
            private String storageField;

            @Comment("附属类显示属性名")
            private String displayField;

            @Comment("novaId属性名")
            private String novaIdFieldName;

            @Comment("是否支持双表视图")
            private Boolean dualTable;

        }

        @Data
        @Accessors(chain = true)
        public static class Link {

            @Comment("关联类名")
            private String referenceName;

            @Comment("中间类获取目标引用类数据时（弹窗选取），额外透传向引用类 DataProxy.fetch 传递的当前类表单上下文信息")
            private List<String> referenceTransmitField;

            @Comment("中间类选取引用类信息")
            private SelectInfo selectInfo;

            @Comment("是否支持双表视图")
            private Boolean dualTable;

            @Data
            @Accessors(chain = true)
            public static class SelectInfo {

                @Comment("关联类")
                private String referenceName;

                @Comment("中间类存储选取引用类值属性名，既对应引用类的哪个属性")
                private String storageField;

                @Comment("中间类存储选取引用类值显示属性名，替代 storageField 展示")
                private String displayField;
            }

        }

        @Data
        @Accessors(chain = true)
        public static class LinkTarget {

            @Comment("当前关联类名")
            private String thisReferenceName;

            @Comment("中间类存储当前引用类的关联属性名，例如 userId")
            private String thisReferenceField;

            @Comment("中间类存储当前引用类值属性名，默认id，即当前类的 thisReferenceField 对应当前引用类的哪个属性（通常为主键）")
            private String thisStorageField;

            @Comment("目标关联类名")
            private String linkReferenceName;

            @Comment("中间类存储目标引用类的关联属性名，例如 ordersId")
            private String linkReferenceField;

            @Comment("中间类存储目标引用类值属性名，默认id，即当前类的 linkReferenceField 对应目标引用类的哪个属性（通常为主键）")
            private String linkStorageField;

        }

    }
}
