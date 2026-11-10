package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.dto.TenantBrandingRequest;
import in.sudhanshu.Billingsoftware.dto.TenantBrandingResponse;
import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import in.sudhanshu.Billingsoftware.repository.TenantRepository;
import in.sudhanshu.Billingsoftware.service.InvoiceNumberService;
import in.sudhanshu.Billingsoftware.service.TenantBrandingService;
import in.sudhanshu.Billingsoftware.util.FinancialYearUtil;
import in.sudhanshu.Billingsoftware.util.PhoneNumberUtil;
import in.sudhanshu.Billingsoftware.util.SecureUploadUtil;
import in.sudhanshu.Billingsoftware.util.InvoiceNumberFormatUtil;
import in.sudhanshu.Billingsoftware.util.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantBrandingServiceImpl implements TenantBrandingService {

    private static final String UPLOAD_PUBLIC_BASE = "http://localhost:8080/uploads/";

    private final TenantRepository tenantRepository;
    private final InvoiceNumberService invoiceNumberService;

    @Override
    public TenantBrandingResponse getBranding() {
        TenantEntity tenant = currentTenant();
        return toResponse(tenant);
    }

    @Override
    public TenantBrandingResponse updateBranding(TenantBrandingRequest request) {
        TenantEntity tenant = currentTenant();

        if (request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
            tenant.setCompanyName(request.getCompanyName().trim());
        }
        tenant.setEmail(request.getEmail());
        tenant.setPhoneNumber(PhoneNumberUtil.normalizeOptional(request.getPhoneNumber()));
        tenant.setAddress(request.getAddress());
        tenant.setCity(request.getCity());
        tenant.setState(request.getState());
        tenant.setPincode(request.getPincode());
        tenant.setGstin(request.getGstin());
        tenant.setWebsite(request.getWebsite());
        tenant.setTagline(request.getTagline());
        tenant.setCompanyNameColor(request.getCompanyNameColor());
        tenant.setTaglineColor(request.getTaglineColor());
        tenant.setHeaderImageUrl(request.getHeaderImageUrl());
        tenant.setHeaderBannerUrl(request.getHeaderBannerUrl());
        tenant.setSignatureImageUrl(request.getSignatureImageUrl());
        tenant.setBankName(request.getBankName());
        tenant.setBankAccountNumber(request.getBankAccountNumber());
        tenant.setBankBranch(request.getBankBranch());
        tenant.setBankIfsc(request.getBankIfsc());
        tenant.setDeclarationText(request.getDeclarationText());
        tenant.setTermsAndConditions(request.getTermsAndConditions());
        if (request.getInvoiceNumberPrefix() != null) {
            String prefix = request.getInvoiceNumberPrefix().trim();
            tenant.setInvoiceNumberPrefix(prefix.isEmpty() ? null : prefix);
        }
        if (request.getInvoiceNumberIncludeFinancialYear() != null) {
            tenant.setInvoiceNumberIncludeFinancialYear(request.getInvoiceNumberIncludeFinancialYear());
        }

        tenant = tenantRepository.save(tenant);

        if (request.getNextBillNumber() != null && request.getNextBillNumber() > 0) {
            invoiceNumberService.syncNextBillNumber(tenant.getId(), request.getNextBillNumber());
        }

        return toResponse(tenant);
    }

    @Override
    public String uploadHeaderImage(MultipartFile file) throws IOException {
        String url = saveUpload(file, "tenant-header");
        TenantEntity tenant = currentTenant();
        tenant.setHeaderImageUrl(url);
        tenantRepository.save(tenant);
        return url;
    }

    @Override
    public String uploadSignatureImage(MultipartFile file) throws IOException {
        String url = saveUpload(file, "tenant-signature");
        TenantEntity tenant = currentTenant();
        tenant.setSignatureImageUrl(url);
        tenantRepository.save(tenant);
        return url;
    }

    @Override
    public String uploadHeaderImageForTenant(String tenantId, MultipartFile file) throws IOException {
        String url = saveUpload(file, "tenant-header");
        TenantEntity tenant = tenantRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        tenant.setHeaderImageUrl(url);
        tenantRepository.save(tenant);
        return url;
    }

    @Override
    public String uploadHeaderBannerForTenant(String tenantId, MultipartFile file) throws IOException {
        String url = saveUpload(file, "tenant-header-banner");
        TenantEntity tenant = tenantRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        tenant.setHeaderBannerUrl(url);
        tenantRepository.save(tenant);
        return url;
    }

    @Override
    public String uploadSignatureImageForTenant(String tenantId, MultipartFile file) throws IOException {
        String url = saveUpload(file, "tenant-signature");
        TenantEntity tenant = tenantRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        tenant.setSignatureImageUrl(url);
        tenantRepository.save(tenant);
        return url;
    }

    private TenantEntity currentTenant() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
    }

    private String saveUpload(MultipartFile file, String prefix) throws IOException {
        String ext = SecureUploadUtil.safeExtension(file.getOriginalFilename());
        String fileName = SecureUploadUtil.newStoredFileName(prefix, ext);
        Path uploadPath = Paths.get("uploads").toAbsolutePath().normalize();
        SecureUploadUtil.writeUpload(uploadPath, file, fileName);
        return UPLOAD_PUBLIC_BASE + fileName;
    }

    private TenantBrandingResponse toResponse(TenantEntity tenant) {
        return TenantBrandingResponse.builder()
                .tenantId(tenant.getTenantId())
                .companyName(tenant.getCompanyName())
                .email(tenant.getEmail())
                .phoneNumber(tenant.getPhoneNumber())
                .address(tenant.getAddress())
                .city(tenant.getCity())
                .state(tenant.getState())
                .pincode(tenant.getPincode())
                .gstin(tenant.getGstin())
                .website(tenant.getWebsite())
                .tagline(tenant.getTagline())
                .companyNameColor(tenant.getCompanyNameColor())
                .taglineColor(tenant.getTaglineColor())
                .headerImageUrl(tenant.getHeaderImageUrl())
                .headerBannerUrl(tenant.getHeaderBannerUrl())
                .signatureImageUrl(tenant.getSignatureImageUrl())
                .bankName(tenant.getBankName())
                .bankAccountNumber(tenant.getBankAccountNumber())
                .bankBranch(tenant.getBankBranch())
                .bankIfsc(tenant.getBankIfsc())
                .declarationText(tenant.getDeclarationText())
                .termsAndConditions(tenant.getTermsAndConditions())
                .invoiceNumberPrefix(tenant.getInvoiceNumberPrefix())
                .invoiceNumberIncludeFinancialYear(
                        tenant.getInvoiceNumberIncludeFinancialYear() != Boolean.FALSE)
                .financialYear(FinancialYearUtil.currentFinancialYear())
                .nextBillNumber(invoiceNumberService.resolveNextBillNumber(tenant.getId()))
                .billNumberPreview(
                        InvoiceNumberFormatUtil.preview(
                                tenant, invoiceNumberService.resolveNextBillNumber(tenant.getId())))
                .build();
    }
}
