package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.Map;

public interface ButtonHandle {

    @Comment("按钮点击处理")
    Vo buttonHandle(String param, Map<String, String> transmitParams);

    @Data
    @Accessors(chain = true)
    class Vo {

        @Comment("成功/失败")
        private Boolean status = true;

        @Comment("提示信息")
        private String message = "请求成功";

    }
}
