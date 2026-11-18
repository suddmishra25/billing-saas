package in.sudhanshu.Billingsoftware.repository;

import in.sudhanshu.Billingsoftware.entity.ItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<ItemEntity, Long> {

    Optional<ItemEntity> findByItemIdAndTenantIdAndClientClientId(
            String itemId,
            Long tenantId,
            String clientId
    );

    List<ItemEntity> findByTenantIdAndClientClientId(Long tenantId, String clientId);

    List<ItemEntity> findByTenantId(Long tenantId);

    Optional<ItemEntity> findByItemIdAndTenantIdAndClientId(
            String itemId,
            Long tenantId,
            Long clientId
    );
}
