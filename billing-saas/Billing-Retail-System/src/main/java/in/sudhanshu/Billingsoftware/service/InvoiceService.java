package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.dto.InvoicePaymentUpdateRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceResponse;
import in.sudhanshu.Billingsoftware.dto.InvoiceSalesReportResponse;
import in.sudhanshu.Billingsoftware.io.DashboardResponse;

import java.util.List;

public interface InvoiceService {
    InvoiceResponse createInvoice(InvoiceRequest request);

    InvoiceResponse getInvoiceById(String invoiceId);

    List<InvoiceResponse> listInvoices();

    InvoiceSalesReportResponse getSalesReport(String financialYear, String clientId);

    DashboardResponse getDashboard(int page, int size);

    InvoiceResponse updatePayment(String invoiceId, InvoicePaymentUpdateRequest request);

    InvoiceResponse updateInvoice(String invoiceId, InvoiceRequest request);
}
