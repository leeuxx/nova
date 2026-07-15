package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.Tree;
import com.nova.entity.TestDemo;
import com.nova.entity.TestDemoRef2;
import com.nova.mapper.TestDemoRef2Mapper;
import com.nova.utils.Beans;
import com.nova.utils.Emptys;
import com.nova.utils.NovaQueryUtils;
import com.nova.utils.collections.list.JArrayList;
import com.nova.utils.collections.list.JList;
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
    public Tree.Vo<TestDemoRef2View> tree(Tree tree) {
        Tree.Vo<TestDemoRef2View> vo = new Tree.Vo<TestDemoRef2View>()
                .setRootList(new ArrayList<>())
                .setChildrenList(new ArrayList<>());
        // 获取数据
        LambdaQueryWrapper<TestDemoRef2> lambdaQueryWrapper = NovaQueryUtils.buildWrapper(TestDemoRef2View.class, tree);
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
