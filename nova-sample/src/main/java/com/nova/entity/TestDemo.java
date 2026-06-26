package com.nova.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
public class TestDemo {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long demo2Id;

    private String name;

    private String nick;

    private String sex;

    private String tel;

    private String hobby;

    private LocalDateTime createTime;

    private LocalDateTime bindTime;

    private String text;

    private Boolean status;

    private BigDecimal size;

    private String tags;

    private String file;

    private String file2;

}
