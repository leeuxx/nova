package com.nova.annotation.fun;

import com.nova.annotation.config.Comment;

import java.util.List;
import java.util.Map;

public interface DataProxy<ENTITY, MODEL> {

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
    FetchResponse<MODEL> fetch(FetchRequest<ENTITY> fetchRequest);

    @Comment("被引用查询（供其他nova引用时进行数据展示）")
    default Map<String, MODEL> fetchReferences(FetchReferencesRequest fetchReferencesRequest) {
        return null;
    }

    @Comment("关键词搜索（供引用nova用做下拉查询条件搜索）")
    default PromptSearchResponse promptSearch(PromptSearchRequest promptSearchRequest) {
        return null;
    }

}
