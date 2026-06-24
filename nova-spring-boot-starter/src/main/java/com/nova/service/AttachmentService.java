package com.nova.service;

import com.nova.annotation.config.Comment;
import com.nova.dto.AttachmentUpload;
import com.nova.utils.R;

import java.util.List;

public interface AttachmentService {

    @Comment("上传文件")
    R<List<String>> upload(AttachmentUpload attachmentUpload);

}
