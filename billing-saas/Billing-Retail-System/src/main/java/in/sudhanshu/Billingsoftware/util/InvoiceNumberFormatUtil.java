package in.sudhanshu.Billingsoftware.util;

import in.sudhanshu.Billingsoftware.entity.TenantEntity;

import java.util.ArrayList;
import java.util.List;

public final class InvoiceNumberFormatUtil {

    private InvoiceNumberFormatUtil() {}

    public static final String CONTINUOUS_SEQUENCE_KEY = "CONTINUOUS";

    public static boolean includesFinancialYear(TenantEntity tenant) {
        return tenant.getInvoiceNumberIncludeFinancialYear() != Boolean.FALSE;
    }

    public static String sequenceBucket(TenantEntity tenant) {
        if (includesFinancialYear(tenant)) {
            return FinancialYearUtil.currentFinancialYear();
        }
        return CONTINUOUS_SEQUENCE_KEY;
    }

    public static String format(TenantEntity tenant, long number) {
        List<String> parts = new ArrayList<>();
        String prefix = tenant.getInvoiceNumberPrefix();
        if (prefix != null && !prefix.isBlank()) {
            parts.add(prefix.trim());
        }
        if (includesFinancialYear(tenant)) {
            parts.add(FinancialYearUtil.currentFinancialYear());
        }
        parts.add(String.valueOf(number));
        return String.join("-", parts);
    }

    public static String preview(TenantEntity tenant, long nextNumber) {
        return format(tenant, nextNumber);
    }
}
