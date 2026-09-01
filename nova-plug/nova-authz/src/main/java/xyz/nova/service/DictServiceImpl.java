package xyz.nova.service;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.nova.annotation.sub.nova.row.OperationHandler;
import xyz.nova.entity.Dict;
import xyz.nova.entity.DictItem;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Fetch;
import xyz.nova.error.NovaException;
import xyz.nova.i18n.NovaI18nUtils;
import xyz.nova.mapper.DictMapper;
import xyz.nova.nova.DictItemNova;
import xyz.nova.nova.DictNova;
import xyz.nova.nova.condition.DictCondition;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.BeanCopyUtils;
import xyz.nova.utils.NovaMyBatisUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DictServiceImpl extends ServiceImpl<DictMapper, Dict> implements DataProxy<DictNova, DictCondition>, OperationHandler<Long, Object> {

    public static String redisKey = "nova:dict:";

    private final StringRedisTemplate redisTemplate;

    private final DictItemServiceImpl dictItemService;

    @Override
    public void add(DictNova dictNova) {
        long count = count(new LambdaQueryWrapper<Dict>()
                .eq(Dict::getCode, dictNova.getCode())
        );
        if (count > 0) {
            throw new NovaException("code已存在");
        }
        Dict dict = BeanCopyUtils.copy(dictNova, Dict.class)
                .setId(YitIdHelper.nextId())
                .setCreateTime(LocalDateTime.now());
        save(dict);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(List<DictNova> dictNova) {
        List<Long> ids = dictNova.stream().map(DictNova::getId).toList();
        List<Dict> dicts = listByIds(ids);
        // 删除字典子项
        dictItemService.dictDelete(ids);
        // 删除字典
        removeByIds(ids);

        for (Dict dict : dicts) {
            cache(dictService -> dict.getCode());
        }
    }

    @Override
    public void update(DictNova dictNova) {
        Dict dict = getById(dictNova.getId());
        String code = dict.getCode();
        long count = count(new LambdaQueryWrapper<Dict>()
                .eq(Dict::getCode, dictNova.getCode())
                .ne(Dict::getId, dictNova.getId())
        );
        if (count > 0) {
            throw new NovaException("code已存在");
        }
        BeanCopyUtils.copy(dictNova, dict);
        updateById(dict);

        cache(dictService -> code);
        if (!code.equals(dictNova.getCode())) {
            cache(dictService -> dictNova.getCode());
        }
    }

    @Override
    public Fetch.Vo<DictNova> fetch(Fetch<DictCondition> fetch) {
        NovaMyBatisUtils.Result<Dict> result = NovaMyBatisUtils.buildWrapper(DictNova.class, fetch);
        IPage<Dict> iPage = page(result.getPage(), result.getWrapper());
        List<Dict> records = iPage.getRecords();
        List<DictNova> dictNovas = new ArrayList<>();
        if (!records.isEmpty()) {
            dictNovas = BeanCopyUtils.<Dict, DictNova>copy(records, DictNova.class);
            // 查询字典数
            List<Long> ids = dictNovas.stream().map(DictNova::getId).toList();
            QueryWrapper<DictItem> queryWrapper = new QueryWrapper<DictItem>()
                    .select("dict_id, COUNT(*) AS count")
                    .in("dict_id", ids)
                    .groupBy("dict_id");
            List<Map<String, Object>> maps = dictItemService.listMaps(queryWrapper);
            Map<Long, Integer> resultMap = maps.stream().collect(Collectors.toMap(
                    map -> Long.valueOf(map.get("dict_id").toString()),
                    map -> ((Number) map.get("count")).intValue()
            ));
            for (DictNova dictNova : dictNovas) {
                Integer itemSize = resultMap.get(dictNova.getId());
                dictNova.setItemSize(itemSize == null ? 0 : itemSize);
            }
        }
        return new Fetch.Vo<DictNova>()
                .setTotal(iPage.getTotal())
                .setRecords(dictNovas);
    }

    @Override
    public DictNova details(Details details) {
        Dict dict = getById(details.getValue());
        return BeanCopyUtils.copy(dict, DictNova.class);
    }

    @Override
    public String exec(List<Long> novaIds, Object o, String param) {
        if (param.equals("dict_add_item")) {
            DictItemNova dictItemNova = (DictItemNova) o;
            dictItemService.add(dictItemNova);
        }
        if (param.equals("cache")) {
            cache();
        }
        return null;
    }

    @Override
    public Object novaFormValue(List<Long> novaIds, String param) {
        Dict dict = getById(novaIds.get(0));
        return new DictItemNova().setDictNova(new DictNova()
                .setId(dict.getId())
                .setName(dict.getName())
        );
    }

    /**
     * 缓存字典
     */
    public void cache(Function<DictServiceImpl, String> function) {
        String code = function.apply(this);
        Dict dict = getOne(new LambdaQueryWrapper<Dict>()
                .eq(Dict::getCode, code)
        );
        String key = redisKey + code;
        redisTemplate.unlink(key);
        if (dict != null) {
            List<DictItem> dictItems = dictItemService.list(new LambdaQueryWrapper<DictItem>()
                    .eq(DictItem::getDictId, dict.getId())
                    .eq(DictItem::getStatus, true)
            );
            if (dictItems != null && !dictItems.isEmpty()) {
                redisTemplate.opsForHash().putAll(key, buildMenuMap(dictItems));
            }
        }
    }

    /**
     * 全量缓存
     */
    private void cache() {
        // 获取所有字典
        List<Dict> dicts = list();
        if (dicts.isEmpty()) {
            // 如果数据库没有字典，清空所有缓存
            Set<String> keys = redisTemplate.keys(redisKey + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.unlink(keys);
            }
            return;
        }
        Map<String, Dict> dictMap = dicts.stream().collect(Collectors.toMap(Dict::getCode, Function.identity()));
        // 获取所有字典项（即使为空也要继续，为了清理残留缓存）
        List<DictItem> dictItems = dictItemService.list(
                new LambdaQueryWrapper<DictItem>().eq(DictItem::getStatus, true)
        );
        Map<Long, List<DictItem>> dictItemMap = dictItems.stream().collect(Collectors.groupingBy(DictItem::getDictId));
        // 获取Redis中所有字典key
        Set<String> redisKeys = redisTemplate.keys(redisKey + "*");
        // 遍历Redis中的key，删除+更新
        if (redisKeys != null && !redisKeys.isEmpty()) {
            redisKeys.forEach(key -> {
                // 先删除旧缓存（无论是更新还是废弃）
                redisTemplate.unlink(key);
                // 提取code
                String code = key.substring(redisKey.length());
                Dict dict = dictMap.remove(code);
                // 如果字典存在且有子项，写入新缓存
                if (dict != null) {
                    List<DictItem> dictItemList = dictItemMap.get(dict.getId());
                    if (dictItemList != null && !dictItemList.isEmpty()) {
                        redisTemplate.opsForHash().putAll(key, buildMenuMap(dictItemList));
                    }
                }
            });
        }
        // 处理Redis中不存在的字典
        dictMap.forEach((code, dict) -> {
            List<DictItem> dictItemList = dictItemMap.get(dict.getId());
            if (dictItemList != null && !dictItemList.isEmpty()) {
                redisTemplate.opsForHash().putAll(redisKey + code, buildMenuMap(dictItemList));
            }
        });
    }

    private Map<String, String> buildMenuMap(List<DictItem> dictItemList) {
        return dictItemList.stream()
                .collect(Collectors.toMap(
                        DictItem::getCode,
                        item -> JSONUtil.parseObj(item).toString(),
                        (old, newVal) -> newVal,
                        LinkedHashMap::new
                ));
    }
}
