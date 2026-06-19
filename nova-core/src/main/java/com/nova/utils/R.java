package com.nova.utils;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;

@Data
@Slf4j
@Accessors(chain = true)
public class R<T> {

    private int code;

    private T data;

    private String msg;

    private String logMsg;

    public static R ok() {
        return new R();
    }

    public static <T> R<T> ok(T data) {
        return new R<T>(data);
    }

    public static R fail() {
        return new R(Enum.FAIL.code, Enum.FAIL.msg);
    }

    public static R fail(String msg) {
        return new R(Enum.FAIL.code, msg);
    }

    public static R fail(int code, String msg) {
        return new R(code, msg);
    }

    public static <T> R<T> fail(int code, String msg, T data) {
        return new R(code, msg, data);
    }

    public R() {
        this.code = Enum.SUCCESS.code;
        this.msg = Enum.SUCCESS.msg;
    }

    public R(T data) {
        this();
        this.data = data;
    }

    public R(int code, String msg) {
        this.code = code;
        this.msg = msg;
    }

    public R(int code, String msg, T data) {
        this.code = code;
        this.data = data;
        this.msg = msg;
    }

    @Getter
    @AllArgsConstructor
    public enum Enum {

        SUCCESS(200, "成功"),

        FAIL(500, "失败"),

        ;

        private final int code;

        private final String msg;
    }


}
