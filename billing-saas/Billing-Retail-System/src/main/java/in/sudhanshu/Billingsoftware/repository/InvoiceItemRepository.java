package in.sudhanshu.Billingsoftware.repository;

import in.sudhanshu.Billingsoftware.entity.InvoiceItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItemEntity, Long> {

//    Optional<InvoiceItemEntity> findByItemIdAndTenantId(String itemId, Long tenantId);
//
//    List<InvoiceItemEntity> findAllByTenantId(Long tenantId);
//
//    boolean existsByNameAndTenantId(
//            String name,
//            Long tenantId
//    );
}