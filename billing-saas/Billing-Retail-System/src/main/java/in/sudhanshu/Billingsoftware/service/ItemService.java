package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.io.ItemRequest;
import in.sudhanshu.Billingsoftware.io.ItemResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ItemService {

    ItemResponse createItem(ItemRequest request);

    List<ItemResponse> getCustomerItems(String customerId);

    ItemResponse getItem(String itemId, String customerId);

    void deleteItem(String itemId, String customerId);
}