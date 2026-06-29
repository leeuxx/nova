package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.Details;
import com.nova.annotation.fun.Fetch;
import com.nova.annotation.sub.nova.field.edit.ChoiceFetchHandler;
import com.nova.entity.TestDemo;
import com.nova.entity.TestDemo2;
import com.nova.entity.TestDemo3;
import com.nova.mapper.TestDemoMapper;
import com.nova.utils.NovaQueryUtils;
import com.nova.view.TestDemo2View;
import com.nova.view.TestDemo3View;
import com.nova.view.TestDemoView;
import lombok.AllArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Service
@AllArgsConstructor(onConstructor_ = @Lazy)
public class TestDemoService extends ServiceImpl<TestDemoMapper, TestDemo> implements ChoiceFetchHandler, DataProxy<TestDemoView> {

    private TestDemo2Service testDemo2Service;

    private TestDemo3Service testDemo3Service;

    @Override
    public List<VLModel> fetch(String[] params) {
        return Arrays.asList(
                new VLModel().setValue("1").setLabel("篮球"),
                new VLModel().setValue("2").setLabel("羽毛球").setColor("#fe6767"),
                new VLModel().setValue("3").setLabel("LOL")
        );
    }

    @Override
    public Fetch.Vo<TestDemoView> fetch(Fetch<TestDemoView> fetch) {
        NovaQueryUtils.Result<TestDemo> testDemoResult = NovaQueryUtils.buildWrapper(TestDemoView.class, fetch, TestDemo.class);
        Page<TestDemo> page = testDemoResult.getPage();
        LambdaQueryWrapper<TestDemo> wrapper = testDemoResult.getWrapper();
        IPage<TestDemo> iPage = page(page, wrapper);
        List<TestDemo> records = iPage.getRecords();
        List<Long> demo2IdList = records.stream()
                .map(TestDemo::getDemo2Id)
                .filter(Objects::nonNull)
                .toList();
        List<TestDemo2> testDemo2s = new ArrayList<>();
        if (!demo2IdList.isEmpty()) {
            testDemo2s = testDemo2Service.listByIds(demo2IdList);
        }
        List<Long> demoIdList = records.stream()
                .map(TestDemo::getId)
                .filter(Objects::nonNull)
                .toList();
        List<TestDemo3> testDemo3s = new ArrayList<>();
        if (!demoIdList.isEmpty()) {
            testDemo3s = testDemo3Service.list(new LambdaQueryWrapper<TestDemo3>()
                    .in(TestDemo3::getDemoId, demoIdList)
            );
        }
        List<TestDemoView> testDemoViews = new ArrayList<>();
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
            for (TestDemo3 testDemo3 : testDemo3s) {
                if (testDemo3.getDemoId().equals(record.getId())) {
                    TestDemo3View testDemo3View = new TestDemo3View();
                    BeanUtils.copyProperties(testDemo3, testDemo3View); // 源，目标
                    testDemoView.setTestDemo3View(testDemo3View);
                }
            }
            testDemoViews.add(testDemoView);
        }
        return new Fetch.Vo<TestDemoView>()
                .setTotal(iPage.getTotal())
                .setRecords(testDemoViews);
    }

    @Override
    public TestDemoView details(Details details) {
        TestDemo testDemo = getById(details.getStorageFieldValue());
        TestDemo2 testDemo2 = testDemo2Service.getById(testDemo.getDemo2Id());
        TestDemoView testDemoView = new TestDemoView();
        BeanUtils.copyProperties(testDemo, testDemoView); // 源，目标
        if (testDemo2 != null) {
            TestDemo2View testDemo2View = new TestDemo2View();
            BeanUtils.copyProperties(testDemo2, testDemo2View); // 源，目标
            testDemoView.setTestDemo2View(testDemo2View);
        }
        return testDemoView;
    }

    @Override
    public void add(TestDemoView testDemoView) {
        testDemoView.setId(YitIdHelper.nextId());
        TestDemo testDemo = new TestDemo();
        BeanUtils.copyProperties(testDemoView, testDemo);
        testDemo.setDemo2Id(testDemoView.getTestDemo2View().getId());
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
        testDemo.setDemo2Id(testDemoView.getTestDemo2View().getId());
        updateById(testDemo);
    }
}
