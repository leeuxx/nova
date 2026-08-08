package xyz.nova.service.file;

import xyz.nova.annotation.comment.Comment;

import java.io.InputStream;

public interface AttachmentProxy {

    @Comment("附件上传, 返回值表示访问路径")
    String upLoad(@Comment("nova类名称") String novaName, @Comment("数据流") InputStream inputStream);

}
