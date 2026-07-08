package com.nova.utils.collections.list;

import com.nova.utils.FunctionUtils;
import com.nova.utils.LambdaUtils;
import com.nova.utils.SetUtils;
import com.nova.utils.collections.map.JHashMap;
import com.nova.utils.collections.map.JMap;

import java.util.List;
import java.util.Map;

/**
 * list接口
 *
 * @param <T>
 */
public interface JList<T> extends List<T> {

    /**
     * 添加
     */
    JList<T> set(T t);

    /**
     * 添加
     */
    JList<T> set(boolean condition, T t);

    /**
     * 添加
     */
    JList<T> setAll(List<T> list);

    /**
     * 添加
     */
    JList<T> setAll(boolean condition, List<T> list);

    /**
     * 转map（对象）
     */
    <R> ToMapOper<T, R> toMap(LambdaUtils.JLFunction<T, R> jlFunction);

    /**
     * 转map（元素）
     */
    ToMapOper<T, T> toMap();

    /**
     * 去重（对象）
     */
    JList<T> comparing(LambdaUtils.JLFunction<T, ?>... jlFunction);

    /**
     * 去重（元素）
     */
    JList<T> comparing();

    /**
     * 正序（对象）
     */
    JList<T> asc(LambdaUtils.JLFunction<T, ?> jlFunction);

    /**
     * 正序（元素）
     */
    JList<T> asc();

    /**
     * 倒序（对象）
     */
    JList<T> desc(LambdaUtils.JLFunction<T, ?> jlFunction);

    /**
     * 倒序（元素）
     */
    JList<T> desc();

    /**
     * 获取某个属性集合
     */
    <R> JList<R> getProperty(LambdaUtils.JLFunction<T, R> jlFunction);

    /**
     * 随机洗牌
     */
    JList<T> shuffle();

    /**
     * 根据值获取下标 -1=不存在
     */
    int getIndex(T t);

    /**
     * 差集 list中有的但是list2中没有
     */
    JList<T> diff(List<T> list2);

    /**
     * 交集 list和list2中都有
     */
    JList<T> section(List<T> list2);

    /**
     * 按指定长度切割为N个集合
     *
     * @param size 长度
     * @return
     */
    JList<JList<T>> partition(int size);

    /**
     * 循环累加
     *
     * @param addFunction
     * @param addFunctions
     * @return
     */
    T forAdd(LambdaUtils.JLFunction<T, ?> addFunction, LambdaUtils.JLFunction<T, ?>... addFunctions);

    /**
     * 循环累加
     *
     * @param fors
     * @param addFunction
     * @param addFunctions
     * @return
     */
    T forAdd(FunctionUtils.ParamsNoResult<T> fors, LambdaUtils.JLFunction<T, ?> addFunction, LambdaUtils.JLFunction<T, ?>... addFunctions);

    /**
     * 查询
     */
    Filter<T> filter();

    /**
     * 转换map操作类
     */
    class ToMapOper<T, R> {
        private List<T> list;
        private LambdaUtils.JLFunction<T, R> jlFunction;

        public ToMapOper(List list) {
            this.list = list;
        }

        public ToMapOper(List list, LambdaUtils.JLFunction jlFunction) {
            this.list = list;
            this.jlFunction = jlFunction;
        }

        /**
         * 重复覆盖
         */
        public JMap<R, T> cover() {
            Map<R, T> cover = new SetUtils.ListOper.ToMapOper<T, R>(list, jlFunction).cover();
            return new JHashMap<>(cover);
        }

        /**
         * 重复分组
         */
        public JMap<R, List<T>> group() {
            Map<R, List<T>> group = new SetUtils.ListOper.ToMapOper<T, R>(list, jlFunction).group();
            return new JHashMap<>(group);
        }
    }

    /**
     * list查询操作类
     *
     * @param <T>
     */
    class Filter<T> {
        private SetUtils.ListOper.Filter<T> filter;

        public Filter(List list) {
            filter = new SetUtils.ListOper.Filter<>(list);
        }

