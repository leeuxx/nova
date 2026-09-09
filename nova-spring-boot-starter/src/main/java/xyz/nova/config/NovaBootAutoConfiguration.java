package xyz.nova.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import xyz.nova.constant.NovaConst;

@Configuration
@ConditionalOnProperty(
        name = NovaConst.CLOUD_MASTER_KEY,
        havingValue = "false", // ⭐ 只有 false 才加载
        matchIfMissing = true  // ⭐ 不配置也加载
)
@ComponentScan(NovaConst.CONTROLLER_PACKAGE)
public class NovaBootAutoConfiguration {
}
