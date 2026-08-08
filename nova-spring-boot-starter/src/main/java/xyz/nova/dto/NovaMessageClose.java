package xyz.nova.dto;

import xyz.nova.annotation.comment.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaMessageClose {

    @Comment("消息id,必填")
    private List<String> ids;

}
