package com.nova.annotation.fun;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class PromptSearchResponse {

    @Comment("存储列")
    private String storageField;

    @Comment("展示列")
    private String displayField;

}
