package com.nova.service;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.Fetch;
import com.nova.entity.TestDemo;
import com.nova.entity.TestDemo4;
import com.nova.entity.TestDemoRef;
import com.nova.mapper.TestDemoRefMapper;
import com.nova.utils.NovaQueryUtils;
import com.nova.view.TestDemo4View;
import com.nova.view.TestDemoRefView;
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
public class TestDemoRefService extends ServiceImpl<TestDemoRefMapper, TestDemoRef> implements DataProxy<TestDemoRefView> {

    private TestDemoService testDemoService;

    private TestDemo4Service testDemo4Service;

    @Override
    public void add(TestDemoRefView testDemoRefView) {
        TestDemoView testDemoView = testDemoRefView.getTestDemoView();
        TestDemo4View testDemo4View = testDemoRefView.getTestDemo4View();
        TestDemoRef testDemoRef = new TestDemoRef()
                .setId(YitIdHelper.nextId())
                .setDemoId(testDemoView.getId())
                .setDemo4Id(testDemo4View.getId());
        save(testDemoRef);
    }

    @Override
    public void delete(List<TestDemoRefView> testDemoRefViews) {
        List<TestDemoRef> testDemoRefs = new ArrayList<>();
        for (TestDemoRefView testDemoRefView : testDemoRefViews) {
            TestDemoRef testDemoRef = new TestDemoRef()
                    .setId(testDemoRefView.getId());
            testDemoRefs.add(testDemoRef);
        }
        removeByIds(testDemoRefs);
    }

    @Override
    public Fetch.Vo<TestDemoRefView> fetch(Fetch<TestDemoRefView> fetch) {
        JSONObject jsonObject = JSONUtil.parseObj(fetch.getConditions().get("demoId"));
        TestDemo testDemo = testDemoService.getById(jsonObject.getLong("value"));
        TestDemoView testDemoView = new TestDemoView();
        BeanUtils.copyProperties(testDemo, testDemoView); // 源，目标
        NovaQueryUtils.Result<TestDemoRef> testDemoRefResult = NovaQueryUtils.buildWrapper(TestDemoRefView.class, fetch, TestDemoRef.class);
        Page<TestDemoRef> page = testDemoRefResult.getPage();
        LambdaQueryWrapper<TestDemoRef> wrapper = testDemoRefResult.getWrapper();
        IPage<TestDemoRef> iPage = page(page, wrapper);
        List<TestDemoRef> records = iPage.getRecords();
        List<Long> demo4IdList = records.stream()
                .map(TestDemoRef::getDemo4Id)
                .filter(Objects::nonNull)
                .toList();
        List<TestDemo4> testDemo4s = new ArrayList<>();
        if (!demo4IdList.isEmpty()) {
            testDemo4s = testDemo4Service.listByIds(demo4IdList);
        }
        List<TestDemoRefView> testDemoRefViews = new ArrayList<>();
        for (TestDemoRef testDemoRef : records) {
            TestDemoRefView testDemoRefView = new TestDemoRefView();
            BeanUtils.copyProperties(testDemoRef, testDemoRefView); // 源，目标
            for (TestDemo4 testDemo4 : testDemo4s) {
                if (testDemo4.getId().equals(testDemoRef.getDemo4Id())) {
                    TestDemo4View testDemo4View = new TestDemo4View();
                    BeanUtils.copyProperties(testDemo4, testDemo4View); // 源，目标
                    testDemoRefView.setTestDemo4View(testDemo4View);
                }
            }
            testDemoRefView.setTestDemoView(testDemoView);
            testDemoRefViews.add(testDemoRefView);
        }
        return new Fetch.Vo<TestDemoRefView>()
                .setTotal(iPage.getTotal())
                .setRecords(testDemoRefViews);
    }
}
