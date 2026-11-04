package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.dto.InvoiceItemRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceItemResponse;
import in.sudhanshu.Billingsoftware.dto.InvoiceRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceResponse;
import in.sudhanshu.Billingsoftware.entity.CustomerEntity;
import in.sudhanshu.Billingsoftware.entity.InvoiceEntity;
import in.sudhanshu.Billingsoftware.entity.InvoiceItemEntity;
import in.sudhanshu.Billingsoftware.entity.ItemEntity;
import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import in.sudhanshu.Billingsoftware.repository.CustomerRepository;
import in.sudhanshu.Billingsoftware.repository.InvoiceRepository;
import in.sudhanshu.Billingsoftware.repository.ItemRepository;
import in.sudhanshu.Billingsoftware.repository.TenantRepository;
import in.sudhanshu.Billingsoftware.service.InvoiceNumberService;
import in.sudhanshu.Billingsoftware.service.InvoiceService;
import in.sudhanshu.Billingsoftware.util.TenantContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final TenantRepository tenantRepository;
    private final CustomerRepository customerRepository;
    private final ItemRepository itemRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceNumberService invoiceNumberService;

    @Override
    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {

        // =====================================================
        // 1. Get logged-in tenant
        // =====================================================

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() ->
                        new RuntimeException("Tenant not found")
                );

        // =====================================================
        // 2. Get customer belonging to this tenant
        // =====================================================

        CustomerEntity customer =
                customerRepository.findByCustomerIdAndTenantId(
                        request.getCustomerId(),
                        tenantId
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Customer not found for this tenant"
                        )
                );

        // =====================================================
        // 3. Create invoice
        // =====================================================

        InvoiceEntity invoice = new InvoiceEntity();

        invoice.setTenant(tenant);
        invoice.setCustomer(customer);

        //invoice.setInvoiceNumber(request.getInvoiceNumber());
        // Generate invoice number
        String invoiceNumber =
                invoiceNumberService.generateInvoiceNumber(tenantId);

        invoice.setInvoiceNumber(invoiceNumber);

        invoice.setInvoiceDate(request.getInvoiceDate());
        invoice.setDueDate(request.getDueDate());

        invoice.setPaymentMethod(request.getPaymentMethod());

        invoice.setAmountPaid(
                request.getAmountPaid() != null
                        ? request.getAmountPaid()
                        : BigDecimal.ZERO
        );

        invoice.setPlaceOfSupply(request.getPlaceOfSupply());
        invoice.setVehicleNumber(request.getVehicleNumber());
        invoice.setTransportName(request.getTransportName());
        invoice.setEWayBillNumber(request.getEWayBillNumber());
        invoice.setPurchaseOrderNumber(request.getPurchaseOrderNumber());
        invoice.setReferenceNumber(request.getReferenceNumber());
        invoice.setNotes(request.getNotes());

        // =====================================================
        // 4. Seller snapshot
        // =====================================================

        invoice.setSellerName(tenant.getCompanyName());
        invoice.setSellerEmail(tenant.getEmail());
        invoice.setSellerPhone(tenant.getPhoneNumber());
        invoice.setSellerAddress(tenant.getAddress());

        // =====================================================
        // 5. Create invoice items
        // =====================================================

        List<InvoiceItemEntity> invoiceItems =
                request.getItems()
                        .stream()
                        .map(itemRequest ->
                                createInvoiceItem(
                                        itemRequest,
                                        tenantId,
                                        customer.getId(),
                                        tenant
                                )
                        )
                        .toList();

        invoice.setItems(invoiceItems);

        // =====================================================
        // 6. Calculate invoice totals
        // =====================================================

        calculateInvoiceTotals(invoice);

        // =====================================================
        // 7. Set payment status
        // =====================================================

        updatePaymentStatus(invoice);

        // =====================================================
        // 8. Save invoice
        // =====================================================

        InvoiceEntity savedInvoice =
                invoiceRepository.save(invoice);

        // =====================================================
        // 9. Convert to response
        // =====================================================

        return convertToResponse(savedInvoice);
    }


    private InvoiceItemEntity createInvoiceItem(
            InvoiceItemRequest request,
            Long tenantId,
            Long customerId,
            TenantEntity tenant) {

        // =====================================================
        // Find item belonging to:
        //
        // tenant + customer
        // =====================================================

        ItemEntity item =
                itemRepository
                        .findByItemIdAndTenantIdAndCustomerId(
                                request.getItemId(),
                                tenantId,
                                customerId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Item not found for this customer"
                                )
                        );

        // =====================================================
        // Quantity
        // =====================================================

        BigDecimal quantity = request.getQuantity();

        if (quantity == null ||
                quantity.compareTo(BigDecimal.ZERO) <= 0) {

            throw new RuntimeException(
                    "Quantity must be greater than zero"
            );
        }

        // =====================================================
        // Rate
        // =====================================================

        BigDecimal rate =
                request.getRate() != null
                        ? request.getRate()
                        : item.getSellingPrice();

        if (rate == null ||
                rate.compareTo(BigDecimal.ZERO) < 0) {

            throw new RuntimeException(
                    "Invalid item rate"
            );
        }

        // =====================================================
        // Discount
        // =====================================================

        BigDecimal discount =
                request.getDiscount() != null
                        ? request.getDiscount()
                        : BigDecimal.ZERO;

        if (discount.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException(
                    "Discount cannot be negative"
            );
        }

        // =====================================================
        // Gross amount
        // =====================================================

        BigDecimal grossAmount =
                quantity.multiply(rate);

        // =====================================================
        // Taxable amount
        // =====================================================

        BigDecimal taxableAmount =
                grossAmount.subtract(discount);

        if (taxableAmount.compareTo(BigDecimal.ZERO) < 0) {

            throw new RuntimeException(
                    "Discount cannot be greater than gross amount"
            );
        }

        // =====================================================
        // GST
        // =====================================================

        BigDecimal gstRate =
                item.getGstRate() != null
                        ? item.getGstRate()
                        : BigDecimal.ZERO;

        BigDecimal taxAmount =
                taxableAmount
                        .multiply(gstRate)
                        .divide(
                                BigDecimal.valueOf(100),
                                2,
                                RoundingMode.HALF_UP
                        );

        // =====================================================
        // Total
        // =====================================================

        BigDecimal totalAmount =
                taxableAmount.add(taxAmount);

        // =====================================================
        // Create invoice item snapshot
        // =====================================================

        return InvoiceItemEntity.builder()
                .tenant(tenant)
                .itemId(item.getItemId())
                .itemName(item.getName())
                .description(item.getDescription())
                .hsnCode(item.getHsnCode())
                .unit(item.getUnit())
                .quantity(quantity)
                .rate(rate)
                .discount(discount)
                .taxableAmount(taxableAmount)
                .gstRate(gstRate)
                .totalTax(taxAmount)
                .totalAmount(totalAmount)
                .build();
    }


    private void calculateInvoiceTotals(
            InvoiceEntity invoice) {

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal taxableAmount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (InvoiceItemEntity item : invoice.getItems()) {

            BigDecimal grossAmount =
                    item.getQuantity()
                            .multiply(item.getRate());

            subtotal = subtotal.add(grossAmount);

            totalDiscount =
                    totalDiscount.add(
                            item.getDiscount()
                    );

            taxableAmount =
                    taxableAmount.add(
                            item.getTaxableAmount()
                    );

            totalTax =
                    totalTax.add(
                            item.getTotalTax()
                    );
        }

        BigDecimal grandTotal =
                taxableAmount.add(totalTax);

        invoice.setSubtotal(subtotal);
        invoice.setDiscount(totalDiscount);
        invoice.setTaxableAmount(taxableAmount);
        invoice.setTotalTax(totalTax);

        /*
         * For now assuming intra-state GST.
         *
         * Later we can calculate CGST/SGST/IGST
         * based on seller and customer state.
         */

        invoice.setCgst(
                totalTax.divide(
                        BigDecimal.valueOf(2),
                        2,
                        RoundingMode.HALF_UP
                )
        );

        invoice.setSgst(
                totalTax.subtract(
                        invoice.getCgst()
                )
        );

        invoice.setIgst(BigDecimal.ZERO);
        invoice.setCess(BigDecimal.ZERO);

        // For now no automatic round-off
        invoice.setRoundOff(BigDecimal.ZERO);

        invoice.setGrandTotal(
                grandTotal
                        .add(invoice.getRoundOff())
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        )
        );

        // =====================================================
        // Balance
        // =====================================================

        BigDecimal amountPaid =
                invoice.getAmountPaid() != null
                        ? invoice.getAmountPaid()
                        : BigDecimal.ZERO;

        BigDecimal balance =
                invoice.getGrandTotal()
                        .subtract(amountPaid);

        if (balance.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException(
                    "Amount paid cannot be greater than invoice total"
            );
        }

        invoice.setBalanceAmount(balance);
    }


    private void updatePaymentStatus(
            InvoiceEntity invoice) {

        BigDecimal amountPaid =
                invoice.getAmountPaid() != null
                        ? invoice.getAmountPaid()
                        : BigDecimal.ZERO;

        BigDecimal grandTotal =
                invoice.getGrandTotal();

        if (amountPaid.compareTo(BigDecimal.ZERO) == 0) {

            invoice.setPaymentStatus(
                    InvoiceEntity.PaymentStatus.PENDING
            );

        } else if (amountPaid.compareTo(grandTotal) >= 0) {

            invoice.setPaymentStatus(
                    InvoiceEntity.PaymentStatus.PAID
            );

        } else {

            invoice.setPaymentStatus(
                    InvoiceEntity.PaymentStatus.PARTIAL
            );
        }
    }


    private InvoiceResponse convertToResponse(InvoiceEntity invoice) {

        List<InvoiceItemResponse> itemResponses =
                invoice.getItems()
                        .stream()
                        .map(item -> InvoiceItemResponse.builder()
                                .itemId(item.getItemId())
                                .name(item.getItemName())
                                .description(item.getDescription())
                                .hsnCode(item.getHsnCode())
                                .unit(item.getUnit())
                                .rate(item.getRate())
                                .totalTax(item.getTotalTax())
                                .totalAmount(item.getTotalAmount())
                                .build())
                        .toList();

        return InvoiceResponse.builder()

                // =========================
                // Invoice
                // =========================
                .invoiceId(invoice.getInvoiceId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())

                // =========================
                // Tenant
                // =========================
                .tenantId(invoice.getTenant().getTenantId())

                // =========================
                // Customer
                // =========================
                .customerId(
                        invoice.getCustomer() != null
                                ? invoice.getCustomer().getCustomerId()
                                : null
                )
                .customerName(
                        invoice.getCustomer() != null
                                ? invoice.getCustomer().getName()
                                : null
                )
                .customerPhone(
                        invoice.getCustomer() != null
                                ? invoice.getCustomer().getPhoneNumber()
                                : null
                )
                .customerEmail(
                        invoice.getCustomer() != null
                                ? invoice.getCustomer().getEmail()
                                : null
                )
                .customerAddress(
                        invoice.getCustomer() != null
                                ? invoice.getCustomer().getAddress()
                                : null
                )
                .customerGst(
                        invoice.getCustomer() != null
                                ? invoice.getCustomer().getGstin()
                                : null
                )


                // =========================
                // Seller
                // =========================
                .sellerName(invoice.getSellerName())
                .sellerAddress(invoice.getSellerAddress())
                .sellerCity(invoice.getSellerCity())
                .sellerState(invoice.getSellerState())
                .sellerPincode(invoice.getSellerPincode())
                .sellerGstin(invoice.getSellerGstin())
                .sellerPhone(invoice.getSellerPhone())
                .sellerEmail(invoice.getSellerEmail())

                // =========================
                // Financial
                // =========================
                .subtotal(invoice.getSubtotal())
                .discount(invoice.getDiscount())
                .taxableAmount(invoice.getTaxableAmount())
                .cgst(invoice.getCgst())
                .sgst(invoice.getSgst())
                .igst(invoice.getIgst())
                .cess(invoice.getCess())
                .totalTax(invoice.getTotalTax())
                .roundOff(invoice.getRoundOff())
                .grandTotal(invoice.getGrandTotal())

                // =========================
                // Payment
                // =========================
                .paymentMethod(invoice.getPaymentMethod())

                .paymentStatus(
                        invoice.getPaymentStatus() != null
                                ? InvoiceResponse.InvoicePaymentStatus
                                .valueOf(invoice.getPaymentStatus().name())
                                : null
                )

                .amountPaid(invoice.getAmountPaid())
                .balanceAmount(invoice.getBalanceAmount())

                // =========================
                // Additional
                // =========================
                .placeOfSupply(invoice.getPlaceOfSupply())
                .vehicleNumber(invoice.getVehicleNumber())
                .transportName(invoice.getTransportName())
                .eWayBillNumber(invoice.getEWayBillNumber())
                .purchaseOrderNumber(invoice.getPurchaseOrderNumber())
                .referenceNumber(invoice.getReferenceNumber())
                .notes(invoice.getNotes())

                // =========================
                // Items
                // =========================
                .items(itemResponses)

                .build();
    }



    @Override
    @Transactional
    public InvoiceResponse getInvoiceById(String invoiceId) {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        InvoiceEntity invoice = invoiceRepository
                .findByInvoiceIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invoice not found"
                        )
                );

        return convertToResponse(invoice);
    }
}