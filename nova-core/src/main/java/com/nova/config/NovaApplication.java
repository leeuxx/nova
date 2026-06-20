package com.nova.config;

import com.baomidou.mybatisplus.annotation.TableId;
import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.config.Comment;
import com.nova.annotation.config.NovaScan;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.constant.NovaConst;
import lombok.Data;
import lombok.Getter;
import lombok.SneakyThrows;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;
import org.reflections.Reflections;
import org.reflections.scanners.SubTypesScanner;
import org.reflections.scanners.TypeAnnotationsScanner;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ImportBeanDefinitionRegistrar;
import org.springframework.core.type.AnnotationMetadata;
import org.springframework.util.ClassUtils;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

@Slf4j
public class NovaApplication implements ImportBeanDefinitionRegistrar {

    @Getter
    private static Class<?> primarySource;

    @Getter
    private static final Set<String> scanPackage = new HashSet<>();

    @Getter
    private static final Map<String, ScanNova> scanNovas = new LinkedHashMap<>();

    @SneakyThrows
    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
        Class<?> clazz = ClassUtils.forName(importingClassMetadata.getClassName(), ClassUtils.getDefaultClassLoader());
        Optional.ofNullable(clazz.getAnnotation(SpringBootApplication.class)).ifPresent(it -> primarySource = clazz);
        // 获取扫描的包名
        NovaScan novaScan = clazz.getAnnotation(NovaScan.class);
        if (novaScan.value().length == 0) {
            scanPackage.add(clazz.getPackage().getName());
        } else {
            Stream.of(novaScan.value()).filter(pack -> !pack.equals(NovaConst.BASE_PACKAGE)).forEach(scanPackage::add);
        }
        // 创建注解缓存
        Reflections reflections = new Reflections(scanPackage,
                new SubTypesScanner(false),    // 扫描子类型
                new TypeAnnotationsScanner()    // 扫描类型注解
        );
        // 获取所有带有 @Nova 注解的类
        Set<Class<?>> novaClasses = reflections.getTypesAnnotatedWith(Nova.class);
        String pkFieldName = null;
        for (Class<?> clz : novaClasses) {
            log.info("找到 @Nova 注解类: {}", clz.getName());
            Map<String, ScanNova.NovaFieldInfo> novaFields = new LinkedHashMap<>();
            Field[] fields = clz.getDeclaredFields();
            for (Field field : fields) {
                if (field.isAnnotationPresent(NovaField.class)) {
                    NovaField novaField = field.getDeclaredAnnotation(NovaField.class);
                    Edit.Type type = novaFieldAutoTypeChange(field.getType(), novaField.edit().type());
                    novaFields.put(field.getName(), new ScanNova.NovaFieldInfo()
                            .setType(type)
                            .setNovaField(novaField)
                    );
                }
                if (field.isAnnotationPresent(TableId.class)) {
                    pkFieldName = field.getName();
                }
            }
            Nova nova = clz.getDeclaredAnnotation(Nova.class);
            ScanNova scanNova = new ScanNova()
                    .setClz(clz)
                    .setPkFieldName(pkFieldName)
                    .setNova(nova)
                    .setNovaFields(novaFields)
                    .setDataProxyClass(nova.dataProxy());
            scanNovas.put(clz.getSimpleName(), scanNova);
        }
    }

    @Data
    @Accessors(chain = true)
    public static class ScanNova {

        @Comment("类")
        private Class<?> clz;

        @Comment("主键属性名")
        private String pkFieldName;

        @Comment("Nova注解")
        private Nova nova;

        @Comment("NovaField注解")
        private Map<String, NovaFieldInfo> novaFields;

        @Comment("数据代理类")
        private Class<? extends DataProxy<?>> dataProxyClass;

        @Data
        @Accessors(chain = true)
        public static class NovaFieldInfo {

            @Comment("组件类型（自动类型转换）")
            private Edit.Type type;

            @Comment("NovaField注解")
            private NovaField novaField;

        }
    }

    /**
     * novaField自动转换类型
     *
     * @param clz  属性类型
     * @param type 组件类型
     * @return 组件类型
     */
    private Edit.Type novaFieldAutoTypeChange(Class<?> clz, Edit.Type type) {
        if (type != Edit.Type.AUTO) {
            return type;
        }
        if (clz == Integer.class || clz == Long.class || clz == Double.class || clz == BigDecimal.class || clz == Float.class) {
            return Edit.Type.NUMBER;
        }
        if (clz == Boolean.class) {
            return Edit.Type.BOOLEAN;
        }
        if (clz == LocalDate.class || clz == LocalDateTime.class || clz == Date.class) {
            return Edit.Type.DATE;
        }
        return Edit.Type.INPUT;
    }
}
