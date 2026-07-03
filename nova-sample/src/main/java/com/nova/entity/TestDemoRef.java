package com.nova.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class TestDemoRef {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long demoId;

    private Long demo4Id;

}
