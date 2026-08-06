package com.nova.dto;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class NovaTableDetails {

    @Comment("来源nova名称,必填")
    private String novaName;

    @Comment("来源值,必填")
    private String storageFieldValue;

}
