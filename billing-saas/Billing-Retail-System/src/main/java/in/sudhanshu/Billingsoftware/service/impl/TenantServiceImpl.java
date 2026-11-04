package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.dto.TenantRequest;
import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import in.sudhanshu.Billingsoftware.entity.UserEntity;
import in.sudhanshu.Billingsoftware.repository.TenantRepository;
import in.sudhanshu.Billingsoftware.repository.UserRepository;
import in.sudhanshu.Billingsoftware.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void createTenant(TenantRequest request) {

        if (userRepository.existsByEmail(request.getAdminEmail())) {
            throw new RuntimeException(
                    "Admin email already exists"
            );
        }

        if (tenantRepository.existsByCompanyName(
                request.getCompanyName())) {

            throw new RuntimeException(
                    "Company already exists"
            );
        }

        // Create tenant
        TenantEntity tenant = TenantEntity.builder()
                .tenantId(UUID.randomUUID().toString())
                .companyName(request.getCompanyName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .build();

        tenantRepository.save(tenant);

        // Create tenant admin
        UserEntity admin = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .name(request.getAdminName())
                .email(request.getAdminEmail())
                .password(
                        passwordEncoder.encode(
                                request.getAdminPassword()
                        )
                )
                .role("TENANT_ADMIN")
                .tenant(tenant)
                .build();

        userRepository.save(admin);
    }
}
