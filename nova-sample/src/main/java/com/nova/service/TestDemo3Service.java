package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.Details;
import com.nova.entity.TestDemo3;
import com.nova.mapper.TestDemo3Mapper;
import com.nova.view.TestDemo3View;
import lombok.AllArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor(onConstructor_ = @Lazy)
public class TestDemo3Service extends ServiceImpl<TestDemo3Mapper, TestDemo3> implements DataProxy<TestDemo3View> {

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

}
