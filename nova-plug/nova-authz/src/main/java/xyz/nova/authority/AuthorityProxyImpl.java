package xyz.nova.authority;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import xyz.nova.config.NovaAuthorityConfig;
import xyz.nova.entity.User;
import xyz.nova.entity.authority.Login;
import xyz.nova.entity.authority.Menu;
import xyz.nova.service.*;
import xyz.nova.service.authority.AuthorityProxy;
import xyz.nova.utils.AuthorityUtils;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthorityProxyImpl implements AuthorityProxy {

    public static String redisKeyMenu = "nova:login:menu:";
    public static String redisKeyService = "nova:login:service:";
    public static String redisKeyUser = "nova:login:user:";

    private final NovaAuthorityConfig novaAuthorityConfig;

    private final UserServiceImpl userService;

    private final UserRoleServiceImpl userRoleService;

    private final RoleServiceImpl roleService;

    private final RoleMenuServiceImpl roleMenuService;

    private final MenuServiceImpl menuService;

    private final StringRedisTemplate redisTemplate;

    @Override
    public boolean checkToken(String token) {
        boolean result = Boolean.TRUE.equals(redisTemplate.hasKey(redisKeyUser + token));
        // token续期
        if (result) {
            redisTemplate.expire(redisKeyMenu + token, novaAuthorityConfig.getExpireTime(), TimeUnit.MINUTES);
            redisTemplate.expire(redisKeyService + token, novaAuthorityConfig.getExpireTime(), TimeUnit.MINUTES);
            redisTemplate.expire(redisKeyUser + token, novaAuthorityConfig.getExpireTime(), TimeUnit.MINUTES);
        }
        return result;
    }

    @Override
    public Login.User login(Login login) {
        // 账号密码验证
        User user = userService.login(login.getUsername(), login.getPassword());
        List<xyz.nova.entity.Menu> menus;
        if (user.getIsAdmin()) {
            // 查询菜单
            menus = menuService.login(true, null);
        } else {
            // 查询用户角色
            List<Long> roleIds = userRoleService.login(user.getId());
            // 验证角色可用性
            roleIds = roleService.login(roleIds);
            // 查询角色菜单
            List<Long> menuIds = roleMenuService.login(roleIds);
            // 查询菜单
            menus = menuService.login(false, menuIds);
        }
        // 生成token
        String token = UUID.randomUUID().toString().replace("-", "");
        // 按父菜单ID分组系统按钮（用于聚合到NOVA菜单的systemButton）
        Map<Long, List<xyz.nova.entity.Menu>> buttonGroupMap = new LinkedHashMap<>();
        for (xyz.nova.entity.Menu menu : menus) {
            if ("BUTTON".equals(menu.getType())) {
                buttonGroupMap.computeIfAbsent(menu.getParentId(), k -> new ArrayList<>()).add(menu);
            }
        }
        // 构建缓存（Hash结构，key=菜单code，所有菜单包括BUTTON都缓存）
        Map<String, String> menuMap = new LinkedHashMap<>();
        Map<String, String> serviceMap = new LinkedHashMap<>();
        int sort = 0;
        for (xyz.nova.entity.Menu menu : menus) {
            JSONObject menuObj = new JSONObject()
                    .set("id", menu.getId())
                    .set("code", menu.getCode())
                    .set("name", menu.getName())
                    .set("value", menu.getValue())
                    .set("icon", menu.getIcon())
                    .set("pic", menu.getParentId())
                    .set("type", menu.getType().equals("DIR") ? Menu.Type.DIR
                            : menu.getType().equals("NOVA") ? Menu.Type.NOVA
                            : menu.getType().equals("TPL") ? Menu.Type.TPL
                            : menu.getType().equals("BUTTON") ? Menu.Type.BUTTON
                            : null
                    )
                    .set("show", menu.getStatus())
                    .set("sort", sort++)
                    .set("serviceName", menu.getServiceName());
            // NOVA菜单
            if ("NOVA".equals(menu.getType())) {
                // 附加systemButton聚合信息
                List<xyz.nova.entity.Menu> buttons = buttonGroupMap.get(menu.getId());
                if (buttons != null && !buttons.isEmpty()) {
                    JSONObject systemButton = new JSONObject();
                    for (xyz.nova.entity.Menu btn : buttons) {
                        String suffix = btn.getCode();
                        if (suffix != null && suffix.contains("@")) {
                            suffix = suffix.substring(suffix.lastIndexOf("@") + 1);
                        }
                        if ("ADD".equals(suffix)) {
                            systemButton.set("add", true);
                        } else if ("EDIT".equals(suffix)) {
                            systemButton.set("edit", true);
                        } else if ("DELETE".equals(suffix)) {
                            systemButton.set("delete", true);
                        }
                    }
                    menuObj.set("systemButton", systemButton);
                }
                // 写入Nova和服务名映射map
                if (menu.getServiceName() != null && !menu.getServiceName().isEmpty()) {
                    serviceMap.put(menu.getValue(), menu.getServiceName());
                }
            }
            menuMap.put(menu.getCode(), menuObj.toString());
        }
        // 存入Redis Hash（菜单）
        redisTemplate.opsForHash().putAll(redisKeyMenu + token, menuMap);
        redisTemplate.expire(redisKeyMenu + token, novaAuthorityConfig.getExpireTime(), TimeUnit.MINUTES);
        // 存入Redis Hash（服务名）
        if (!serviceMap.isEmpty()) {
            redisTemplate.opsForHash().putAll(redisKeyService + token, serviceMap);
            redisTemplate.expire(redisKeyService + token, novaAuthorityConfig.getExpireTime(), TimeUnit.MINUTES);
        }
        // 存入Redis String（用户信息）
        JSONObject userObj = new JSONObject()
                .set("id", user.getId())
                .set("name", user.getName())
                .set("account", user.getAccount())
                .set("isAdmin", user.getIsAdmin())
                .set("orgId", user.getOrgId());
        redisTemplate.opsForValue().set(redisKeyUser + token, userObj.toString(), novaAuthorityConfig.getExpireTime(), TimeUnit.MINUTES);
        // 返回登录信息
        return new Login.User()
                .setToken(token)
                .setName(user.getName())
                .setAlias(user.getAccount());
    }

    @Override
    public void logout(String token) {
        redisTemplate.delete(redisKeyMenu + token);
        redisTemplate.delete(redisKeyService + token);
        redisTemplate.delete(redisKeyUser + token);
    }

    @Override
    public List<Menu> getMenu(String token) {
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(redisKeyMenu + token);
        if (entries.isEmpty()) {
            return List.of();
        }
        // 先解析sort，按sort正序排序后再转Menu
        List<JSONObject> jsonList = new ArrayList<>(entries.size());
        for (Object value : entries.values()) {
            jsonList.add(new JSONObject(value.toString()));
        }
        jsonList.sort(Comparator.comparingInt(json -> json.getInt("sort", 0)));
        List<Menu> menus = new ArrayList<>(jsonList.size());
        for (JSONObject json : jsonList) {
            Menu menu = new Menu()
                    .setId(json.getLong("id"))
                    .setCode(json.getStr("code"))
                    .setIcon(json.getStr("icon"))
                    .setName(json.getStr("name"))
                    .setValue(json.getStr("value"))
                    .setPid(json.getLong("pic"))
                    .setType(json.getEnum(Menu.Type.class, "type"))
                    .setShow(json.getBool("show"));
            // 系统按钮（仅NOVA类型有）
            JSONObject sbJson = json.getJSONObject("systemButton");
            if (sbJson != null) {
                menu.setSystemButton(new Menu.SystemButton()
                        .setAdd(sbJson.getBool("add", false))
                        .setEdit(sbJson.getBool("edit", false))
                        .setDelete(sbJson.getBool("delete", false)));
            }
            menus.add(menu);
        }
        return menus;
    }

    @Override
    public boolean menuPermission(String token, String code) {
        return redisTemplate.opsForHash().hasKey(redisKeyMenu + token, code);
    }

    public JSONObject getUser() {
        String user = redisTemplate.opsForValue().get(redisKeyUser + AuthorityUtils.getToken());
        return JSONUtil.parseObj(user);
    }

    @Override
    public String getServiceName(String token, String novaName) {
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(redisKeyService + token);
        if (entries.isEmpty()) {
            return null;
        }
        Object o = entries.get(novaName);
        return o == null ? null : o.toString();
    }
}
