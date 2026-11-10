package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.io.ItemRequest;
import in.sudhanshu.Billingsoftware.io.ItemResponse;

import java.util.List;

public interface ItemService {

    ItemResponse createItem(ItemRequest request);

    ItemResponse updateItem(String itemId, String clientId, ItemRequest request);

    List<ItemResponse> getClientItems(String clientId);

    ItemResponse getItem(String itemId, String clientId);

    void deleteItem(String itemId, String clientId);

    List<ItemResponse> read();
}
