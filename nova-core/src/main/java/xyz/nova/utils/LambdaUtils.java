package xyz.nova.utils;

import cn.hutool.core.util.StrUtil;
import lombok.SneakyThrows;
import org.springframework.util.ClassUtils;

import java.beans.Introspector;
import java.io.Serializable;
import java.lang.invoke.SerializedLambda;
import java.lang.reflect.Method;
import java.util.function.Function;

/**
 * lambda解析工具
 */
public class LambdaUtils {

    /**
     * 获取属性名
     */
    public static <T> String getProperty(SFunc<T, ?> function) {
        return findField(function).property();
    }

    /**
     * 获取属性名(驼峰转下划线)
     */
    public static <T> String getUnderlineCaseName(SFunc<T, ?> function) {
        return StrUtil.toUnderlineCase(findField(function).property());
    }

    /**
     * 获取方法名
     */
    public static <T> String getMethod(SFunc<T, ?> function) {
        return findField(function).method();
    }

    /**
     * 获取类class
     */
    public static <T> Class<T> getClass(SFunc<T, ?> function) {
        return findField(function).clazz();
    }

    @SneakyThrows
    private static <T> FieldInfo<T> findField(SFunc<T, ?> function) {
        // 第1步 获取SerializedLambda
        Method method = function.getClass().getDeclaredMethod("writeReplace");
        method.setAccessible(Boolean.TRUE);
        SerializedLambda serializedLambda = (SerializedLambda) method.invoke(function);
        // 第2步 implMethodName 即为Field对应的Getter方法名
        String implMethodName = serializedLambda.getImplMethodName();
        if (implMethodName.startsWith("lambda$")) {
            throw new IllegalArgumentException("不能传递lambda表达式,只能使用方法引用");
        }
        String propertyName;
        if (implMethodName.startsWith("get") && implMethodName.length() > 3) {
            propertyName = Introspector.decapitalize(implMethodName.substring(3));
        } else {
            throw new IllegalArgumentException(implMethodName + "不是Getter方法引用");
        }
        // 第3步 获取的Class是字符串，并且包名是"/"分割，需要替换成"."，才能获取到对应的Class对象
        String declaredClass = serializedLambda.getImplClass().replace("/", ".");
        Class<T> clazz = (Class<T>) Class.forName(declaredClass, false, ClassUtils.getDefaultClassLoader());
        return new FieldInfo<>(clazz, implMethodName, propertyName);
    }

    /**
     * 函数式接口
     *
     * @param <T> 引用实体类型
     * @param <R> 引用方法返回值类型
     */
    @FunctionalInterface
    public interface SFunc<T, R> extends Function<T, R>, Serializable {

    }

    /**
     * 字段信息内部类
     *
     * @param <T> 实体类型
     */
    public record FieldInfo<T>(Class<T> clazz, String method, String property) {

    }
}