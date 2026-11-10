package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.dto.TenantBrandingRequest;
import in.sudhanshu.Billingsoftware.dto.TenantBrandingResponse;
import in.sudhanshu.Billingsoftware.service.TenantBrandingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1.0/tenant/branding")
public class TenantBrandingController {

    private final TenantBrandingService tenantBrandingService;

    @GetMapping
    public TenantBrandingResponse getBranding() {
        return tenantBrandingService.getBranding();
    }

    @PutMapping
    public TenantBrandingResponse updateBranding(@RequestBody TenantBrandingRequest request) {
        return tenantBrandingService.updateBranding(request);
    }

    @PostMapping(value = "/header", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadHeader(@RequestPart("file") MultipartFile file) throws IOException {
        String url = tenantBrandingService.uploadHeaderImage(file);
        return Map.of("url", url);
    }

    @PostMapping(value = "/signature", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadSignature(@RequestPart("file") MultipartFile file) throws IOException {
        String url = tenantBrandingService.uploadSignatureImage(file);
        return Map.of("url", url);
    }
}
