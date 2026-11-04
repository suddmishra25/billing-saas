package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.entity.TenantEntity;

public interface InvoiceNumberService {

    String generateInvoiceNumber(Long tenantId);
}
