package com.nova.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
public class TestDemo2 {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long demoId;

    private String name;

    private String msg;

    private LocalDateTime createTime;

    private Boolean status;

    private Integer type;

}
