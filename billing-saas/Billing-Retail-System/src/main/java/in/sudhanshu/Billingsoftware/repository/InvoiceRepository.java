package in.sudhanshu.Billingsoftware.repository;

import in.sudhanshu.Billingsoftware.entity.InvoiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository
        extends JpaRepository<InvoiceEntity, Long> {

    List<InvoiceEntity> findByTenantId(
            Long tenantId
    );

    List<InvoiceEntity> findByTenantIdAndCustomerCustomerId(
            Long tenantId,
            String customerId
    );

    Optional<InvoiceEntity> findByInvoiceIdAndTenantId(
            String invoiceId,
            Long tenantId
    );
}