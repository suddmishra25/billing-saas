package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.dto.InvoiceItemRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceItemResponse;
import in.sudhanshu.Billingsoftware.service.InvoiceItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1.0/invoiceItems")
@RequiredArgsConstructor
public class InvoiceItemController {

    //private final InvoiceItemService invoiceItemService;

//    @PostMapping
//    @ResponseStatus(HttpStatus.CREATED)
//    public InvoiceItemResponse createItem(@RequestBody InvoiceItemRequest request) {
//        return invoiceItemService.createItem(request);
//    }
//
//    @GetMapping
//    public List<InvoiceItemResponse> getAllItems() {
//        return invoiceItemService.getAllItems();
//    }
//
//    @GetMapping("/{itemId}")
//    public InvoiceItemResponse getItem(@PathVariable String itemId) {
//
//        return invoiceItemService.getItem(itemId);
//    }
//
//    @PutMapping("/{itemId}")
//    public InvoiceItemResponse updateItem(@PathVariable String itemId, @RequestBody InvoiceItemRequest request) {
//
//        return invoiceItemService.updateItem(itemId, request);
//    }
//
//    @DeleteMapping("/{itemId}")
//    @ResponseStatus(HttpStatus.NO_CONTENT)
//    public void deleteItem(@PathVariable String itemId) {
//
//        invoiceItemService.deleteItem(itemId);
//    }
}