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
import com.nova.view.TestDemo2View;
import com.nova.view.TestDemoView;
import lombok.AllArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Service
@AllArgsConstructor
public class TestDemoService extends ServiceImpl<TestDemoMapper, TestDemo> implements ChoiceFetchHandler, DataProxy<TestDemo, TestDemoView> {

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
    public FetchResponse<TestDemoView> fetch(FetchRequest<TestDemo> queryRequest) {
        FetchRequest.MybatisPLus<TestDemo> mybatisPLus = queryRequest.getMybatisPLus();
        LambdaQueryWrapper<TestDemo> wrapper = mybatisPLus.getWrapper();
        IPage<TestDemo> iPage = page(mybatisPLus.getPage(), wrapper);
        List<TestDemo> records = iPage.getRecords();
        List<Long> demo2IdList = records.stream()
                .map(TestDemo::getDemo2Id)
                .filter(Objects::nonNull)
                .toList();
        List<TestDemoView> testDemoViews = new ArrayList<>();
        if (!demo2IdList.isEmpty()) {
            List<TestDemo2> testDemo2s = testDemo2Service.listByIds(demo2IdList);
            for (TestDemo record : records) {
                TestDemoView testDemoView = new TestDemoView();
                BeanUtils.copyProperties(record, testDemoView); // 源，目标
                for (TestDemo2 testDemo2 : testDemo2s) {
                    if (testDemo2.getId().equals(record.getDemo2Id())) {
                        TestDemo2View testDemo2View = new TestDemo2View();
                        BeanUtils.copyProperties(testDemo2, testDemo2View); // 源，目标
                        testDemoView.setTestDemo2View(testDemo2View);
                    }
                }
                testDemoViews.add(testDemoView);
            }
        }
        return new FetchResponse<TestDemoView>()
                .setTotal(iPage.getTotal())
                .setRecords(testDemoViews);
    }

    @Override
    public void add(TestDemoView testDemoView) {
        testDemoView.setId(YitIdHelper.nextId());
        TestDemo testDemo = new TestDemo();
        BeanUtils.copyProperties(testDemoView, testDemo);
        save(testDemo);
    }

    @Override
    public void delete(List<TestDemoView> testDemoViews) {
        List<TestDemo> testDemoList = new ArrayList<>();
        for (TestDemoView testDemoView : testDemoViews) {
            TestDemo testDemo = new TestDemo();
            BeanUtils.copyProperties(testDemoView, testDemo);
            testDemoList.add(testDemo);
        }
        removeBatchByIds(testDemoList);
    }

    @Override
    public void update(TestDemoView testDemoView) {
        TestDemo testDemo = new TestDemo();
        BeanUtils.copyProperties(testDemoView, testDemo);
        updateById(testDemo);
    }
}
