package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.Fetch;
import com.nova.entity.TestDemo;
import com.nova.entity.TestDemoRef2;
import com.nova.mapper.TestDemoRef2Mapper;
import com.nova.utils.Beans;
import com.nova.utils.Emptys;
import com.nova.utils.NovaQueryUtils;
import com.nova.utils.collections.list.JArrayList;
import com.nova.utils.collections.map.JMap;
import com.nova.view.TestDemoRef2View;
import com.nova.view.TestDemoView;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor(onConstructor_ = @Lazy)
public class TestDemoRef2Service extends ServiceImpl<TestDemoRef2Mapper, TestDemoRef2> implements DataProxy<TestDemoRef2View> {

    private TestDemoService testDemoService;

    @Override
    public void add(TestDemoRef2View testDemoRefView) {
        TestDemoView testDemoView = testDemoRefView.getTestDemoView();
        TestDemoView testDemoView2 = testDemoRefView.getTestDemoView2();
        TestDemoRef2 testDemoRef2 = new TestDemoRef2()
                .setId(YitIdHelper.nextId())
                .setDemoId(testDemoView.getId())
                .setDemoId2(testDemoView2.getId());
        save(testDemoRef2);
    }

    @Override
    public void delete(List<TestDemoRef2View> testDemoRef2Views) {
        List<TestDemoRef2> testDemoRef2s = new ArrayList<>();
        for (TestDemoRef2View testDemoRef2View : testDemoRef2Views) {
            TestDemoRef2 testDemoRef2 = new TestDemoRef2()
                    .setId(testDemoRef2View.getId());
            testDemoRef2s.add(testDemoRef2);
        }
        removeByIds(testDemoRef2s);
    }

    @Override
    public Fetch.Vo<TestDemoRef2View> fetch(Fetch fetch) {
        NovaQueryUtils.Result<TestDemoRef2> testDemoRefResult = NovaQueryUtils.buildWrapper(TestDemoRef2View.class, fetch);
        Page<TestDemoRef2> page = testDemoRefResult.getPage();
        LambdaQueryWrapper<TestDemoRef2> wrapper = testDemoRefResult.getWrapper();
        IPage<TestDemoRef2> iPage = page(page, wrapper);
        List<TestDemoRef2> records = iPage.getRecords();
        List<TestDemoRef2View> testDemoRef2Views = new ArrayList<>();
        if (Emptys.check(records)) {
            List<TestDemo> testDemos = testDemoService.listByIds(new JArrayList<>(records).getProperty(TestDemoRef2::getDemoId).comparing());
            JMap<Long, TestDemo> testDemoJMaps = new JArrayList<>(testDemos).toMap(TestDemo::getId).cover();
            List<TestDemo> testDemos2s = testDemoService.listByIds(new JArrayList<>(records).getProperty(TestDemoRef2::getDemoId2).comparing());
            JMap<Long, TestDemo> testDemo2JMaps = new JArrayList<>(testDemos2s).toMap(TestDemo::getId).cover();
            for (TestDemoRef2 testDemoRef2 : records) {
                TestDemo testDemo = testDemoJMaps.get(testDemoRef2.getDemoId());
                TestDemo testDemo2 = testDemo2JMaps.get(testDemoRef2.getDemoId2());
                TestDemoRef2View testDemoRef2View = Beans.copy(TestDemoRef2View.class, testDemoRef2)
                        .setTestDemoView2(Beans.copy(TestDemoView.class, testDemo2))
                        .setTestDemoView(Beans.copy(TestDemoView.class, testDemo));
                testDemoRef2Views.add(testDemoRef2View);
            }
        }
        return new Fetch.Vo<TestDemoRef2View>()
                .setTotal(iPage.getTotal())
                .setRecords(testDemoRef2Views);
    }
}
