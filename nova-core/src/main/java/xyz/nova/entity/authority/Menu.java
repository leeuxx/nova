package xyz.nova.entity.authority;

import xyz.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class Menu {

    @Comment("id,必填")
    private Long id;

    @Comment("编码,必填")
    private String code;

    @Comment("名称,必填")
    private String name;

    @Comment("值")
    private String value;

    @Comment("图标")
    private String icon;

    @Comment("父级id")
    private Long pid;

    @Comment("类型")
    private Type type = Type.DIR;

    @Comment("是否显示")
    private Boolean show = true;

    @Comment("系统按钮配置,Type.NOVA时有效")
    private SystemButton systemButton = new SystemButton();

    public enum Type {
        @Comment("目录")
        DIR,
        @Comment("nova视图")
        NOVA,
        @Comment("自定义视图（支持本地文件和远程url）")
        TPL,
        @Comment("按钮")
        BUTTON
    }

    @Data
    @Accessors(chain = true)
    public static class SystemButton {

        @Comment("新增按钮")
        private Boolean add = false;

        @Comment("编辑按钮")
        private Boolean edit = false;

        @Comment("删除按钮")
        private Boolean delete = false;

    }
}
