package com.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import com.nova.annotation.sub.nova.field.edit.ButtonHandle;
import com.nova.annotation.sub.nova.field.edit.ChoiceFetchHandler;
import com.nova.annotation.sub.nova.row.OperationHandler;
import com.nova.entity.TestDemo;
import com.nova.entity.TestDemo2;
import com.nova.entity.TestDemo3;
import com.nova.entity.data.Details;
import com.nova.entity.data.Fetch;
import com.nova.entity.data.Tree;
import com.nova.mapper.TestDemoMapper;
import com.nova.service.data.DataProxy;
import com.nova.utils.NovaQueryUtils;
import com.nova.utils.collections.list.JArrayList;
import com.nova.utils.collections.list.JList;
import com.nova.view.TestDemo2View;
import com.nova.view.TestDemo3View;
import com.nova.view.TestDemoView;
import lombok.AllArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@AllArgsConstructor(onConstructor_ = @Lazy)
public class TestDemoService extends ServiceImpl<TestDemoMapper, TestDemo> implements ChoiceFetchHandler, DataProxy<TestDemoView>, OperationHandler<Long, Object>, ButtonHandle {

    private TestDemo2Service testDemo2Service;

    private TestDemo3Service testDemo3Service;

    @Override
    public List<VLModel> fetch(String[] params) {
        return Arrays.asList(new VLModel().setValue("1").setLabel("篮球"), new VLModel().setValue("2").setLabel("羽毛球").setColor("#fe6767"), new VLModel().setValue("3").setLabel("LOL"), new VLModel().setValue("4").setLabel("大象"), new VLModel().setValue("5").setLabel("编程"));
    }

    @Override
    public Fetch.Vo<TestDemoView> fetch(Fetch fetch) {
        NovaQueryUtils.Result<TestDemo> testDemoResult = NovaQueryUtils.buildWrapper(TestDemoView.class, fetch);
        Page<TestDemo> page = testDemoResult.getPage();
        LambdaQueryWrapper<TestDemo> wrapper = testDemoResult.getWrapper().isNull(TestDemo::getParentId);
        IPage<TestDemo> iPage = page(page, wrapper);
        List<TestDemo> records = iPage.getRecords();
        List<Long> demo2IdList = records.stream().map(TestDemo::getDemo2Id).filter(Objects::nonNull).toList();
        List<TestDemo2> testDemo2s = new ArrayList<>();
        if (!demo2IdList.isEmpty()) {
            testDemo2s = testDemo2Service.listByIds(demo2IdList);
        }
        List<Long> demoIdList = records.stream().map(TestDemo::getId).filter(Objects::nonNull).toList();
        List<TestDemo3> testDemo3s = new ArrayList<>();
        if (!demoIdList.isEmpty()) {
            testDemo3s = testDemo3Service.list(new LambdaQueryWrapper<TestDemo3>().in(TestDemo3::getDemoId, demoIdList));
        }
        List<TestDemoView> testDemoViews = new ArrayList<>();
        for (TestDemo record : records) {
            TestDemoView testDemoView = new TestDemoView();
            BeanUtils.copyProperties(record, testDemoView); // 源，目标
            for (TestDemo2 testDemo2 : testDemo2s) {
                if (testDemo2.getId().equals(record.getDemo2Id())) {
                    TestDemo2View testDemo2View = new TestDemo2View();
                    BeanUtils.copyProperties(testDemo2, testDemo2View); // 源，目标
                    testDemoView.setTestDemo2View(testDemo2View);
                }
            }
            for (TestDemo3 testDemo3 : testDemo3s) {
                if (testDemo3.getDemoId().equals(record.getId())) {
                    TestDemo3View testDemo3View = new TestDemo3View();
                    BeanUtils.copyProperties(testDemo3, testDemo3View); // 源，目标
                    testDemoView.setTestDemo3View(testDemo3View);
                }
            }
            testDemoViews.add(testDemoView);
        }
        return new Fetch.Vo<TestDemoView>().setTotal(iPage.getTotal()).setRecords(testDemoViews);
    }

