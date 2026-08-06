package xyz.nova.utils;

import cn.hutool.json.JSONUtil;
import lombok.SneakyThrows;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 集合操作工具类
 */
public class SetUtils {

    /**
     * map操作
     */
    public static <K, V> MapOper<K, V> map(Map<K, V> map) {
        return new MapOper<>(map);
    }

    /**
     * list操作
     */
    public static <T> ListOper<T> list(List<T> list) {
        return new ListOper<>(list);
    }

    /**
     * 数组操作
     */
    public static <T> ArrayOper<T> array(T[] array) {
        return new ArrayOper<>(array);
    }

    /**
     * map操作类
     */
    public static class MapOper<K, V> {
        private Map<K, V> map;

        public MapOper(Map<K, V> map) {
            this.map = map;
        }

        /**
         * 转list
         */
        public ToList<K, V> toList() {
            return new ToList<>(map);
        }

        /**
         * 转实体
         */
        @SneakyThrows
        public <T> T toBean(Class<T> t) {
            return JSONUtil.parseObj(map).toBean(t);
        }

        /**
         * 转换list操作类
         */
        public static class ToList<K, V> {
            private Map<K, V> map;

            public ToList(Map<K, V> map) {
                this.map = map;
            }

            /**
             * key转换list
             */
            public List<K> key() {
                return new ArrayList<K>(map.keySet());
            }

            /**
             * value转换list
             */
            public List<V> value() {
                return new ArrayList<V>(map.values());
            }
        }
    }

    /**
     * list操作类
     */
    public static class ListOper<T> {
        private List<T> list;

        public ListOper(List list) {
            this.list = list;
        }

        /**
         * 转map（对象）
         */
        public <R> ToMapOper<T, R> toMap(LambdaUtils.JLFunction<T, R> jlFunction) {
            return new ToMapOper<>(list, jlFunction);
        }

        /**
         * 转map（元素）
         */
        public ToMapOper<T, T> toMap() {
            return new ToMapOper<>(list);
        }

        /**
         * 去重（对象）
         */
        public List<T> comparing(LambdaUtils.JLFunction<T, ?>... jlFunction) {
            return list.stream().collect(
                    Collectors.collectingAndThen(
                            Collectors.toCollection(() -> new TreeSet<>(
                                            Comparator.comparing(o -> {
                                                try {
                                                    StringJoiner stringJoiner = new StringJoiner(";");
                                                    for (LambdaUtils.JLFunction<T, ?> tjlFunction : jlFunction) {
                                                        String property = LambdaUtils.getProperty(tjlFunction);
                                                        Tuple.Tuple3<String, Object, Class<?>> tuple3 = Reflect.PropertyReflect.getProperty(o, property);
                                                        if (tuple3 == null) {
                                                            return null;
                                                        }
                                                        stringJoiner.add(tuple3.getV2().toString());
                                                    }
                                                    return stringJoiner.toString();
                                                } catch (Exception e) {
                                                }
                                                return null;
                                            })
                                    )
                            ), ArrayList::new)
            );
        }

        /**
         * 去重（元素）
         */
        public List<T> comparing() {
            return list.stream().distinct().collect(Collectors.toList());
        }

        /**
         * 正序（对象）
         */
        public List<T> asc(LambdaUtils.JLFunction<T, ?> jlFunction) {
            Collections.sort(list, Comparator.comparing((LambdaUtils.JLFunction) jlFunction));
            return new ArrayList<T>(list);
        }

        /**
         * 倒序（对象）
         */
        public List<T> desc(LambdaUtils.JLFunction<T, ?> jlFunction) {
            Collections.sort(list, Comparator.comparing((LambdaUtils.JLFunction) jlFunction).reversed());
            return new ArrayList<T>(list);
        }

        /**
         * 正序（元素）
         */
        public List<T> asc() {
            Collections.sort((List) list);
            return new ArrayList<T>(list);
        }

        /**
         * 倒序（元素）
         */
        public List<T> desc() {
            Collections.sort(list, Collections.reverseOrder());
            return new ArrayList<T>(list);
        }

        /**
         * 获取某个属性集合
         */
        public <R> List<R> getProperty(LambdaUtils.JLFunction<T, R> jlFunction) {
            return list.stream().map(jlFunction).collect(Collectors.toList());
        }

        /**
         * 洗牌
         */
        public List<T> shuffle() {
            Collections.shuffle(list);
            return new ArrayList<T>(list);
        }

