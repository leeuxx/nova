package xyz.nova.utils.collections.map;

import xyz.nova.utils.LambdaUtils2;
import xyz.nova.utils.SetUtils;
import xyz.nova.utils.collections.list.JArrayList;
import xyz.nova.utils.collections.list.JList;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * map接口
 * function并不区分key的数据类型，假设泛型K为Integer，实际入参为String，而function同样可以获取到值
 */
public interface JMap<K, V> extends Map<K, V> {

    /**
     * 覆盖写入
     */
    JMap<K, V> set(K key, V value);

    /**
     * 覆盖写入
     */
    JMap<K, V> set(boolean condition, K key, V value);

    /**
     * 覆盖写入
     */
    <T> JMap<K, V> set(LambdaUtils2.JLFunction<T, ?> function, V value);

    /**
     * 覆盖写入
     */
    <T> JMap<K, V> set(boolean condition, LambdaUtils2.JLFunction<T, ?> function, V value);

    /**
     * 不覆盖写入，key存在直接返回旧value，不存在则新增且返回null
     */
    V setIfAbsent(K key, V value);

    /**
     * 不覆盖写入，key存在直接返回旧value，不存在则新增且返回null
     */
    <T> V setIfAbsent(LambdaUtils2.JLFunction<T, ?> function, V value);

    /**
     * 写入全部
     *
     * @param map
     * @return
     */
    JMap<K, V> setAll(Map<K, V> map);

    /**
     * 写入全部
     *
     * @param map
     * @return
     */
    JMap<K, V> setAll(boolean condition, Map<K, V> map);

    /**
     * 删除并返回value
     */
    V del(K key);

    /**
     * 删除并返回value
     */
    <T> V del(LambdaUtils2.JLFunction<T, ?> function);

    String getString(K key);

    <T> String getString(LambdaUtils2.JLFunction<T, ?> function);

    Integer getInt(K key);

    <T> Integer getInt(LambdaUtils2.JLFunction<T, ?> function);

    Long getLong(K key);

    <T> Long getLong(LambdaUtils2.JLFunction<T, ?> function);

    Double getDouble(K key);

    <T> Double getDouble(LambdaUtils2.JLFunction<T, ?> function);

    BigDecimal getBigDecimal(K key);

    <T> BigDecimal getBigDecimal(LambdaUtils2.JLFunction<T, ?> function);

    Boolean getBoolean(K key);

    <T> Boolean getBoolean(LambdaUtils2.JLFunction<T, ?> function);

    LocalDateTime getLocalDateTime(K key);

    <T> LocalDateTime getLocalDateTime(LambdaUtils2.JLFunction<T, ?> function);

    Timestamp getTimestamp(K key);

    <T> Timestamp getTimestamp(LambdaUtils2.JLFunction<T, ?> function);

    V get(K key, Class<V> t);

    <T> V get(LambdaUtils2.JLFunction<T, ?> function, Class<V> t);

    /**
     * 获取所有key
     */
    JList<K> getKeys();

    /**
     * 获取所有value
     */
    JList<V> getValues();

    /**
     * 转list
     */
    ToList<K, V> toList();

    /**
     * 转实体
     */
    <T> T toBean(Class<T> t);

    /**
     * 转换list操作类
     */
    class ToList<K, V> {
        private Map<K, V> map;

        public ToList(Map<K, V> map) {
            this.map = map;
        }

        /**
         * key转换list
         */
        public JList<K> key() {
            List<K> key = SetUtils.map(map).toList().key();
            return new JArrayList<>(key);
        }

        /**
         * value转换list
         */
        public JList<V> value() {
            List<V> value = SetUtils.map(map).toList().value();
            return new JArrayList<>(value);
        }
    }
}