    @Override
    public TestDemoView details(Details details) {
        TestDemo testDemo = getById(details.getStorageFieldValue());
        TestDemoView testDemoView = new TestDemoView();
        BeanUtils.copyProperties(testDemo, testDemoView); // 源，目标
        if (testDemo.getParentId() != null) {
            TestDemo topTestDemo = getById(testDemo.getParentId());
            TestDemoView topTestDemoView = new TestDemoView();
            BeanUtils.copyProperties(topTestDemo, topTestDemoView); // 源，目标
            testDemoView.setTestDemoView(topTestDemoView);
        }
        TestDemo2 testDemo2 = testDemo2Service.getById(testDemo.getDemo2Id());
        if (testDemo2 != null) {
            TestDemo2View testDemo2View = new TestDemo2View();
            BeanUtils.copyProperties(testDemo2, testDemo2View); // 源，目标
            testDemoView.setTestDemo2View(testDemo2View);
        }
        return testDemoView;
    }

    @Override
    public Tree.Vo<TestDemoView> tree(Tree tree) {
        Tree.Vo<TestDemoView> vo = new Tree.Vo<TestDemoView>()
                .setRootList(new ArrayList<>())
                .setChildrenList(new ArrayList<>());
        LambdaQueryWrapper<TestDemo> lambdaQueryWrapper = NovaQueryUtils.buildWrapper(TestDemoView.class, tree);
        JList<TestDemo> testDemos = new JArrayList<>(list(lambdaQueryWrapper));
        JList<TestDemo> rootList = testDemos.filter().isNull(TestDemo::getParentId).list();
        JList<TestDemo> childrenList = testDemos.filter().isNotNull(TestDemo::getParentId).list();
        List<Long> demo2IdList = testDemos.stream().map(TestDemo::getDemo2Id).filter(Objects::nonNull).toList();
        List<TestDemo2> testDemo2s = new ArrayList<>();
        if (!demo2IdList.isEmpty()) {
            testDemo2s = testDemo2Service.listByIds(demo2IdList);
        }
        List<Long> demoIdList = testDemos.stream().map(TestDemo::getId).filter(Objects::nonNull).toList();
        List<TestDemo3> testDemo3s = new ArrayList<>();
        if (!demoIdList.isEmpty()) {
            testDemo3s = testDemo3Service.list(new LambdaQueryWrapper<TestDemo3>().in(TestDemo3::getDemoId, demoIdList));
        }
        // 根节点处理
        for (TestDemo record : rootList) {
            TestDemoView testDemoView = new TestDemoView();
            BeanUtils.copyProperties(record, testDemoView); // 源，目标
            for (TestDemo2 testDemo2 : testDemo2s) {
                if (testDemo2.getId().equals(record.getDemo2Id())) {
                    TestDemo2View testDemo2View = new TestDemo2View();
                    BeanUtils.copyProperties(testDemo2, testDemo2View); // 源，目标
                    testDemoView.setTestDemo2View(testDemo2View);
                }
            }
            for (TestDemo3 testDemo3 : testDemo3s) {
                if (testDemo3.getDemoId().equals(record.getId())) {
                    TestDemo3View testDemo3View = new TestDemo3View();
                    BeanUtils.copyProperties(testDemo3, testDemo3View); // 源，目标
                    testDemoView.setTestDemo3View(testDemo3View);
                }
            }
            vo.getRootList().add(testDemoView);
        }
        // 子节点处理
        for (TestDemo record : childrenList) {
            TestDemoView testDemoView = new TestDemoView();
            BeanUtils.copyProperties(record, testDemoView); // 源，目标
            testDemoView.setTestDemoView(new TestDemoView()
                    .setId(record.getParentId())
            );
            for (TestDemo2 testDemo2 : testDemo2s) {
                if (testDemo2.getId().equals(record.getDemo2Id())) {
                    TestDemo2View testDemo2View = new TestDemo2View();
                    BeanUtils.copyProperties(testDemo2, testDemo2View); // 源，目标
                    testDemoView.setTestDemo2View(testDemo2View);
                }
            }
            for (TestDemo3 testDemo3 : testDemo3s) {
                if (testDemo3.getDemoId().equals(record.getId())) {
                    TestDemo3View testDemo3View = new TestDemo3View();
                    BeanUtils.copyProperties(testDemo3, testDemo3View); // 源，目标
                    testDemoView.setTestDemo3View(testDemo3View);
                }
            }
            vo.getChildrenList().add(testDemoView);
        }
        return vo;
    }

