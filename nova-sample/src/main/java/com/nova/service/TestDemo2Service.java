package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.Details;
import com.nova.annotation.fun.Fetch;
import com.nova.annotation.fun.PromptSearch;
import com.nova.entity.TestDemo;
import com.nova.entity.TestDemo2;
import com.nova.mapper.TestDemo2Mapper;
import com.nova.utils.NovaQueryUtils;
import com.nova.view.TestDemo2View;
import com.nova.view.TestDemoView;
import lombok.AllArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@AllArgsConstructor(onConstructor_ = @Lazy)
public class TestDemo2Service extends ServiceImpl<TestDemo2Mapper, TestDemo2> implements DataProxy<TestDemo2View> {

    private TestDemoService testDemoService;

    @Override
    public Fetch.Vo<TestDemo2View> fetch(Fetch fetch) {
        NovaQueryUtils.Result<TestDemo2> testDemo2Result = NovaQueryUtils.buildWrapper(TestDemo2View.class, fetch, TestDemo2.class);
        Page<TestDemo2> page = testDemo2Result.getPage();
        LambdaQueryWrapper<TestDemo2> wrapper = testDemo2Result.getWrapper();
        IPage<TestDemo2> iPage = page(page, wrapper);
        List<TestDemo2> records = iPage.getRecords();

        List<Long> demoIdList = records.stream()
                .map(TestDemo2::getDemoId)
                .filter(Objects::nonNull)
                .toList();
        List<TestDemo2View> testDemo2Views = new ArrayList<>();
        if (!demoIdList.isEmpty()) {
            List<TestDemo> testDemos = testDemoService.listByIds(demoIdList);
            for (TestDemo2 record : records) {
                TestDemo2View testDemo2View = new TestDemo2View();
                BeanUtils.copyProperties(record, testDemo2View); // 源，目标
                for (TestDemo testDemo : testDemos) {
                    if (record.getDemoId().equals(testDemo.getId())) {
                        TestDemoView testDemoView = new TestDemoView();
                        BeanUtils.copyProperties(testDemo, testDemoView); // 源，目标
                        testDemo2View.setTestDemoView(testDemoView);
                    }
                }
                testDemo2Views.add(testDemo2View);
            }
        }
        return new Fetch.Vo<TestDemo2View>()
                .setTotal(iPage.getTotal())
                .setRecords(testDemo2Views);
    }

    @Override
    public TestDemo2View details(Details details) {
        TestDemo2 testDemo2 = getById(details.getStorageFieldValue());
        TestDemo testDemo = testDemoService.getById(testDemo2.getDemoId());
        TestDemo2View testDemo2View = new TestDemo2View();
        BeanUtils.copyProperties(testDemo2, testDemo2View); // 源，目标
        if (testDemo != null) {
            TestDemoView testDemoView = new TestDemoView();
            BeanUtils.copyProperties(testDemo, testDemoView); // 源，目标
            testDemo2View.setTestDemoView(testDemoView);
        }
        return testDemo2View;
    }

    @Override
    public PromptSearch.Vo promptSearch(PromptSearch promptSearch) {
        LambdaQueryWrapper<TestDemo2> lambdaQueryWrapper = new LambdaQueryWrapper<TestDemo2>()
                .like(TestDemo2::getName, promptSearch.getPrompt());
        IPage<TestDemo2> iPage = page(Page.of(promptSearch.getCurrent(), promptSearch.getSize()), lambdaQueryWrapper);
        List<TestDemo2> records = iPage.getRecords();
        List<PromptSearch.Vo.Record> list = new ArrayList<>();
        for (TestDemo2 testDemo2 : records) {
            PromptSearch.Vo.Record record = new PromptSearch.Vo.Record()
                    .setStorageField(testDemo2.getId().toString())
                    .setDisplayField(testDemo2.getName());
            list.add(record);
        }
        return new PromptSearch.Vo()
                .setTotal(iPage.getTotal())
                .setRecords(list);
    }
}
