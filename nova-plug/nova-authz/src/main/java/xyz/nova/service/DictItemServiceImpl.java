package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import org.springframework.stereotype.Service;
import xyz.nova.entity.Dict;
import xyz.nova.entity.DictItem;
import xyz.nova.entity.data.Fetch;
import xyz.nova.error.NovaException;
import xyz.nova.mapper.DictItemMapper;
import xyz.nova.nova.DictItemNova;
import xyz.nova.nova.DictNova;
import xyz.nova.nova.condition.DictItemCondition;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.BeanCopyUtils;
import xyz.nova.utils.NovaMyBatisUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DictItemServiceImpl extends ServiceImpl<DictItemMapper, DictItem> implements DataProxy<DictItemNova, DictItemCondition> {

    @Override
    public void add(DictItemNova dictItemNova) {
        DictNova dictNova = dictItemNova.getDictNova();
        long count = count(new LambdaQueryWrapper<DictItem>()
                .eq(DictItem::getCode, dictItemNova.getCode())
                .eq(DictItem::getDictId, dictNova.getId())
        );
        if (count > 0) {
            throw new NovaException("code已存在");
        }
        DictItem dictItem = BeanCopyUtils.copy(dictItemNova, DictItem.class, DictItemNova::getDictNova)
                .setId(YitIdHelper.nextId())
                .setDictId(dictNova.getId())
                .setCreateTime(LocalDateTime.now());
        save(dictItem);
    }

    @Override
    public void delete(List<DictItemNova> dictItemNova) {
        DataProxy.super.delete(dictItemNova);
    }

    @Override
    public void update(DictItemNova dictItemNova) {
        DataProxy.super.update(dictItemNova);
    }

    @Override
    public Fetch.Vo<DictItemNova> fetch(Fetch<DictItemCondition> fetch) {
        NovaMyBatisUtils.Result<DictItem> result = NovaMyBatisUtils.buildWrapper(DictItemNova.class, fetch);
        IPage<DictItem> iPage = page(result.getPage(), result.getWrapper());
        List<DictItem> records = iPage.getRecords();
        List<DictItemNova> dictItemNovas = new ArrayList<>();
        if (!records.isEmpty()) {
            dictItemNovas = BeanCopyUtils.<DictItem, DictItemNova>copy(records, DictItemNova.class);
        }
        return new Fetch.Vo<DictItemNova>()
                .setTotal(iPage.getTotal())
                .setRecords(dictItemNovas);
    }
}
