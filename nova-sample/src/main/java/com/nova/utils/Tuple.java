package com.nova.utils;

import lombok.Data;

/**
 * 元祖
 */
public class Tuple {

    /**
     * 二维
     *
     * @param <A>
     * @param <B>
     */
    @Data
    public static class Tuple2<A, B> {

        private A v1;

        private B v2;

        public Tuple2(A v1, B v2) {
            this.v1 = v1;
            this.v2 = v2;
        }
    }

    /**
     * 三维
     *
     * @param <A>
     * @param <B>
     * @param <C>
     */
    @Data
    public static class Tuple3<A, B, C> extends Tuple2<A, B> {

        private C v3;

        public Tuple3(A v1, B v2, C v3) {
            super(v1, v2);
            this.v3 = v3;
        }
    }

    /**
     * 四维
     *
     * @param <A>
     * @param <B>
     * @param <C>
     * @param <D>
     */
    @Data
    public static class Tuple4<A, B, C, D> extends Tuple3<A, B, C> {

        private D v4;

        public Tuple4(A v1, B v2, C v3, D v4) {
            super(v1, v2, v3);
            this.v4 = v4;
        }
    }

    /**
     * 五维
     *
     * @param <A>
     * @param <B>
     * @param <C>
     * @param <D>
     * @param <E>
     */
    @Data
    public static class Tuple5<A, B, C, D, E> extends Tuple4<A, B, C, D> {

        private E v5;

        public Tuple5(A v1, B v2, C v3, D v4, E v5) {
            super(v1, v2, v3, v4);
            this.v5 = v5;
        }
    }
}
