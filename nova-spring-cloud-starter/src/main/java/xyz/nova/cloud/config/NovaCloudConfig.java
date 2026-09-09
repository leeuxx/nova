package xyz.nova.cloud.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "nova.cloud")
public class NovaCloudConfig {

    /**
     * 是否为主节点
     *  true  = 主节点，Controller 走远程调用（Feign）
     *  false = 从节点，Controller 走本地实现（默认）
     */
    private Boolean master;

}
