package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.dto.InvoiceRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceResponse;
import org.springframework.stereotype.Service;


public interface InvoiceService {
    InvoiceResponse createInvoice(InvoiceRequest request);

    public InvoiceResponse getInvoiceById(String invoiceId);
}
