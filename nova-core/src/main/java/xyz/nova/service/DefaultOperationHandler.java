package xyz.nova.service;

import org.springframework.stereotype.Service;
import xyz.nova.annotation.sub.nova.row.OperationHandler;
import xyz.nova.error.NovaException;

import java.util.List;

@Service
public class DefaultOperationHandler implements OperationHandler<Object, Object> {

    @Override
    public String exec(List<Object> novaIds, Object o, String param) {
        throw new NovaException("OperationHandler.exec未实现");
    }

    @Override
    public Object novaFormValue(List<Object> novaIds, String param) {
        return OperationHandler.super.novaFormValue(novaIds, param);
    }
}
