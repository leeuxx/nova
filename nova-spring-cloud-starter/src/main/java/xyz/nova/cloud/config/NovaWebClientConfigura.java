package xyz.nova.cloud.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.time.Duration;


@Configuration
public class NovaWebClientConfigura {

    @Bean
    @LoadBalanced
    public WebClient.Builder novaWebClientBuilder() {
        ConnectionProvider provider = ConnectionProvider.builder("nova-webClient-pool")
                // 最大连接数
                .maxConnections(100)
                // 空闲超过 5 * 60 秒的连接可被回收
                .maxIdleTime(Duration.ofSeconds(5 * 60))
                // 后台每 60 秒检查一次空闲连接
                .evictInBackground(Duration.ofSeconds(60))
                .build();
        HttpClient httpClient = HttpClient.create(provider)
                // 建立 TCP 连接的超时：5 秒内连不上远程服务就放弃
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                // 静默超时：两次网络读取之间的最大间隔。
                // 流式响应通常几十毫秒一包，30秒足以覆盖首字节等待和短暂停顿；
                // 只防“连接卡死”，不代表业务总时长（总时长由 SseEmitter 控制）
                .responseTimeout(Duration.ofSeconds(30));
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient));
    }

}
