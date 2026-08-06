package xyz.nova.utils;

import lombok.SneakyThrows;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.core.type.ClassMetadata;
import org.springframework.core.type.classreading.CachingMetadataReaderFactory;
import org.springframework.core.type.classreading.MetadataReader;
import org.springframework.core.type.classreading.MetadataReaderFactory;
import org.springframework.core.type.filter.AssignableTypeFilter;
import org.springframework.util.Assert;
import org.springframework.util.ClassUtils;

import java.lang.annotation.Annotation;
import java.lang.reflect.*;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 反射工具类
 */
public class Reflect {

    /**
     * class
     */
    public static class ClassReflect {

        /**
         * 获取类注解
         *
         * @param obj    类对象
         * @param aclass 注解class
         * @param <T>
         * @return
         */
        public static <T> T getAnnotate(Object obj, Class<T> aclass) {
            return getAnnotate(obj.getClass(), aclass);
        }

        /**
         * 获取类注解
         *
         * @param classz 类class
         * @param aclass 注解class
         * @param <T>
         * @return
         */
        public static <T> T getAnnotate(Class classz, Class<T> aclass) {
            if (classz.isAnnotationPresent(aclass)) {
                return (T) classz.getAnnotation(aclass);
            }
            List<Class<?>> superclass = getSuperclass(classz);
            if (Emptys.check(superclass)) {
                return getAnnotate(superclass, aclass);
            }
            return null;
        }

        /**
         * 判断是否是某个类的子类
         *
         * @param fatherClass 父class
         * @param sonObje     子类对象
         * @return
         */
        public static boolean isInstanceOf(Class<?> fatherClass, Object sonObje) {
            return isInstanceOf(fatherClass, sonObje.getClass());
        }

        /**
         * 判断是否是某个类的子类
         *
         * @param fatherClass 父class
         * @param sonClass    子类class
         * @return
         */
        public static boolean isInstanceOf(Class<?> fatherClass, Class<?> sonClass) {
            if (sonClass.isInterface()) {
                Class<?>[] interfaces = sonClass.getInterfaces();
                for (Class<?> anInterface : interfaces) {
                    if (anInterface.equals(fatherClass)) {
                        return true;
                    }
                }
            } else {
                try {
                    Assert.isInstanceOf(fatherClass, sonClass.newInstance());
                } catch (Exception e) {
                    return false;
                }
                return true;
            }
            return false;
        }

        /**
         * 子类获取实现接口
         *
         * @param obj
         * @return
         */
        public static List<Class<?>> getInterface(Object obj) {
            return getInterface(obj.getClass());
        }

        /**
         * 子类获取实现接口
         *
         * @param claszz
         * @return
         */
        public static List<Class<?>> getInterface(Class<?> claszz) {
            Class<?>[] interfaces = claszz.getInterfaces();
            return Arrays.asList(interfaces);
        }

        /**
         * 子类获取实现接口泛型
         *
         * @param obj 对象
         * @return
         */
        public static List<Tuple.Tuple2<Class<?>, List<Class<?>>>> getInterfacesGene(Object obj) {
            return getInterfacesGene(obj.getClass());
        }

        /**
         * 子类获取实现接口泛型
         *
         * @param claszz class
         * @return
         */
        public static List<Tuple.Tuple2<Class<?>, List<Class<?>>>> getInterfacesGene(Class<?> claszz) {
            List<Tuple.Tuple2<Class<?>, List<Class<?>>>> list = new ArrayList<>();
            Type[] types = claszz.getGenericInterfaces();
            for (Type type : types) {
                ParameterizedType parameterized = (ParameterizedType) type;
                Type[] actualTypeArguments = parameterized.getActualTypeArguments();
                List<Class<?>> gene = new ArrayList<>(actualTypeArguments.length);
                for (Type actualTypeArgument : actualTypeArguments) {
                    gene.add((Class<?>) actualTypeArgument);
                }
                list.add(new Tuple.Tuple2<>((Class<?>) ((ParameterizedType) type).getRawType(), gene));
            }
            return list;
        }

        /**
         * 子类获取实现接口泛型（指定实现类）
         *
         * @param obj            对象
         * @param interfaceClass 实现类class
         * @return
         */
        public static List<Class<?>> getInterfacesGene(Object obj, Class<?> interfaceClass) {
            return getInterfacesGene(obj.getClass(), interfaceClass);
        }

