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

    /**
     * RPC 配置（主节点配置）
     */
    private Rpc rpc = new Rpc();

    @Data
    public static class Rpc {

        /**
         * 连接池最大连接数（全局）
         */
        private int maxTotal = 200;

        /**
         * 每个下游实例（路由）的最大连接数
         */
        private int maxPerRoute = 20;

        /**
         * 建立连接超时时间（毫秒）
         */
        private int connectTimeout = 2000;

        /**
         * 读取响应超时时间（毫秒）
         */
        private int readTimeout = 5000;

        /**
         * 是否开启 RPC 自动重试。
         */
        private boolean retryEnabled = false;

        /**
         * 重试次数（仅 retryEnabled=true 时生效）
         */
        private int retryCount = 1;

    }
}
