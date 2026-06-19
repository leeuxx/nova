package com.nova.annotation.fun;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.Collections;
import java.util.List;

@Data
@Accessors(chain = true)
public class FetchResponse<T> {

    @Comment("数据总数")
    private long total = 0;

    @Comment("数据列表")
    private List<T> records = Collections.emptyList();

}
