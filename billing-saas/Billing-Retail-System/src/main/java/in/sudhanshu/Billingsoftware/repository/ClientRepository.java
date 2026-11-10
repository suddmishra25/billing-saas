package in.sudhanshu.Billingsoftware.repository;

import in.sudhanshu.Billingsoftware.entity.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<ClientEntity, Long> {

    Optional<ClientEntity> findByClientIdAndTenantId(String clientId, Long tenantId);

    List<ClientEntity> findAllByTenantId(Long tenantId);

    boolean existsByEmailAndTenantId(String email, Long tenantId);
}
