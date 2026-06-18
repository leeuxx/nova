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

    void insert(@Param("tableName") String tableName,
                @Param("columns") List<String> columns,
                @Param("values") List<String> values);

    void update(@Param("tableName") String tableName,
                @Param("columns") List<String> columns,
                @Param("values") List<String> values,
                @Param("pkColumn") String pkColumn,
                @Param("pkValue") String pkValue);

    void delete(@Param("tableName") String tableName,
                @Param("pkColumn") String pkColumn,
                @Param("pkValues") List<String> pkValues);

    @Data
    @Accessors(chain = true)
    class Condition {

        @Comment("字段名")
        private String column;

        @Comment("字段值")
        private String value;

        @Comment("类型")
        private String type;

        @Comment("是否高级查询")
        private boolean vague;

        @Comment("扩展参数")
        private String ext;
    }

}
