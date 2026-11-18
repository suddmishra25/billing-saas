package in.sudhanshu.Billingsoftware.repository;

import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantRepository extends JpaRepository<TenantEntity, Long> {

    Optional<TenantEntity> findByTenantId(String tenantId);

    boolean existsByCompanyName(String companyName);

    boolean existsByEmail(String email);

    boolean existsByCompanyNameAndTenantIdNot(String companyName, String tenantId);
}
