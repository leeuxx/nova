package xyz.nova.utils;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 参数校验工具
 */
public class Emptys {

    /**
     * object判空
     */
    public static boolean check(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof String && "".equals(String.valueOf(value))) {
            return false;
        }
        if (value instanceof List && ((List) value).size() == 0) {
            return false;
        }
        if (value instanceof Map && ((Map) value).size() == 0) {
            return false;
        }
        if (value instanceof Set && ((Set) value).size() == 0) {
            return false;
        }
        return true;
    }

    /**
     * string最小 最大
     */
    public static boolean check(String value, int min, int max) {
        return !check(value) || value.length() < min || value.length() > max ? false : true;
    }

    /**
     * string正则
     */
    public static boolean check(String value, String regex) {
        return !check(value) || !Pattern.matches(regex, value) ? false : true;
    }

    /**
     * 数值最小 最大
     */
    public static boolean check(Number value, Number min, Number max) {
        return !check(value) || value.doubleValue() < min.doubleValue() || value.doubleValue() > max.doubleValue() ? false : true;
    }

}
