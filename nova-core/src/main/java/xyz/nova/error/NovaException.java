package xyz.nova.error;

import lombok.Getter;

@Getter
public class NovaException extends RuntimeException {

    private String detail;

    public NovaException(String message) {
        super(message);
    }

    public NovaException(String message, String detail) {
        super(message);
        this.detail = detail;
    }

    public NovaException(Throwable e) {
        super(e);
    }

}