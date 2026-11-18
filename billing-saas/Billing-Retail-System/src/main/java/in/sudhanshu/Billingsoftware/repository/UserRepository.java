package in.sudhanshu.Billingsoftware.repository;

import in.sudhanshu.Billingsoftware.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByUserId(String userId);

    boolean existsByEmail(String email);

    Optional<UserEntity> findByTenant_IdAndRole(Long tenantId, String role);

    List<UserEntity> findByTenant_Id(Long tenantId);
}
