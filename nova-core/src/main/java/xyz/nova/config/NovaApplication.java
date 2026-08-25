package xyz.nova.config;

import xyz.nova.annotation.Nova;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.config.NovaId;
import xyz.nova.annotation.config.NovaScan;
import xyz.nova.service.data.DataProxy;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.constant.NovaConst;
import lombok.Data;
import lombok.Getter;
import lombok.SneakyThrows;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;
import org.reflections.Reflections;
import org.reflections.scanners.Scanners;
import org.reflections.util.ConfigurationBuilder;
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
    private static final Map<String, ScanNova> scanNovas = new LinkedHashMap<>();

    @SneakyThrows
    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
        Class<?> clazz = ClassUtils.forName(importingClassMetadata.getClassName(), ClassUtils.getDefaultClassLoader());
        // 获取扫描的包名
        NovaScan novaScan = clazz.getAnnotation(NovaScan.class);
        Set<String> scanPackage = new HashSet<>();
        if (novaScan.value().length == 0) {
            scanPackage.add(clazz.getPackage().getName());
        } else {
            scanPackage.addAll(Arrays.asList(novaScan.value()));
        }
        scanPackage.add(NovaConst.BASE_PACKAGE);
        // 创建 Reflections 实例
        Reflections reflections = new Reflections(
                new ConfigurationBuilder()
                        .forPackages(scanPackage.toArray(String[]::new))
                        .setScanners(
                                Scanners.TypesAnnotated, // 扫描类上的注解
                                Scanners.SubTypes // 扫描子类型（包含内部类）
                        )
        );
        // 获取所有带 @Nova 注解的类
        Set<Class<?>> novaClasses = reflections.get(Scanners.TypesAnnotated.with(Nova.class).asClass());
        for (Class<?> clz : novaClasses) {
            String novaIdFieldName = null;
            Class<?> novaIdClass = null;
            Map<String, ScanNova.NovaFieldInfo> novaFields = new LinkedHashMap<>();
            List<String> assocColumns = new ArrayList<>();
            Field[] fields = clz.getDeclaredFields();
            for (Field field : fields) {
                if (field.isAnnotationPresent(NovaField.class)) {
                    NovaField novaField = field.getDeclaredAnnotation(NovaField.class);
                    Edit.Type type = novaFieldAutoTypeChange(field.getType(), novaField.edit().type());
                    novaFields.put(field.getName(), new ScanNova.NovaFieldInfo()
                            .setNovaField(novaField)
                            .setType(type)
                            .setFieldClass(field.getType())
                            .setFieldName(field.getName())
                    );
                    Edit edit = novaField.edit();
                    if (type == Edit.Type.REFERENCE) {
                        assocColumns.add(edit.referenceType().ref());
                    } else if (type == Edit.Type.APPENDAGE || type == Edit.Type.APPENDAGES) {
                        assocColumns.add(edit.appendageType().by());
                    }
                }
                if (field.isAnnotationPresent(NovaId.class)) {
                    novaIdFieldName = field.getName();
                    novaIdClass = field.getType();
                }
            }
            Nova nova = clz.getDeclaredAnnotation(Nova.class);
            List<RowOperation> rowOperations = new ArrayList<>(Arrays.asList(nova.rowOperation()));
            ScanNova scanNova = new ScanNova()
                    .setClz(clz)
                    .setNovaIdFieldName(novaIdFieldName)
                    .setNovaIdClass(novaIdClass)
                    .setNova(nova)
                    .setNovaFields(novaFields)
                    .setDataProxyClass(nova.dataProxy())
                    .setRowOperations(rowOperations)
                    .setAssocColumns(assocColumns);
            if (check(scanNova)) {
                log.info("@Nova classes: {}", clz.getName());
                scanNovas.put(clz.getSimpleName(), scanNova);
            }
        }
    }

    @Data
    @Accessors(chain = true)
    public static class ScanNova {

        @Comment("类")
        private Class<?> clz;

        @Comment("novaId属性名")
        private String novaIdFieldName;

        @Comment("novaId属性类型")
        private Class<?> novaIdClass;

        @Comment("Nova注解")
        private Nova nova;

        @Comment("NovaField注解")
        private Map<String, NovaFieldInfo> novaFields;

        @Comment("数据代理类")
        private Class<? extends DataProxy<?, ?>> dataProxyClass;

        @Comment("自定义功能按钮")
        private List<RowOperation> rowOperations;

        @Comment("关联组件列（REFERENCE的ref、APPENDAGE/APPENDAGES的by）")
        private List<String> assocColumns;

        @Data
        @Accessors(chain = true)
        public static class NovaFieldInfo {

            @Comment("NovaField注解")
            private NovaField novaField;

            @Comment("组件类型（自动类型转换）")
            private Edit.Type type;

            @Comment("属性类型")
            private Class<?> fieldClass;

            @Comment("属性名称")
            private String fieldName;

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

    /**
     * ScanNova缓存正确性检查
     */
    private boolean check(ScanNova scanNova) {
        // 无数据标识
        if (scanNova.getNovaIdFieldName() == null) {
            return false;
        }
        // 无有效字段
        if (scanNova.getNovaFields().isEmpty()) {
            return false;
        }
        return true;
    }

}
