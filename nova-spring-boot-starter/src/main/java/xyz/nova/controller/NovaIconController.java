package xyz.nova.controller;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.experimental.Accessors;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.config.RestMappingController;
import xyz.nova.error.NovaException;
import xyz.nova.utils.R;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@RestMappingController("nova/icon")
public class NovaIconController {

    private static final OkHttpClient HTTP_CLIENT = new OkHttpClient.Builder()
            .connectTimeout(3, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();

    private static final Pattern ICON_NAME = Pattern.compile("^[a-z0-9-]+:[a-z0-9-]+$");

    @Comment("从 Iconify 获取图标 JSON（开发期生成离线图标配置）")
    @PostMapping("fetch")
    public R<List<Vo>> fetch(@RequestBody List<String> icons) {
        if (icons == null || icons.isEmpty()) {
            throw new NovaException("icons 不能为空");
        }
        // 按 prefix 分组，同一个 prefix 只请求一次
        Map<String, List<String>> byPrefix = new LinkedHashMap<>();
        for (String icon : icons) {
            if (icon == null || !ICON_NAME.matcher(icon).matches()) {
                throw new NovaException("图标名格式错误，应为 prefix:name：" + icon);
            }
            int index = icon.indexOf(':');
            byPrefix.computeIfAbsent(icon.substring(0, index), key -> new ArrayList<>())
                    .add(icon.substring(index + 1));
        }

        List<Vo> result = new ArrayList<>();
        byPrefix.forEach((prefix, names) -> {
            String url = "https://api.iconify.design/" + prefix + ".json?icons=" + String.join(",", names);
            String text;
            try (Response response = HTTP_CLIENT.newCall(new Request.Builder().url(url).get().build()).execute()) {
                text = response.body() == null ? "" : response.body().string();
                if (!response.isSuccessful()) {
                    throw new NovaException("Iconify 请求失败：" + prefix + " HTTP " + response.code(), text);
                }
            } catch (IOException e) {
                throw new NovaException("Iconify 请求异常：" + prefix, e.getMessage());
            }
            // prefix 不存在时 Iconify 返回 200 + 纯文本 404
            if (!JSONUtil.isTypeJSON(text)) {
                throw new NovaException("图标集不存在：" + prefix, text);
            }
            JSONObject json = JSONUtil.parseObj(text);
            JSONArray notFound = json.getJSONArray("not_found");
            if (notFound != null && !notFound.isEmpty()) {
                throw new NovaException("图标不存在：" + prefix + " " + notFound);
            }
            Map<String, Icon> iconMap = new LinkedHashMap<>();
            JSONObject iconsJson = json.getJSONObject("icons");
            if (iconsJson != null) {
                iconsJson.forEach((name, value) ->
                        iconMap.put(name, JSONUtil.toBean((JSONObject) value, Icon.class)));
            }
            result.add(new Vo()
                    .setPrefix(json.getStr("prefix"))
                    .setWidth(json.getInt("width"))
                    .setHeight(json.getInt("height"))
                    .setIcons(iconMap));
        });
        return R.ok(result);
    }

    @Data
    @Accessors(chain = true)
    public static class Vo {

        private String prefix;

        private Integer width;

        private Integer height;

        private Map<String, Icon> icons;

    }

    @Data
    @Accessors(chain = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Icon {

        private String body;

        private Integer width;

        private Integer height;

        private Integer left;

        private Integer top;

        private Integer rotate;

        @JsonProperty("hFlip")
        private Boolean hFlip;

        @JsonProperty("vFlip")
        private Boolean vFlip;

    }
}
