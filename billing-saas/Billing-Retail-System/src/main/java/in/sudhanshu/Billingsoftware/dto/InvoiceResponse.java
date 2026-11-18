package in.sudhanshu.Billingsoftware.dto;

import in.sudhanshu.Billingsoftware.io.PaymentMethod;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {

    private String invoiceId;
    private String invoiceNumber;

    private LocalDate invoiceDate;
    private LocalDate dueDate;

    // Client (bill-to)
    private String clientId;
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    private String clientAddress;
    private String clientGst;

    // Seller
    private String sellerName;
    private String sellerAddress;
    private String sellerCity;
    private String sellerState;
    private String sellerPincode;
    private String sellerGstin;
    private String sellerPhone;
    private String sellerEmail;

    // Financial
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal taxableAmount;

    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal cess;

    private BigDecimal totalTax;
    private BigDecimal roundOff;
    private BigDecimal grandTotal;

    // Payment
    private PaymentMethod paymentMethod;
    private InvoicePaymentStatus paymentStatus;
    private BigDecimal amountPaid;
    private BigDecimal balanceAmount;

    // Additional
    private String placeOfSupply;
    private String vehicleNumber;
    private String transportName;
    private String eWayBillNumber;
    private String purchaseOrderNumber;
    private String referenceNumber;
    private String challanNumber;
    private String challanDated;
    private String notes;
    private String tenantId;

    /** Live tenant branding for print layout (logo, bank, terms). */
    private TenantBrandingResponse branding;

    private List<InvoiceItemResponse> items;

    public enum InvoicePaymentStatus {
        PENDING,
        PARTIAL,
        PAID,
        CANCELLED
    }
}