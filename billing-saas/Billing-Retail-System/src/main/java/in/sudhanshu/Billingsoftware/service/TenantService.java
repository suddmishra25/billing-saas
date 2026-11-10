package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.dto.TenantRequest;
import in.sudhanshu.Billingsoftware.dto.TenantResponse;
import in.sudhanshu.Billingsoftware.dto.TenantUpdateRequest;

import java.util.List;

public interface TenantService {

    TenantResponse createTenant(TenantRequest request);

    List<TenantResponse> listTenants();

    TenantResponse getTenant(String tenantId);

    TenantResponse updateTenant(String tenantId, TenantUpdateRequest request);

    void deleteTenant(String tenantId);
}
