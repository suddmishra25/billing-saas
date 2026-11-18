package in.sudhanshu.Billingsoftware.repository;

import in.sudhanshu.Billingsoftware.entity.TenantInvoiceSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TenantInvoiceSequenceRepository extends JpaRepository<TenantInvoiceSequence, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT s
            FROM TenantInvoiceSequence s
            WHERE s.tenant.id = :tenantId
            AND s.financialYear = :financialYear
            """)
    Optional<TenantInvoiceSequence> findForUpdate(
            @Param("tenantId") Long tenantId,
            @Param("financialYear") String financialYear
    );

    Optional<TenantInvoiceSequence> findByTenantIdAndFinancialYear(Long tenantId, String financialYear);


}
