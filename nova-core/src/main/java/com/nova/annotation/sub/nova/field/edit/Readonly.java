package com.nova.annotation.sub.nova.field.edit;

import java.beans.Transient;

public @interface Readonly {

    boolean add() default true;

    boolean edit() default true;

    @Transient
    String[] params() default {};

    @Transient
    Class<? extends ReadonlyHandler> exprHandler() default ReadonlyHandler.class;

    interface ReadonlyHandler {

        boolean add(boolean add, String[] params);

        boolean edit(boolean edit, String[] params);

    }
}