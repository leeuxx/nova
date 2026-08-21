package xyz.nova.nova.condition;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class UserCondition {

    private String name;

    private Boolean isAdmin;

    private Boolean status;

    private Long orgId;

    private List<LocalDateTime> createTime;

}
