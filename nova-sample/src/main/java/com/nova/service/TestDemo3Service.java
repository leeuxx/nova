package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.FetchReferencesRequest;
import com.nova.annotation.fun.FetchRequest;
import com.nova.annotation.fun.FetchResponse;
import com.nova.entity.TestDemo3;
import com.nova.mapper.TestDemo3Mapper;
import com.nova.view.TestDemo3View;
import lombok.AllArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class TestDemo3Service extends ServiceImpl<TestDemo3Mapper, TestDemo3> implements DataProxy<TestDemo3, TestDemo3View> {

    @Override
    public FetchResponse<TestDemo3View> fetch(FetchRequest<TestDemo3> fetchRequest) {
        return null;
    }

    @Override
    public Map<String, TestDemo3View> fetchReferences(FetchReferencesRequest fetchReferencesRequest) {
        List<TestDemo3> testDemo3s = list(new LambdaQueryWrapper<TestDemo3>()
                .in(TestDemo3::getDemoId, fetchReferencesRequest.getStorageFieldValues())
        );
        Map<String, TestDemo3View> testDemo3Views = new HashMap<>();
        for (TestDemo3 testDemo3 : testDemo3s) {
            TestDemo3View testDemo3View = new TestDemo3View();
            BeanUtils.copyProperties(testDemo3, testDemo3View); // 源，目标
            testDemo3Views.put(String.valueOf(testDemo3.getDemoId()), testDemo3View);
        }
        return testDemo3Views;
    }
}
