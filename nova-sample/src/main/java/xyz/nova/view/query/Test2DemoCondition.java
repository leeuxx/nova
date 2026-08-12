package xyz.nova.view.query;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class Test2DemoCondition {

    private Long demoId;

    private String name;

    private Integer type;

    private List<LocalDateTime> createTime;

}
