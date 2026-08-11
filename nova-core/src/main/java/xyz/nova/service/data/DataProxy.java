package xyz.nova.service.data;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Fetch;
import xyz.nova.entity.data.PromptSearch;
import xyz.nova.entity.data.Tree;
import xyz.nova.error.NovaException;

import java.util.List;

public interface DataProxy<MODEL, CONDITION> {

    @Comment("增加")
    default void add(MODEL model) {
        throw new NovaException("DataProxy.add未实现");
    }

    @Comment("批量增加")
    default void add(List<MODEL> models) {
        throw new NovaException("DataProxy.add(batch)未实现");
    }

    @Comment("删除")
    default void delete(List<MODEL> models) {
        throw new NovaException("DataProxy.delete未实现");
    }

    @Comment("修改")
    default void update(MODEL model) {
        throw new NovaException("DataProxy.update未实现");
    }

    @Comment("查询")
    default Fetch.Vo<MODEL> fetch(Fetch<CONDITION> fetch) {
        throw new NovaException("DataProxy.fetch未实现");
    }

    @Comment("详情")
    default MODEL details(Details details) {
        throw new NovaException("DataProxy.details未实现");
    }

    @Comment("树查询")
    default Tree.Vo<MODEL> tree(Tree tree) {
        throw new NovaException("DataProxy.tree未实现");
    }

    @Comment("关键词搜索（供引用nova用做下拉查询条件搜索）")
    default PromptSearch.Vo promptSearch(PromptSearch promptSearch) {
        throw new NovaException("DataProxy.promptSearch未实现");
    }

}