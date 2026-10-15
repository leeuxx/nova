package xyz.nova.service.impl;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.config.NovaAiConfig;
import xyz.nova.config.NovaApplication;
import xyz.nova.constant.NovaAiConst;
import xyz.nova.dto.NovaTableAdd;
import xyz.nova.entity.data.NovaExpr;
import xyz.nova.error.NovaException;
import xyz.nova.i18n.NovaI18nUtils;
import xyz.nova.service.NovaAiService;
import xyz.nova.utils.AiStreamUtils;
import xyz.nova.utils.NovaFieldUtils;
import xyz.nova.utils.NovaUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
                String value = info.getValue();
                if (prompt != null && value != null && !value.isEmpty()) {
                    fields.set(info.getField(), new JSONObject()
                            .set("value", value)
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
                    String value = info.getValue();
                    if (prompt != null && value != null && !value.isEmpty()) {
                        fields.set(novaName + "." + info.getField(), new JSONObject()
                                .set("value", value)
                                .set("rule", prompt)
                        );
                    }
                }
            });
        }
        // 如果fields为空, 则直接返回放行
        if (fields.isEmpty()) {
            return defaultSseEmitter(emitter);
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

    @Override
    public List<NovaExpr> parseSearch(String novaName, String prompt) {
        Locale locale = LocaleContextHolder.getLocale();
        // 可查询字段：取实体全部字段（含未开放为搜索字段的条件字段），排除不可查询组件
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(novaName);
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        JSONArray fields = new JSONArray();
        novaFields.forEach((field, novaFieldInfo) -> {
            if (!NovaFieldUtils.isQueryType(novaFieldInfo.getType())) {
                return;
            }
            NovaField novaField = novaFieldInfo.getNovaField();
            String title = NovaI18nUtils.get(novaField.edit().title(), locale, NovaI18nUtils.SourceType.ANNOTATE);
            fields.put(new JSONObject()
                    .set("field", field)
                    .set("title", title)
            );
        });
        // 组装输入
        JSONObject input = new JSONObject()
                .set("prompt", prompt)
                .set("fields", fields);
        // 模型配置
        Map<String, NovaAiConfig.OpenAiConfig> openAis = novaAiConfig.getOpenAis();
        if (openAis.isEmpty()) {
            throw aiParseFail("AI model not configured, cannot parse prompt");
        }
        String aiName = NovaUtils.getAiName(novaName);
        NovaAiConfig.OpenAiConfig openAiConfig = (aiName == null || aiName.isEmpty())
                ? openAis.values().iterator().next() : openAis.get(aiName);
        if (openAiConfig == null) {
            throw aiParseFail("AI model config not found: " + aiName);
        }
        // 流式调用并同步等待结果
        String text = AiStreamUtils.complete(
                openAiConfig.getBaseUrl(), openAiConfig.getApiKey(), openAiConfig.getModel(),
                NovaAiConst.SEARCH_PARSE_PROMPT, input.toString(), 30000L);
        JSONObject result;
        try {
            result = JSONUtil.parseObj(text);
        } catch (Exception e) {
            throw aiParseFail("AI response is not a parseable query condition");
        }
        if (result.isEmpty()) {
            throw aiParseFail("No query condition parsed from prompt");
        }
        // 元数据
        Map<String, NovaFieldUtils.ChoiceInfo> choices = NovaFieldUtils.getChoice(novaName, locale);
        Map<String, NovaFieldUtils.ReferenceTypeInfo> references = NovaFieldUtils.getReference(novaName);
        Map<String, NovaFieldUtils.AppendageTypeInfo> appendages = NovaFieldUtils.getAppendage(novaName);
        // 逐字段转为表达式
        List<NovaExpr> exprs = new ArrayList<>();
        for (String field : result.keySet()) {
            NovaApplication.ScanNova.NovaFieldInfo novaFieldInfo = novaFields.get(field);
            if (novaFieldInfo == null || !NovaFieldUtils.isQueryType(novaFieldInfo.getType())) {
                throw aiParseFail("AI returned unknown field: " + field);
            }
            JSONArray array = result.getJSONArray(field);
            if (array == null || array.isEmpty()) {
                throw aiParseFail("AI returned malformed field expression: " + field);
            }
            Edit.Type type = novaFieldInfo.getType();
            String title = NovaI18nUtils.get(novaFieldInfo.getNovaField().edit().title(), locale, NovaI18nUtils.SourceType.ANNOTATE);
            // 实际查询字段
            String actualField = field;
            if (type == Edit.Type.REFERENCE) {
                NovaFieldUtils.ReferenceTypeInfo reference = references.get(field);
                if (reference != null) {
                    actualField = reference.getRef();
                }
            } else if (type == Edit.Type.APPENDAGE || type == Edit.Type.APPENDAGES) {
                NovaFieldUtils.AppendageTypeInfo appendage = appendages.get(field);
                if (appendage != null) {
                    actualField = appendage.getBy();
                }
            }
            for (Object element : array) {
                JSONObject expr = JSONUtil.parseObj(element);
                String opStr = expr.getStr("op", "eq");
                NovaExpr.Op op;
                try {
                    op = NovaExpr.Op.valueOf(opStr.trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    throw aiParseFail("AI returned unknown operator: " + field + "=" + opStr);
                }
                JSONArray valueArr = expr.getJSONArray("values");
                // 值原样透传，仅 CHOICE 需要标签转值以匹配存储值
                List<String> values = new ArrayList<>();
                if (valueArr != null) {
                    for (Object raw : valueArr) {
                        String value = String.valueOf(raw);
                        if (type == Edit.Type.CHOICE) {
                            boolean found = false;
                            for (NovaFieldUtils.ChoiceInfo.ValueInfo info : choices.get(field).getValues()) {
                                if (value.equals(info.getLabel()) || value.equals(info.getValue())) {
                                    value = info.getValue();
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                throw aiParseFail("Cannot match choice value: " + field + "=" + value);
                            }
                        }
                        values.add(value);
                    }
                }
                // 操作符对值数量的约定
                if (op == NovaExpr.Op.IS_NULL || op == NovaExpr.Op.IS_NOT_NULL) {
                    // is_null / is_not_null：不带值
                    if (!values.isEmpty()) {
                        throw aiParseFail("Field " + field + " operator " + op.name().toLowerCase() + " takes no values");
                    }
                } else if (op == NovaExpr.Op.BETWEEN) {
                    // between：恰好 2 个（起、止）
                    if (values.size() != 2) {
                        throw aiParseFail("Field " + field + " between requires 2 values");
                    }
                } else if (op == NovaExpr.Op.IN) {
                    // in：至少 1 个
                    if (values.isEmpty()) {
                        throw aiParseFail("Field " + field + " in requires at least 1 value");
                    }
                } else if (values.size() != 1) {
                    // 其余操作符：恰好 1 个
                    throw aiParseFail("Field " + field + " operator " + op.name().toLowerCase() + " requires exactly 1 value");
                }
                exprs.add(new NovaExpr().setField(actualField).setTitle(title).setOp(op).setValues(values));
            }
        }
        return exprs;
    }

    /**
     * AI 解析失败：前端统一提示，具体原因写入 detail 供日志排查
     */
    private NovaException aiParseFail(String detail) {
        return new NovaException(NovaI18nUtils.get("ai.parse.fail", NovaI18nUtils.SourceType.CODE), detail);
    }

}