        /**
         * 子类获取实现接口泛型（指定实现类）
         *
         * @param claszz         class
         * @param interfaceClass 实现类class
         * @return
         */
        public static List<Class<?>> getInterfacesGene(Class<?> claszz, Class<?> interfaceClass) {
            List<Class<?>> list = new ArrayList<>();
            Type[] types = claszz.getGenericInterfaces();
            for (Type type : types) {
                Class<?> interfaceClasss = (Class<?>) ((ParameterizedType) type).getRawType();
                if (!interfaceClasss.equals(interfaceClass)) {
                    continue;
                }
                ParameterizedType parameterized = (ParameterizedType) type;
                Type[] actualTypeArguments = parameterized.getActualTypeArguments();
                for (Type actualTypeArgument : actualTypeArguments) {
                    list.add((Class<?>) actualTypeArgument);
                }
            }
            return list;
        }

        /**
         * 子类获取继承类
         *
         * @return
         */
        public static List<Class<?>> getSuperclass(Object obj) {
            return getSuperclass(obj.getClass());
        }

        /**
         * 子类获取继承类
         *
         * @return
         */
        public static List<Class<?>> getSuperclass(Class<?> claszz) {
            List<Class<?>> list = new ArrayList<>();
            if (claszz.isInterface()) {
                Class<?>[] interfaces = claszz.getInterfaces();
                for (Class<?> anInterface : interfaces) {
                    list.add(anInterface);
                }
            } else {
                Class<?> superclass = claszz.getSuperclass();
                if (!superclass.equals(Object.class)) {
                    list.add(superclass);
                }
            }
            return list;
        }

        /**
         * 子类获取继承类泛型
         *
         * @param obj 对象
         * @return
         */
        public static List<Class<?>> getSuperGene(Object obj) {
            return getSuperGene(obj.getClass());
        }

        /**
         * 子类获取继承类泛型
         *
         * @param claszz class
         * @return
         */
        public static List<Class<?>> getSuperGene(Class<?> claszz) {
            List<Class<?>> list = new ArrayList<>();
            Type[] actualTypeArguments = ((ParameterizedType) claszz.getGenericSuperclass()).getActualTypeArguments();
            for (Type actualTypeArgument : actualTypeArguments) {
                list.add((Class<?>) actualTypeArgument);
            }
            return list;
        }

        /**
         * 父类获取继承类 || 父接口获取实现类
         *
         * @param packages 包名
         * @param clas     父类/接口 集合
         * @return
         */
        @SneakyThrows
        public static List<Class<?>> getProxyClass(String packages, Class<?>... clas) {
            List<Class<?>> list = new ArrayList<>();
            if (clas == null || clas.length == 0) {
                return list;
            }
            ClassPathScanningCandidateComponentProvider provider = new ClassPathScanningCandidateComponentProvider(false);
            Map<String, Class<?>> map = new HashMap<>(clas.length);
            for (Class<?> cla : clas) {
                provider.addIncludeFilter(new AssignableTypeFilter(cla));
                map.put(cla.getName(), cla);
            }
            Set<BeanDefinition> components = provider.findCandidateComponents(packages);
            for (BeanDefinition component : components) {
                Class cls = Class.forName(component.getBeanClassName());
                if (map.containsKey(cls.getName())) {
                    continue;
                }
                list.add(cls);
            }
            return list;
        }

        /**
         * 获取指定包下类/接口
         */
        private static List<Class<?>> getPackageClass(String packagePath, int type) {
            List<Class<?>> classList = new ArrayList<>();
            Tuple.Tuple2<Resource[], MetadataReaderFactory> resourceAndMetadataReaderFactory = getResourceAndMetadataReaderFactory(packagePath);
            Resource[] resources = resourceAndMetadataReaderFactory.getV1();
            MetadataReaderFactory readerfactory = resourceAndMetadataReaderFactory.getV2();
            for (Resource resource : resources) {
                try {
                    MetadataReader reader = readerfactory.getMetadataReader(resource);
                    ClassMetadata classMetadata = reader.getClassMetadata();
                    if ((type == 1 && !classMetadata.isInterface()) || (type == 2 && classMetadata.isInterface())) {
                        continue;
                    }
                    Class<?> clazz = Class.forName(classMetadata.getClassName());
                    classList.add(clazz);
                } catch (Exception e) {

                }
            }
            return classList;
        }

        /**
         * 获取指定包下接口
         */
        public static List<Class<?>> getPackageClassByInterface(String packagePath) {
            return getPackageClass(packagePath, 1);
        }

        /**
         * 获取指定包下类
         */
        public static List<Class<?>> getPackageClassByClass(String packagePath) {
            return getPackageClass(packagePath, 2);
        }

