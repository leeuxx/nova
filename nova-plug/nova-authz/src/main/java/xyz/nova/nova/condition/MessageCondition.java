package xyz.nova.nova.condition;

import lombok.Data;

@Data
public class MessageCondition {

    private Long userId;

    private Boolean allowClose;

    private String type;

}
