package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.dto.TenantRequest;
import in.sudhanshu.Billingsoftware.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/saas")
@RequiredArgsConstructor
public class SaasAdminController {

    private final TenantService tenantService;

    @PostMapping("/tenants")
    @ResponseStatus(HttpStatus.CREATED)
    public String createTenant(@RequestBody TenantRequest request) {

        tenantService.createTenant(request);
        return "Tenant created successfully";
    }
}