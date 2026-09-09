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
@TableName("n_upms_menu")
public class Menu implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId
    private Long id;

    private Long parentId;

    private String code;

    private String icon;

    private String name;

    private Integer sort;

    private Boolean status;

    private String type;

    private String value;

    private String param;

    private String serviceName;

    private LocalDateTime createTime;

}
