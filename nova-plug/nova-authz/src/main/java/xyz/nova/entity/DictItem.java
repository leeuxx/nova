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
@TableName("n_upms_dict_item")
public class DictItem implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId
    private Long id;

    private Long dictId;

    private String code;

    private String val;

    private String msg;

    private Boolean status;

    private LocalDateTime createTime;

}
