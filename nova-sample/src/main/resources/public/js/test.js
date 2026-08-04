// param     — 静态参数（字符串）
// transmitParams — 表单字段键值对（对象）
// $btn      — 按钮的 jQuery 对象（如果按钮有 id）

console.log('param:', param, 'transmitParams:', transmitParams, '$btn:', $btn)

var countdown = 60
$btn.text(countdown + 's')
var timer = setInterval(function () {
    countdown--
    if (countdown <= 0) {
        clearInterval(timer)
        $btn.text('倒计时结束')
    } else {
        $btn.text(countdown + 's')
    }
}, 1000)

window.modal.error("四种信息弹窗的按钮没配 props，走 Naive UI 默认样式，所以和 confirm（primary 蓝、medium 大小）不一致。给弹窗补上相同的 positiveButtonProps。", {
    title: "标题",
})