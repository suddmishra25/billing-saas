package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.dto.InvoiceItemRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceItemResponse;

import java.util.List;

public interface InvoiceItemService {

    InvoiceItemResponse createItem(InvoiceItemRequest request);

    List<InvoiceItemResponse> getAllItems();

    InvoiceItemResponse getItem(String itemId);

    InvoiceItemResponse updateItem(
            String itemId,
            InvoiceItemRequest request
    );

    void deleteItem(String itemId);
}