package com.nova.upload;

import com.nova.service.file.AttachmentProxy;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
public class MyAttachmentProxy implements AttachmentProxy {

    @Override
    public String upLoad(String novaName, InputStream inputStream) {
        return "https://cdn.ossfile.mxrvending.com/tyGoods/6902890258827.png";
    }
}
