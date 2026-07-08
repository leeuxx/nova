package com.nova.utils;

import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * bean工具
 */
@Slf4j
public class Beans {

    /**
     * 对象拷贝
     *
     * @param resultClass 返回对象class
     * @param dataEntity  数据对象
     * @param <T>
     * @return
     */
    @SneakyThrows
    public static <T> T copy(Class<T> resultClass, Object dataEntity) {
        return copy(resultClass.newInstance(), dataEntity);
    }

    /**
     * 对象拷贝
     *
     * @param resultEntity 返回对象
     * @param dataEntity   数据对象
     * @param <T>
     * @return
     */
    public static <T> T copy(T resultEntity, Object dataEntity) {
        List<Tuple.Tuple3<String, Object, Class<?>>> resultProperty = Reflect.PropertyReflect.getProperty(resultEntity);
        Map<String, Tuple.Tuple3<String, Object, Class<?>>> resultPropertyMap = resultProperty.stream().collect(Collectors.toMap(o -> o.getV1(), Function.identity(), (key1, key2) -> key2));
        return copyUtils(resultEntity, resultPropertyMap, dataEntity);
    }

    /**
     * 集合拷贝
     *
     * @param resultClass 返回集合泛型class
     * @param dataList    数据集合
     * @param <T>         泛型
     * @return
     */
    public static <T> List<T> copy(Class<T> resultClass, List<?> dataList) {
        if (!Emptys.check(dataList)) {
            return new ArrayList<>();
        }
        List<Tuple.Tuple3<String, Object, Class<?>>> resultProperty = Reflect.PropertyReflect.getProperty(resultClass);
        Map<String, Tuple.Tuple3<String, Object, Class<?>>> resultPropertyMap = resultProperty.stream().collect(Collectors.toMap(o -> o.getV1(), Function.identity(), (key1, key2) -> key2));
        List<T> result = new ArrayList<>(dataList.size());
        dataList.forEach(dataEntity -> {
            try {
                T resultEntity = copyUtils(resultClass.newInstance(), resultPropertyMap, dataEntity);
                result.add(resultEntity);
            } catch (Exception e) {
                log.error("{}", e);
            }
        });
        return result;
    }

    private static <T> T copyUtils(T resultEntity, Map<String, Tuple.Tuple3<String, Object, Class<?>>> resultPropertyMap, Object dataEntity) {
        if (dataEntity == null) {
            return resultEntity;
        }
        List<Tuple.Tuple3<String, Object, Class<?>>> dataProperty = Reflect.PropertyReflect.getProperty(dataEntity);
        Map<String, List<Tuple.Tuple3<String, Object, Class<?>>>> dataPropertyMap = dataProperty.stream().collect(Collectors.groupingBy(o -> o.getV1()));
        resultPropertyMap.forEach((resultName, tuple3) -> {
            List<Tuple.Tuple3<String, Object, Class<?>>> tuple3s = dataPropertyMap.get(resultName);
            if (!Emptys.check(tuple3s)) {
                return;
            }
            for (Tuple.Tuple3<String, Object, Class<?>> dataTuple3 : tuple3s) {
                if (dataTuple3 == null || !Emptys.check(dataTuple3.getV2())) {
                    continue;
                }
                Object value = dataTuple3.getV2();
                char[] cs = dataTuple3.getV1().toCharArray();
                cs[0] -= 32;
                Method method = Reflect.MethodReflect.getMethod(resultEntity.getClass(), "set" + String.valueOf(cs), tuple3.getV3());
                Object[] param = dataTuple3.getV3().equals(tuple3.getV3()) ? new Object[]{value} : Reflect.MethodReflect.checkParamType(method.getParameters(), new Object[]{value});
                try {
                    method.invoke(resultEntity, param);
                } catch (Exception e) {
                    log.error("{}", e);
                }
                return;
            }
        });
        return resultEntity;
    }

}
