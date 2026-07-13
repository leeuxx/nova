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
import com.nova.entity.TestDemo3;
import com.nova.mapper.TestDemo3Mapper;
import com.nova.utils.NovaQueryUtils;
import com.nova.view.TestDemo3View;
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
public class TestDemo3Service extends ServiceImpl<TestDemo3Mapper, TestDemo3> implements DataProxy<TestDemo3View> {

    private TestDemoService testDemoService;

    @Override
    public Fetch.Vo<TestDemo3View> fetch(Fetch fetch) {
        NovaQueryUtils.Result<TestDemo3> testDemo3Result = NovaQueryUtils.buildWrapper(TestDemo3View.class, fetch);
        Page<TestDemo3> page = testDemo3Result.getPage();
        LambdaQueryWrapper<TestDemo3> wrapper = testDemo3Result.getWrapper();
        IPage<TestDemo3> iPage = page(page, wrapper);
        List<TestDemo3> records = iPage.getRecords();
        List<Long> demo2IdList = records.stream()
                .map(TestDemo3::getDemoId)
                .filter(Objects::nonNull)
                .toList();
        List<TestDemo> testDemos = new ArrayList<>();
        if (!demo2IdList.isEmpty()) {
            testDemos = testDemoService.list(new LambdaQueryWrapper<TestDemo>()
                    .in(TestDemo::getId, demo2IdList)
            );
        }
        List<TestDemo3View> testDemo3Views = new ArrayList<>();
        for (TestDemo3 record : records) {
            TestDemo3View testDemo3View = new TestDemo3View();
            BeanUtils.copyProperties(record, testDemo3View); // 源，目标
            for (TestDemo testDemo : testDemos) {
                if (testDemo.getId().equals(record.getDemoId())) {
                    TestDemoView testDemoView = new TestDemoView();
                    BeanUtils.copyProperties(testDemo, testDemoView);
                    testDemo3View.setTestDemoView(testDemoView);
                }
            }
            testDemo3Views.add(testDemo3View);
        }
        return new Fetch.Vo<TestDemo3View>()
                .setTotal(iPage.getTotal())
                .setRecords(testDemo3Views);
    }

    @Override
    public TestDemo3View details(Details details) {
        TestDemo3 testDemo3 = getOne(new LambdaQueryWrapper<TestDemo3>()
                .eq(TestDemo3::getDemoId, details.getStorageFieldValue())
        );
        TestDemo3View testDemo3View = new TestDemo3View();
        if (testDemo3 != null) {
            BeanUtils.copyProperties(testDemo3, testDemo3View); // 源，目标
        }
        return testDemo3View;
    }

    @Override
    public PromptSearch.Vo promptSearch(PromptSearch promptSearch) {
        LambdaQueryWrapper<TestDemo3> lambdaQueryWrapper = new LambdaQueryWrapper<TestDemo3>()
                .like(TestDemo3::getName, promptSearch.getPrompt());
        IPage<TestDemo3> iPage = page(Page.of(promptSearch.getCurrent(), promptSearch.getSize()), lambdaQueryWrapper);
        List<TestDemo3> records = iPage.getRecords();
        List<PromptSearch.Vo.Record> list = new ArrayList<>();
        for (TestDemo3 testDemo3 : records) {
            PromptSearch.Vo.Record record = new PromptSearch.Vo.Record()
                    .setStorageField(testDemo3.getDemoId().toString())
                    .setDisplayField(testDemo3.getName());
            list.add(record);
        }
        return new PromptSearch.Vo()
                .setTotal(iPage.getTotal())
                .setRecords(list);
    }

}
