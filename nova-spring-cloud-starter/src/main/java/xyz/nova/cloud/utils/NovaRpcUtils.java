package xyz.nova.cloud.utils;

import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;
import xyz.nova.cloud.config.NovaRestTemplateConfig;
import xyz.nova.service.authority.AuthorityProxy;
import xyz.nova.utils.AuthorityUtils;
import xyz.nova.utils.R;
import xyz.nova.utils.SpringBeanUtils;

import java.util.List;
import java.util.function.Supplier;

public class NovaRpcUtils {

    /**
     * 当前服务名缓存
     */
    private static String currentServiceName;

    /**
     * 文件上传（multipart/form-data）
     */
    public static <T> R<T> upload(String novaName, String path, List<MultipartFile> files, Supplier<R<T>> supplier) {
        String serviceName = getServiceName(novaName);
        // 服务名为空或等于自身，执行本地
        if (serviceName == null || serviceName.isEmpty() || isSameService(serviceName)) {
            return supplier.get();
        }
        String url = UriComponentsBuilder.newInstance()
                .scheme("http")
                .host(serviceName)
                .path(path)
                .build()
                .toUriString();
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("novaName", novaName);
        files.forEach(file -> builder.part("files", file.getResource()));
        MultiValueMap<String, HttpEntity<?>> multipartBody = builder.build();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, HttpEntity<?>>> requestEntity = new HttpEntity<>(multipartBody, headers);
        RestTemplate restTemplate = SpringBeanUtils.getBean(NovaRestTemplateConfig.REST_TEMPLATE_NAME, RestTemplate.class);
        return restTemplate.postForObject(url, requestEntity, R.class);
    }

    /**
     * POST + JSON 调用
     */
    public static <T> R<T> post(String novaName, String path, Object requestBody, Supplier<R<T>> supplier) {
        String serviceName = getServiceName(novaName);
        // 服务名为空或等于自身，尝试执行本地
        if (serviceName == null || serviceName.isEmpty() || isSameService(serviceName)) {
            return supplier.get();
        }
        // 远程调用
        String url = UriComponentsBuilder.newInstance()
                .scheme("http")
                .host(serviceName)
                .path(path)
                .build()
                .toUriString();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Object> requestEntity = new HttpEntity<>(requestBody, headers);
        RestTemplate restTemplate = SpringBeanUtils.getBean(NovaRestTemplateConfig.REST_TEMPLATE_NAME, RestTemplate.class);
        return restTemplate.postForObject(url, requestEntity, R.class);
    }

    /**
     * 获取服务名
     * @param novaName Nova类名
     * @return 服务名
     */
    private static String getServiceName(String novaName) {
        AuthorityProxy authorityProxy = SpringBeanUtils.getBean(AuthorityProxy.class);
        return authorityProxy.getServiceName(AuthorityUtils.getToken(), novaName);
    }

    /**
     * 判断是否是调用自身
     */
    private static boolean isSameService(String targetService) {
        if (currentServiceName == null) {
            currentServiceName = SpringBeanUtils.getBean(Environment.class).getProperty("spring.application.name");
        }
        return targetService.equals(currentServiceName);
    }

}
