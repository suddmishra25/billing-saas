package in.sudhanshu.Billingsoftware.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "invoice_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    private String description;

    private String hsnCode;

    private String unit;

    private BigDecimal quantity;

    private BigDecimal rate;

    private BigDecimal discount;

    private BigDecimal taxableAmount;

    private BigDecimal gstRate;

    private BigDecimal totalTax;

    private BigDecimal totalAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantEntity tenant;
}