package in.sudhanshu.Billingsoftware.util;

import java.time.LocalDate;

public final class FinancialYearUtil {

    private FinancialYearUtil() {
    }

    public static String getCurrentFinancialYear() {

        LocalDate today = LocalDate.now();

        int year = today.getYear();

        if (today.getMonthValue() < 4) {
            return (year - 1) + "-" +
                    String.valueOf(year).substring(2);
        }

        return year + "-" +
                String.valueOf(year + 1).substring(2);
    }
}
