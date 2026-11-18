package in.sudhanshu.Billingsoftware.util;

import java.time.LocalDate;

public final class FinancialYearUtil {

    private FinancialYearUtil() {}

    public static String currentFinancialYear() {
        return financialYearFor(LocalDate.now());
    }

    /** Indian FY: April–March, label e.g. {@code 2025-26}. */
    public static String financialYearFor(LocalDate date) {
        if (date == null) {
            return null;
        }
        int year = date.getYear();
        int month = date.getMonthValue();
        if (month >= 4) {
            return year + "-" + String.valueOf(year + 1).substring(2);
        }
        return (year - 1) + "-" + String.valueOf(year).substring(2);
    }
}