        /**
         * 获取指定包下类/接口
         */
        public static List<Class<?>> getPackageClass(String packagePath) {
            return getPackageClass(packagePath, 3);
        }

        /**
         * 获取指定包下类/接口（被注解）
         */
        private static <T> List<Tuple.Tuple2<Class<?>, T>> getPackageClass(String packagePath, Class<T> tClass, int type) {
            List<Tuple.Tuple2<Class<?>, T>> list = new ArrayList<>();
            Tuple.Tuple2<Resource[], MetadataReaderFactory> resourceAndMetadataReaderFactory = getResourceAndMetadataReaderFactory(packagePath);
            Resource[] resources = resourceAndMetadataReaderFactory.getV1();
            MetadataReaderFactory readerfactory = resourceAndMetadataReaderFactory.getV2();
            for (Resource resource : resources) {
                try {
                    MetadataReader reader = readerfactory.getMetadataReader(resource);
                    ClassMetadata classMetadata = reader.getClassMetadata();
                    if ((type == 1 && !classMetadata.isInterface()) || (type == 2 && classMetadata.isInterface())) {
                        continue;
                    }
                    Class<?> clazz = Class.forName(classMetadata.getClassName());
                    if (clazz.isAnnotationPresent((Class<? extends Annotation>) tClass)) {
                        T annotation = (T) clazz.getAnnotation((Class<? extends Annotation>) tClass);
                        Tuple.Tuple2<Class<?>, T> tuple2 = new Tuple.Tuple2<>(clazz, annotation);
                        list.add(tuple2);
                    }
                } catch (Exception e) {

                }
            }
            return list;
        }

        /**
         * 获取指定包下接口（被注解）
         */
        public static <T> List<Tuple.Tuple2<Class<?>, T>> getPackageClassByInterface(String packagePath, Class<T> tClass) {
            return getPackageClass(packagePath, tClass, 1);
        }

        /**
         * 获取指定包下类（被注解）
         */
        public static <T> List<Tuple.Tuple2<Class<?>, T>> getPackageClassByClass(String packagePath, Class<T> tClass) {
            return getPackageClass(packagePath, tClass, 2);
        }

        /**
         * 获取指定包下类接口（被注解）
         */
        public static <T> List<Tuple.Tuple2<Class<?>, T>> getPackageClass(String packagePath, Class<T> tClass) {
            return getPackageClass(packagePath, tClass, 3);
        }

        @SneakyThrows
        private static Tuple.Tuple2<Resource[], MetadataReaderFactory> getResourceAndMetadataReaderFactory(String packagePath) {
            ResourcePatternResolver resourcePatternResolver = new PathMatchingResourcePatternResolver();
            String pattern = ResourcePatternResolver.CLASSPATH_ALL_URL_PREFIX +
                    ClassUtils.convertClassNameToResourcePath(packagePath) + "/**/*.class";
            Resource[] resources = resourcePatternResolver.getResources(pattern);
            MetadataReaderFactory readerfactory = new CachingMetadataReaderFactory(resourcePatternResolver);
            Tuple.Tuple2<Resource[], MetadataReaderFactory> tuple2 = new Tuple.Tuple2<>(resources, readerfactory);
            return tuple2;
        }
    }

    /**
     * 方法
     */
    public static class MethodReflect {
        /**
         * 执行方法
         *
         * @param clazz      class
         * @param methodName 方法名
         * @param args       参数
         * @return
         */
        @SneakyThrows
        public static Object getMethodValue(Class<?> clazz, String methodName, Object... args) {
            return getMethodValue(clazz.newInstance(), methodName, args);
        }

        /**
         * 执行方法
         *
         * @param obj        对象
         * @param methodName 方法名
         * @param args       参数
         * @return
         */
        @SneakyThrows
        public static Object getMethodValue(Object obj, String methodName, Object... args) {
            Method[] methods = obj.getClass().getMethods();
            for (Method method : methods) {
                if (!method.getName().equals(methodName)) {
                    continue;
                }
                return method.invoke(obj, args);
            }
            return null;
        }

        /**
         * 获取方法
         *
         * @param clazz 类class
         * @return
         */
        public static List<Method> getMethod(Class<?> clazz) {
            return Arrays.stream(clazz.getMethods()).collect(Collectors.toList());
        }

