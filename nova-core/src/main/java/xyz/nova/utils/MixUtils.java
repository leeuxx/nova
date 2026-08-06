package xyz.nova.utils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class MixUtils {

    /**
     * 驼峰转下划线
     */
    public static String camelToSnake(String camelCase) {
        if (camelCase == null || camelCase.isEmpty()) {
            return camelCase;
        }
        StringBuilder result = new StringBuilder();
        result.append(Character.toLowerCase(camelCase.charAt(0)));
        for (int i = 1; i < camelCase.length(); i++) {
            char c = camelCase.charAt(i);
            if (Character.isUpperCase(c)) {
                result.append('_');
                result.append(Character.toLowerCase(c));
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    /**
     * 下划线转驼峰
     */
    public static String snakeToCamel(String snakeCase) {
        if (snakeCase == null || snakeCase.isEmpty()) {
            return snakeCase;
        }
        StringBuilder result = new StringBuilder();
        boolean nextUpper = false;
        for (char c : snakeCase.toCharArray()) {
            if (c == '_') {
                nextUpper = true;
            } else if (nextUpper) {
                result.append(Character.toUpperCase(c));
                nextUpper = false;
            } else {
                result.append(Character.toLowerCase(c));
            }
        }
        return result.toString();
    }

    /**
     * 将下划线命名的 Map 列表转换为驼峰命名的 Map 列表
     */
    public static List<Map<String, Object>> convertToCamelCase(List<Map<String, Object>> snakeMapList) {
        List<Map<String, Object>> camelMapList = new ArrayList<>();
        for (Map<String, Object> snakeMap : snakeMapList) {
            Map<String, Object> camelMap = new LinkedHashMap<>();
            for (Map.Entry<String, Object> entry : snakeMap.entrySet()) {
                camelMap.put(snakeToCamel(entry.getKey()), entry.getValue());
            }
            camelMapList.add(camelMap);
        }
        return camelMapList;
    }
}
