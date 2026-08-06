package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import com.nova.entity.data.Details;
import com.nova.entity.data.Fetch;
import com.nova.entity.data.PromptSearch;
import com.nova.entity.TestDemo;
import com.nova.entity.TestDemo4;
import com.nova.mapper.TestDemo4Mapper;
import com.nova.service.data.DataProxy;
import com.nova.utils.NovaQueryUtils;
import com.nova.view.TestDemo4View;
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
public class TestDemo4Service extends ServiceImpl<TestDemo4Mapper, TestDemo4> implements DataProxy<TestDemo4View> {

    private TestDemoService testDemoService;

    @Override
    public Fetch.Vo<TestDemo4View> fetch(Fetch fetch) {
        NovaQueryUtils.Result<TestDemo4> testDemo4Result = NovaQueryUtils.buildWrapper(TestDemo4View.class, fetch);
        Page<TestDemo4> page = testDemo4Result.getPage();
        LambdaQueryWrapper<TestDemo4> wrapper = testDemo4Result.getWrapper();
        IPage<TestDemo4> iPage = page(page, wrapper);
        List<TestDemo4> records = iPage.getRecords();
        List<Long> demo2IdList = records.stream()
                .map(TestDemo4::getDemoId)
                .filter(Objects::nonNull)
                .toList();
        List<TestDemo> testDemos = new ArrayList<>();
        if (!demo2IdList.isEmpty()) {
            testDemos = testDemoService.list(new LambdaQueryWrapper<TestDemo>()
                    .in(TestDemo::getId, demo2IdList)
            );
        }
        List<TestDemo4View> testDemo4Views = new ArrayList<>();
        for (TestDemo4 record : records) {
            TestDemo4View testDemo4View = new TestDemo4View();
            BeanUtils.copyProperties(record, testDemo4View); // 源，目标
            for (TestDemo testDemo : testDemos) {
                if (testDemo.getId().equals(record.getDemoId())) {
                    TestDemoView testDemoView = new TestDemoView();
                    BeanUtils.copyProperties(testDemo, testDemoView);
                    testDemo4View.setTestDemoView(testDemoView);
                }
            }
            testDemo4Views.add(testDemo4View);
        }
        return new Fetch.Vo<TestDemo4View>()
                .setTotal(iPage.getTotal())
                .setRecords(testDemo4Views);
    }

    @Override
    public TestDemo4View details(Details details) {
        TestDemo4 testDemo4 = getById(details.getValue());
        TestDemo4View testDemo4View = new TestDemo4View();
        if (testDemo4 != null) {
            BeanUtils.copyProperties(testDemo4, testDemo4View); // 源，目标
        }
        return testDemo4View;
    }

    @Override
    public PromptSearch.Vo promptSearch(PromptSearch promptSearch) {
        LambdaQueryWrapper<TestDemo4> lambdaQueryWrapper = new LambdaQueryWrapper<TestDemo4>()
                .like(TestDemo4::getName, promptSearch.getPrompt());
        IPage<TestDemo4> iPage = page(Page.of(promptSearch.getCurrent(), promptSearch.getSize()), lambdaQueryWrapper);
        List<TestDemo4> records = iPage.getRecords();
        List<PromptSearch.Vo.Record> list = new ArrayList<>();
        for (TestDemo4 testDemo4 : records) {
            PromptSearch.Vo.Record record = new PromptSearch.Vo.Record()
                    .setId(testDemo4.getDemoId().toString())
                    .setName(testDemo4.getName());
            list.add(record);
        }
        return new PromptSearch.Vo()
                .setTotal(iPage.getTotal())
                .setRecords(list);
    }

    @Override
    public void add(TestDemo4View testDemo4View) {
        testDemo4View.setId(YitIdHelper.nextId());
        TestDemo4 testDemo4 = new TestDemo4();
        BeanUtils.copyProperties(testDemo4View, testDemo4);
        testDemo4.setDemoId(testDemo4View.getTestDemoView().getId());
        save(testDemo4);
    }

    @Override
    public void delete(List<TestDemo4View> testDemo4Views) {
        List<TestDemo4> testDemo4s = new ArrayList<>();
        for (TestDemo4View testDemo4View : testDemo4Views) {
            TestDemo4 testDemo4 = new TestDemo4();
            BeanUtils.copyProperties(testDemo4View, testDemo4);
            testDemo4s.add(testDemo4);
        }
        removeBatchByIds(testDemo4s);
    }

    @Override
    public void update(TestDemo4View testDemo4View) {
        TestDemo4 testDemo4 = new TestDemo4();
        BeanUtils.copyProperties(testDemo4View, testDemo4);
        updateById(testDemo4);
    }
}
