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

import java.io.IOException;
import java.util.List;
import java.util.Map;

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
            for (NovaTableAdd.FormInfo info : formInfo) {
                fields.set(info.getField(), new JSONObject()
                        .set("value", info.getValue())
                        .set("rule", "请检查合理性")
                );
            }
        }
        if (appendageFormInfo != null) {
            appendageFormInfo.forEach((novaName, formInfos) -> {
                for (NovaTableAdd.FormInfo info : formInfos) {
                    fields.set(novaName + "." + info.getField(), new JSONObject()
                            .set("value", info.getValue())
                            .set("rule", "请检查合理性")
                    );
                }
            });
        }
        StringBuilder lineBuf = new StringBuilder();
        Thread thread = new Thread(() -> AiStreamUtils.stream(
                novaAiConfig.getBaseUrl(),
                novaAiConfig.getApiKey(),
                novaAiConfig.getModel(),
                NovaAiConst.ADD_SSE_EMITTER_PROMPT,
                fields.toString(),
                // onChunk: 追加 + 切行
                content -> {
                    lineBuf.append(content);
                    int idx;
                    while ((idx = lineBuf.indexOf("\n")) >= 0) {
                        String oneLine = lineBuf.substring(0, idx).trim();
                        lineBuf.delete(0, idx + 1);
                        if (oneLine.isEmpty()) continue;
                        handleLine(emitter, oneLine);
                    }
                },
                // onDone: 处理残留 + 结束
                () -> {
                    if (!lineBuf.isEmpty()) {
                        String last = lineBuf.toString().trim();
                        if (!last.isEmpty()) {
                            handleLine(emitter, last);
                        }
                    }
                    emitter.complete();
                },
                // onError
                msg -> {
                    try {
                        emitter.send(SseEmitter.event().name("error")
                                .data(new JSONObject().set("type", "error").set("message", msg).toString()));
                    } catch (IOException ignored) {
                    }
                    emitter.complete();
                }
        ));
        thread.start();

        emitter.onTimeout(() -> {
            log.error("SSE超时");
            emitter.complete();
        });
        emitter.onError((e) -> log.error("SSE错误", e));

        return emitter;
    }

    /**
     * 解析一行并推送
     */
    private void handleLine(SseEmitter emitter, String line) {
        try {
            // 结论行: 分析完成: 数据看起来没问题 / 有几点建议您看看
            if (line.contains("分析完成")) {
                boolean ok = line.contains("没问题");
                emitter.send(SseEmitter.event().name("result")
                        .data(new JSONObject().set("type", "result").set("ok", ok).toString()));
                return;
            }
            // 通过行: ✓ <字段值>
            if (line.startsWith("✓")) {
                emitter.send(SseEmitter.event().name("item")
                        .data(new JSONObject().set("type", "item").set("ok", true)
                                .set("value", line.substring(1).trim()).toString()));
                return;
            }
            // 注意行: ✗ <字段值>: <说明>
            if (line.startsWith("✗")) {
                String rest = line.substring(1).trim();
                String value, msg = "";
                int c = rest.indexOf(":");
                if (c < 0) c = rest.indexOf("：");
                if (c > 0) {
                    value = rest.substring(0, c).trim();
                    msg = rest.substring(c + 1).trim();
                } else {
                    value = rest;
                }
                emitter.send(SseEmitter.event().name("item")
                        .data(new JSONObject().set("type", "item").set("ok", false)
                                .set("value", value).set("msg", msg).toString()));
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}