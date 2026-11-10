/** Build sample bill number matching server InvoiceNumberFormatUtil. */
export const formatBillNumberPreview = ({
    invoiceNumberPrefix,
    invoiceNumberIncludeFinancialYear,
    financialYear,
    nextBillNumber,
}) => {
    const parts = [];
    const prefix = (invoiceNumberPrefix || "").trim();
    if (prefix) {
        parts.push(prefix);
    }
    if (invoiceNumberIncludeFinancialYear !== false) {
        parts.push(financialYear || "FY");
    }
    const num = nextBillNumber ?? "?";
    parts.push(String(num));
    return parts.join("-");
};