    @Override
    public void add(TestDemoView testDemoView) {
        testDemoView.setId(YitIdHelper.nextId());
        TestDemo testDemo = new TestDemo();
        BeanUtils.copyProperties(testDemoView, testDemo);
        testDemo.setDemo2Id(testDemoView.getTestDemo2View().getId());
        save(testDemo);
        TestDemo3View testDemo3View = testDemoView.getTestDemo3View();
        if (testDemo3View != null) {
            TestDemo3 testDemo3 = new TestDemo3();
            BeanUtils.copyProperties(testDemo3View, testDemo3);
            testDemo3.setId(YitIdHelper.nextId()).setDemoId(testDemo.getId());
            testDemo3Service.save(testDemo3);
        }
    }

    @Override
    public void delete(List<TestDemoView> testDemoViews) {
        List<TestDemo> testDemoList = new ArrayList<>();
        for (TestDemoView testDemoView : testDemoViews) {
            TestDemo testDemo = new TestDemo();
            BeanUtils.copyProperties(testDemoView, testDemo);
            testDemoList.add(testDemo);
        }
        removeBatchByIds(testDemoList);
    }

    @Override
    public void update(TestDemoView testDemoView) {
        TestDemo testDemo = new TestDemo();
        BeanUtils.copyProperties(testDemoView, testDemo);
        if (testDemoView.getTestDemo2View() != null) {
            testDemo.setDemo2Id(testDemoView.getTestDemo2View().getId());
        }
        TestDemoView topTestDemoView = testDemoView.getTestDemoView();
        if (topTestDemoView != null) {
            testDemo.setParentId(topTestDemoView.getId());
        }
        updateById(testDemo);
        TestDemo3View testDemo3View = testDemoView.getTestDemo3View();
        if (testDemo3View != null) {
            TestDemo3 testDemo3 = testDemo3Service.getOne(new LambdaQueryWrapper<TestDemo3>().eq(TestDemo3::getDemoId, testDemo.getId()));
            if (testDemo3 == null) {
                testDemo3 = new TestDemo3();
                BeanUtils.copyProperties(testDemo3View, testDemo3);
                testDemo3.setId(YitIdHelper.nextId()).setDemoId(testDemo.getId());
            } else {
                testDemo3.setName(testDemo3View.getName()).setMsg(testDemo3View.getMsg()).setFile(testDemo3View.getFile());
            }
            testDemo3Service.saveOrUpdate(testDemo3);
        }
    }

    @Override
    public Object novaFormValue(List<Long> novaIds, String param) {
        return new TestDemoView.TestRow().setName("张三").setTestDemo2View(new TestDemo2View().setId(1L).setName("财务部")).setTestDemo3View(new TestDemo3View().setTestDemoView(new TestDemoView().setId(1001L).setName("张三")).setName("随机名称" + YitIdHelper.nextId()).setMsg("测试内容").setFile("https://cdn.ossfile.mxrvending.com/tyGoods/6902890238345.png,https://cdn.ossfile.mxrvending.com/tyGoods/6902890235156.png,https://cdn.ossfile.mxrvending.com/tyGoods/6902890234562.png")).setHobby("2").setFile("https://pic.rmb.bdstatic.com/bjh/bc1178073846/250713/6c653fba298a0dbb91dc600e620e1813.jpeg,https://cdn.ossfile.mxrvending.com/tyGoods/6902890249603.png").setCreateTime(LocalDateTime.now());
    }

    @Override
    public String exec(List<Long> novaIds, Object o, String param) {
        if (param.equals("1")) {
            TestDemoView.TestRow testRow = (TestDemoView.TestRow) o;
            System.out.println(testRow);
        }
        return null;
    }

    @Override
    public boolean buttonHandle(String param, Map<String, String> transmitParam) {
        return true;
    }
}
