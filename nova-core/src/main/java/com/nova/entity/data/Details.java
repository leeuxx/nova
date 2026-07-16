package com.nova.entity.data;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class Details {

    @Comment("来源nova名称")
    private String novaName;

    @Comment("存储值, 参考storageField属性")
    private String storageFieldValue;

    @Data
    @Accessors(chain = true)
    public static class Vo<MODEL> {

        @Comment("存储值, 参考storageField属性")
        private String storageFieldValue;

        @Comment("数据模型")
        private MODEL model;

    }
}
