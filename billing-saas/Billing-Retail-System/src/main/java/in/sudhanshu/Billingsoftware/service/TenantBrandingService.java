package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.dto.TenantBrandingRequest;
import in.sudhanshu.Billingsoftware.dto.TenantBrandingResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface TenantBrandingService {

    TenantBrandingResponse getBranding();

    TenantBrandingResponse updateBranding(TenantBrandingRequest request);

    String uploadHeaderImage(MultipartFile file) throws IOException;

    String uploadSignatureImage(MultipartFile file) throws IOException;

    String uploadHeaderImageForTenant(String tenantId, MultipartFile file) throws IOException;

    String uploadHeaderBannerForTenant(String tenantId, MultipartFile file) throws IOException;

    String uploadSignatureImageForTenant(String tenantId, MultipartFile file) throws IOException;
}