        /**
         * =（对象）
         *
         * @return
         */
        public Filter<T> eq(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
            filter.eq(jlFunction, value);
            return this;
        }

        /**
         * =（元素）
         *
         * @param value
         * @return
         */
        public Filter<T> eq(T value) {
            filter.eq(value);
            return this;
        }

        /**
         * <（对象）
         *
         * @return
         */
        public Filter<T> lt(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
            filter.lt(jlFunction, value);
            return this;
        }

        /**
         * <（元素）
         *
         * @param value
         * @return
         */
        public Filter<T> lt(T value) {
            filter.lt(value);
            return this;
        }

        /**
         * >（对象）
         *
         * @return
         */
        public Filter<T> gt(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
            filter.gt(jlFunction, value);
            return this;
        }

        /**
         * >（元素）
         *
         * @param value
         * @return
         */
        public Filter<T> gt(T value) {
            filter.gt(value);
            return this;
        }

        /**
         * <=（对象）
         *
         * @return
         */
        public Filter<T> le(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
            filter.le(jlFunction, value);
            return this;
        }

        /**
         * <=（元素）
         *
         * @param value
         * @return
         */
        public Filter<T> le(T value) {
            filter.le(value);
            return this;
        }

        /**
         * >=（对象）
         *
         * @return
         */
        public Filter<T> ge(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
            filter.ge(jlFunction, value);
            return this;
        }

        /**
         * >=（元素）
         *
         * @param value
         * @return
         */
        public Filter<T> ge(T value) {
            filter.ge(value);
            return this;
        }

        /**
         * !=（对象）
         *
         * @return
         */
        public Filter<T> ne(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
            filter.ne(jlFunction, value);
            return this;
        }

        /**
         * !=（元素）
         *
         * @param value
         * @return
         */
        public Filter<T> ne(T value) {
            filter.ne(value);
            return this;
        }

        /**
         * like（对象）
         *
         * @return
         */
        public Filter<T> like(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
            filter.like(jlFunction, value);
            return this;
        }

        /**
         * like（元素）
         *
         * @param value
         * @return
         */
        public Filter<T> like(T value) {
            filter.like(value);
            return this;
        }

        /**
         * like（对象）
         *
         * @return
         */
        public Filter<T> vlike(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
            filter.vlike(jlFunction, value);
            return this;
        }

        /**
         * like（元素）
         *
         * @param value
         * @return
         */
        public Filter<T> vlike(T value) {
            filter.vlike(value);
            return this;
        }

        /**
         * in（对象）
         *
         * @return
         */
        public <R> Filter<T> in(LambdaUtils.JLFunction<T, R> jlFunction, List<R> value) {
            filter.in(jlFunction, value);
            return this;
        }

        /**
         * in（元素）
         *
         * @param value
         * @return
         */
        public Filter<T> in(List<T> value) {
            filter.in(value);
            return this;
        }

        /**
         * notin（对象）
         *
         * @return
         */
        public <R> Filter<T> notIn(LambdaUtils.JLFunction<T, R> jlFunction, List<R> value) {
            filter.notIn(jlFunction, value);
            return this;
        }

        /**
         * notin（元素）
         *
         * @param value
         * @return
         */
        public Filter<T> notIn(List<T> value) {
            filter.notIn(value);
            return this;
        }

        /**
         * isNull（对象）
         *
         * @return
         */
        public <R> Filter<T> isNull(LambdaUtils.JLFunction<T, R> jlFunction) {
            filter.isNull(jlFunction);
            return this;
        }

        /**
         * isNotNull（对象）
         *
         * @return
         */
        public <R> Filter<T> isNotNull(LambdaUtils.JLFunction<T, R> jlFunction) {
            filter.isNotNull(jlFunction);
            return this;
        }

        /**
         * 获取list
         *
         * @return
         */
        public JList<T> list() {
            List<T> list = filter.list();
            return new JArrayList<>(list);
        }

        /**
         * 获取对象
         *
         * @return
         */
        public T object() {
            List<T> list = filter.list();
            if (list.size() > 0) {
                return list.get(0);
            }
            return null;
        }
    }
}
