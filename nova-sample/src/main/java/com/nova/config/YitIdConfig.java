package com.nova.config;

import com.github.yitter.contract.IdGeneratorOptions;
import com.github.yitter.idgen.YitIdHelper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class YitIdConfig {

    @PostConstruct
    public void initYitId() {
        YitIdHelper.setIdGenerator(new IdGeneratorOptions((short) 1));
    }

}
