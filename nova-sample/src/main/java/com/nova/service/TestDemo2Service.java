package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.annotation.fun.*;
import com.nova.entity.TestDemo2;
import com.nova.mapper.TestDemo2Mapper;
import com.nova.view.TestDemo2View;
import com.nova.view.TestDemoView;
import lombok.AllArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class TestDemo2Service extends ServiceImpl<TestDemo2Mapper, TestDemo2> implements DataProxy<TestDemo2, TestDemo2View> {

    @Override
    public FetchResponse<TestDemo2View> fetch(FetchRequest<TestDemo2> queryRequest) {
        FetchRequest.MybatisPLus<TestDemo2> mybatisPLus = queryRequest.getMybatisPLus();
        LambdaQueryWrapper<TestDemo2> wrapper = mybatisPLus.getWrapper();
        IPage<TestDemo2> iPage = page(mybatisPLus.getPage(), wrapper);
        List<TestDemo2> records = iPage.getRecords();
        List<TestDemo2View> testDemo2Views = new ArrayList<>();
        for (TestDemo2 record : records) {
            TestDemo2View testDemo2View = new TestDemo2View();
            BeanUtils.copyProperties(record, testDemo2View); // 源，目标
            testDemo2View.setTestDemoView(new TestDemoView()
                    .setId(record.getDemoId())
            );
            testDemo2Views.add(testDemo2View);
        }
        return new FetchResponse<TestDemo2View>()
                .setTotal(iPage.getTotal())
                .setRecords(testDemo2Views);
    }

    @Override
    public Map<String, TestDemo2View> fetchReferences(FetchReferencesRequest fetchReferencesRequest) {
        List<TestDemo2> testDemo2s = listByIds(fetchReferencesRequest.getStorageFieldValues());
        Map<String, TestDemo2View> testDemo2Views = new HashMap<>();
        for (TestDemo2 testDemo2 : testDemo2s) {
            TestDemo2View testDemo2View = new TestDemo2View();
            BeanUtils.copyProperties(testDemo2, testDemo2View); // 源，目标
            testDemo2View.setTestDemoView(new TestDemoView()
                    .setId(testDemo2.getDemoId())
            );
            testDemo2Views.put(String.valueOf(testDemo2.getId()), testDemo2View);
        }
        return testDemo2Views;
    }

    @Override
    public PromptSearchResponse promptSearch(PromptSearchRequest promptSearchRequest) {
        LambdaQueryWrapper<TestDemo2> lambdaQueryWrapper = new LambdaQueryWrapper<TestDemo2>()
                .like(TestDemo2::getName, promptSearchRequest.getPrompt());
        IPage<TestDemo2> iPage = page(Page.of(promptSearchRequest.getCurrent(), promptSearchRequest.getSize()), lambdaQueryWrapper);
        List<TestDemo2> records = iPage.getRecords();
        List<PromptSearchResponse.Record> list = new ArrayList<>();
        for (TestDemo2 testDemo2 : records) {
            PromptSearchResponse.Record record = new PromptSearchResponse.Record()
                    .setStorageField(testDemo2.getId().toString())
                    .setDisplayField(testDemo2.getName());
            list.add(record);
        }
        return new PromptSearchResponse()
                .setTotal(iPage.getTotal())
                .setRecords(list);
    }
}
