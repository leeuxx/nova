package xyz.nova.view.query;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TestDemoQuery {

    private List<Long> id;

    private String name;

    private String nick;

    private Long demo2Id;

    private Long parentId;

    private List<String> sex;

    private List<String> hobby;

    private List<LocalDateTime> createTime;

    private List<LocalDate> bindTime;

    private Boolean status;

    private List<BigDecimal> size;

    private List<String> tags;

}
