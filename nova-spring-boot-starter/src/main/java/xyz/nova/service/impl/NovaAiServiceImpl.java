package xyz.nova.service.impl;

import cn.hutool.json.JSONObject;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.nova.config.NovaAiConfig;
import xyz.nova.constant.NovaAiConst;
import xyz.nova.dto.NovaTableAdd;
import xyz.nova.service.NovaAiService;
import xyz.nova.utils.AiStreamUtils;
import xyz.nova.utils.NovaFieldUtils;
import xyz.nova.utils.NovaUtils;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@AllArgsConstructor
public class NovaAiServiceImpl implements NovaAiService {

    private NovaAiConfig novaAiConfig;

    @Override
    public SseEmitter addSseEmitter(NovaTableAdd novaTableAdd) {
        SseEmitter emitter = new SseEmitter(60000L);   // 超时
        List<NovaTableAdd.FormInfo> formInfo = novaTableAdd.getFormInfo();
        Map<String, List<NovaTableAdd.FormInfo>> appendageFormInfo = novaTableAdd.getAppendageFormInfo();
        JSONObject fields = new JSONObject();
        if (formInfo != null) {
            Map<String, String> prompts = NovaFieldUtils.getAiReviewPrompts(novaTableAdd.getNovaName());
            for (NovaTableAdd.FormInfo info : formInfo) {
                String prompt = prompts.get(info.getField());
                if (prompt != null) {
                    fields.set(info.getField(), new JSONObject()
                            .set("value", info.getValue())
                            .set("rule", prompt)
                    );
                }
            }
        }
        if (appendageFormInfo != null) {
            appendageFormInfo.forEach((novaName, formInfos) -> {
                Map<String, String> prompts = NovaFieldUtils.getAiReviewPrompts(novaName);
                for (NovaTableAdd.FormInfo info : formInfos) {
                    String prompt = prompts.get(info.getField());
                    if (prompt != null) {
                        fields.set(novaName + "." + info.getField(), new JSONObject()
                                .set("value", info.getValue())
                                .set("rule", prompt)
                        );
                    }
                }
            });
        }
        // 获取大模型
        Map<String, NovaAiConfig.OpenAiConfig> openAis = novaAiConfig.getOpenAis();
        // 如果openAis为空, 则直接返回放行
        if (openAis.isEmpty()) {
            return defaultSseEmitter(emitter);
        }
        String aiName = NovaUtils.getAiName(novaTableAdd.getNovaName());
        // 获取openAiConfig，如果aiName为空则默认选择第一个
        NovaAiConfig.OpenAiConfig openAiConfig = (aiName == null || aiName.isEmpty()) ? openAis.values().iterator().next() : openAis.get(aiName);
        // 如果openAiConfig为空, 则直接返回放行
        if (openAiConfig == null) {
            return defaultSseEmitter(emitter);
        }
        // 流式 JSON 解析状态
        StringBuilder jsonBuf = new StringBuilder();
        int[] braceCount = {0};      // 当前大括号深度
        boolean[] inString = {false};  // 是否在字符串内
        boolean[] escaped = {false};   // 上一个字符是否是转义符 \
        CompletableFuture.runAsync(() -> AiStreamUtils.stream(
                openAiConfig.getBaseUrl(),
                openAiConfig.getApiKey(),
                openAiConfig.getModel(),
                NovaAiConst.ADD_SSE_EMITTER_PROMPT,
                fields.toString(),
                // onChunk: 逐字符扫描, 用大括号计数判断完整 JSON 对象
                content -> {
                    for (int i = 0; i < content.length(); i++) {
                        char c = content.charAt(i);
                        // 转义处理
                        if (escaped[0]) {
                            escaped[0] = false;
                            jsonBuf.append(c);
                            continue;
                        }
                        if (c == '\\' && inString[0]) {
                            escaped[0] = true;
                            jsonBuf.append(c);
                            continue;
                        }
                        // 字符串边界
                        if (c == '"') {
                            inString[0] = !inString[0];
                            jsonBuf.append(c);
                            continue;
                        }
                        // 字符串内直接追加, 不计数
                        if (inString[0]) {
                            jsonBuf.append(c);
                            continue;
                        }
                        // 大括号计数
                        if (c == '{') {
                            braceCount[0]++;
                            jsonBuf.append(c);
                        } else if (c == '}') {
                            jsonBuf.append(c);
                            braceCount[0]--;
                            // 一个顶层 JSON 对象闭合
                            if (braceCount[0] == 0) {
                                String jsonStr = jsonBuf.toString().trim();
                                jsonBuf.setLength(0);
                                if (!jsonStr.isEmpty()) {
                                    handleJson(emitter, jsonStr);
                                }
                            }
                        } else {
                            // 非 JSON 内容（换行、空白等），仅当已有缓冲时才追加
                            if (braceCount[0] > 0) {
                                jsonBuf.append(c);
                            }
                        }
                    }
                },
                // onDone
                emitter::complete,
                // onError
                msg -> {
                    try {
                        emitter.send(SseEmitter.event()
                                .name("error")
                                .data(new JSONObject()
                                        .set("type", "error")
                                        .set("message", msg)
                                        .toString()
                                )
                        );
                    } catch (IOException ignored) {
                    }
                    emitter.complete();
                }
        ));
        emitter.onTimeout(() -> {
            log.error("SSE Timeout");
            emitter.complete();
        });
        emitter.onError((e) -> log.error("SSE error", e));
        return emitter;
    }

    /**
     * 解析一条 JSON 并推送
     */
    private void handleJson(SseEmitter emitter, String jsonStr) {
        try {
            JSONObject obj = new JSONObject(jsonStr);
            // 结论行
            if (obj.getBool("done", false)) {
                boolean ok = obj.getBool("ok", false);
                emitter.send(SseEmitter.event().name("result")
                        .data(new JSONObject().set("type", "result").set("ok", ok).toString()));
                return;
            }
            // 字段分析行
            String name = obj.getStr("name", "");
            boolean ok = obj.getBool("ok", true);
            String review = obj.getStr("review", "");
            emitter.send(SseEmitter.event()
                    .name("item")
                    .data(new JSONObject()
                            .set("type", "item")
                            .set("name", name)
                            .set("ok", ok)
                            .set("msg", review)
                            .toString()
                    )
            );
        } catch (Exception e) {
            log.warn("Error: AI failed to return JSON response: {}", jsonStr, e);
        }
    }

    private SseEmitter defaultSseEmitter(SseEmitter emitter) {
        try {
            emitter.send(SseEmitter.event()
                    .name("result")
                    .data(new JSONObject()
                            .set("type", "result")
                            .set("ok", true)
                            .toString()
                    )
            );
        } catch (IOException ignored) {
        }
        emitter.complete();
        return emitter;
    }

}
