package xyz.nova.utils;

import lombok.SneakyThrows;
import org.springframework.beans.BeanUtils;

import java.util.ArrayList;
import java.util.List;

public class BeanCopyUtils {

    /**
     * 对象拷贝
     *
     * @param source      源对象
     * @param targetClass 目标class
     * @param ignores     忽略属性（从源对象中忽略）
     * @param <S>         源对象类型
     * @param <T>         目标类型
     * @return 目标对象
     */
    @SafeVarargs
    @SneakyThrows
    public static <S, T> T copy(S source, Class<T> targetClass, LambdaUtils.SFunc<S, ?>... ignores) {
        T target = targetClass.getDeclaredConstructor().newInstance();
        if (source != null) {
            BeanUtils.copyProperties(source, target, toArray(ignores));
        }
        return target;
    }

    /**
     * 对象拷贝
     *
     * @param source  源对象
     * @param target  目标对象
     * @param ignores 忽略属性（从源对象中忽略）
     * @param <S>     源对象类型
     * @param <T>     目标类型
     * @return 目标对象
     */
    @SafeVarargs
    public static <S, T> T copy(S source, T target, LambdaUtils.SFunc<S, ?>... ignores) {
        if (source == null || target == null) {
            return target;
        }
        BeanUtils.copyProperties(source, target, toArray(ignores));
        return target;
    }

    /**
     * 集合拷贝
     *
     * @param sources     源集合
     * @param targetClass 目标class
     * @param ignores     忽略属性（从源对象中忽略）
     * @param <S>         源对象类型
     * @param <T>         目标类型
     * @return 目标集合
     */
    @SafeVarargs
    @SneakyThrows
    public static <S, T> List<T> copy(List<S> sources, Class<T> targetClass, LambdaUtils.SFunc<S, ?>... ignores) {
        if (sources == null || sources.isEmpty()) {
            return new ArrayList<>();
        }
        String[] ignoreArray = toArray(ignores);
        List<T> targets = new ArrayList<>(sources.size());
        for (S source : sources) {
            T target = targetClass.getDeclaredConstructor().newInstance();
            if (source != null) {
                BeanUtils.copyProperties(source, target, ignoreArray);
            }
            targets.add(target);
        }
        return targets;
    }

    @SafeVarargs
    private static <S> String[] toArray(LambdaUtils.SFunc<S, ?>... ignores) {
        if (ignores == null || ignores.length == 0) {
            return new String[0];
        }
        List<String> list = new ArrayList<>(ignores.length);
        for (LambdaUtils.SFunc<S, ?> sFunc : ignores) {
            list.add(LambdaUtils.getProperty(sFunc));
        }
        return list.toArray(new String[0]);
    }
}