        /**
         * 获取方法
         *
         * @param clazz      类class
         * @param methodName 方法名
         * @return
         */
        @SneakyThrows
        public static Method getMethod(Class<?> clazz, String methodName, Class<?>... args) {
            Method method = clazz.getMethod(methodName, args);
            return method;
        }

        /**
         * 获取方法（被注解）
         *
         * @param clazz           类class
         * @param annotationClass 注解class
         * @return
         */
        public static <T> List<Tuple.Tuple2<Method, T>> getMethod(Class<?> clazz, Class<T> annotationClass) {
            List<Tuple.Tuple2<Method, T>> list = new ArrayList<>();
            try {
                //spring获取到有继承的bean有$$分隔符，去掉花里胡哨的继承
                String name = clazz.getName();
                name = name.indexOf("$$") != -1 ? name.substring(0, name.indexOf("$$")) : name;
                clazz = Class.forName(name);
                Method[] methods = clazz.getMethods();
                for (Method method : methods) {
                    if (method.isAnnotationPresent((Class<? extends Annotation>) annotationClass)) {
                        T annotation = (T) method.getAnnotation((Class<? extends Annotation>) annotationClass);
                        list.add(new Tuple.Tuple2<>(method, annotation));
                    }
                }
            } catch (Exception e) {

            }
            return list;
        }

        /**
         * 获取方法参数
         *
         * @param method
         * @return
         */
        public static List<Tuple.Tuple2<String, Class<?>>> getMethodParams(Method method) {
            List<Tuple.Tuple2<String, Class<?>>> list = new ArrayList<>();
            Parameter[] params = method.getParameters();
            for (Parameter param : params) {
                Tuple.Tuple2<String, Class<?>> tuple2 = new Tuple.Tuple2<>(param.getName(), param.getType());
                list.add(tuple2);
            }
            return list;
        }

        /**
         * 获取方法参数（被注解）
         *
         * @param method          方法对象
         * @param annotationClass 注解class
         * @return
         */
        public static <T> List<Tuple.Tuple3<String, Class<?>, T>> getMethodParams(Method method, Class<T> annotationClass) {
            List<Tuple.Tuple3<String, Class<?>, T>> list = new ArrayList<>();
            Parameter[] parameters = method.getParameters();
            for (Parameter parameter : parameters) {
                T annotation = (T) parameter.getAnnotation((Class<? extends Annotation>) annotationClass);
                if (annotation == null) {
                    continue;
                }
                Tuple.Tuple3<String, Class<?>, T> tuple3 = new Tuple.Tuple3<>(parameter.getName(), parameter.getType(), annotation);
                list.add(tuple3);
            }
            return list;
        }

        /**
         * 执行参数处理
         *
         * @return
         */
        public static Object[] checkParamType(Parameter[] params, Object[] value) {
            Object[] param = new Object[params.length];
            for (int i = 0; i < params.length; i++) {
                Class<?> type = params[i].getType();
                Object o;
                try {
                    o = value[i];
                } catch (Exception e) {
                    o = null;
                }
                param[i] = o == null ? null
                        : type.equals(String.class) ? (o instanceof LocalDateTime ? DataTime.toString((LocalDateTime) o) : o.toString())
                        : type.equals(Integer.class) ? Integer.parseInt(o.toString())
                        : type.equals(Boolean.class) ? Boolean.parseBoolean(o.toString())
                        : type.equals(BigDecimal.class) ? new BigDecimal(o.toString())
                        : type.equals(LocalDateTime.class) ? DataTime.toLocal(o.toString())
                        : type.equals(Long.class) ? Long.parseLong(o.toString())
                        : type.equals(Double.class) ? Double.parseDouble(o.toString())
                        : type.equals(Float.class) ? Float.parseFloat(o.toString())
                        : type.equals(Short.class) ? Short.parseShort(o.toString())
                        : o;
            }
            return param;
        }
    }

    /**
     * 属性
     */
    public static class PropertyReflect {

        /**
         * 获取属性集合
         *
         * @param c class
         * @return
         */
        @SneakyThrows
        public static List<Tuple.Tuple3<String, Object, Class<?>>> getProperty(Class<?> c) {
            List<Tuple.Tuple3<String, Object, Class<?>>> list = getProperty(c.newInstance());
            return list;
        }

