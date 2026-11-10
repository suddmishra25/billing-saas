package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.dto.TenantRequest;
import in.sudhanshu.Billingsoftware.dto.TenantResponse;
import in.sudhanshu.Billingsoftware.dto.TenantUpdateRequest;
import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import in.sudhanshu.Billingsoftware.entity.UserEntity;
import in.sudhanshu.Billingsoftware.repository.TenantRepository;
import in.sudhanshu.Billingsoftware.repository.UserRepository;
import in.sudhanshu.Billingsoftware.service.TenantService;
import in.sudhanshu.Billingsoftware.util.PhoneNumberUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private static final String TENANT_ADMIN_ROLE = "TENANT_ADMIN";

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public TenantResponse createTenant(TenantRequest request) {

        validateCreateRequest(request);

        if (userRepository.existsByEmail(request.getAdminEmail())) {
            throw new RuntimeException("Admin email already exists");
        }

        if (tenantRepository.existsByCompanyName(request.getCompanyName())) {
            throw new RuntimeException("Company already exists");
        }

        TenantEntity tenant = TenantEntity.builder()
                .tenantId(UUID.randomUUID().toString())
                .companyName(request.getCompanyName())
                .email(request.getEmail())
                .phoneNumber(PhoneNumberUtil.normalizeOptional(request.getPhoneNumber()))
                .address(request.getAddress())
                .tagline(trimOrNull(request.getTagline()))
                .website(trimOrNull(request.getWebsite()))
                .companyNameColor(trimOrNull(request.getCompanyNameColor()))
                .taglineColor(trimOrNull(request.getTaglineColor()))
                .gstin(trimOrNull(request.getGstin()))
                .headerImageUrl(trimOrNull(request.getHeaderImageUrl()))
                .headerBannerUrl(trimOrNull(request.getHeaderBannerUrl()))
                .signatureImageUrl(trimOrNull(request.getSignatureImageUrl()))
                .bankName(trimOrNull(request.getBankName()))
                .bankAccountNumber(trimOrNull(request.getBankAccountNumber()))
                .bankBranch(trimOrNull(request.getBankBranch()))
                .bankIfsc(trimOrNull(request.getBankIfsc()))
                .build();

        tenant = tenantRepository.save(tenant);

        UserEntity admin = UserEntity.builder()
                .userId(UUID.randomUUID().toString())
                .name(request.getAdminName())
                .email(request.getAdminEmail())
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .role(TENANT_ADMIN_ROLE)
                .tenant(tenant)
                .mustChangePassword(true)
                .build();

        userRepository.save(admin);

        return toResponse(tenant, admin);
    }

    @Override
    public List<TenantResponse> listTenants() {
        return tenantRepository.findAll().stream()
                .map(this::toResponseWithAdmin)
                .toList();
    }

    @Override
    public TenantResponse getTenant(String tenantId) {
        TenantEntity tenant = findTenant(tenantId);
        return toResponseWithAdmin(tenant);
    }

    @Override
    @Transactional
    public TenantResponse updateTenant(String tenantId, TenantUpdateRequest request) {

        TenantEntity tenant = findTenant(tenantId);
        UserEntity admin = findTenantAdmin(tenant.getId());

        if (request.getCompanyName() != null
                && !request.getCompanyName().isBlank()
                && tenantRepository.existsByCompanyNameAndTenantIdNot(
                request.getCompanyName().trim(), tenantId)) {
            throw new RuntimeException("Another company already uses this name");
        }

        if (request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
            tenant.setCompanyName(request.getCompanyName().trim());
        }
        if (request.getEmail() != null) {
            tenant.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null) {
            tenant.setPhoneNumber(PhoneNumberUtil.normalizeOptional(request.getPhoneNumber()));
        }
        if (request.getAddress() != null) {
            tenant.setAddress(request.getAddress());
        }
        if (request.getTagline() != null) {
            tenant.setTagline(trimOrNull(request.getTagline()));
        }
        if (request.getWebsite() != null) {
            tenant.setWebsite(trimOrNull(request.getWebsite()));
        }
        if (request.getCompanyNameColor() != null) {
            tenant.setCompanyNameColor(trimOrNull(request.getCompanyNameColor()));
        }
        if (request.getTaglineColor() != null) {
            tenant.setTaglineColor(trimOrNull(request.getTaglineColor()));
        }
        if (request.getGstin() != null) {
            tenant.setGstin(trimOrNull(request.getGstin()));
        }
        if (request.getHeaderImageUrl() != null) {
            tenant.setHeaderImageUrl(trimOrNull(request.getHeaderImageUrl()));
        }
        if (request.getHeaderBannerUrl() != null) {
            tenant.setHeaderBannerUrl(trimOrNull(request.getHeaderBannerUrl()));
        }
        if (request.getSignatureImageUrl() != null) {
            tenant.setSignatureImageUrl(trimOrNull(request.getSignatureImageUrl()));
        }
        if (request.getBankName() != null) {
            tenant.setBankName(trimOrNull(request.getBankName()));
        }
        if (request.getBankAccountNumber() != null) {
            tenant.setBankAccountNumber(trimOrNull(request.getBankAccountNumber()));
        }
        if (request.getBankBranch() != null) {
            tenant.setBankBranch(trimOrNull(request.getBankBranch()));
        }
        if (request.getBankIfsc() != null) {
            tenant.setBankIfsc(trimOrNull(request.getBankIfsc()));
        }

        if (request.getAdminName() != null && !request.getAdminName().isBlank()) {
            admin.setName(request.getAdminName().trim());
        }

        if (request.getAdminEmail() != null
                && !request.getAdminEmail().isBlank()
                && !request.getAdminEmail().equalsIgnoreCase(admin.getEmail())) {

            if (userRepository.existsByEmail(request.getAdminEmail())) {
                throw new RuntimeException("Email already in use");
            }
            admin.setEmail(request.getAdminEmail().trim());
        }

        if (request.getDefaultPassword() != null && !request.getDefaultPassword().isBlank()) {
            admin.setPassword(passwordEncoder.encode(request.getDefaultPassword()));
            admin.setMustChangePassword(true);
        }

        tenantRepository.save(tenant);
        userRepository.save(admin);

        return toResponse(tenant, admin);
    }

    @Override
    @Transactional
    public void deleteTenant(String tenantId) {
        TenantEntity tenant = findTenant(tenantId);
        List<UserEntity> users = userRepository.findByTenant_Id(tenant.getId());
        userRepository.deleteAll(users);
        tenantRepository.delete(tenant);
    }

    private void validateCreateRequest(TenantRequest request) {
        if (request.getCompanyName() == null || request.getCompanyName().isBlank()) {
            throw new RuntimeException("Company name is required");
        }
        if (request.getAdminName() == null || request.getAdminName().isBlank()) {
            throw new RuntimeException("Admin name is required");
        }
        if (request.getAdminEmail() == null || request.getAdminEmail().isBlank()) {
            throw new RuntimeException("Admin email is required");
        }
        if (request.getAdminPassword() == null || request.getAdminPassword().isBlank()) {
            throw new RuntimeException("Default password is required");
        }
    }

    private TenantEntity findTenant(String tenantId) {
        return tenantRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
    }

    private UserEntity findTenantAdmin(Long tenantPk) {
        return userRepository.findByTenant_IdAndRole(tenantPk, TENANT_ADMIN_ROLE)
                .orElseThrow(() -> new RuntimeException("Tenant admin user not found"));
    }

    private TenantResponse toResponseWithAdmin(TenantEntity tenant) {
        UserEntity admin = userRepository
                .findByTenant_IdAndRole(tenant.getId(), TENANT_ADMIN_ROLE)
                .orElse(null);
        return toResponse(tenant, admin);
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private TenantResponse toResponse(TenantEntity tenant, UserEntity admin) {
        TenantResponse.TenantResponseBuilder builder = TenantResponse.builder()
                .tenantId(tenant.getTenantId())
                .companyName(tenant.getCompanyName())
                .email(tenant.getEmail())
                .phoneNumber(tenant.getPhoneNumber())
                .address(tenant.getAddress())
                .tagline(tenant.getTagline())
                .website(tenant.getWebsite())
                .companyNameColor(tenant.getCompanyNameColor())
                .taglineColor(tenant.getTaglineColor())
                .gstin(tenant.getGstin())
                .headerImageUrl(tenant.getHeaderImageUrl())
                .headerBannerUrl(tenant.getHeaderBannerUrl())
                .signatureImageUrl(tenant.getSignatureImageUrl())
                .bankName(tenant.getBankName())
                .bankAccountNumber(tenant.getBankAccountNumber())
                .bankBranch(tenant.getBankBranch())
                .bankIfsc(tenant.getBankIfsc())
                .createdAt(tenant.getCreatedAt());

        if (admin != null) {
            builder.adminUserId(admin.getUserId())
                    .adminName(admin.getName())
                    .adminEmail(admin.getEmail())
                    .adminMustChangePassword(Boolean.TRUE.equals(admin.getMustChangePassword()));
        }

        return builder.build();
    }
}
