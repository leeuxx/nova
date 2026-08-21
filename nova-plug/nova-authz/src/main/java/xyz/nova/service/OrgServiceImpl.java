package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.nova.annotation.sub.nova.row.OperationHandler;
import xyz.nova.entity.Menu;
import xyz.nova.entity.Org;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Tree;
import xyz.nova.error.NovaException;
import xyz.nova.mapper.OrgMapper;
import xyz.nova.nova.MenuNova;
import xyz.nova.nova.OrgNova;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.BeanCopyUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrgServiceImpl extends ServiceImpl<OrgMapper, Org> implements DataProxy<OrgNova, Object>, OperationHandler<Long, Object> {

    @Override
    public void add(OrgNova orgNova) {
        long count = count(new LambdaQueryWrapper<Org>()
                .eq(Org::getCode, orgNova.getCode())
        );
        if (count > 0) {
            throw new NovaException("code已存在");
        }
        Org org = BeanCopyUtils.copy(orgNova, Org.class)
                .setId(YitIdHelper.nextId())
                .setCreateTime(LocalDateTime.now());
        if (orgNova.getOrgNova() != null) {
            org.setParentId(orgNova.getOrgNova().getId());
        }
        save(org);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(List<OrgNova> orgNova) {
        List<Long> ids = orgNova.stream().map(OrgNova::getId).toList();
        cascadeDelete(ids);
    }

    @Override
    public void update(OrgNova orgNova) {
        long count = count(new LambdaQueryWrapper<Org>()
                .eq(Org::getCode, orgNova.getCode())
                .ne(Org::getId, orgNova.getId())
        );
        if (count > 0) {
            throw new NovaException("code已存在");
        }
        Org org = BeanCopyUtils.copy(orgNova, Org.class);
        if (orgNova.getOrgNova() != null) {
            org.setParentId(orgNova.getOrgNova().getId());
        }
        updateById(org);
    }

    @Override
    public Tree.Vo<OrgNova> tree(Tree tree) {
        List<Org> orgs = list(new LambdaQueryWrapper<Org>()
                .orderByAsc(Org::getCreateTime)
        );
        // 使用 partitioningBy 只需遍历一次，性能更好
        Map<Boolean, List<Org>> partitioned = orgs.stream()
                .collect(Collectors.partitioningBy(org -> org.getParentId() == null));
        List<OrgNova> rootList = partitioned.get(true).stream()
                .map(org -> BeanCopyUtils.copy(org, OrgNova.class))
                .toList();
        List<OrgNova> childrenList = partitioned.get(false).stream()
                .map(org -> BeanCopyUtils.copy(org, OrgNova.class).setOrgNova(
                        new OrgNova().setId(org.getParentId())
                ))
                .toList();
        return new Tree.Vo<OrgNova>()
                .setRootList(rootList)
                .setChildrenList(childrenList);
    }

    @Override
    public OrgNova details(Details details) {
        Org org = getById(details.getValue());
        OrgNova orgNova = BeanCopyUtils.copy(org, OrgNova.class);
        if (org.getParentId() != null) {
            Org parent = getById(org.getParentId());
            orgNova.setOrgNova(new OrgNova()
                    .setId(parent.getId())
                    .setName(parent.getName())
            );
        }
        return orgNova;
    }

    @Override
    public String exec(List<Long> novaIds, Object o, String param) {
        if (param.equals("org_add")) {
            OrgNova orgNova = (OrgNova) o;
            add(orgNova);
        }
        return null;
    }

    @Override
    public Object novaFormValue(List<Long> novaIds, String param) {
        if (param.equals("org_add")) {
            Org org = getById(novaIds.get(0));
            return new OrgNova().setOrgNova(new OrgNova()
                    .setId(org.getId())
                    .setName(org.getName())
            );
        }
        return null;
    }

    /**
     * 递归删除组织
     * @param ids 菜单id
     */
    private void cascadeDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        // 删除当前组织
        removeBatchByIds(ids);
        // 查询下级组织
        List<Org> orgs = list(new LambdaQueryWrapper<Org>()
                .select(Org::getId)
                .in(Org::getParentId, ids)
        );
        // 递归删除下级组织
        if (orgs != null && !orgs.isEmpty()) {
            List<Long> childIds = orgs.stream()
                    .map(Org::getId)
                    .toList();
            cascadeDelete(childIds);
        }
    }
}
