package xyz.nova.utils.collections.list;

import xyz.nova.utils.collections.map.JHashMap;
import xyz.nova.utils.collections.map.JMap;
import lombok.SneakyThrows;
import xyz.nova.utils.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * arrayList
 *
 * @param <T>
 */
public class JArrayList<T> extends ArrayList<T> implements JList<T> {

    public JArrayList() {
    }

    public JArrayList(int initialCapacity) {
        super(initialCapacity);
    }

    public JArrayList(List<T> list) {
        super(list);
    }

    @Override
    public JList<T> set(T t) {
        this.add(t);
        return this;
    }

    @Override
    public JList<T> set(boolean condition, T t) {
        if (condition) {
            this.add(t);
        }
        return this;
    }

    @Override
    public JList<T> setAll(List<T> list) {
        this.addAll(list);
        return this;
    }

    @Override
    public JList<T> setAll(boolean condition, List<T> list) {
        if (condition) {
            this.addAll(list);
        }
        return this;
    }

    @Override
    public <R> ToMapOper<T, R> toMap(LambdaUtils.JLFunction<T, R> jlFunction) {
        return new ToMapOper<>(this, jlFunction);
    }

    @Override
    public ToMapOper<T, T> toMap() {
        return new ToMapOper<>(this);
    }

    @Override
    public JList<T> comparing(LambdaUtils.JLFunction<T, ?>... jlFunction) {
        List<T> comparing = SetUtils.list(this).comparing(jlFunction);
        return new JArrayList<T>(comparing);
    }

    @Override
    public JList<T> comparing() {
        List<T> comparing = SetUtils.list(this).comparing();
        return new JArrayList<>(comparing);
    }

    @Override
    public JList<T> asc(LambdaUtils.JLFunction<T, ?> jlFunction) {
        List<T> asc = SetUtils.list(this).asc(jlFunction);
        return new JArrayList<>(asc);
    }

    @Override
    public JList<T> asc() {
        List<T> asc = SetUtils.list(this).asc();
        return new JArrayList<T>(asc);
    }

    @Override
    public JList<T> desc(LambdaUtils.JLFunction<T, ?> jlFunction) {
        List<T> desc = SetUtils.list(this).desc(jlFunction);
        return new JArrayList<>(desc);
    }

    @Override
    public JList<T> desc() {
        List<T> desc = SetUtils.list(this).desc();
        return new JArrayList<>(desc);
    }

    @Override
    public <R> JList<R> getProperty(LambdaUtils.JLFunction<T, R> jlFunction) {
        List<R> property = SetUtils.list(this).getProperty(jlFunction);
        return new JArrayList<>(property);
    }

    @Override
    public JList<T> shuffle() {
        List<T> shuffle = SetUtils.list(this).shuffle();
        return new JArrayList<>(shuffle);
    }

    @Override
    public int getIndex(T t) {
        return SetUtils.list(this).getIndex(t);
    }

    @Override
    public JList<T> diff(List<T> list2) {
        List<T> diff = SetUtils.list(this).diff(list2);
        return new JArrayList<>(diff);
    }

    @Override
    public JList<T> section(List<T> list2) {
        List<T> section = SetUtils.list(this).section(list2);
        return new JArrayList<>(section);
    }

    @Override
    public JList<JList<T>> partition(int size) {
        List<List<T>> partition = SetUtils.list(this).partition(size);
        JList<JList<T>> jList = new JArrayList<>();
        for (List<T> list : partition) {
            jList.add(new JArrayList<>(list));
        }
        return jList;
    }

    @Override
    public T forAdd(LambdaUtils.JLFunction<T, ?> addFunction, LambdaUtils.JLFunction<T, ?>... addFunctions) {
        return forAdd(null, addFunction, addFunctions);
    }

    @Override
    @SneakyThrows
    public T forAdd(FunctionUtils.ParamsNoResult<T> fors, LambdaUtils.JLFunction<T, ?> addFunction, LambdaUtils.JLFunction<T, ?>... addFunctions) {
        if (this.size() == 0) {
            return null;
        }
        JMap<String, BigDecimal> propertys = new JHashMap<String, BigDecimal>()
                .set(LambdaUtils.getProperty(addFunction), new BigDecimal(0));
        if (addFunctions != null && addFunctions.length > 0) {
            for (LambdaUtils.JLFunction<T, ?> function : addFunctions) {
                propertys.set(LambdaUtils.getProperty(function), new BigDecimal(0));
            }
        }
        this.forEach(t -> {
            List<Tuple.Tuple3<String, Object, Class<?>>> propertyList = Reflect.PropertyReflect.getProperty(t);
            Map<String, Tuple.Tuple3<String, Object, Class<?>>> propertyMaps = propertyList.stream().collect(Collectors.toMap(o -> o.getV1(), Function.identity(), (key1, key2) -> key2));
            propertys.forEach((property, bigDecimal) -> {
                Tuple.Tuple3<String, Object, Class<?>> tuple3 = propertyMaps.get(property);
                Object value = tuple3.getV2();
                if (value == null) {
                    return;
                }
                if (tuple3.getV3() == BigDecimal.class) {
                    propertys.put(property, bigDecimal.add((BigDecimal) value));
                } else {
                    propertys.put(property, bigDecimal.add(new BigDecimal(value.toString())));
                }
            });
            if (fors == null) {
                return;
            }
            fors.run(t);
        });
        T result = (T) this.get(0).getClass().newInstance();
        propertys.forEach((property, bigDecimal) -> {
            Tuple.Tuple3<String, Object, Class<?>> tuple3 = Reflect.PropertyReflect.getProperty(result, property);
            if (tuple3.getV3() == BigDecimal.class) {
                Reflect.PropertyReflect.setPropertyValue(result, property, bigDecimal);
            } else if (tuple3.getV3() == Integer.class) {
                Reflect.PropertyReflect.setPropertyValue(result, property, bigDecimal.intValue());
            } else if (tuple3.getV3() == Long.class) {
                Reflect.PropertyReflect.setPropertyValue(result, property, bigDecimal.longValue());
            } else if (tuple3.getV3() == Double.class) {
                Reflect.PropertyReflect.setPropertyValue(result, property, bigDecimal.doubleValue());
            }
        });
        return result;
    }

    @Override
    public Filter<T> filter() {
        return new Filter<>(this);
    }

}
