package xyz.nova.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("n_upms_role")
public class Role implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId
    private Long id;

    private String code;

    private String name;

    private Boolean status;

    private LocalDateTime createTime;
}
