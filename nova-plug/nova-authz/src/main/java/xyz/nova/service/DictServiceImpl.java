package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.nova.annotation.sub.nova.row.OperationHandler;
import xyz.nova.entity.Dict;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Fetch;
import xyz.nova.error.NovaException;
import xyz.nova.mapper.DictMapper;
import xyz.nova.nova.DictNova;
import xyz.nova.nova.MenuNova;
import xyz.nova.nova.condition.DictCondition;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.BeanCopyUtils;
import xyz.nova.utils.NovaMyBatisUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class DictServiceImpl extends ServiceImpl<DictMapper, Dict> implements DataProxy<DictNova, DictCondition>, OperationHandler<DictNova, Object> {

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
        // 删除字典
        removeByIds(ids);
    }

    @Override
    public void update(DictNova dictNova) {
        long count = count(new LambdaQueryWrapper<Dict>()
                .eq(Dict::getCode, dictNova.getCode())
                .ne(Dict::getId, dictNova.getId())
        );
        if (count > 0) {
            throw new NovaException("code已存在");
        }
        Dict dict = BeanCopyUtils.copy(dictNova, Dict.class);
        updateById(dict);
    }

    @Override
    public Fetch.Vo<DictNova> fetch(Fetch<DictCondition> fetch) {
        NovaMyBatisUtils.Result<Dict> result = NovaMyBatisUtils.buildWrapper(DictNova.class, fetch);
        IPage<Dict> iPage = page(result.getPage(), result.getWrapper());
        List<Dict> records = iPage.getRecords();
        List<DictNova> dictNovas = new ArrayList<>();
        if (!records.isEmpty()) {
            dictNovas = BeanCopyUtils.<Dict, DictNova>copy(records, DictNova.class);
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
    public String exec(List<DictNova> novaIds, Object o, String param) {
        return null;
    }
}
