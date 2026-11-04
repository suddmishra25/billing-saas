package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.entity.CategoryEntity;
import in.sudhanshu.Billingsoftware.entity.CustomerEntity;
import in.sudhanshu.Billingsoftware.entity.ItemEntity;
import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import in.sudhanshu.Billingsoftware.io.ItemRequest;
import in.sudhanshu.Billingsoftware.io.ItemResponse;
import in.sudhanshu.Billingsoftware.repository.CategoryRepository;
import in.sudhanshu.Billingsoftware.repository.CustomerRepository;
import in.sudhanshu.Billingsoftware.repository.ItemRepository;
import in.sudhanshu.Billingsoftware.repository.TenantRepository;
import in.sudhanshu.Billingsoftware.service.FileUploadService;
import in.sudhanshu.Billingsoftware.service.ItemService;
import in.sudhanshu.Billingsoftware.util.TenantContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final TenantRepository tenantRepository;
    private final CustomerRepository customerRepository;

    @Override
    @Transactional
    public ItemResponse createItem(ItemRequest request) {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() ->
                        new RuntimeException("Tenant not found")
                );

        CustomerEntity customer =
                customerRepository
                        .findByCustomerIdAndTenantId(
                                request.getCustomerId(),
                                tenantId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Customer not found"
                                )
                        );

        ItemEntity item = ItemEntity.builder()
                .name(request.getName())
                .description(request.getDescription())
                .hsnCode(request.getHsnCode())
                .unit(request.getUnit())
                .sellingPrice(request.getSellingPrice())
                .purchasePrice(request.getPurchasePrice())
                .gstRate(request.getGstRate())
                .discount(request.getDiscount())
                .stockQuantity(request.getStockQuantity())
                .tenant(tenant)
                .customer(customer)
                .build();

        item = itemRepository.save(item);

        return convertToResponse(item);
    }

    @Override
    public List<ItemResponse> getCustomerItems(String customerId) {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        return itemRepository
                .findByTenantIdAndCustomerCustomerId(tenantId, customerId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Override
    public ItemResponse getItem(String itemId, String customerId) {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        ItemEntity item =
                itemRepository
                        .findByItemIdAndTenantIdAndCustomerCustomerId(
                                itemId,
                                tenantId,
                                customerId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Item not found"
                                )
                        );

        return convertToResponse(item);
    }

    @Override
    @Transactional
    public void deleteItem(String itemId, String customerId) {

        Long tenantId = TenantContext.getTenantId();

        ItemEntity item =
                itemRepository
                        .findByItemIdAndTenantIdAndCustomerCustomerId(
                                itemId,
                                tenantId,
                                customerId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Item not found"
                                )
                        );

        itemRepository.delete(item);
    }

    private ItemResponse convertToResponse(ItemEntity item) {

        return ItemResponse.builder()
                .itemId(item.getItemId())
                .customerId(
                        item.getCustomer().getCustomerId()
                )
                .name(item.getName())
                .description(item.getDescription())
                .hsnCode(item.getHsnCode())
                .unit(item.getUnit())
                .sellingPrice(item.getSellingPrice())
                .purchasePrice(item.getPurchasePrice())
                .gstRate(item.getGstRate())
                .discount(item.getDiscount())
                .stockQuantity(item.getStockQuantity())
                .build();
    }
}