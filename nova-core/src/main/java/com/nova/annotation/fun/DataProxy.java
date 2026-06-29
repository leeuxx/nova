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

    @Comment("查询（表格内容渲染）")
    default Fetch.Vo<MODEL> fetch(Fetch<MODEL> fetch) {
        return null;
    }

    @Comment("详情（编辑详情）")
    default MODEL details(Details details) {
        return null;
    }

    @Comment("关键词搜索（供引用nova用做下拉查询条件搜索）")
    default PromptSearch.Vo promptSearch(PromptSearch promptSearch) {
        return null;
    }

}
