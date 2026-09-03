package xyz.nova.annotation.sub.nova;

import xyz.nova.annotation.comment.Comment;

public interface TooltipHandler {

    @Comment("获取提示信息")
    String getTooltip(@Comment("参数") String param);

}
