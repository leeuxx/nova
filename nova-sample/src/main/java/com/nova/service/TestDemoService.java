package com.nova.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.FetchRequest;
import com.nova.annotation.fun.FetchResponse;
import com.nova.annotation.sub.nova.field.edit.ChoiceFetchHandler;
import com.nova.entity.TestDemo;
import com.nova.mapper.TestDemoMapper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@AllArgsConstructor
public class TestDemoService extends ServiceImpl<TestDemoMapper, TestDemo> implements ChoiceFetchHandler, DataProxy<TestDemo> {

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
        IPage<TestDemo> iPage = page(mybatisPLus.getPage(), mybatisPLus.getWrapper());
        List<TestDemo> records = iPage.getRecords();
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
