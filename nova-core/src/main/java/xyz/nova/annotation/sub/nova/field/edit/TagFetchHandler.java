package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;

import java.util.List;

public interface TagFetchHandler {

    @Comment("获取标签列表")
    List<String> fetchTags(String param);

}
