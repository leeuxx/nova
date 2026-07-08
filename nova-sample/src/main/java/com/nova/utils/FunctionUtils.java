package com.nova.utils;

/**
 * 函数接口工具类
 */
public class FunctionUtils {

    /**
     * 有参有返回值
     *
     * @param <T>
     */
    @FunctionalInterface
    public interface ParamsResult<T, R> {
        R run(T params);
    }

    /**
     * 无参有返回值
     *
     * @param <T>
     */
    @FunctionalInterface
    public interface NoParamsResult<T> {
        T run();
    }

    /**
     * 有参无返回值
     *
     * @param <T>
     */
    @FunctionalInterface
    public interface ParamsNoResult<T> {
        void run(T params);
    }

    /**
     * 无参无返回值
     */
    @FunctionalInterface
    public interface NoParamsNoResult {
        void run();
    }
}
