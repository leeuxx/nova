package com.nova.service.authority;

import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.row.ExprBool;
import com.nova.utils.AuthorityUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Comment("根据菜单编码控制自定义按钮权限")
public class RowAuthExpr implements ExprBool.ExprHandler {

    private AuthorityProxy authorityProxy;

    @Override
    public boolean handler(String params) {
        return authorityProxy.menuPermission(AuthorityUtils.getToken(), params);
    }
}
