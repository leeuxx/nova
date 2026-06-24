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

    @Comment("关键词搜索（被引用表做为查询条件搜索时触发, 返回被引用列和显示列）")
    default List<PromptSearchResponse> promptSearch(String novaName, String prompt) {
        return null;
    }
}
