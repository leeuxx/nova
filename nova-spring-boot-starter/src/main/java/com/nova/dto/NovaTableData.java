package com.nova.dto;

import com.nova.annotation.config.Comment;
import com.nova.annotation.fun.Fetch;
import com.nova.dto.page.PageBean;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTableData {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("来源nova名称")
    @NotBlank(message = "sourceNovaName不能为空")
    private String sourceNovaName;

    @Comment("分页信息")
    @NotNull(message = "pageBean不能为空")
    private PageBean<Map<String, Object>> pageBean;

    @Comment("查询条件")
    private Map<String, Search> conditions;

    @Comment("来源上下文属性集合")
    private Map<String, String> sourceFields;

    @Comment("LINK组件查询条件")
    private Map<String, Map<String, String>> linkConditions;

    @Data
    @Accessors(chain = true)
    public static class Search {

        @Comment("属性值")
        private String value;

        @Comment("属性类型")
        private String type;

        @Comment("是否高级查询")
        private Boolean vague;

    }
}
