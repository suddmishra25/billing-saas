package in.sudhanshu.Billingsoftware.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceSalesReportResponse {

    private String financialYear;
    private String clientId;
    private List<String> availableFinancialYears;
    private SalesReportSummary summary;
    private List<ClientSalesSummary> salesByClient;
    private List<InvoiceSalesReportRow> invoices;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SalesReportSummary {
        private int invoiceCount;
        private int cancelledCount;
        private BigDecimal totalSales;
        private BigDecimal totalTax;
        private BigDecimal amountReceived;
        private BigDecimal outstanding;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClientSalesSummary {
        private String clientId;
        private String clientName;
        private int invoiceCount;
        private BigDecimal totalSales;
        private BigDecimal totalTax;
        private BigDecimal amountReceived;
        private BigDecimal outstanding;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceSalesReportRow {
        private String invoiceId;
        private String invoiceNumber;
        private LocalDate invoiceDate;
        private String clientId;
        private String clientName;
        private BigDecimal grandTotal;
        private BigDecimal totalTax;
        private InvoiceResponse.InvoicePaymentStatus paymentStatus;
        private BigDecimal balanceAmount;
    }
}
