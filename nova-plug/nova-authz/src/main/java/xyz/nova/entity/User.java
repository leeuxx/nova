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
@TableName("n_upms_user")
public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId
    private Long id;

    private String name;

    private String account;

    private String password;

    private String salt;

    private Boolean isAdmin;

    private Boolean status;

    private Long orgId;

    private String remark;

    private LocalDateTime resetPwdTime;

    private LocalDateTime createTime;

}
