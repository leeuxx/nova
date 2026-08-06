package com.nova.dto;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaMessageClose {

    @Comment("消息id,必填")
    private List<String> ids;

}
