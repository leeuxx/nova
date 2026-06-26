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

        @Comment("数据标识属性名")
        private String idFieldName;

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

            @Comment("关联类型")
            private String type;

            @Comment("关联类名")
            private String referenceName;

            @Comment("关联字段")
            private String referenceField;

            @Comment("关联引用透传属性")
            private List<String> referenceTransmitField;

            @Comment("存储列")
            private String storageField;

            @Comment("展示列")
            private String displayField;

        }
    }
}
