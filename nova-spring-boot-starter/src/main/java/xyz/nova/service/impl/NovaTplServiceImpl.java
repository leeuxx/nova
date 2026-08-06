package xyz.nova.service.impl;

import xyz.nova.dto.NovaTplOpen;
import xyz.nova.service.NovaTplService;
import xyz.nova.utils.AuthorityUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class NovaTplServiceImpl implements NovaTplService {

    @Override
    public String getTplPath(NovaTplOpen novaTplOpen) {
        StringBuilder url = new StringBuilder(novaTplOpen.getPath());
        List<String> params = new ArrayList<>();
        // 必传参数
        params.add("token=" + AuthorityUtils.getToken());
        params.add("novaName=" + novaTplOpen.getNovaName());
        // 可选参数：novaIds和param
        List<String> novaIdValues = novaTplOpen.getNovaIdValues();
        if (novaIdValues != null && !novaIdValues.isEmpty()) {
            params.add("novaIds=" + String.join(",", novaIdValues));
        }
        String operationParam = novaTplOpen.getOperationParam();
        if (operationParam != null && !operationParam.isEmpty()) {
            params.add("param=" + operationParam);
        }
        return url.append("?").append(String.join("&", params)).toString();
    }
}
