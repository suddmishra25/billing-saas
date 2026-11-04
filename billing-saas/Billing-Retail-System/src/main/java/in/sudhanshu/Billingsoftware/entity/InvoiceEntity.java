package in.sudhanshu.Billingsoftware.entity;

import in.sudhanshu.Billingsoftware.io.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "invoices",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_invoice_number_tenant",
                        columnNames = {"invoice_number", "tenant_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // Invoice identification
    // =========================
    @Column(nullable = false, unique = true)
    private String invoiceId;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    private LocalDate invoiceDate;

    private LocalDate dueDate;

    // =========================
    // Tenant
    // =========================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantEntity tenant;

    // =========================
    // Customer
    // =========================

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerEntity customer;

    // =========================
    // Seller snapshot
    // =========================

    private String sellerName;
    private String sellerAddress;
    private String sellerCity;
    private String sellerState;
    private String sellerPincode;
    private String sellerGstin;
    private String sellerPhone;
    private String sellerEmail;

    // =========================
    // Financial details
    // =========================

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

    // =========================
    // Payment
    // =========================

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    private BigDecimal amountPaid;
    private BigDecimal balanceAmount;

    // =========================
    // Additional invoice info
    // =========================

    private String placeOfSupply;
    private String vehicleNumber;
    private String transportName;
    private String eWayBillNumber;
    private String purchaseOrderNumber;
    private String referenceNumber;

    @Column(length = 1000)
    private String notes;

    // =========================
    // Invoice Items
    // =========================

    @OneToMany(
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JoinColumn(name = "invoice_id")
    @Builder.Default
    private List<InvoiceItemEntity> items = new ArrayList<>();

    // =========================
    // Audit
    // =========================

    @CreationTimestamp
    @Column(updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;

    @PrePersist
    protected void onCreate() {

        if (invoiceId == null) {
            invoiceId = "INV-" + System.currentTimeMillis();
        }

        if (invoiceDate == null) {
            invoiceDate = LocalDate.now();
        }

        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.PENDING;
        }

        if (amountPaid == null) {
            amountPaid = BigDecimal.ZERO;
        }

        if (subtotal == null) {
            subtotal = BigDecimal.ZERO;
        }

        if (discount == null) {
            discount = BigDecimal.ZERO;
        }

        if (taxableAmount == null) {
            taxableAmount = BigDecimal.ZERO;
        }

        if (cgst == null) {
            cgst = BigDecimal.ZERO;
        }

        if (sgst == null) {
            sgst = BigDecimal.ZERO;
        }

        if (igst == null) {
            igst = BigDecimal.ZERO;
        }

        if (cess == null) {
            cess = BigDecimal.ZERO;
        }

        if (totalTax == null) {
            totalTax = BigDecimal.ZERO;
        }

        if (roundOff == null) {
            roundOff = BigDecimal.ZERO;
        }

        if (grandTotal == null) {
            grandTotal = BigDecimal.ZERO;
        }

        if (balanceAmount == null) {
            balanceAmount =
                    grandTotal.subtract(amountPaid);
        }
    }

    public enum PaymentStatus {
        PENDING,
        PARTIAL,
        PAID,
        CANCELLED
    }
}