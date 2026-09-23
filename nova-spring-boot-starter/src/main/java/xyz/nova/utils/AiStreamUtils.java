package xyz.nova.utils;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

@Slf4j
public class AiStreamUtils {

    private static final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(2, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .build();

    /**
     * 通用流式调用
     *
     * @param baseUrl  API 地址（不含 /chat/completions）
     * @param apiKey   API Key
     * @param model    模型名
     * @param system   系统提示词
     * @param prompt   用户内容
     * @param onChunk  每收到一段文本回调（原样，不切不拼）
     * @param onDone   流正常结束回调（与 onError 互斥）
     * @param onError  出错回调（与 onDone 互斥）
     */
    public static void stream(String baseUrl, String apiKey, String model,
                              String system,
                              String prompt,
                              Consumer<String> onChunk,
                              Runnable onDone,
                              Consumer<String> onError) {
        try {
            JSONObject bodyObj = new JSONObject()
                    .set("model", model)
                    .set("messages", new JSONArray()
                            .put(new JSONObject().set("role", "system").set("content", system))
                            .put(new JSONObject().set("role", "user").set("content", prompt)))
                    .set("stream", true);

            Request request = new Request.Builder()
                    .url(baseUrl + "/chat/completions")
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(MediaType.parse("application/json"), bodyObj.toString()))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    onError.accept("API调用失败: " + response.code());
                    return;
                }
                ResponseBody body = response.body();
                if (body == null) {
                    onError.accept("响应体为空");
                    return;
                }
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(body.byteStream(), StandardCharsets.UTF_8));
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.startsWith("data:")) continue;
                    String data = line.substring(5).trim();
                    if (data.isEmpty() || "[DONE]".equals(data)) continue;
                    try {
                        JSONObject chunk = JSONUtil.parseObj(data);
                        JSONArray choices = chunk.getJSONArray("choices");
                        if (choices == null || choices.isEmpty()) continue;
                        JSONObject delta = choices.getJSONObject(0).getJSONObject("delta");
                        if (delta == null) continue;
                        String content = delta.getStr("content");
                        if (content == null || content.isEmpty()) continue;

                        onChunk.accept(content);
                    } catch (Exception e) {
                        log.warn("解析流式数据失败: {}", data, e);
                    }
                }
            }
            // 正常读完，回调 onDone
            onDone.run();
        } catch (Exception e) {
            log.error("AI流式异常", e);
            onError.accept("异常: " + e.getMessage());
        }
    }
}