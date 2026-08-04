package com.nova.service.file;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
@ConditionalOnMissingBean(value = AttachmentProxy.class, ignored = DefaultAttachmentProxy.class)
public class DefaultAttachmentProxy implements AttachmentProxy {

    @Override
    public String upLoad(String novaName, InputStream inputStream) {
        throw new RuntimeException("附件上传未配置");
    }
}
