package xyz.nova.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;
import xyz.nova.constant.NovaConst;

@Configuration
@MapperScan(NovaConst.MAPPER_PACKAGE)
public class NovaMyBatisPlusConfiguration {
}
