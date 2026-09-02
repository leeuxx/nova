package xyz.nova.service.file;

import xyz.nova.error.NovaException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;
import xyz.nova.i18n.NovaI18nUtils;

import java.io.InputStream;

@Component
@ConditionalOnMissingBean(value = AttachmentProxy.class, ignored = DefaultAttachmentProxy.class)
public class DefaultAttachmentProxy implements AttachmentProxy {

    @Override
    public String upLoad(String novaName, InputStream inputStream) {
        throw new NovaException(NovaI18nUtils.get("attachment.none", NovaI18nUtils.SourceType.CODE));
    }
}
