package in.sudhanshu.Billingsoftware.util;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class PasswordPolicyValidator {

    private static final int MIN_LENGTH = 8;
    private static final Pattern UPPER = Pattern.compile("[A-Z]");
    private static final Pattern LOWER = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL = Pattern.compile("[^A-Za-z0-9]");

    public void validate(String password) {
        List<String> errors = new ArrayList<>();

        if (password == null || password.length() < MIN_LENGTH) {
            errors.add("Password must be at least " + MIN_LENGTH + " characters");
        }
        if (password != null && !UPPER.matcher(password).find()) {
            errors.add("Password must include an uppercase letter");
        }
        if (password != null && !LOWER.matcher(password).find()) {
            errors.add("Password must include a lowercase letter");
        }
        if (password != null && !DIGIT.matcher(password).find()) {
            errors.add("Password must include a number");
        }
        if (password != null && !SPECIAL.matcher(password).find()) {
            errors.add("Password must include a special character");
        }

        if (!errors.isEmpty()) {
            throw new RuntimeException(String.join(". ", errors));
        }
    }
}
