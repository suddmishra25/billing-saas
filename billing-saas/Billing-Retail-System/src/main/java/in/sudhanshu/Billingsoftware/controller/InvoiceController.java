package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.dto.InvoicePaymentUpdateRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceResponse;
import in.sudhanshu.Billingsoftware.dto.InvoiceSalesReportResponse;
import in.sudhanshu.Billingsoftware.io.OrderRequest;
import in.sudhanshu.Billingsoftware.io.OrderResponse;
import in.sudhanshu.Billingsoftware.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1.0")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/invoices")
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceResponse createInvoice(@RequestBody InvoiceRequest request) {
        return invoiceService.createInvoice(request);
    }

    @GetMapping("/invoices")
    public List<InvoiceResponse> listInvoices() {
        return invoiceService.listInvoices();
    }

    @GetMapping("/invoices/reports/sales")
    public InvoiceSalesReportResponse salesReport(
            @RequestParam(required = false) String financialYear,
            @RequestParam(required = false) String clientId) {
        return invoiceService.getSalesReport(financialYear, clientId);
    }

    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @PathVariable String invoiceId) {

        return ResponseEntity.ok(
                invoiceService.getInvoiceById(invoiceId)
        );
    }

    @PatchMapping("/invoices/{invoiceId}/payment")
    public InvoiceResponse updatePayment(
            @PathVariable String invoiceId,
            @RequestBody InvoicePaymentUpdateRequest request) {
        return invoiceService.updatePayment(invoiceId, request);
    }

    @PutMapping("/invoices/{invoiceId}")
    public InvoiceResponse updateInvoice(
            @PathVariable String invoiceId,
            @RequestBody InvoiceRequest request) {
        return invoiceService.updateInvoice(invoiceId, request);
    }

}
