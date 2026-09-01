package xyz.nova.service.data;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Fetch;
import xyz.nova.entity.data.PromptSearch;
import xyz.nova.entity.data.Tree;
import xyz.nova.error.NovaException;
import xyz.nova.i18n.NovaI18nUtils;

import java.util.List;

public interface DataProxy<MODEL, CONDITION> {

    @Comment("增加")
    default void add(MODEL model) {
        throw new NovaException(NovaI18nUtils.get("dataProxy.none", new Object[]{"DataProxy.add"}));
    }

    @Comment("批量增加")
    default void add(List<MODEL> models) {
        throw new NovaException(NovaI18nUtils.get("dataProxy.none", new Object[]{"DataProxy.add(batch)"}));
    }

    @Comment("删除")
    default void delete(List<MODEL> models) {
        throw new NovaException(NovaI18nUtils.get("dataProxy.none", new Object[]{"DataProxy.delete"}));
    }

    @Comment("修改")
    default void update(MODEL model) {
        throw new NovaException(NovaI18nUtils.get("dataProxy.none", new Object[]{"DataProxy.update"}));
    }

    @Comment("查询")
    default Fetch.Vo<MODEL> fetch(Fetch<CONDITION> fetch) {
        throw new NovaException(NovaI18nUtils.get("dataProxy.none", new Object[]{"DataProxy.fetch"}));
    }

    @Comment("详情")
    default MODEL details(Details details) {
        throw new NovaException(NovaI18nUtils.get("dataProxy.none", new Object[]{"DataProxy.details"}));
    }

    @Comment("树查询")
    default Tree.Vo<MODEL> tree(Tree tree) {
        throw new NovaException(NovaI18nUtils.get("dataProxy.none", new Object[]{"DataProxy.tree"}));
    }

    @Comment("树引用反显查询")
    default List<?> treeDisplay(Tree tree) {
        throw new NovaException(NovaI18nUtils.get("dataProxy.none", new Object[]{"DataProxy.treeDisplay"}));
    }

    @Comment("关键词搜索（供引用nova用做下拉查询条件搜索）")
    default PromptSearch.Vo promptSearch(PromptSearch promptSearch) {
        throw new NovaException(NovaI18nUtils.get("dataProxy.none", new Object[]{"DataProxy.promptSearch"}));
    }

}