package in.sudhanshu.Billingsoftware.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "tenant_invoice_sequences",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "bh_tenant_financial_year",
                        columnNames = {"tenant_id", "financial_year"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantInvoiceSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private TenantEntity tenant;

    @Column(name = "financial_year", nullable = false)
    private String financialYear;

    @Column(name = "last_number", nullable = false)
    private Long lastNumber;
}