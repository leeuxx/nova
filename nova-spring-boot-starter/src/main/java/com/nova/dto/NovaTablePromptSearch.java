package com.nova.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.nova.annotation.config.Comment;
import com.nova.dto.page.PageBean;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTablePromptSearch {

    @Comment("nova名称,必填")
    private String novaName;

    @Comment("来源nova名称,必填")
    private String sourceNovaName;

    @Comment("提示词,必填")
    private String prompt;

    @Comment("分页信息,必填")
    private PageBean<Vo> pageBean;

    @Comment("来源上下文属性集合")
    private Map<String, String> sourceFields;

    @Data
    @Accessors(chain = true)
    @JsonSerialize
    public static class Vo {

        @Comment("存储列")
        private String storageField;

        @Comment("展示列")
        private String displayField;

    }
}
