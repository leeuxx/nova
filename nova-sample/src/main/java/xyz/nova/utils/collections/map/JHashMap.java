package xyz.nova.utils.collections.map;

import xyz.nova.utils.LambdaUtils2;
import xyz.nova.utils.SetUtils;
import xyz.nova.utils.collections.list.JArrayList;
import xyz.nova.utils.collections.list.JList;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

/**
 * HashMap
 */
public class JHashMap<K, V> extends HashMap<K, V> implements JMap<K, V>, Serializable {

    public JHashMap() {

    }

    public JHashMap(int initialCapacity) {
        super(initialCapacity);
    }

    public JHashMap(Map<K, V> map) {
        super(map);
    }

    @Override
    public JMap<K, V> set(K key, V value) {
        this.put(key, value);
        return this;
    }

    @Override
    public JMap<K, V> set(boolean condition, K key, V value) {
        if (condition) {
            this.put(key, value);
        }
        return this;
    }

    @Override
    public <T> JMap<K, V> set(LambdaUtils2.JLFunction<T, ?> function, V value) {
        set(getKey(function), value);
        return this;
    }

    @Override
    public <T> JMap<K, V> set(boolean condition, LambdaUtils2.JLFunction<T, ?> function, V value) {
        set(condition, getKey(function), value);
        return this;
    }

    @Override
    public V setIfAbsent(K key, V value) {
        return this.putIfAbsent(key, value);
    }

    @Override
    public <T> V setIfAbsent(LambdaUtils2.JLFunction<T, ?> function, V value) {
        return setIfAbsent(getKey(function), value);
    }

    @Override
    public JMap<K, V> setAll(Map<K, V> map) {
        this.putAll(map);
        return this;
    }

    @Override
    public JMap<K, V> setAll(boolean condition, Map<K, V> map) {
        if (condition) {
            this.putAll(map);
        }
        return this;
    }

    @Override
    public V del(K key) {
        return this.remove(key);
    }

    @Override
    public <T> V del(LambdaUtils2.JLFunction<T, ?> function) {
        return del(getKey(function));
    }

    @Override
    public String getString(K key) {
        return this.get(key) == null ? null : this.get(key).toString();
    }

    @Override
    public <T> String getString(LambdaUtils2.JLFunction<T, ?> function) {
        return this.get(getKey(function)) == null ? null : this.get(getKey(function)).toString();
    }

    @Override
    public Integer getInt(K key) {
        return this.get(key) == null ? null : Integer.parseInt(this.get(key).toString());
    }

    @Override
    public <T> Integer getInt(LambdaUtils2.JLFunction<T, ?> function) {
        return this.get(getKey(function)) == null ? null : Integer.parseInt(this.get(getKey(function)).toString());
    }

    @Override
    public Long getLong(K key) {
        return this.get(key) == null ? null : Long.parseLong(this.get(key).toString());
    }

    @Override
    public <T> Long getLong(LambdaUtils2.JLFunction<T, ?> function) {
        return this.get(getKey(function)) == null ? null : Long.parseLong(this.get(getKey(function)).toString());
    }

    @Override
    public Double getDouble(K key) {
        return this.get(key) == null ? null : Double.parseDouble(this.get(key).toString());
    }

    @Override
    public <T> Double getDouble(LambdaUtils2.JLFunction<T, ?> function) {
        return this.get(getKey(function)) == null ? null : Double.parseDouble(this.get(getKey(function)).toString());
    }

    @Override
    public BigDecimal getBigDecimal(K key) {
        return this.get(key) == null ? null : new BigDecimal(this.get(key).toString());
    }

    @Override
    public <T> BigDecimal getBigDecimal(LambdaUtils2.JLFunction<T, ?> function) {
        return this.get(getKey(function)) == null ? null : new BigDecimal(this.get(getKey(function)).toString());
    }

    @Override
    public Boolean getBoolean(K key) {
        return this.get(key) == null ? null : Boolean.parseBoolean(this.get(key).toString());
    }

    @Override
    public <T> Boolean getBoolean(LambdaUtils2.JLFunction<T, ?> function) {
        return this.get(getKey(function)) == null ? null : Boolean.parseBoolean(this.get(getKey(function)).toString());
    }

    @Override
    public LocalDateTime getLocalDateTime(K key) {
        return this.get(key) == null ? null : (LocalDateTime) this.get(key);
    }

    @Override
    public <T> LocalDateTime getLocalDateTime(LambdaUtils2.JLFunction<T, ?> function) {
        return this.get(getKey(function)) == null ? null : (LocalDateTime) this.get(getKey(function));
    }

    @Override
    public Timestamp getTimestamp(K key) {
        return this.get(key) == null ? null : (Timestamp) this.get(key);
    }

    @Override
    public <T> Timestamp getTimestamp(LambdaUtils2.JLFunction<T, ?> function) {
        return this.get(getKey(function)) == null ? null : (Timestamp) this.get(getKey(function));
    }

    @Override
    public V get(K key, Class<V> t) {
        V v = this.get(key);
        return v == null ? null : v;
    }

    @Override
    public <T> V get(LambdaUtils2.JLFunction<T, ?> function, Class<V> t) {
        V v = this.get(getKey(function));
        return v == null ? null : v;
    }

    @Override
    public JList<K> getKeys() {
        Set<K> keyNameSet = this.keySet();
        List<K> ks = new ArrayList<>(keyNameSet);
        return new JArrayList<>(ks);
    }

    @Override
    public JList<V> getValues() {
        Collection<V> keyValueCollection = this.values();
        List<V> vs = new ArrayList<>(keyValueCollection);
        return new JArrayList<>(vs);
    }

    @Override
    public ToList<K, V> toList() {
        return new ToList<>(this);
    }

    @Override
    public <T> T toBean(Class<T> t) {
        return SetUtils.map(this).toBean(t);
    }

    private <T> K getKey(LambdaUtils2.JLFunction<T, ?> function) {
        return (K) LambdaUtils2.getProperty(function);
    }
}
