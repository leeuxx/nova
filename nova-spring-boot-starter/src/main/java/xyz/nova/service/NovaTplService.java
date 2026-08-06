package xyz.nova.service;

import xyz.nova.annotation.config.Comment;
import xyz.nova.dto.NovaTplOpen;

public interface NovaTplService {

    @Comment("获取tpl模版请求地址")
    String getTplPath(NovaTplOpen novaTplOpen);

}
