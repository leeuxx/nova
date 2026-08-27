package xyz.nova.utils;

import cn.hutool.json.JSONUtil;
import org.springframework.data.redis.core.StringRedisTemplate;
import xyz.nova.entity.DictItem;
import xyz.nova.service.DictServiceImpl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class DictUtils {

    /**
     * 获取字典
     * @param code 编码
     * @return 字典集合
     */
    public static List<DictItem> getDict(String code) {
        List<DictItem> dictItems = new ArrayList<>();
        StringRedisTemplate redisTemplate = SpringBeanUtils.getBean(StringRedisTemplate.class);
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(DictServiceImpl.redisKey + code);
        entries.forEach((k, v) -> {
            DictItem dictItem = JSONUtil.parseObj(v).toBean(DictItem.class);
            dictItems.add(dictItem);
        });
        return dictItems;
    }

    /**
     * 获取字典
     * @param code 编码
     * @param itemCode 子编码
     * @return 字典
     */
    public static DictItem getDict(String code, String itemCode) {
        StringRedisTemplate redisTemplate = SpringBeanUtils.getBean(StringRedisTemplate.class);
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(DictServiceImpl.redisKey + code);
        Object item = entries.get(itemCode);
        if (item != null) {
            return JSONUtil.parseObj(item).toBean(DictItem.class);
        }
        return null;
    }
}
