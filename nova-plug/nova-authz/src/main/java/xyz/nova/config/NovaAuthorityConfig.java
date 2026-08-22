package xyz.nova.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "nova.authority")
public class NovaAuthorityConfig {

    /**
     * token有效期（分钟）
     */
    private Integer expireTime = 30;

}
