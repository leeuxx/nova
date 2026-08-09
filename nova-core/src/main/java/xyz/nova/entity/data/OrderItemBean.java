package xyz.nova.entity.data;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.comment.Comment;

@Data
@Accessors(chain = true)
public class OrderItemBean {

    @Comment("需要进行排序的字段")
    private String column;

    @Comment("是否正序排列，默认 true")
    private boolean asc = true;

}
