package xyz.nova.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import lombok.experimental.Accessors;

import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
public class TestDemo3 {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long demoId;

    private String name;

    private String msg;

    private String file;

    private LocalDateTime createTime;

}
