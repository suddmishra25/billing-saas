package in.sudhanshu.Billingsoftware.repository;

import in.sudhanshu.Billingsoftware.entity.CustomerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<CustomerEntity, Long> {

    Optional<CustomerEntity> findByCustomerIdAndTenantId(String customerId, Long tenantId);

    List<CustomerEntity> findAllByTenantId(Long tenantId);

    boolean existsByEmailAndTenantId(String email, Long tenantId);

    boolean existsByPhoneNumberAndTenantId(String phone, Long tenantId);
}
