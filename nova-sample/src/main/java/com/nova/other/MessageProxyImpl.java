package com.nova.other;

import com.nova.entity.message.Message;
import com.nova.service.message.MessageProxy;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class MessageProxyImpl implements MessageProxy {

    @Override
    public List<Message> getMessages(String token) {
        return Arrays.asList(
                new Message().setTitle("重要消息！请先完整阅读！！！").setContent("午夜三点十七分，环卫工老周准时被闹钟叫醒。他套上荧光背心，拎着竹扫帚出了门，却发现自己负责的那条梧桐街，路面正在缓缓起伏。\n" +
                        "\n" +
                        "老周揉了揉眼，以为是没睡醒。可脚下的柏油路确实在动，像一头沉睡的巨兽在均匀呼吸。路面的纹理随着“吸气”而收紧，把掉落的梧桐叶绞成细碎的粉末；又在“呼气”时微微鼓起，将粉屑轻轻吹向路牙。\n" +
                        "\n" +
                        "更诡异的是，路中心那道两年前修补的裂缝，此刻竟像一张微张的嘴，发出“嘶——呼——”的声响。老周鬼使神差地蹲下身，把耳朵贴了上去。\n" +
                        "\n" +
                        "裂缝深处，传来细密的、金属摩擦般的话语：\n" +
                        "“第1347次路面更新程序启动……检测到有机生命体接触……启动记忆擦除协议……”\n" +
                        "\n" +
                        "老周猛地弹开，后背撞上路灯杆。他惊恐地发现，整条梧桐街的路灯同时明灭了三下，然后所有的光都汇聚到了他身上，在地上投出一个没有边界的圆形光斑——像一个瞄准镜。\n" +
                        "\n" +
                        "这时，他口袋里的老年机突然震动，收到一条来自“市政道路养护中心”的短信：\n" +
                        "\n" +
                        "“周师傅，请保持静止。我们正在为您进行每日例行的‘道路友好度升级’。本次升级预计耗时三分钟，可能会伴有轻微的眩晕和记忆重组，属于正常现象。感谢您对智慧城市建设的配合。”\n" +
                        "\n" +
                        "老周想跑，却发现自己的鞋底已经融化了，黏在温热的柏油路面上。那股“呼吸”的节奏，不知何时起，和他自己心跳的频率，完全同步了。\n" +
                        "\n" +
                        "清晨五点，天蒙蒙亮。\n" +
                        "\n" +
                        "另一个环卫工来接替，看见老周坐在路边，眼神呆滞，安安静静地叠着他的荧光背心。\n" +
                        "\n" +
                        "“周师傅，下班了？”\n" +
                        "\n" +
                        "老周抬起头，露出一个标准的、像刚铺好的柏油路面一样平整无痕的微笑：\n" +
                        "“嗯，地面很软，躺着很舒服。”\n" +
                        "\n" +
                        "新来的环卫工低头看了看脚下，路面平坦如常，几片梧桐叶静静躺着。他总觉得今天这条路，黑得格外油亮，格外……新鲜。")
                        .setId("1")
                        .setType(Message.Type.CRITICAL)
                        .setClose(true),
                new Message().setContent("老周想跑，却发现自己的鞋底已经融化了，黏在温热的柏油路面上。另一个环卫工来接替另一个环卫工来接替")
                        .setId("2")
                        .setClose(true),
                new Message().setContent("更诡异的是，路中心那道两年前修补的裂缝，此刻竟像一张微张的嘴，发出“嘶——呼——”的声响。老周鬼使神差地蹲下身，把耳朵贴了上去。")
                        .setId("3")
                        .setType(Message.Type.FOLLOW)
                        .setClose(false)
        );
    }

    @Override
    public void closeMessages(String token, List<String> ids) {
        System.out.println(ids);
    }
}
