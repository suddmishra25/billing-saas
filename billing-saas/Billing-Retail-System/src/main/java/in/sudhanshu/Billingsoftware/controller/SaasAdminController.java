package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.dto.TenantRequest;
import in.sudhanshu.Billingsoftware.dto.TenantResponse;
import in.sudhanshu.Billingsoftware.dto.TenantUpdateRequest;
import in.sudhanshu.Billingsoftware.service.TenantBrandingService;
import in.sudhanshu.Billingsoftware.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/saas")
@RequiredArgsConstructor
public class SaasAdminController {

    private final TenantService tenantService;
    private final TenantBrandingService tenantBrandingService;

    @GetMapping("/tenants")
    public List<TenantResponse> listTenants() {
        return tenantService.listTenants();
    }

    @GetMapping("/tenants/{tenantId}")
    public TenantResponse getTenant(@PathVariable String tenantId) {
        return tenantService.getTenant(tenantId);
    }

    @PostMapping("/tenants")
    @ResponseStatus(HttpStatus.CREATED)
    public TenantResponse createTenant(@RequestBody TenantRequest request) {
        return tenantService.createTenant(request);
    }

    @PutMapping("/tenants/{tenantId}")
    public TenantResponse updateTenant(
            @PathVariable String tenantId,
            @RequestBody TenantUpdateRequest request) {
        return tenantService.updateTenant(tenantId, request);
    }

    @DeleteMapping("/tenants/{tenantId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTenant(@PathVariable String tenantId) {
        tenantService.deleteTenant(tenantId);
    }

    @PostMapping(value = "/tenants/{tenantId}/header", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadTenantHeader(
            @PathVariable String tenantId,
            @RequestPart("file") MultipartFile file) throws IOException {
        String url = tenantBrandingService.uploadHeaderImageForTenant(tenantId, file);
        return Map.of("url", url);
    }

    @PostMapping(value = "/tenants/{tenantId}/header-banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadTenantHeaderBanner(
            @PathVariable String tenantId,
            @RequestPart("file") MultipartFile file) throws IOException {
        String url = tenantBrandingService.uploadHeaderBannerForTenant(tenantId, file);
        return Map.of("url", url);
    }

    @PostMapping(value = "/tenants/{tenantId}/signature", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadTenantSignature(
            @PathVariable String tenantId,
            @RequestPart("file") MultipartFile file) throws IOException {
        String url = tenantBrandingService.uploadSignatureImageForTenant(tenantId, file);
        return Map.of("url", url);
    }
}
