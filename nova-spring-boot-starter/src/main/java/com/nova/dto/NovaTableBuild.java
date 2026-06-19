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

        @Comment("日期时间组件信息")
        private Map<String, Date> date;

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

            @Comment("类型")
            private String type;

            @Comment("是否必填")
            private Boolean notNull;

        }

        @Data
        @Accessors(chain = true)
        public static class Choice {

            @Comment("选择类型")
            private String selectType;

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
        public static class Date {

            @Comment("格式类型")
            private String type;

            @Comment("选择模式")
            private String pickerMode;
        }
    }
}
