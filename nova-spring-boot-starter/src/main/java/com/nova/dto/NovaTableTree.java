package com.nova.dto;

import com.nova.annotation.config.Comment;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class NovaTableTree {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("父级标识值")
    @NotBlank(message = "storageFieldValue不能为空")
    private String storageFieldValue;

}
