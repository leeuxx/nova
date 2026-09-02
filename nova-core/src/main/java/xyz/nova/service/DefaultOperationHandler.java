package xyz.nova.service;

import org.springframework.stereotype.Service;
import xyz.nova.annotation.sub.nova.row.OperationHandler;
import xyz.nova.error.NovaException;
import xyz.nova.i18n.NovaI18nUtils;

import java.util.List;

@Service
public class DefaultOperationHandler implements OperationHandler<Object, Object> {

    @Override
    public String exec(List<Object> novaIds, Object o, String param) {
        throw new NovaException(NovaI18nUtils.get("operationHandler.none", NovaI18nUtils.SourceType.CODE));
    }

    @Override
    public Object novaFormValue(List<Object> novaIds, String param) {
        return OperationHandler.super.novaFormValue(novaIds, param);
    }
}
