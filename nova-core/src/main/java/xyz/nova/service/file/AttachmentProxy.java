package xyz.nova.service.file;

import xyz.nova.annotation.comment.Comment;

import java.io.InputStream;

public interface AttachmentProxy {

    @Comment("附件上传, 返回值表示访问路径")
    String upLoad(@Comment("nova类名称") String novaName, @Comment("数据流") InputStream inputStream);

    @Comment("附件上传(带原始文件名), 返回值表示访问路径")
    default String upLoad(@Comment("nova类名称") String novaName,
                          @Comment("原始文件名") String originalFilename,
                          @Comment("数据流") InputStream inputStream) {
        return upLoad(novaName, inputStream);
    }

}
