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
     *
     * @param function
     * @param <T>
     * @return
     */
    public static <T> String getProperty(JLFunction<T, ?> function) {
        return findField(function, "property").getV3();
    }


    /**
     * 获取属性名(驼峰转下划线)
     *
     * @param function
     * @param <T>
     * @return
     */
    public static <T> String getUnderlineCaseName(JLFunction<T, ?> function) {
        return StrUtil.toUnderlineCase(findField(function, "property").getV3());
    }

    /**
     * 获取方法名
     *
     * @param function
     * @param <T>
     * @return
     */
    public static <T> String getMethod(JLFunction<T, ?> function) {
        return findField(function, "method").getV2();
    }

    /**
     * 获取类class
     *
     * @param function
     * @param <T>
     * @return
     */
    public static <T> Class<T> getClass(JLFunction<T, ?> function) {
        return findField(function, "class").getV1();
    }

    @SneakyThrows
    private static <T> Tuple.Tuple3<Class<T>, String, String> findField(JLFunction<T, ?> function, String way) {
        String propertyName = null;
        // 第1步 获取SerializedLambda
        Method method = function.getClass().getDeclaredMethod("writeReplace");
        method.setAccessible(Boolean.TRUE);
        SerializedLambda serializedLambda = (SerializedLambda) method.invoke(function);
        // 第2步 implMethodName 即为Field对应的Getter方法名
        String implMethodName = serializedLambda.getImplMethodName();
        if (implMethodName.startsWith("lambda$")) {
            throw new IllegalArgumentException("不能传递lambda表达式,只能使用方法引用");
        }
        if (way.equals("property")) {
            if (implMethodName.startsWith("get") && implMethodName.length() > 3) {
                propertyName = Introspector.decapitalize(implMethodName.substring(3));
            } else {
                throw new IllegalArgumentException(implMethodName + "不是Getter方法引用");
            }
        }
        // 第3步 获取的Class是字符串，并且包名是“/”分割，需要替换成“.”，才能获取到对应的Class对象
        String declaredClass = serializedLambda.getImplClass().replace("/", ".");
        Class<T> classz = (Class<T>) Class.forName(declaredClass, false, ClassUtils.getDefaultClassLoader());
        // 第4步  Spring 中的反射工具类获取Class中定义的Field（此步为扩展，可省略）
            /*Field field = ReflectionUtils.findField(classz, propertyName);
            if (field == null) {
                return null;
            }
            classz = field.getDeclaringClass();*/
        //封装类class、方法名、属性名
        Tuple.Tuple3<Class<T>, String, String> tuple3 = new Tuple.Tuple3<>(classz, implMethodName, propertyName);
        return tuple3;
    }

    /**
     * 函数式接口
     *
     * @param <T> 引用实体类型
     * @param <R> 引用方法返回值类型
     */
    @FunctionalInterface
    public interface JLFunction<T, R> extends Function<T, R>, Serializable {

    }
}
