package com.nova.annotation.fun;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class PromptSearchRequest {

    @Comment("当前页")
    private long current = 1;

    @Comment("显示行数")
    private long size = 10;

    @Comment("来源nova名称")
    private String novaName;

    @Comment("搜索关键词")
    private String prompt;

}
