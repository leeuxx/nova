package com.nova.dto;

import com.nova.annotation.config.Comment;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaMessageClose {

    @Comment("消息id")
    @NotEmpty(message = "ids不能为空")
    private List<String> ids;

}
