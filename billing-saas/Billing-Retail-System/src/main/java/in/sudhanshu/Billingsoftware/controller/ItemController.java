package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.io.ItemRequest;
import in.sudhanshu.Billingsoftware.io.ItemResponse;
import in.sudhanshu.Billingsoftware.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1.0/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponse createItem(@RequestBody ItemRequest request) {
        return itemService.createItem(request);
    }

    @GetMapping
    public List<ItemResponse> fetchItems() {
        return itemService.read();
    }

    @GetMapping("/client/{clientId}")
    public List<ItemResponse> getClientItems(@PathVariable String clientId) {
        return itemService.getClientItems(clientId);
    }

    @GetMapping("/{itemId}/client/{clientId}")
    public ItemResponse getItem(
            @PathVariable String itemId,
            @PathVariable String clientId) {
        return itemService.getItem(itemId, clientId);
    }

    @PutMapping("/{itemId}/client/{clientId}")
    public ItemResponse updateItem(
            @PathVariable String itemId,
            @PathVariable String clientId,
            @RequestBody ItemRequest request) {
        return itemService.updateItem(itemId, clientId, request);
    }

    @DeleteMapping("/{itemId}/client/{clientId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(
            @PathVariable String itemId,
            @PathVariable String clientId) {
        itemService.deleteItem(itemId, clientId);
    }
}
