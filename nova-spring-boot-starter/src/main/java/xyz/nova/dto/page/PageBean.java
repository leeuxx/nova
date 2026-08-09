package xyz.nova.dto.page;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.entity.data.OrderItemBean;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Data
@Accessors(chain = true)
public class PageBean<T> {

    @Comment("当前页")
    private long current = 1;

    @Comment("显示行数")
    private long size = 10;

    @Comment("总数")
    private long total = 0;

    @Comment("排序")
    private List<OrderItemBean> orders = new ArrayList<>();

    @Comment("查询数据列表")
    private List<T> records = Collections.emptyList();

}
