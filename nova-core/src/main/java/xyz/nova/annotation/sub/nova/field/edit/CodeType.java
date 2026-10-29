package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;

public @interface CodeType {

    @Comment("类型")
    Type type() default Type.JSON;

    enum Type {
        @Comment("json")
        JSON,
        @Comment("java")
        JAVA,
        @Comment("sql")
        SQL,
        @Comment("xml")
        XML,
        @Comment("html")
        YAML,
        @Comment("css")
        HTML,
        @Comment("yaml")
        CSS,
        @Comment("shell")
        SHELL,
        @Comment("markdown")
        MARKDOWN,
        @Comment("properties")
        PROPERTIES
    }
}
