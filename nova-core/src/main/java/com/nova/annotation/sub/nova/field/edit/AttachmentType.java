package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface AttachmentType {

    @Comment("附件类型")
    Type type() default Type.BASE;

    @Comment("附件显示类型")
    ShowType showType() default ShowType.DOWN;

    @Comment("附件在表格中显示类型")
    TableShowType tableShowType() default TableShowType.TEXT;

    @Comment("最大上传数")
    int maxLimit() default 1;

    @Comment("单个文件最小文件大小,kb")
    int minSize() default -1;

    @Comment("单个文件最大文件大小,kb")
    int maxSize() default -1;

    @Comment("允许上传的文件类型（如：.jpg）")
    String[] fileTypes() default {};

    enum Type {
        @Comment("任意文件")
        BASE,
        @Comment("图片文件")
        IMAGE
    }

    enum ShowType {
        @Comment("往上展开")
        TOP,
        @Comment("往下展开")
        DOWN
    }

    enum TableShowType {
        @Comment("文本")
        TEXT,
        @Comment("图片")
        IMAGE,
        @Comment("视频")
        VIDEO,
        @Comment("二维码")
        QR_CODE,
        @Comment("弹窗显示")
        DIALOG
    }
}
