package in.sudhanshu.Billingsoftware.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Entity
@Table(
        name = "items",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_item_tenant",
                        columnNames = {"item_id", "tenant_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String itemId;

    @Column(nullable = false)
    private String name;

    private String description;

    private String hsnCode;

    private String unit;

    private BigDecimal sellingPrice;

    private BigDecimal purchasePrice;

    private BigDecimal gstRate;

    private BigDecimal discount;

    private BigDecimal stockQuantity;

    // Tenant ownership
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantEntity tenant;

    // Customer ownership
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerEntity customer;

    @CreationTimestamp
    @Column(updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;

    @PrePersist
    protected void onCreate() {

        if (itemId == null) {
            itemId = "ITEM-" + System.currentTimeMillis();
        }
    }
}