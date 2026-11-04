package in.sudhanshu.Billingsoftware.repository;

import in.sudhanshu.Billingsoftware.entity.ItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<ItemEntity, Long> {

    Optional<ItemEntity> findByItemIdAndTenantIdAndCustomerCustomerId(
            String itemId,
            Long tenantId,
            String customerId
    );

    List<ItemEntity> findByTenantIdAndCustomerCustomerId(
            Long tenantId,
            String customerId
    );

    Optional<ItemEntity> findByItemIdAndTenantId(
            String itemId,
            Long tenantId
    );

    Optional<ItemEntity> findByItemIdAndTenantIdAndCustomerId(
            String itemId,
            Long tenantId,
            Long customerId
    );
}