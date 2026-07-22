package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

import java.util.Map;

public interface ButtonHandle {

    @Comment("按钮点击处理")
    boolean buttonHandle(String param, Map<String, String> transmitParams);

}
