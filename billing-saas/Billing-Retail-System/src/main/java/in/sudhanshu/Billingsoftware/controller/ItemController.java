package in.sudhanshu.Billingsoftware.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.sudhanshu.Billingsoftware.io.ItemRequest;
import in.sudhanshu.Billingsoftware.io.ItemResponse;
import in.sudhanshu.Billingsoftware.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
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

    @GetMapping("/customer/{customerId}")
    public List<ItemResponse> getCustomerItems(@PathVariable String customerId) {

        return itemService.getCustomerItems(customerId);
    }

    @GetMapping("/{itemId}/customer/{customerId}")
    public ItemResponse getItem(@PathVariable String itemId, @PathVariable String customerId) {

        return itemService.getItem(
                itemId,
                customerId
        );
    }

    @DeleteMapping("/{itemId}/customer/{customerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable String itemId, @PathVariable String customerId) {

        itemService.deleteItem(
                itemId,
                customerId
        );
    }
}