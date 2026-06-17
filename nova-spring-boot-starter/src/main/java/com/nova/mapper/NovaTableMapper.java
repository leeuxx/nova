package com.nova.mapper;

import com.nova.annotation.Comment;
import lombok.Data;
import lombok.experimental.Accessors;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface NovaTableMapper {

    Long count(@Param("tableName") String tableName,
               @Param("conditions") List<Condition> conditions);

    List<Map<String, Object>> selectPage(@Param("tableName") String tableName,
                                         @Param("columns") List<String> columns,
                                         @Param("conditions") List<Condition> conditions,
                                         @Param("orderBy") String orderBy,
                                         @Param("offset") long offset,
                                         @Param("size") long size);

    @Data
    @Accessors(chain = true)
    class Condition {

        @Comment("字段名")
        private String column;

        @Comment("字段值")
        private Object value;

        @Comment("是否模糊查询")
        private boolean vague;

    }

}
