package com.nova.dto;

import com.nova.annotation.Comment;
import com.nova.dto.page.PageBean;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTableData {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("分页信息")
    @NotNull(message = "pageBean不能为空")
    private PageBean<Map<String, Object>> pageBean;

    @Comment("查询条件")
    private Map<String, Search> conditions;

    @Data
    @Accessors(chain = true)
    public static class Search {

        @Comment("值")
        private String value;

        @Comment("是否高级查询")
        private Boolean vague;

    }

    @Data
    @Accessors(chain = true)
    public static class Vo {

        @Comment("表格内容")
        private Map<String, TableValue> tableValues;

        @Data
        @Accessors(chain = true)
        public static class TableValue {

            @Comment("值")
            private String value;

            @Comment("类型")
            private String type;

        }

    }
}
