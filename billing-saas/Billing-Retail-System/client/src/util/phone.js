/** Indian mobile: exactly 10 digits when provided. */
export const PHONE_DIGITS = 10;

export const sanitizePhoneInput = (raw) =>
    (raw || "").replace(/\D/g, "").slice(0, PHONE_DIGITS);

export const isValidPhone10 = (value) => {
    const v = (value || "").trim();
    return v === "" || /^\d{10}$/.test(v);
};

export const phoneValidationMessage = `Phone number must be exactly ${PHONE_DIGITS} digits`;

export const assertPhoneOptional = (value) => {
    if (!isValidPhone10(value)) {
        throw new Error(phoneValidationMessage);
    }
};
