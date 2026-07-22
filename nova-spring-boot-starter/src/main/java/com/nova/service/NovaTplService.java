package com.nova.service;

import com.nova.annotation.config.Comment;
import com.nova.dto.NovaTplOpen;

public interface NovaTplService {

    @Comment("获取tpl模版请求地址")
    String getTplPath(NovaTplOpen novaTplOpen);

}
