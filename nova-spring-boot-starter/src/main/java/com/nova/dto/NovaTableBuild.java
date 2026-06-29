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

            @Comment("tap类型 thisForm=自身详情表单 referenceForm=引用详情表单 appendageForm=附属对象表单")
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

            @Comment("当前对象存储对方对象的字段名")
            private String referenceField;

            @Comment("拉取对方引用数据时透传的当前对象上下文字段列表")
            private List<String> referenceTransmitField;

            @Comment("对方对象被当前对象引用的字段名")
            private String storageField;

            @Comment("对方对象被当前对象引用场景下替代 storageField 展示的字段名")
            private String displayField;

        }

        @Data
        @Accessors(chain = true)
        public static class AppendageType {

            @Comment("关联类名")
            private String referenceName;

            @Comment("对方对象存储当前对象的字段名")
            private String referenceField;

            @Comment("当前对象被对方对象引用的字段名")
            private String storageField;

            @Comment("对方对象在被引用显示场景下展示的字段名")
            private String displayField;

            @Comment("novaId属性名")
            private String novaIdFieldName;

        }
    }
}