        /**
         * 根据值获取下标 -1=不存在
         */
        public int getIndex(T t) {
            List<T> targetList = Arrays.asList(t);
            int index = Collections.indexOfSubList(list, targetList);
            return index;
        }

        /**
         * 差集 List中有的但是List2中没有
         */
        public List<T> diff(List<T> list2) {
            list.removeAll(list2);
            return new ArrayList<T>(list);
        }

        /**
         * 交集 List和List2中都有
         *
         * @param list2
         */
        public List<T> section(List<T> list2) {
            list.retainAll(list2);
            return new ArrayList<T>(list);
        }

        /**
         * 按指定长度分隔为N个集合
         *
         * @param size 长度
         * @return
         */
        public List<List<T>> partition(int size) {
            return null;
        }

        /**
         * 查询
         */
        public Filter<T> filter() {
            return new Filter<>(list);
        }

        /**
         * 转换map操作类
         */
        public static class ToMapOper<T, R> {
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
            public Map<R, T> cover() {
                if (jlFunction == null) {
                    return (Map<R, T>) list.stream().collect(Collectors.toMap(o -> o, Function.identity(), (key1, key2) -> key2));
                }
                String property = LambdaUtils.getProperty(jlFunction);
                return list.stream().collect(Collectors.toMap(o -> {
                    try {
                        Tuple.Tuple3<String, Object, Class<?>> tuple3 = Reflect.PropertyReflect.getProperty(o, property);
                        if (tuple3 == null) {
                            return null;
                        }
                        R value = (R) tuple3.getV2();
                        return value;
                    } catch (Exception e) {
                    }
                    return null;
                }, Function.identity(), (key1, key2) -> key2));
            }

            /**
             * 重复分组
             */
            public Map<R, List<T>> group() {
                if (jlFunction == null) {
                    return (Map<R, List<T>>) list.stream().collect(Collectors.groupingBy(o -> o));
                }
                String property = LambdaUtils.getProperty(jlFunction);
                return list.stream().collect(Collectors.groupingBy(o -> {
                    try {
                        Tuple.Tuple3<String, Object, Class<?>> tuple3 = Reflect.PropertyReflect.getProperty(o, property);
                        if (tuple3 == null) {
                            return null;
                        }
                        R value = (R) tuple3.getV2();
                        return value;
                    } catch (Exception e) {
                    }
                    return null;
                }));
            }
        }

        /**
         * list查询操作类
         *
         * @param <T>
         */
        public static class Filter<T> {
            private List<T> list;
            private final static String EQ = "=", LT = "<", GT = ">", LE = "<=", GE = ">=", NE = "!=", LIKE = "like", VLIKE = "vlike", IN = "in", NOT_IN = "notIn", IS_NULL = "isNull", IS_NOT_NULL = "isNotNull";

            public Filter(List list) {
                this.list = list;
            }

