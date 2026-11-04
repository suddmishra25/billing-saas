package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.dto.InvoiceRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceResponse;
import in.sudhanshu.Billingsoftware.io.OrderRequest;
import in.sudhanshu.Billingsoftware.io.OrderResponse;
import in.sudhanshu.Billingsoftware.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @PathVariable String invoiceId) {

        return ResponseEntity.ok(
                invoiceService.getInvoiceById(invoiceId)
        );
    }

}
