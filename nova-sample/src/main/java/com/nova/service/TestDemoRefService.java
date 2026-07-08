package com.nova.service;

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
import com.nova.utils.Beans;
import com.nova.utils.Emptys;
import com.nova.utils.NovaQueryUtils;
import com.nova.utils.collections.list.JArrayList;
import com.nova.utils.collections.map.JMap;
import com.nova.view.TestDemo4View;
import com.nova.view.TestDemoRefView;
import com.nova.view.TestDemoView;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

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
    public Fetch.Vo<TestDemoRefView> fetch(Fetch fetch) {
        NovaQueryUtils.Result<TestDemoRef> testDemoRefResult = NovaQueryUtils.buildWrapper(TestDemoRefView.class, fetch, TestDemoRef.class);
        Page<TestDemoRef> page = testDemoRefResult.getPage();
        LambdaQueryWrapper<TestDemoRef> wrapper = testDemoRefResult.getWrapper();
        IPage<TestDemoRef> iPage = page(page, wrapper);
        List<TestDemoRef> records = iPage.getRecords();
        List<TestDemoRefView> testDemoRefViews = new ArrayList<>();
        if (Emptys.check(records)) {
            List<TestDemo> testDemos = testDemoService.listByIds(new JArrayList<>(records).getProperty(TestDemoRef::getDemoId).comparing());
            JMap<Long, TestDemo> testDemoJMaps = new JArrayList<>(testDemos).toMap(TestDemo::getId).cover();
            List<TestDemo4> testDemo4s = testDemo4Service.listByIds(new JArrayList<>(records).getProperty(TestDemoRef::getDemo4Id).comparing());
            JMap<Long, TestDemo4> testDemo4JMaps = new JArrayList<>(testDemo4s).toMap(TestDemo4::getId).cover();
            for (TestDemoRef testDemoRef : records) {
                TestDemo testDemo = testDemoJMaps.get(testDemoRef.getDemoId());
                TestDemoView testDemoView = Beans.copy(TestDemoView.class, testDemo);
                TestDemo4 testDemo4 = testDemo4JMaps.get(testDemoRef.getDemo4Id());
                TestDemo4View testDemo4View = Beans.copy(TestDemo4View.class, testDemo4);
                TestDemoRefView testDemoRefView = Beans.copy(TestDemoRefView.class, testDemoRef)
                        .setTestDemo4View(testDemo4View)
                        .setTestDemoView(testDemoView);
                testDemoRefViews.add(testDemoRefView);
            }
        }
        return new Fetch.Vo<TestDemoRefView>()
                .setTotal(iPage.getTotal())
                .setRecords(testDemoRefViews);
    }
}
