package xyz.nova.cloud.config;

import org.apache.hc.client5.http.HttpRequestRetryStrategy;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.DefaultHttpRequestRetryStrategy;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.TimeValue;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import xyz.nova.utils.AuthorityUtils;

import java.io.IOException;

/**
 * Nova 框架的 RestTemplate 配置。
 * <p>
 * 提供带连接池、超时控制和统一请求头透传的 RestTemplate Bean，
 * 供框架内部的服务间远程调用使用。连接池与超时参数由 {@link NovaCloudConfig.Rpc} 提供。
 */
@Configuration
public class NovaRestTemplateConfig {

    /**
     * RestTemplate Bean 名称
     */
    public static final String REST_TEMPLATE_NAME = "novaRestTemplate";

    @Autowired
    private NovaCloudConfig novaCloudConfig;

    /**
     * 默认重试策略
     * 标记 @ConditionalOnMissingBean，使用方定义自己的 HttpRequestRetryStrategy Bean 即可覆盖此默认实现。
     */
    @Bean
    @ConditionalOnMissingBean(HttpRequestRetryStrategy.class)
    public HttpRequestRetryStrategy novaDefaultRetryStrategy() {
        NovaCloudConfig.Rpc rpc = novaCloudConfig.getRpc();
        return new DefaultHttpRequestRetryStrategy(rpc.getRetryCount(), TimeValue.ofSeconds(1));
    }

    /**
     * 创建带负载均衡、连接池、超时控制和统一请求头透传的 RestTemplate。
     * <p>
     * {@code @LoadBalanced} 使服务名（如 order-service）可被解析为真实实例地址。
     */
    @LoadBalanced
    @Bean(REST_TEMPLATE_NAME)
    public RestTemplate restTemplate(HttpRequestRetryStrategy retryStrategy) {
        NovaCloudConfig.Rpc rpc = novaCloudConfig.getRpc();
        // 连接池管理器
        PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();
        connectionManager.setMaxTotal(rpc.getMaxTotal());
        connectionManager.setDefaultMaxPerRoute(rpc.getMaxPerRoute());
        // RequestConfig：连接超时与响应超时
        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(Timeout.ofMilliseconds(rpc.getConnectTimeout()))
                .setResponseTimeout(Timeout.ofMilliseconds(rpc.getReadTimeout()))
                .build();
        // 构建 HttpClient，按开关决定是否启用重试
        HttpClientBuilder httpClientBuilder = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .setDefaultRequestConfig(requestConfig);
        if (rpc.isRetryEnabled()) {
            // 仅在显式开启时挂载重试策略，重试次数由配置决定
            httpClientBuilder.setRetryStrategy(retryStrategy);
        } else {
            // 默认关闭自动重试，避免非幂等操作被重复执行
            httpClientBuilder.disableAutomaticRetries();
        }
        CloseableHttpClient httpClient = httpClientBuilder.build();
        // 请求工厂
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);
        // 组装 RestTemplate
        RestTemplate restTemplate = new RestTemplate(factory);
        restTemplate.getInterceptors().add(new NovaHeaderInterceptor());
        return restTemplate;
    }

    /**
     * 统一请求头拦截器。
     * <p>
     * 在每次出站请求上透传当前请求的 token、menuCode 和 accept-language，
     * 避免在每个业务方法里重复设置。
     */
    public static class NovaHeaderInterceptor implements ClientHttpRequestInterceptor {

        @Override
        public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
            HttpHeaders headers = request.getHeaders();
            // 透传鉴权 token
            headers.set("token", AuthorityUtils.getToken());
            // 透传菜单编码
            headers.set("menuCode", AuthorityUtils.getMenuCode());
            // 透传语言标识（来自当前入站请求），无请求上下文时跳过
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                headers.set("accept-language", attributes.getRequest().getHeader("accept-language"));
            }
            return execution.execute(request, body);
        }
    }
}