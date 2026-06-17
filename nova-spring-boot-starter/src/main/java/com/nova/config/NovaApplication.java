package com.nova.config;

import com.nova.annotation.Comment;
import com.nova.annotation.Nova;
import com.nova.annotation.NovaField;
import com.nova.annotation.config.NovaScan;
import com.nova.constant.NovaConst;
import com.nova.utils.MixUtils;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
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
        String pkFieldName = "";
        for (Class<?> clz : novaClasses) {
            log.info("找到 @Nova 注解类: {}", clz.getName());
            Map<String, NovaField> novaFields = new LinkedHashMap<>();
            List<String> columnNames = new ArrayList<>();
            Field[] fields = clz.getDeclaredFields();
            for (Field field : fields) {
                if (field.isAnnotationPresent(NovaField.class)) {
                    NovaField novaField = field.getDeclaredAnnotation(NovaField.class);
                    novaFields.put(field.getName(), novaField);
                    columnNames.add(MixUtils.camelToSnake(field.getName()));
                }
                if (field.isAnnotationPresent(TableId.class)) {
                    pkFieldName = field.getName();
                }
            }
            Nova nova = clz.getDeclaredAnnotation(Nova.class);
            TableName tableName = clz.getAnnotation(TableName.class);
            ScanNova scanNova = new ScanNova()
                    .setClz(clz)
                    .setNova(nova)
                    .setNovaFields(novaFields)
                    .setSqlInfo(new ScanNova.SqlInfo()
                            .setTableName(tableName.value())
                            .setOrderBy(nova.orderBy())
                            .setPkFieldName(pkFieldName)
                            .setColumnNames(columnNames)
                    );
            scanNovas.put(clz.getSimpleName(), scanNova);
        }
    }

    @Data
    @Accessors(chain = true)
    public static class ScanNova {

        @Comment("类class")
        private Class<?> clz;

        @Comment("Nova注解")
        private Nova nova;

        @Comment("NovaField注解")
        private Map<String, NovaField> novaFields;

        @Comment("SQL构建信息")
        private SqlInfo sqlInfo;

        @Data
        @Accessors(chain = true)
        public static class SqlInfo {

            @Comment("表名")
            private String tableName;

            @Comment("排序表达式")
            private String orderBy;

            @Comment("主键字段名")
            private String pkFieldName;

            @Comment("字段名")
            private List<String> columnNames;

        }
    }
}