            /**
             * 对象执行
             *
             * @param jlFunction
             * @param propertyValue
             * @param oper
             */
            private void exec(LambdaUtils.JLFunction<T, ?> jlFunction, Object propertyValue, String oper) {
                String property = LambdaUtils.getProperty(jlFunction);
                list = list.stream().filter(ss -> {
                    try {
                        Tuple.Tuple3<String, Object, Class<?>> tuple3 = Reflect.PropertyReflect.getProperty(ss, property);
                        if (tuple3 != null) {
                            return propertyValue instanceof List ? inAdnNotInComArithmetic(tuple3.getV2(), (List) propertyValue, oper) : comArithmetic(tuple3.getV2(), propertyValue, oper);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    return false;
                }).collect(Collectors.toList());
            }

            /**
             * 元素执行
             *
             * @param value
             * @param oper
             */
            private void exec(Object value, String oper) {
                list = list.stream().filter(temp -> value instanceof List ? inAdnNotInComArithmetic(temp, (List) value, oper) : comArithmetic(temp, value, oper)).collect(Collectors.toList());
            }

            /**
             * =（对象）
             *
             * @return
             */
            public Filter<T> eq(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
                exec(jlFunction, value, EQ);
                return this;
            }

            /**
             * =（元素）
             *
             * @param value
             * @return
             */
            public Filter<T> eq(T value) {
                exec(value, EQ);
                return this;
            }

            /**
             * <（对象）
             *
             * @return
             */
            public Filter<T> lt(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
                exec(jlFunction, value, LT);
                return this;
            }

            /**
             * <（元素）
             *
             * @param value
             * @return
             */
            public Filter<T> lt(T value) {
                exec(value, LT);
                return this;
            }

            /**
             * >（对象）
             *
             * @return
             */
            public Filter<T> gt(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
                exec(jlFunction, value, GT);
                return this;
            }

            /**
             * >（元素）
             *
             * @param value
             * @return
             */
            public Filter<T> gt(T value) {
                exec(value, GT);
                return this;
            }

            /**
             * <=（对象）
             *
             * @return
             */
            public Filter<T> le(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
                exec(jlFunction, value, LE);
                return this;
            }

            /**
             * <=（元素）
             *
             * @param value
             * @return
             */
            public Filter<T> le(T value) {
                exec(value, LE);
                return this;
            }

            /**
             * >=（对象）
             *
             * @return
             */
            public Filter<T> ge(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
                exec(jlFunction, value, GE);
                return this;
            }

            /**
             * >=（元素）
             *
             * @param value
             * @return
             */
            public Filter<T> ge(T value) {
                exec(value, GE);
                return this;
            }

            /**
             * !=（对象）
             *
             * @return
             */
            public Filter<T> ne(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
                exec(jlFunction, value, NE);
                return this;
            }

            /**
             * !=（元素）
             *
             * @param value
             * @return
             */
            public Filter<T> ne(T value) {
                exec(value, NE);
                return this;
            }

            /**
             * like（对象）
             *
             * @return
             */
            public Filter<T> like(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
                exec(jlFunction, value, LIKE);
                return this;
            }

            /**
             * like（元素）
             *
             * @param value
             * @return
             */
            public Filter<T> like(T value) {
                exec(value, LIKE);
                return this;
            }

            /**
             * like（对象）
             *
             * @return
             */
            public Filter<T> vlike(LambdaUtils.JLFunction<T, ?> jlFunction, Object value) {
                exec(jlFunction, value, VLIKE);
                return this;
            }

            /**
             * like（元素）
             *
             * @param value
             * @return
             */
            public Filter<T> vlike(T value) {
                exec(value, VLIKE);
                return this;
            }

            /**
             * in（对象）
             *
             * @return
             */
            public <R> Filter<T> in(LambdaUtils.JLFunction<T, R> jlFunction, List<R> value) {
                exec(jlFunction, value, IN);
                return this;
            }

            /**
             * in（元素）
             *
             * @param value
             * @return
             */
            public Filter<T> in(List<T> value) {
                exec(value, IN);
                return this;
            }

            /**
             * notin（对象）
             *
             * @return
             */
            public <R> Filter<T> notIn(LambdaUtils.JLFunction<T, R> jlFunction, List<R> value) {
                exec(jlFunction, value, NOT_IN);
                return this;
            }

            /**
             * notin（元素）
             *
             * @param value
             * @return
             */
            public Filter<T> notIn(List<T> value) {
                exec(value, NOT_IN);
                return this;
            }

            /**
             * isNull（对象）
             *
             * @return
             */
            public <R> Filter<T> isNull(LambdaUtils.JLFunction<T, R> jlFunction) {
                exec(jlFunction, null, IS_NULL);
                return this;
            }

            /**
             * isNotNull（对象）
             *
             * @return
             */
            public <R> Filter<T> isNotNull(LambdaUtils.JLFunction<T, R> jlFunction) {
                exec(jlFunction, null, IS_NOT_NULL);
                return this;
            }

            /**
             * 获取list
             *
             * @return
             */
            public List<T> list() {
                return new ArrayList<T>(list);
            }

            /**
             * 获取对象
             *
             * @return
             */
            public T object() {
                if (list.size() > 0) {
                    return new ArrayList<T>(list).get(0);
                }
                return null;
            }

            /**
             * 获取map（对象）
             *
             * @return
             */
            public <R> ToMapOper<T, R> map(LambdaUtils.JLFunction<T, R> jlFunction) {
                return new ToMapOper<>(list, jlFunction);
            }

            /**
             * 转map（元素）
             */
            public ToMapOper<T, T> map() {
                return new ToMapOper<>(list);
            }

            private boolean inAdnNotInComArithmetic(Object value, List list, String comArithmetic) {
                boolean contains = list.contains(value);
                if (contains) {
                    return comArithmetic.equals(IN) ? true : false;
                } else {
                    return comArithmetic.equals(IN) ? false : true;
                }
            }

            private boolean comArithmetic(Object value, Object propertyValue, String comArithmetic) {
                if (value != null) {
                    if (comArithmetic.equals(IS_NULL)) {
                        return false;
                    }
                    if (comArithmetic.equals(IS_NOT_NULL)) {
                        return true;
                    }
                    if (value instanceof String) {
                        boolean fal = comArithmetic.equals(EQ) ? value.toString().equals(propertyValue.toString())
                                : comArithmetic.equals(LIKE) ? value.toString().indexOf(propertyValue.toString()) != -1
                                : comArithmetic.equals(VLIKE) ? propertyValue.toString().indexOf(value.toString()) != -1
                                : false;
                        if (!fal) {
                            try {
                                int values = Integer.parseInt(value.toString());
                                int propertyValues = Integer.parseInt(propertyValue.toString());
                                fal = comArithmetic.equals(LT) ? values < propertyValues
                                        : (comArithmetic.equals(GT)) ? values > propertyValues
                                        : (comArithmetic.equals(LE)) ? values <= propertyValues
                                        : (comArithmetic.equals(GE)) ? values >= propertyValues
                                        : (comArithmetic.equals(NE)) ? values != propertyValues
                                        : false;
                            } catch (Exception e) {
                            }
                        }
                        return fal;
                    } else if (value instanceof Integer) {
                        int values = Integer.parseInt(value.toString());
                        int propertyValues = Integer.parseInt(propertyValue.toString());
                        boolean fal = comArithmetic.equals(EQ) ? values == propertyValues
                                : (comArithmetic.equals(LT)) ? values < propertyValues
                                : (comArithmetic.equals(GT)) ? values > propertyValues
                                : (comArithmetic.equals(LE)) ? values <= propertyValues
                                : (comArithmetic.equals(GE)) ? values >= propertyValues
                                : (comArithmetic.equals(NE)) ? values != propertyValues
                                : false;
                        return fal;
                    } else if (value instanceof Long) {
                        long values = Long.valueOf(value.toString());
                        long propertyValues = Long.valueOf(propertyValue.toString());
                        boolean fal = comArithmetic.equals(EQ) ? values == propertyValues
                                : (comArithmetic.equals(LT)) ? values < propertyValues
                                : (comArithmetic.equals(GT)) ? values > propertyValues
                                : (comArithmetic.equals(LE)) ? values <= propertyValues
                                : (comArithmetic.equals(GE)) ? values >= propertyValues
                                : (comArithmetic.equals(NE)) ? values != propertyValues
                                : false;
                        return fal;
                    } else if (value instanceof Double) {
                        double values = Double.valueOf(value.toString());
                        double propertyValues = Double.valueOf(propertyValue.toString());
                        boolean fal = comArithmetic.equals(EQ) ? values == propertyValues
                                : (comArithmetic.equals(LT)) ? values < propertyValues
                                : (comArithmetic.equals(GT)) ? values > propertyValues
                                : (comArithmetic.equals(LE)) ? values <= propertyValues
                                : (comArithmetic.equals(GE)) ? values >= propertyValues
                                : (comArithmetic.equals(NE)) ? values != propertyValues
                                : false;
                        return fal;
                    } else if (value instanceof BigDecimal) {
                        BigDecimal values = new BigDecimal(value.toString());
                        BigDecimal propertyValues = new BigDecimal(propertyValue.toString());
                        boolean fal = comArithmetic.equals(EQ) ? values.compareTo(propertyValues) == 0
                                : (comArithmetic.equals(LT)) ? values.compareTo(propertyValues) == -1
                                : (comArithmetic.equals(GT)) ? values.compareTo(propertyValues) == 1
                                : (comArithmetic.equals(LE)) ? values.compareTo(propertyValues) < 1
                                : (comArithmetic.equals(GE)) ? values.compareTo(propertyValues) > -1
                                : (comArithmetic.equals(NE)) ? values.compareTo(propertyValues) != 0
                                : false;
                        return fal;
                    } else {
                        //其他统一当成对象处理
                        boolean fal = comArithmetic.equals(EQ) ? value.equals(propertyValue) ? true : false
                                : comArithmetic.equals(NE) ? !value.equals(propertyValue) ? true : false
                                : false;
                        return fal;
                    }
                } else {
                    return comArithmetic.equals(IS_NULL) ? true : false;
                }
            }
        }
    }

    /**
     * 数组操作类
     */
    public static class ArrayOper<T> {
        private T[] array;

        public ArrayOper(T[] array) {
            this.array = array;
        }

        /**
         * 转list
         */
        public List<T> toList() {
            List<T> list = new ArrayList<T>(array.length);
            Collections.addAll(list, array);
            return list;
        }
    }
}
