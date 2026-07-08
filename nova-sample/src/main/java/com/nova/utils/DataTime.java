package com.nova.utils;

import cn.hutool.core.date.DateTime;
import cn.hutool.core.date.DateUtil;
import lombok.SneakyThrows;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 日期工具类
 */
public class DataTime {

    public final static String defaultFormat = "yyyy-MM-dd HH:mm:ss";

    /**
     * 计算时间差
     *
     * @param startTime 开始日期
     * @param endTime   结束日期
     * @return
     */
    public static long diff(LocalDateTime startTime, LocalDateTime endTime) {
        Duration duration = Duration.between(startTime, endTime);
        long diff = duration.toMillis();
        return diff;
    }

    /**
     * 计算时间差
     *
     * @param startTime 开始日期
     * @param endTime   结束日期
     * @param type      结果单位 d=天 h=时 m=分 s=秒 ss=毫秒
     * @return
     */
    public static long diff(LocalDateTime startTime, LocalDateTime endTime, String type) {
        long diff = diff(startTime, endTime);
        long result = type.equals("d") ? diff / 86400000
                : type.equals("h") ? diff / 3600000
                : type.equals("m") ? diff / 60000
                : type.equals("s") ? diff / 1000
                : type.equals("ss") ? diff
                : 0;
        return result;
    }

    /**
     * 获取日期（当前）
     *
     * @param format 日期格式
     * @return
     */
    public static String getSring(String format) {
        SimpleDateFormat df = new SimpleDateFormat(format);
        return df.format(new Date());
    }

    /**
     * 获取日期（当前）
     *
     * @return
     */
    public static String getSring() {
        return getSring(defaultFormat);
    }

    /**
     * 获取日期（当前）
     *
     * @return
     */
    public static LocalDateTime getLocal() {
        return LocalDateTime.now();
    }

    /**
     * 获取日期（加减时间）
     *
     * @param year   年+-
     * @param month  月+-
     * @param day    日+-
     * @param hour   时+-
     * @param minute 分+-
     * @param second 秒+-
     * @param time   指定日期
     * @param format 指定格式
     * @return
     */
    @SneakyThrows
    public static String getStringAround(int year, int month, int day, int hour, int minute, int second, String time, String format) {
        Calendar beforeTime = Calendar.getInstance();
        Date date = new SimpleDateFormat(format).parse(time);
        beforeTime.setTime(date);
        beforeTime.add(Calendar.YEAR, year);
        beforeTime.add(Calendar.MONTH, month);
        beforeTime.add(Calendar.DATE, day);
        beforeTime.add(Calendar.HOUR, hour);
        beforeTime.add(Calendar.MINUTE, minute);
        beforeTime.add(Calendar.SECOND, second);
        Date beforeD = beforeTime.getTime();
        return new SimpleDateFormat(format).format(beforeD);
    }

    /**
     * 获取日期（加减时间）
     *
     * @param year   年+-
     * @param month  月+-
     * @param day    日+-
     * @param hour   时+-
     * @param minute 分+-
     * @param second 秒+-
     * @param time   指定日期
     * @return
     */
    @SneakyThrows
    public static String getStringAround(int year, int month, int day, int hour, int minute, int second, String time) {
        return getStringAround(year, month, day, hour, minute, second, time, defaultFormat);
    }

    /**
     * 获取日期（加减时间）
     *
     * @param year   年+-
     * @param month  月+-
     * @param day    日+-
     * @param hour   时+-
     * @param minute 分+-
     * @param second 秒+-
     * @return
     */
    public static String getStringAround(int year, int month, int day, int hour, int minute, int second) {
        return getStringAround(year, month, day, hour, minute, second, getSring());
    }

    /**
     * String转LocalDateTime
     *
     * @param time   String日期
     * @param format 格式
     * @return
     */
    public static LocalDateTime toLocal(String time, String format) {
        DateTimeFormatter df = DateTimeFormatter.ofPattern(format);
        LocalDateTime ldt = LocalDateTime.parse(time, df);
        return ldt;
    }

    /**
     * String转LocalDateTime
     *
     * @param time String日期
     * @return
     */
    public static LocalDateTime toLocal(String time) {
        return toLocal(time, defaultFormat);
    }

