package com.nova.dto;

import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class NovaUserGetMenu {

    @Data
    @Accessors(chain = true)
    public static class Vo {

        /**
         * id
         */
        private Long id;

        /**
         * 编码
         */
        private String code;

        /**
         * 名称
         */
        private String name;

        /**
         * 类型 table=表格视图
         */
        private String type;

        /**
         * 值
         */
        private String value;

        /**
         * 图标
         */
        private String icon;

        /**
         * 父级id
         */
        private Long pid;

    }
}
