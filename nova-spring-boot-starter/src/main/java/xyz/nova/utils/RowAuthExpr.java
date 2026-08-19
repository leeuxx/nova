package xyz.nova.utils;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.sub.nova.row.ExprBool;
import xyz.nova.service.authority.AuthorityProxy;

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
