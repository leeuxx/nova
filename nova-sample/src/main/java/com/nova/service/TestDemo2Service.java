package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.FetchRequest;
import com.nova.annotation.fun.FetchResponse;
import com.nova.annotation.fun.PromptSearchResponse;
import com.nova.entity.TestDemo;
import com.nova.entity.TestDemo2;
import com.nova.mapper.TestDemo2Mapper;
import com.nova.utils.SpringBeanUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@AllArgsConstructor
public class TestDemo2Service extends ServiceImpl<TestDemo2Mapper, TestDemo2> implements DataProxy<TestDemo2> {

    @Override
    public FetchResponse<TestDemo2> fetch(FetchRequest<TestDemo2> queryRequest) {
        FetchRequest.MybatisPLus<TestDemo2> mybatisPLus = queryRequest.getMybatisPLus();
        LambdaQueryWrapper<TestDemo2> wrapper = mybatisPLus.getWrapper();
        IPage<TestDemo2> iPage = page(mybatisPLus.getPage(), wrapper);
        List<TestDemo2> records = iPage.getRecords();
        List<Long> demoIdList = records.stream()
                .map(TestDemo2::getDemoId)
                .filter(Objects::nonNull)
                .toList();
        TestDemoService testDemoService = SpringBeanUtils.getBean(TestDemoService.class);
        if (!demoIdList.isEmpty()) {
            List<TestDemo> testDemos = testDemoService.listByIds(demoIdList);
            for (TestDemo2 record : records) {
                record.setTestDemo(testDemos.stream()
                        .filter(testDemo -> testDemo.getId().equals(record.getDemoId()))
                        .findFirst()
                        .orElse(null));
            }
        }

        return new FetchResponse<TestDemo2>()
                .setTotal(iPage.getTotal())
                .setRecords(records);
    }

    @Override
    public List<PromptSearchResponse> promptSearch(String novaName, String prompt) {
        List<TestDemo2> testDemo2s = list(new LambdaQueryWrapper<TestDemo2>()
                .like(TestDemo2::getName, prompt)
        );
        List<PromptSearchResponse> promptSearchResponses = new ArrayList<>();
        for (TestDemo2 testDemo2 : testDemo2s) {
            PromptSearchResponse promptSearchResponse = new PromptSearchResponse()
                    .setStorageField(String.valueOf(testDemo2.getId()))
                    .setDisplayField(testDemo2.getName());
            promptSearchResponses.add(promptSearchResponse);
        }
        return promptSearchResponses;
    }
}
