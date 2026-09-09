package xyz.nova.cloud.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import xyz.nova.constant.NovaConst;

@Configuration
@ConditionalOnProperty(
        name = NovaConst.CLOUD_MASTER_KEY,
        havingValue = "true" // ⭐ 只有 true 才加载
)
@ComponentScan(NovaConst.CONTROLLER_CLOUD_PACKAGE)
public class NovaCouldAutoConfiguration {
}