        /**
         * 获取属性集合
         *
         * @param o 对象
         * @return
         */
        @SneakyThrows
        public static List<Tuple.Tuple3<String, Object, Class<?>>> getProperty(Object o) {
            List<Tuple.Tuple3<String, Object, Class<?>>> list = new ArrayList<>();
            Field[] fields = o.getClass().getDeclaredFields();
            for (Field field : fields) {
                field.setAccessible(true);
                String name = field.getName();
                if (Modifier.isStatic(field.getModifiers()) || Modifier.isFinal(field.getModifiers())) {
                    continue;
                }
                Object value = field.get(o);
                Class<?> type = field.getType();
                list.add(new Tuple.Tuple3<>(name, value, type));
            }
            List<Class<?>> superclass = ClassReflect.getSuperclass(o);
            if (Emptys.check(superclass)) {
                List<Tuple.Tuple3<String, Object, Class<?>>> superProperty = getSuperProperty(superclass.get(0), o);
                list.addAll(superProperty);
            }
            return list;
        }

        /**
         * 获取属性集合（被注解）
         *
         * @param c      类class
         * @param tClass 注解class
         * @param <T>
         * @return
         */
        @SneakyThrows
        public static <T> List<Tuple.Tuple4<String, Object, Class<?>, T>> getProperty(Class<?> c, Class<T> tClass) {
            List<Tuple.Tuple4<String, Object, Class<?>, T>> list = getProperty(c.newInstance(), tClass);
            return list;
        }

        /**
         * 获取属性集合（被注解）
         *
         * @param o               对象
         * @param annotationClass 注解class
         * @param <T>
         * @return
         */
        @SneakyThrows
        public static <T> List<Tuple.Tuple4<String, Object, Class<?>, T>> getProperty(Object o, Class<T> annotationClass) {
            List<Tuple.Tuple4<String, Object, Class<?>, T>> list = new ArrayList<>();
            Field[] fields = o.getClass().getDeclaredFields();
            for (Field field : fields) {
                if (!field.isAnnotationPresent((Class<? extends Annotation>) annotationClass)) {
                    continue;
                }
                T annotation = (T) field.getAnnotation((Class<? extends Annotation>) annotationClass);
                field.setAccessible(true);
                String name = field.getName();
                if (Modifier.isStatic(field.getModifiers()) || Modifier.isFinal(field.getModifiers())) {
                    continue;
                }
                Object value = field.get(o);
                Class<?> type = field.getType();
                list.add(new Tuple.Tuple4<>(name, value, type, annotation));
            }
            List<Class<?>> superclass = ClassReflect.getSuperclass(o);
            if (Emptys.check(superclass)) {
                List<Tuple.Tuple4<String, Object, Class<?>, T>> superProperty = getSuperProperty(superclass.get(0), o, annotationClass);
                list.addAll(superProperty);
            }
            return list;
        }

        /**
         * 获取特定属性
         *
         * @param c        类class
         * @param property 属性名
         * @return
         */
        @SneakyThrows
        public static Tuple.Tuple3<String, Object, Class<?>> getProperty(Class<?> c, String property) {
            Tuple.Tuple3<String, Object, Class<?>> tuple3 = getProperty(c.newInstance(), property);
            return tuple3;
        }

        /**
         * 获取特定属性
         *
         * @param o        对象
         * @param property 属性名
         * @return
         */
        public static Tuple.Tuple3<String, Object, Class<?>> getProperty(Object o, String property) {
            Tuple.Tuple3<String, Object, Class<?>> tuple3 = new Tuple.Tuple3<>(null, null, null);
            try {
                Field field = o.getClass().getDeclaredField(property);
                field.setAccessible(true);
                String name = field.getName();
                Object value = field.get(o);
                Class<?> type = field.getType();
                tuple3 = new Tuple.Tuple3<>(name, value, type);
            } catch (Exception e) {
                List<Class<?>> superclass = ClassReflect.getSuperclass(o);
                if (Emptys.check(superclass)) {
                    Tuple.Tuple3<String, Object, Class<?>> superProperty = getSuperProperty(superclass.get(0), o, property);
                    return superProperty;
                }
            }
            return tuple3;
        }

        /**
         * 获取属性泛型
         */
        public static List<Class<?>> getPropertyGene(Class<?> claszz, String property) {
            List<Class<?>> list = new ArrayList<>();
            try {
                Field field = claszz.getDeclaredField(property);
                field.setAccessible(true);
                Type[] actualTypeArguments = ((ParameterizedType) field.getGenericType()).getActualTypeArguments();
                for (Type actualTypeArgument : actualTypeArguments) {
                    list.add((Class<?>) actualTypeArgument);
                }
            } catch (Exception e) {
                List<Class<?>> superclass = ClassReflect.getSuperclass(claszz);
                if (Emptys.check(superclass)) {
                    List<Class<?>> propertyGene = getPropertyGene(superclass.get(0), property);
                    return propertyGene;
                }
            }
            return list;
        }