    /**
     * LocalDateTime转String
     *
     * @param time   LocalDateTime日期
     * @param format 格式
     * @return
     */
    public static String toString(LocalDateTime time, String format) {
        DateTimeFormatter df = DateTimeFormatter.ofPattern(format);
        return df.format(time);
    }

    /**
     * LocalDateTime转String
     *
     * @param time LocalDateTime日期
     * @return
     */
    public static String toString(LocalDateTime time) {
        return toString(time, defaultFormat);
    }

    /**
     * 日期字符串对比
     *
     * @param time1
     * @param time2
     * @return 正数=大于 0=相等 负数=小于
     */
    public static int stringContrast(String time1, String time2) {
        return time1.compareTo(time2);
    }

    /**
     * 获取月天数
     *
     * @param time   日期
     * @param format 格式
     * @return
     */
    @SneakyThrows
    public static int getMonthByDay(String time, String format) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(new SimpleDateFormat(format).parse(time));
        return calendar.getActualMaximum(Calendar.DAY_OF_MONTH);
    }

    /**
     * 获取月天数
     *
     * @param time 日期
     * @return
     */
    public static int getMonthByDay(String time) {
        return getMonthByDay(time, defaultFormat);
    }

    /**
     * 获取两个日期相差月数
     *
     * @param date1
     * @param date2
     * @return
     */
    @SneakyThrows
    public static int getMonthSpace(String date1, String date2) {
        return (int) ChronoUnit.MONTHS.between(LocalDate.parse(date1), LocalDate.parse(date2));
    }


    /***
     * 获取最近n的日期有序集合
     * @param nDay
     * @return {@link List< String>}
     * @author 谭斌
     * @date 2023/3/7 13:46
     */
    public static List<String> dayListByLastDay(int nDay) {
        LocalDate localDate = LocalDate.now().minusDays(-1L);
        LocalDate afterDate = localDate.minusDays(nDay);
        //获取倒数n天
        List<LocalDate> localDates = new ArrayList<>(nDay);
        List<String> dayList = new ArrayList<>(nDay);

        for (LocalDate currentdate = afterDate;
             currentdate.isBefore(localDate) || currentdate.isEqual(localDate);
             currentdate = currentdate.plusDays(1L)) {
            localDates.add(LocalDate.of(currentdate.getYear(), currentdate.getMonth(), currentdate.getDayOfMonth()));
        }

        // 倒叙排列近n天日期
        localDates = localDates.stream().sorted(Comparator.naturalOrder()).collect(Collectors.toList());
        localDates.forEach(d -> {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            dayList.add(d.format(formatter));
        });


        return dayList;
    }

    /**
     * 最近一周的所有日期
     *
     * @return
     */
    public static List<String> getNearlyWeekDates() {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        Calendar c = Calendar.getInstance();
        // 过去七天
        c.setTime(new Date());
        String today = format.format(new Date());
        c.add(Calendar.DATE, -7);
        Date d = c.getTime();
        String day = format.format(d);
        List<String> result = getBetweenDates(day, today, false);
        return result;
    }

    /**
     * 最近一个月的所有日期
     *
     * @return
     */
    public static List<String> getNearlyMonthDates() {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        Calendar c = Calendar.getInstance();
        // 过去一月
        c.setTime(new Date());
        String today = format.format(new Date());
        c.add(Calendar.MONTH, -1);
        Date m = c.getTime();
        String mon = format.format(m);
        List<String> result = getBetweenDates(mon, today, false);

        return result;
    }


    /**
     * 最近三个月的所有日期
     *
     * @return
     */
    public static List<String> getNearlyThMonthDates() {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        Calendar c = Calendar.getInstance();
        // 过去一月
        c.setTime(new Date());
        String today = format.format(new Date());
        c.add(Calendar.MONTH, -3);
        Date m = c.getTime();
        String mon = format.format(m);
        List<String> result = getBetweenDates(mon, today, false);

        return result;
    }

    /**
     * 最近n个月的所有日期
     *
     * @return
     */
    public static List<String> getNearlyThMonthDates(int n) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        Calendar c = Calendar.getInstance();
        // 过去一月
        c.setTime(new Date());
        String today = format.format(new Date());
        c.add(Calendar.MONTH, -n);
        Date m = c.getTime();
        String mon = format.format(m);
        List<String> result = getBetweenDates(mon, today, false);

        return result;
    }

    /**
     * 最近n个月的开始日期
     *
     * @return
     */
    public static DateTime getNearlyMonthDatesStart(int n) {
        Calendar c = Calendar.getInstance();
        c.setTime(new Date());
        c.add(Calendar.MONTH, -n);
        Date m = c.getTime();
        DateTime dateTime = DateUtil.beginOfDay(m);
        return dateTime;
    }


    /**
     * 最近半年的所有日期
     *
     * @return
     */
    public static List<String> getNearlySixMonthDates() {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        Calendar c = Calendar.getInstance();
        // 过去一月
        c.setTime(new Date());
        String today = format.format(new Date());
        c.add(Calendar.MONTH, -6);
        Date m = c.getTime();
        String mon = format.format(m);
        List<String> result = getBetweenDates(mon, today, false);

        return result;
    }

    /**
     * 最近一年的所有月份
     *
     * @return
     */
    public static List<String> getNearlyYearDates() {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        Calendar c = Calendar.getInstance();
        // 过去一年
        c.setTime(new Date());
        String today = format.format(new Date());
        c.add(Calendar.MONTH, -11);
        Date y = c.getTime();
        String year = format.format(y);
        // 如果要获取近一年内的所有月份
        // List<String> result = getMonthsBetweenDates(year, today);
        // 如果要获取近一年内的所有日期
        List<String> result = getBetweenDates(year, today, false);
        return result;
    }

    /**
     * 补全给定时间内的所有周，包含最开始的
     *
     * @param startTime
     * @param endTime
     * @return
     */
    public static List<String> getWeeksBetweenDates(String startTime, String endTime) {
        List<String> result = new ArrayList<>();
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        Date start = null;
        Date end = null;
        try {
            start = format.parse(startTime);
            end = format.parse(endTime);
            Calendar calendar = Calendar.getInstance();
            calendar.setFirstDayOfWeek(Calendar.MONDAY);
            calendar.setTime(start);
            result.add(calendar.get(Calendar.YEAR) + "-" + calendar.get(Calendar.WEEK_OF_YEAR));
            while (calendar.getTime().before(end)) {
                calendar.add(Calendar.WEEK_OF_YEAR, 1);
                String weekStr = calendar.get(Calendar.YEAR) + "-" + calendar.get(Calendar.WEEK_OF_YEAR);
                result.add(weekStr);
            }
        } catch (ParseException e) {
            e.printStackTrace();
        }

        return result;
    }

    /**
     * 补全给定起止时间区间内的所有日期
     *
     * @param startTime
     * @param endTime
     * @param isIncludeStartTime
     * @return
     */
    public static List<String> getBetweenDates(String startTime, String endTime, boolean isIncludeStartTime) {
        List<String> result = new ArrayList<>();
        try {
            SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
            // 定义起始日期
            Date d1 = new SimpleDateFormat("yyyy-MM-dd").parse(startTime);
            // 定义结束日期 可以去当前月也可以手动写日期。
            Date d2 = new SimpleDateFormat("yyyy-MM-dd").parse(endTime);
            // 定义日期实例
            Calendar dd = Calendar.getInstance();
            // 设置日期起始时间
            dd.setTime(d1);
            if (isIncludeStartTime) {
                result.add(format.format(d1));
            }
            // 判断是否到结束日期
            while (dd.getTime().before(d2)) {
                // 进行当前日期加1
                dd.add(Calendar.DATE, 1);
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                String str = sdf.format(dd.getTime());
                result.add(str);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }

    /**
     * 补全给定时间区内的所有月份
     *
     * @param startTime
     * @param endTime
     * @return
     */
    public static List<String> getMonthsBetweenDates(String startTime, String endTime) {
        List<String> result = new ArrayList<>();
        try {
            SimpleDateFormat format = new SimpleDateFormat("yyyy-MM");
            // 定义起始日期
            Date d1 = new SimpleDateFormat("yyyy-MM").parse(startTime);
            // 定义结束日期 可以去当前月也可以手动写日期。
            Date d2 = new SimpleDateFormat("yyyy-MM").parse(endTime);
            // 定义日期实例
            Calendar dd = Calendar.getInstance();
            // 设置日期起始时间
            dd.setTime(d1);
            result.add(format.format(d1));
            // 判断是否到结束日期
            while (dd.getTime().before(d2)) {
                // 进行当前日期月份加1
                dd.add(Calendar.MONTH, 1);
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM");
                String str = sdf.format(dd.getTime());
                result.add(str);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }


}
