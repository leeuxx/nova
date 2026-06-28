package com.nova.annotation.fun;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.Map;

@Data
@Accessors(chain = true)
public class PromptSearchRequest {

    @Comment("当前页")
    private long current = 1;

    @Comment("显示行数")
    private long size = 10;

    @Comment("搜索关键词")
    private String prompt;

    @Comment("来源nova名称")
    private String novaName;

    @Comment("来源上下文属性集合")
    private Map<String, String> sourceFields;

}
