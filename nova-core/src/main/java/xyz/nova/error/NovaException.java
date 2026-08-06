package xyz.nova.error;

import lombok.Getter;

@Getter
public class NovaException extends RuntimeException {

    public NovaException(String message) {
        super(message);
    }

    public NovaException(Throwable e) {
        super(e);
    }

}