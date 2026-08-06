package xyz.nova.utils;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

/**
 * spring bean工具
 * 修改bean只需要获取到bean对象再set修改属性即可
 */
@Component
public class SpringBeanUtils implements ApplicationContextAware {

    private static ConfigurableApplicationContext configurableApplicationContext;

    private static ApplicationContext applicationContext;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        SpringBeanUtils.applicationContext = applicationContext;
        configurableApplicationContext = (ConfigurableApplicationContext) applicationContext;
    }

    /**
     * 获取bean
     */
    public static <T> T getBean(Class<T> clazz) {
        return applicationContext.getBean(clazz);
    }

    /**
     * 获取bean
     */
    public static Object getBean(String beanName) {
        return applicationContext.getBean(beanName);
    }

    /**
     * 获取bean
     */
    public static <T> T getBean(String beanName, Class<T> clazz) {
        return (T) applicationContext.getBean(beanName);
    }

}
