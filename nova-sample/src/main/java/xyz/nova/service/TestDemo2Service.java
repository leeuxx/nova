package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import xyz.nova.annotation.sub.nova.field.view.PopHandler;
import xyz.nova.entity.TestDemo;
import xyz.nova.entity.TestDemo2;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Fetch;
import xyz.nova.entity.data.PromptSearch;
import xyz.nova.mapper.TestDemo2Mapper;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.NovaQueryUtils;
import xyz.nova.view.TestDemo2View;
import xyz.nova.view.TestDemoView;
import lombok.AllArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import xyz.nova.view.query.Test2DemoCondition;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Service
@AllArgsConstructor(onConstructor_ = @Lazy)
public class TestDemo2Service extends ServiceImpl<TestDemo2Mapper, TestDemo2> implements DataProxy<TestDemo2View, Test2DemoCondition>, PopHandler {

    private TestDemoService testDemoService;

    @Override
    public Fetch.Vo<TestDemo2View> fetch(Fetch<Test2DemoCondition> fetch) {
        NovaQueryUtils.Result<TestDemo2> testDemo2Result = NovaQueryUtils.buildWrapper(TestDemo2View.class, fetch);
        Page<TestDemo2> page = testDemo2Result.getPage();
        LambdaQueryWrapper<TestDemo2> wrapper = testDemo2Result.getWrapper();
        IPage<TestDemo2> iPage = page(page, wrapper);
        List<TestDemo2> records = iPage.getRecords();

        List<Long> demoIdList = records.stream()
                .map(TestDemo2::getDemoId)
                .filter(Objects::nonNull)
                .toList();
        List<TestDemo2View> testDemo2Views = new ArrayList<>();
        if (!demoIdList.isEmpty()) {
            List<TestDemo> testDemos = testDemoService.listByIds(demoIdList);
            for (TestDemo2 record : records) {
                TestDemo2View testDemo2View = new TestDemo2View();
                BeanUtils.copyProperties(record, testDemo2View); // 源，目标
                for (TestDemo testDemo : testDemos) {
                    if (record.getDemoId().equals(testDemo.getId())) {
                        TestDemoView testDemoView = new TestDemoView();
                        BeanUtils.copyProperties(testDemo, testDemoView); // 源，目标
                        testDemo2View.setTestDemoView(testDemoView);
                    }
                }
                testDemo2Views.add(testDemo2View);
            }
        }
        return new Fetch.Vo<TestDemo2View>()
                .setTotal(iPage.getTotal())
                .setRecords(testDemo2Views);
    }

    @Override
    public TestDemo2View details(Details details) {
        TestDemo2 testDemo2 = getById(details.getValue());
        TestDemo testDemo = testDemoService.getById(testDemo2.getDemoId());
        TestDemo2View testDemo2View = new TestDemo2View();
        BeanUtils.copyProperties(testDemo2, testDemo2View); // 源，目标
        if (testDemo != null) {
            TestDemoView testDemoView = new TestDemoView();
            BeanUtils.copyProperties(testDemo, testDemoView); // 源，目标
            testDemo2View.setTestDemoView(testDemoView);
        }
        return testDemo2View;
    }

    @Override
    public PromptSearch.Vo promptSearch(PromptSearch promptSearch) {
        LambdaQueryWrapper<TestDemo2> lambdaQueryWrapper = new LambdaQueryWrapper<TestDemo2>()
                .like(TestDemo2::getName, promptSearch.getPrompt());
        IPage<TestDemo2> iPage = page(Page.of(promptSearch.getCurrent(), promptSearch.getSize()), lambdaQueryWrapper);
        List<TestDemo2> records = iPage.getRecords();
        List<PromptSearch.Vo.Record> list = new ArrayList<>();
        for (TestDemo2 testDemo2 : records) {
            PromptSearch.Vo.Record record = new PromptSearch.Vo.Record()
                    .setId(testDemo2.getId().toString())
                    .setName(testDemo2.getName());
            list.add(record);
        }
        return new PromptSearch.Vo()
                .setTotal(iPage.getTotal())
                .setRecords(list);
    }

    @Override
    public List<PopModel> getPopModel(String param, String value) {
        if (param.equals("1")) {
            TestDemo testDemo = testDemoService.getById(value);
            return Arrays.asList(
                    new PopModel().setName("用户ID").setValue(String.valueOf(testDemo.getId())),
                    new PopModel().setName("用户名").setValue(testDemo.getName()),
                    new PopModel().setName("用户昵称").setValue(testDemo.getNick()),
                    new PopModel().setName("手机号码").setValue(testDemo.getTel()),
                    new PopModel().setName("状态").setValue(String.valueOf(testDemo.getStatus())).setType(Type.BOOLEAN),
                    new PopModel().setName("爱好").setValue(testDemo.getTags()).setType(Type.TAG)
            );
        }
        if (param.equals("2")) {
            return Arrays.asList(
                    new PopModel().setName("测试ID").setValue("123"),
                    new PopModel().setName("测试名称").setValue("王麻子")
            );
        }
        if (param.equals("3")) {
            return Arrays.asList(
                    new PopModel().setName("单元格").setValue("123"),
                    new PopModel().setName("显隐").setValue("true").setType(Type.BOOLEAN)
            );
        }
        return null;
    }
}
