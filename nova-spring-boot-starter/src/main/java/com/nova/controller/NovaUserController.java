package com.nova.controller;

import com.nova.annotation.config.Comment;
import com.nova.annotation.config.RestMappingController;
import com.nova.dto.NovaUserGetMenu;
import com.nova.utils.R;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.Arrays;
import java.util.List;

@AllArgsConstructor
@RestMappingController("nova/user")
public class NovaUserController {

    @Comment("获取菜单")
    @PostMapping("getMenu")
    public R<List<NovaUserGetMenu.Vo>> getMenu() {
        List<NovaUserGetMenu.Vo> vos = Arrays.asList(
                new NovaUserGetMenu.Vo()
                        .setId(1L)
                        .setCode("home")
                        .setName("主页")
                        .setIcon("material-symbols:home-outline"),
                new NovaUserGetMenu.Vo()
                        .setId(2L)
                        .setCode("sys")
                        .setName("系统管理")
                        .setIcon("material-symbols:settings-outline"),
                new NovaUserGetMenu.Vo()
                        .setId(3L)
                        .setCode("user")
                        .setValue("TestDemo")
                        .setType("table")
                        .setName("用户管理")
                        .setIcon("material-symbols:person-outline")
                        .setPid(2L),
                new NovaUserGetMenu.Vo()
                        .setId(4L)
                        .setCode("role")
                        .setValue("TestDemo2")
                        .setType("table")
                        .setName("部门管理")
                        .setIcon("material-symbols:group-outline")
                        .setPid(2L),
                new NovaUserGetMenu.Vo()
                        .setId(5L)
                        .setCode("menu")
                        .setValue("MENU")
                        .setType("tpl")
                        .setName("菜单管理")
                        .setIcon("material-symbols:menu")
                        .setPid(2L)
        );
        return R.ok(vos);
    }

}
