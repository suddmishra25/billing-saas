package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.entity.ClientEntity;
import in.sudhanshu.Billingsoftware.entity.ItemEntity;
import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import in.sudhanshu.Billingsoftware.io.ItemRequest;
import in.sudhanshu.Billingsoftware.io.ItemResponse;
import in.sudhanshu.Billingsoftware.repository.ClientRepository;
import in.sudhanshu.Billingsoftware.repository.ItemRepository;
import in.sudhanshu.Billingsoftware.repository.TenantRepository;
import in.sudhanshu.Billingsoftware.service.ItemService;
import in.sudhanshu.Billingsoftware.util.TenantContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final TenantRepository tenantRepository;
    private final ClientRepository clientRepository;

    @Override
    @Transactional
    public ItemResponse createItem(ItemRequest request) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        ClientEntity client = clientRepository
                .findByClientIdAndTenantId(request.getClientId(), tenantId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        ItemEntity item = ItemEntity.builder()
                .name(request.getName())
                .description(request.getDescription())
                .hsnCode(request.getHsnCode())
                .unit(request.getUnit())
                .sellingPrice(request.getSellingPrice())
                .purchasePrice(request.getPurchasePrice())
                .discount(request.getDiscount())
                .stockQuantity(request.getStockQuantity())
                .tenant(tenant)
                .client(client)
                .build();

        applyTaxRates(item, request);
        item = itemRepository.save(item);
        return convertToResponse(item);
    }

    @Override
    @Transactional
    public ItemResponse updateItem(String itemId, String clientId, ItemRequest request) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        ItemEntity item = itemRepository
                .findByItemIdAndTenantIdAndClientClientId(itemId, tenantId, clientId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setHsnCode(request.getHsnCode());
        item.setUnit(request.getUnit());
        item.setSellingPrice(request.getSellingPrice());
        item.setPurchasePrice(request.getPurchasePrice());
        applyTaxRates(item, request);
        item.setDiscount(request.getDiscount());
        item.setStockQuantity(request.getStockQuantity());

        item = itemRepository.save(item);
        return convertToResponse(item);
    }

    @Override
    public List<ItemResponse> getClientItems(String clientId) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        return itemRepository
                .findByTenantIdAndClientClientId(tenantId, clientId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Override
    public ItemResponse getItem(String itemId, String clientId) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        ItemEntity item = itemRepository
                .findByItemIdAndTenantIdAndClientClientId(itemId, tenantId, clientId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        return convertToResponse(item);
    }

    @Override
    @Transactional
    public void deleteItem(String itemId, String clientId) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        ItemEntity item = itemRepository
                .findByItemIdAndTenantIdAndClientClientId(itemId, tenantId, clientId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        itemRepository.delete(item);
    }

    @Override
    public List<ItemResponse> read() {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        return itemRepository.findByTenantId(tenantId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private ItemResponse convertToResponse(ItemEntity item) {
        BigDecimal cgst = effectiveCgst(item);
        BigDecimal sgst = effectiveSgst(item);
        return ItemResponse.builder()
                .itemId(item.getItemId())
                .clientId(item.getClient().getClientId())
                .clientName(item.getClient().getName())
                .name(item.getName())
                .description(item.getDescription())
                .hsnCode(item.getHsnCode())
                .unit(item.getUnit())
                .sellingPrice(item.getSellingPrice())
                .purchasePrice(item.getPurchasePrice())
                .gstRate(cgst.add(sgst))
                .cgstRate(cgst)
                .sgstRate(sgst)
                .discount(item.getDiscount())
                .stockQuantity(item.getStockQuantity())
                .build();
    }

    private void applyTaxRates(ItemEntity item, ItemRequest request) {
        BigDecimal cgst = request.getCgstRate() != null ? request.getCgstRate() : BigDecimal.ZERO;
        BigDecimal sgst = request.getSgstRate() != null ? request.getSgstRate() : BigDecimal.ZERO;

        if (cgst.compareTo(BigDecimal.ZERO) == 0
                && sgst.compareTo(BigDecimal.ZERO) == 0
                && request.getGstRate() != null) {
            cgst = request.getGstRate()
                    .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            sgst = request.getGstRate().subtract(cgst);
        }

        item.setCgstRate(cgst);
        item.setSgstRate(sgst);
        item.setGstRate(cgst.add(sgst));
    }

    static BigDecimal effectiveCgst(ItemEntity item) {
        if (item.getCgstRate() != null) {
            return item.getCgstRate();
        }
        if (item.getGstRate() != null) {
            return item.getGstRate()
                    .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    static BigDecimal effectiveSgst(ItemEntity item) {
        if (item.getSgstRate() != null) {
            return item.getSgstRate();
        }
        if (item.getGstRate() != null) {
            BigDecimal half = item.getGstRate()
                    .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            return item.getGstRate().subtract(half);
        }
        return BigDecimal.ZERO;
    }
}
