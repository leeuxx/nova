package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.FetchRequest;
import com.nova.annotation.fun.FetchResponse;
import com.nova.annotation.sub.nova.field.edit.ChoiceFetchHandler;
import com.nova.entity.TestDemo;
import com.nova.entity.TestDemo2;
import com.nova.mapper.TestDemoMapper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Service
@AllArgsConstructor
public class TestDemoService extends ServiceImpl<TestDemoMapper, TestDemo> implements ChoiceFetchHandler, DataProxy<TestDemo> {

    private TestDemo2Service testDemo2Service;

    @Override
    public List<VLModel> fetch(String[] params) {
        return Arrays.asList(
                new VLModel().setValue("1").setLabel("篮球"),
                new VLModel().setValue("2").setLabel("羽毛球").setColor("#fe6767"),
                new VLModel().setValue("3").setLabel("LOL")
        );
    }

    @Override
    public FetchResponse<TestDemo> fetch(FetchRequest<TestDemo> queryRequest) {
        FetchRequest.MybatisPLus<TestDemo> mybatisPLus = queryRequest.getMybatisPLus();
        LambdaQueryWrapper<TestDemo> wrapper = mybatisPLus.getWrapper();
        IPage<TestDemo> iPage = page(mybatisPLus.getPage(), wrapper);
        List<TestDemo> records = iPage.getRecords();
        List<Long> demo2IdList = records.stream()
                .map(TestDemo::getDemo2Id)
                .filter(Objects::nonNull)
                .toList();
        if (!demo2IdList.isEmpty()) {
            List<TestDemo2> testDemo2s = testDemo2Service.listByIds(demo2IdList);
            for (TestDemo record : records) {
                record.setTestDemo2(testDemo2s.stream()
                        .filter(testDemo2 -> testDemo2.getId().equals(record.getDemo2Id()))
                        .findFirst()
                        .orElse(null));
            }
        }
        return new FetchResponse<TestDemo>()
                .setTotal(iPage.getTotal())
                .setRecords(records);
    }

    @Override
    public void add(TestDemo testDemo) {
        testDemo.setId(YitIdHelper.nextId());
        save(testDemo);
    }

    @Override
    public void delete(List<TestDemo> testDemos) {
        removeBatchByIds(testDemos);
    }

    @Override
    public void update(TestDemo testDemo) {
        updateById(testDemo);
    }
}
