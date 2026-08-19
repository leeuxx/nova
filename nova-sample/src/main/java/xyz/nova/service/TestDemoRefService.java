package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import xyz.nova.entity.TestDemo;
import xyz.nova.entity.TestDemo4;
import xyz.nova.entity.TestDemoRef;
import xyz.nova.entity.data.Fetch;
import xyz.nova.mapper.TestDemoRefMapper;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.Beans;
import xyz.nova.utils.Emptys;
import xyz.nova.utils.NovaMyBatisUtils;
import xyz.nova.utils.collections.list.JArrayList;
import xyz.nova.utils.collections.map.JMap;
import xyz.nova.view.TestDemo4View;
import xyz.nova.view.TestDemoRefView;
import xyz.nova.view.TestDemoView;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor(onConstructor_ = @Lazy)
public class TestDemoRefService extends ServiceImpl<TestDemoRefMapper, TestDemoRef> implements DataProxy<TestDemoRefView, Object> {

    private TestDemoService testDemoService;

    private TestDemo4Service testDemo4Service;

    @Override
    public void add(List<TestDemoRefView> testDemoRefViews) {
        for (TestDemoRefView testDemoRefView : testDemoRefViews) {
            TestDemoView testDemoView = testDemoRefView.getTestDemoView();
            TestDemo4View testDemo4View = testDemoRefView.getTestDemo4View();
            TestDemoRef testDemoRef = new TestDemoRef()
                    .setId(YitIdHelper.nextId())
                    .setDemoId(testDemoView.getId())
                    .setDemo4Id(testDemo4View.getId());
            save(testDemoRef);
        }
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
    public Fetch.Vo<TestDemoRefView> fetch(Fetch<Object> fetch) {
        NovaMyBatisUtils.Result<TestDemoRef> testDemoRefResult = NovaMyBatisUtils.buildWrapper(TestDemoRefView.class, fetch);
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