        /**
         * 设置属性值
         *
         * @param o
         * @param property
         * @param value
         */
        public static void setPropertyValue(Object o, String property, Object value) {
            class Handle {
                public boolean setPropertyValue(Object o, String property, Object value, Object jo) {
                    try {
                        Field field = o.getClass().getDeclaredField(property);
                        field.setAccessible(true);
                        field.set(o, value instanceof Timestamp ? ((Timestamp) value).toLocalDateTime() : value);
                        Beans.copy(jo, o);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
            }
            boolean b1 = new Handle().setPropertyValue(o, property, value, o);
            if (!b1) {
                try {
                    Object po = Beans.copy(ClassReflect.getSuperclass(o).get(0).newInstance(), o);
                    while (true) {
                        boolean b = new Handle().setPropertyValue(po, property, value, o);
                        if (b || !Emptys.check(ClassReflect.getSuperclass(po))) {
                            break;
                        }
                        po = Beans.copy(ClassReflect.getSuperclass(po).get(0).newInstance(), o);
                    }
                } catch (Exception e1) {
                    e1.printStackTrace();
                }
            }
        }

        /*-------------------------------*/

        /**
         * 获取父类属性
         */
        @SneakyThrows
        private static List<Tuple.Tuple3<String, Object, Class<?>>> getSuperProperty(Class<?> p, Object s) {
            List<Tuple.Tuple3<String, Object, Class<?>>> list = new ArrayList<>();
            Field[] fields = p.getDeclaredFields();
            for (Field field : fields) {
                field.setAccessible(true);
                String name = field.getName();
                if (Modifier.isStatic(field.getModifiers()) || Modifier.isFinal(field.getModifiers())) {
                    continue;
                }
                Object value = field.get(s);
                Class<?> type = field.getType();
                list.add(new Tuple.Tuple3<>(name, value, type));
            }
            List<Class<?>> superclass = ClassReflect.getSuperclass(p);
            if (Emptys.check(superclass)) {
                List<Tuple.Tuple3<String, Object, Class<?>>> superProperty = getSuperProperty(superclass.get(0), s);
                list.addAll(superProperty);
            }
            return list;
        }

        /**
         * 获取父类属性（被注解）
         */
        @SneakyThrows
        private static <T> List<Tuple.Tuple4<String, Object, Class<?>, T>> getSuperProperty(Class<?> p, Object s, Class<T> annotationClass) {
            List<Tuple.Tuple4<String, Object, Class<?>, T>> list = new ArrayList<>();
            Field[] fields = p.getDeclaredFields();
            for (Field field : fields) {
                if (!field.isAnnotationPresent((Class<? extends Annotation>) annotationClass)) {
                    continue;
                }
                T annotation = (T) field.getAnnotation((Class<? extends Annotation>) annotationClass);
                field.setAccessible(true);
                String name = field.getName();
                if (Modifier.isStatic(field.getModifiers()) || Modifier.isFinal(field.getModifiers())) {
                    continue;
                }
                Object value = field.get(s);
                Class<?> type = field.getType();
                list.add(new Tuple.Tuple4<>(name, value, type, annotation));
            }
            List<Class<?>> superclass = ClassReflect.getSuperclass(p);
            if (Emptys.check(superclass)) {
                List<Tuple.Tuple4<String, Object, Class<?>, T>> superProperty = getSuperProperty(superclass.get(0), s, annotationClass);
                list.addAll(superProperty);
            }
            return list;
        }

        /**
         * 获取父类属性（单个）
         */
        private static Tuple.Tuple3<String, Object, Class<?>> getSuperProperty(Class<?> p, Object s, String property) {
            Tuple.Tuple3<String, Object, Class<?>> tuple3 = new Tuple.Tuple3<>(null, null, null);
            try {
                Field field = p.getDeclaredField(property);
                field.setAccessible(true);
                String name = field.getName();
                Object value = field.get(s);
                Class<?> type = field.getType();
                tuple3 = new Tuple.Tuple3<>(name, value, type);
            } catch (Exception e) {
                List<Class<?>> superclass = ClassReflect.getSuperclass(p);
                if (Emptys.check(superclass)) {
                    Tuple.Tuple3<String, Object, Class<?>> superPropertyOne = getSuperProperty(superclass.get(0), s, property);
                    return superPropertyOne;
                }
            }
            return tuple3;
        }
    }

}
