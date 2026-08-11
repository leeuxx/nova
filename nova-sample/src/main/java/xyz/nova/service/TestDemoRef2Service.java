package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import xyz.nova.entity.data.Fetch;
import xyz.nova.entity.data.Tree;
import xyz.nova.entity.TestDemo;
import xyz.nova.entity.TestDemoRef2;
import xyz.nova.mapper.TestDemoRef2Mapper;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.Beans;
import xyz.nova.utils.Emptys;
import xyz.nova.utils.NovaQueryUtils;
import xyz.nova.utils.collections.list.JArrayList;
import xyz.nova.utils.collections.list.JList;
import xyz.nova.utils.collections.map.JMap;
import xyz.nova.view.TestDemoRef2View;
import xyz.nova.view.TestDemoView;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor(onConstructor_ = @Lazy)
public class TestDemoRef2Service extends ServiceImpl<TestDemoRef2Mapper, TestDemoRef2> implements DataProxy<TestDemoRef2View, Object> {

    private TestDemoService testDemoService;

    @Override
    public void add(List<TestDemoRef2View> testDemoRefViews) {
        Long id = testDemoRefViews.get(0).getTestDemoView().getId();
        remove(new LambdaQueryWrapper<TestDemoRef2>()
                .eq(TestDemoRef2::getDemoId, id)
        );
        for (TestDemoRef2View testDemoRefView : testDemoRefViews) {
            TestDemoView testDemoView = testDemoRefView.getTestDemoView();
            TestDemoView testDemoView2 = testDemoRefView.getTestDemoView2();
            TestDemoRef2 testDemoRef2 = new TestDemoRef2()
                    .setId(YitIdHelper.nextId())
                    .setDemoId(testDemoView.getId())
                    .setDemoId2(testDemoView2.getId());
            save(testDemoRef2);
        }
    }

    @Override
    public Fetch.Vo<TestDemoRef2View> fetch(Fetch<Object> fetch) {
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


    @Override
    public Tree.Vo<TestDemoRef2View> tree(Tree tree) {
        Tree.Vo<TestDemoRef2View> vo = new Tree.Vo<TestDemoRef2View>()
                .setRootList(new ArrayList<>())
                .setChildrenList(new ArrayList<>());
        // 获取数据
        LambdaQueryWrapper<TestDemoRef2> lambdaQueryWrapper = NovaQueryUtils.buildWrapper(TestDemoRef2View.class, tree);
        lambdaQueryWrapper.eq(TestDemoRef2::getDemoId, tree.getOperateValue());
        JList<TestDemoRef2> testDemoRef2s = new JArrayList<>(list(lambdaQueryWrapper));
        if (Emptys.check(testDemoRef2s)) {
            // 本身
            TestDemo thisTestDemo = testDemoService.getById(testDemoRef2s.get(0).getDemoId());
            TestDemoView testDemoView = Beans.copy(TestDemoView.class, thisTestDemo);
            // 获取关联信息
            JList<TestDemo> testDemos = new JArrayList<>(testDemoService.listByIds(testDemoRef2s.getProperty(TestDemoRef2::getDemoId2)));
            JList<TestDemo> rootList = testDemos.filter().isNull(TestDemo::getParentId).list();
            JList<TestDemo> childrenList = testDemos.filter().isNotNull(TestDemo::getParentId).list();
            // 根节点处理
            for (TestDemo testDemo : rootList) {
                TestDemoRef2View testDemoRef2View = new TestDemoRef2View()
                        .setId(testDemo.getId())
                        .setTestDemoView(testDemoView)
                        .setTestDemoView2(Beans.copy(TestDemoView.class, testDemo));
                vo.getRootList().add(testDemoRef2View);
            }
            // 子节点处理
            for (TestDemo testDemo : childrenList) {
                TestDemoRef2View testDemoRef2View = new TestDemoRef2View()
                        .setId(testDemo.getId())
                        .setTestDemoView(testDemoView)
                        .setTestDemoView2(Beans.copy(TestDemoView.class, testDemo));
                vo.getChildrenList().add(testDemoRef2View);
            }

        }
        return vo;
    }

}
