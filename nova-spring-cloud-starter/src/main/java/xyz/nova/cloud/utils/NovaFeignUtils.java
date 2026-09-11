package xyz.nova.cloud.utils;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;
import xyz.nova.service.authority.AuthorityProxy;
import xyz.nova.utils.AuthorityUtils;
import xyz.nova.utils.R;
import xyz.nova.utils.SpringBeanUtils;

import java.util.List;
import java.util.function.Supplier;

public class NovaFeignUtils {

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
        headers.set("token", AuthorityUtils.getToken());
        headers.set("menuCode", AuthorityUtils.getMenuCode());
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            headers.set("accept-language", request.getHeader("accept-language"));
        }
        HttpEntity<MultiValueMap<String, HttpEntity<?>>> requestEntity = new HttpEntity<>(multipartBody, headers);
        RestTemplate restTemplate = SpringBeanUtils.getBean("novaRestTemplate", RestTemplate.class);
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
        headers.set("token", AuthorityUtils.getToken());
        headers.set("menuCode", AuthorityUtils.getMenuCode());
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            headers.set("accept-language", request.getHeader("accept-language"));
        }
        HttpEntity<Object> requestEntity = new HttpEntity<>(requestBody, headers);
        RestTemplate restTemplate = SpringBeanUtils.getBean("novaRestTemplate", RestTemplate.class);
        return restTemplate.postForObject(url, requestEntity, R.class);
    }

    private static String getServiceName(String novaName) {
        AuthorityProxy authorityProxy = SpringBeanUtils.getBean(AuthorityProxy.class);
        return authorityProxy.getServiceName(AuthorityUtils.getToken(), novaName);
    }

    private static boolean isSameService(String targetService) {
        String currentService = SpringBeanUtils.getBean(Environment.class).getProperty("spring.application.name");
        return targetService.equals(currentService);
    }
}
