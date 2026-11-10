package in.sudhanshu.Billingsoftware.repository;

import in.sudhanshu.Billingsoftware.entity.InvoiceEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository
        extends JpaRepository<InvoiceEntity, Long> {

    List<InvoiceEntity> findByTenantId(
            Long tenantId
    );

    List<InvoiceEntity> findByTenantIdAndClientClientId(
            Long tenantId,
            String clientId
    );

    Optional<InvoiceEntity> findByInvoiceIdAndTenantId(
            String invoiceId,
            Long tenantId
    );

    List<InvoiceEntity> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    Page<InvoiceEntity> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable pageable);

    @Query("""
            SELECT COALESCE(SUM(i.grandTotal), 0)
            FROM InvoiceEntity i
            WHERE i.tenant.id = :tenantId
            AND i.invoiceDate >= :start
            AND i.invoiceDate <= :end
            """)
    BigDecimal sumGrandTotalByTenantAndInvoiceDateBetween(
            @Param("tenantId") Long tenantId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    @Query("""
            SELECT COUNT(i)
            FROM InvoiceEntity i
            WHERE i.tenant.id = :tenantId
            AND i.invoiceDate >= :start
            AND i.invoiceDate <= :end
            """)
    long countByTenantAndInvoiceDateBetween(
            @Param("tenantId") Long tenantId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );
}