package com.nova.annotation.fun;

import com.nova.annotation.config.Comment;

import java.util.List;

public interface DataProxy<MODEL> {

    @Comment("增加")
    default void add(MODEL model) {
    }

    @Comment("删除")
    default void delete(List<MODEL> models) {
    }

    @Comment("修改")
    default void update(MODEL model) {
    }

    @Comment("查询")
    FetchResponse<MODEL> fetch(FetchRequest<MODEL> queryRequest);
}
