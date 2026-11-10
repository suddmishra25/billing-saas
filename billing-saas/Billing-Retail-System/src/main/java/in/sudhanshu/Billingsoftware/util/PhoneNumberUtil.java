package in.sudhanshu.Billingsoftware.util;

import java.util.regex.Pattern;

public final class PhoneNumberUtil {

    private static final Pattern TEN_DIGITS = Pattern.compile("^\\d{10}$");

    private PhoneNumberUtil() {}

    /**
     * Blank/null allowed; otherwise exactly 10 digits (non-digits stripped first).
     */
    public static String normalizeOptional(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String digits = raw.replaceAll("\\D", "");
        if (!TEN_DIGITS.matcher(digits).matches()) {
            throw new RuntimeException("Phone number must be exactly 10 digits");
        }
        return digits;
    }

    public static String requireTenDigits(String raw) {
        String normalized = normalizeOptional(raw);
        if (normalized == null) {
            throw new RuntimeException("Phone number is required (10 digits)");
        }
        return normalized;
    }
}
