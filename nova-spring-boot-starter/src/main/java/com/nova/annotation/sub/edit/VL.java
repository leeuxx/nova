package com.nova.annotation.sub.edit;

import com.nova.annotation.Comment;

public @interface VL {

    @Comment("值")
    String value();

    @Comment("标签")
    String label();

}
