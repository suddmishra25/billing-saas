package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.dto.InvoiceItemRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceItemResponse;
import in.sudhanshu.Billingsoftware.dto.InvoicePaymentUpdateRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceRequest;
import in.sudhanshu.Billingsoftware.dto.InvoiceResponse;
import in.sudhanshu.Billingsoftware.dto.InvoiceSalesReportResponse;
import in.sudhanshu.Billingsoftware.dto.TenantBrandingResponse;
import in.sudhanshu.Billingsoftware.entity.ClientEntity;
import in.sudhanshu.Billingsoftware.entity.InvoiceEntity;
import in.sudhanshu.Billingsoftware.entity.InvoiceItemEntity;
import in.sudhanshu.Billingsoftware.entity.ItemEntity;
import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import in.sudhanshu.Billingsoftware.repository.ClientRepository;
import in.sudhanshu.Billingsoftware.repository.InvoiceRepository;
import in.sudhanshu.Billingsoftware.repository.ItemRepository;
import in.sudhanshu.Billingsoftware.repository.TenantRepository;
import in.sudhanshu.Billingsoftware.service.InvoiceNumberService;
import in.sudhanshu.Billingsoftware.service.InvoiceService;
import in.sudhanshu.Billingsoftware.io.DashboardResponse;
import in.sudhanshu.Billingsoftware.util.FinancialYearUtil;
import in.sudhanshu.Billingsoftware.util.TenantContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final TenantRepository tenantRepository;
    private final ClientRepository clientRepository;
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
        // 2. Get client belonging to this tenant
        // =====================================================

        ClientEntity client =
                clientRepository.findByClientIdAndTenantId(
                        request.getClientId(),
                        tenantId
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Client not found for this tenant"
                        )
                );

        // =====================================================
        // 3. Create invoice
        // =====================================================

        InvoiceEntity invoice = new InvoiceEntity();

        invoice.setTenant(tenant);
        invoice.setClient(client);

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
        invoice.setChallanNumber(request.getChallanNumber());
        invoice.setChallanDated(request.getChallanDated());
        invoice.setNotes(request.getNotes());

        // =====================================================
        // 4. Seller snapshot
        // =====================================================

        invoice.setSellerName(tenant.getCompanyName());
        invoice.setSellerEmail(tenant.getEmail());
        invoice.setSellerPhone(tenant.getPhoneNumber());
        invoice.setSellerAddress(tenant.getAddress());
        invoice.setSellerCity(tenant.getCity());
        invoice.setSellerState(tenant.getState());
        invoice.setSellerPincode(tenant.getPincode());
        invoice.setSellerGstin(tenant.getGstin());

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
                                        client.getId(),
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

    @Override
    @Transactional
    public InvoiceResponse updateInvoice(String invoiceId, InvoiceRequest request) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        InvoiceEntity invoice = invoiceRepository
                .findByInvoiceIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        if (request.getClientId() == null || request.getClientId().isBlank()) {
            throw new RuntimeException("Client is required");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("At least one line item is required");
        }

        ClientEntity client = clientRepository
                .findByClientIdAndTenantId(request.getClientId(), tenantId)
                .orElseThrow(() -> new RuntimeException("Client not found for this tenant"));

        invoice.setClient(client);
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
        invoice.setChallanNumber(request.getChallanNumber());
        invoice.setChallanDated(request.getChallanDated());
        invoice.setNotes(request.getNotes());

        List<InvoiceItemEntity> invoiceItems = request.getItems()
                .stream()
                .map(itemRequest ->
                        createInvoiceItem(
                                itemRequest,
                                tenantId,
                                client.getId(),
                                tenant
                        )
                )
                .toList();

        invoice.getItems().clear();
        invoice.getItems().addAll(invoiceItems);

        calculateInvoiceTotals(invoice);
        updatePaymentStatus(invoice);

        return convertToResponse(invoiceRepository.save(invoice));
    }

    private InvoiceItemEntity createInvoiceItem(
            InvoiceItemRequest request,
            Long tenantId,
            Long clientPkId,
            TenantEntity tenant) {

        ItemEntity item =
                itemRepository
                        .findByItemIdAndTenantIdAndClientId(
                                request.getItemId(),
                                tenantId,
                                clientPkId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Item not found for this client"
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

        BigDecimal cgstRate = ItemServiceImpl.effectiveCgst(item);
        BigDecimal sgstRate = ItemServiceImpl.effectiveSgst(item);

        BigDecimal cgstAmount =
                taxableAmount
                        .multiply(cgstRate)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal sgstAmount =
                taxableAmount
                        .multiply(sgstRate)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal taxAmount = cgstAmount.add(sgstAmount);
        BigDecimal gstRate = cgstRate.add(sgstRate);

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
                .cgstRate(cgstRate)
                .sgstRate(sgstRate)
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
        BigDecimal totalCgst = BigDecimal.ZERO;
        BigDecimal totalSgst = BigDecimal.ZERO;

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

            BigDecimal lineCgstRate =
                    item.getCgstRate() != null ? item.getCgstRate() : BigDecimal.ZERO;
            BigDecimal lineSgstRate =
                    item.getSgstRate() != null ? item.getSgstRate() : BigDecimal.ZERO;
            if (lineCgstRate.compareTo(BigDecimal.ZERO) == 0
                    && lineSgstRate.compareTo(BigDecimal.ZERO) == 0
                    && item.getGstRate() != null) {
                lineCgstRate = item.getGstRate()
                        .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                lineSgstRate = item.getGstRate().subtract(lineCgstRate);
            }

            BigDecimal taxable = item.getTaxableAmount() != null
                    ? item.getTaxableAmount()
                    : BigDecimal.ZERO;

            BigDecimal lineCgst = taxable
                    .multiply(lineCgstRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineSgst = taxable
                    .multiply(lineSgstRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            totalCgst = totalCgst.add(lineCgst);
            totalSgst = totalSgst.add(lineSgst);
            totalTax = totalTax.add(lineCgst).add(lineSgst);
        }

        BigDecimal grandTotal =
                taxableAmount.add(totalTax);

        invoice.setSubtotal(subtotal);
        invoice.setDiscount(totalDiscount);
        invoice.setTaxableAmount(taxableAmount);
        invoice.setTotalTax(totalTax);
        invoice.setCgst(totalCgst);
        invoice.setSgst(totalSgst);

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
                                .quantity(item.getQuantity())
                                .rate(item.getRate())
                                .discount(item.getDiscount())
                                .taxableAmount(item.getTaxableAmount())
                                .gstRate(item.getGstRate())
                                .cgstRate(item.getCgstRate())
                                .sgstRate(item.getSgstRate())
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
                .branding(tenantBranding(invoice.getTenant()))

                // =========================
                // Client
                // =========================
                .clientId(
                        invoice.getClient() != null
                                ? invoice.getClient().getClientId()
                                : null
                )
                .clientName(
                        invoice.getClient() != null
                                ? invoice.getClient().getName()
                                : null
                )
                .clientPhone(
                        invoice.getClient() != null
                                ? invoice.getClient().getPhoneNumber()
                                : null
                )
                .clientEmail(
                        invoice.getClient() != null
                                ? invoice.getClient().getEmail()
                                : null
                )
                .clientAddress(
                        invoice.getClient() != null
                                ? invoice.getClient().getAddress()
                                : null
                )
                .clientGst(
                        invoice.getClient() != null
                                ? invoice.getClient().getGstin()
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
                .challanNumber(invoice.getChallanNumber())
                .challanDated(invoice.getChallanDated())
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

    @Override
    public List<InvoiceResponse> listInvoices() {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        return invoiceRepository
                .findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Override
    public InvoiceSalesReportResponse getSalesReport(String financialYear, String clientId) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        List<InvoiceEntity> all = invoiceRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);

        TreeSet<String> availableYears = new TreeSet<>(Comparator.reverseOrder());
        for (InvoiceEntity inv : all) {
            String fy = FinancialYearUtil.financialYearFor(inv.getInvoiceDate());
            if (fy != null) {
                availableYears.add(fy);
            }
        }
        if (availableYears.isEmpty()) {
            availableYears.add(FinancialYearUtil.currentFinancialYear());
        }

        String selectedFy = (financialYear != null && !financialYear.isBlank())
                ? financialYear.trim()
                : availableYears.first();

        List<InvoiceEntity> inFinancialYear = all.stream()
                .filter(inv -> selectedFy.equals(FinancialYearUtil.financialYearFor(inv.getInvoiceDate())))
                .toList();

        String selectedClient = (clientId != null && !clientId.isBlank()) ? clientId.trim() : null;

        Map<String, InvoiceSalesReportResponse.ClientSalesSummary> byClient = new LinkedHashMap<>();
        for (InvoiceEntity inv : inFinancialYear) {
            if (inv.getClient() == null) {
                continue;
            }
            if (inv.getPaymentStatus() == InvoiceEntity.PaymentStatus.CANCELLED) {
                continue;
            }
            String cid = inv.getClient().getClientId();
            InvoiceSalesReportResponse.ClientSalesSummary row = byClient.computeIfAbsent(
                    cid,
                    k -> InvoiceSalesReportResponse.ClientSalesSummary.builder()
                            .clientId(cid)
                            .clientName(inv.getClient().getName())
                            .invoiceCount(0)
                            .totalSales(BigDecimal.ZERO)
                            .totalTax(BigDecimal.ZERO)
                            .amountReceived(BigDecimal.ZERO)
                            .outstanding(BigDecimal.ZERO)
                            .build()
            );
            row.setInvoiceCount(row.getInvoiceCount() + 1);
            row.setTotalSales(row.getTotalSales().add(nz(inv.getGrandTotal())));
            row.setTotalTax(row.getTotalTax().add(nz(inv.getTotalTax())));
            row.setAmountReceived(row.getAmountReceived().add(nz(inv.getAmountPaid())));
            row.setOutstanding(row.getOutstanding().add(nz(inv.getBalanceAmount())));
        }

        List<InvoiceSalesReportResponse.ClientSalesSummary> salesByClient = new ArrayList<>(byClient.values());
        salesByClient.sort(Comparator.comparing(
                InvoiceSalesReportResponse.ClientSalesSummary::getTotalSales,
                Comparator.nullsFirst(Comparator.naturalOrder())
        ).reversed());

        List<InvoiceEntity> forTable = inFinancialYear;
        if (selectedClient != null) {
            forTable = inFinancialYear.stream()
                    .filter(inv -> inv.getClient() != null && selectedClient.equals(inv.getClient().getClientId()))
                    .toList();
        }

        int cancelledCount = 0;
        int invoiceCount = 0;
        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal amountReceived = BigDecimal.ZERO;
        BigDecimal outstanding = BigDecimal.ZERO;

        for (InvoiceEntity inv : forTable) {
            if (inv.getPaymentStatus() == InvoiceEntity.PaymentStatus.CANCELLED) {
                cancelledCount++;
                continue;
            }
            invoiceCount++;
            totalSales = totalSales.add(nz(inv.getGrandTotal()));
            totalTax = totalTax.add(nz(inv.getTotalTax()));
            amountReceived = amountReceived.add(nz(inv.getAmountPaid()));
            outstanding = outstanding.add(nz(inv.getBalanceAmount()));
        }

        List<InvoiceSalesReportResponse.InvoiceSalesReportRow> rows = forTable.stream()
                .sorted(Comparator.comparing(
                        InvoiceEntity::getInvoiceDate,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .map(inv -> InvoiceSalesReportResponse.InvoiceSalesReportRow.builder()
                        .invoiceId(inv.getInvoiceId())
                        .invoiceNumber(inv.getInvoiceNumber())
                        .invoiceDate(inv.getInvoiceDate())
                        .clientId(inv.getClient() != null ? inv.getClient().getClientId() : null)
                        .clientName(inv.getClient() != null ? inv.getClient().getName() : null)
                        .grandTotal(inv.getGrandTotal())
                        .totalTax(inv.getTotalTax())
                        .paymentStatus(mapPaymentStatus(inv))
                        .balanceAmount(inv.getBalanceAmount())
                        .build())
                .toList();

        return InvoiceSalesReportResponse.builder()
                .financialYear(selectedFy)
                .clientId(selectedClient)
                .availableFinancialYears(new ArrayList<>(availableYears))
                .summary(InvoiceSalesReportResponse.SalesReportSummary.builder()
                        .invoiceCount(invoiceCount)
                        .cancelledCount(cancelledCount)
                        .totalSales(totalSales)
                        .totalTax(totalTax)
                        .amountReceived(amountReceived)
                        .outstanding(outstanding)
                        .build())
                .salesByClient(salesByClient)
                .invoices(rows)
                .build();
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static InvoiceResponse.InvoicePaymentStatus mapPaymentStatus(InvoiceEntity invoice) {
        if (invoice.getPaymentStatus() == null) {
            return InvoiceResponse.InvoicePaymentStatus.PENDING;
        }
        return InvoiceResponse.InvoicePaymentStatus.valueOf(invoice.getPaymentStatus().name());
    }

    @Override
    @Transactional
    public InvoiceResponse updatePayment(
            String invoiceId,
            InvoicePaymentUpdateRequest request) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        InvoiceEntity invoice = invoiceRepository
                .findByInvoiceIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        if (request.getPaymentStatus() == InvoiceResponse.InvoicePaymentStatus.CANCELLED) {
            invoice.setPaymentStatus(InvoiceEntity.PaymentStatus.CANCELLED);
        } else if (request.getPaymentStatus() == InvoiceResponse.InvoicePaymentStatus.PAID) {
            invoice.setAmountPaid(invoice.getGrandTotal());
            invoice.setBalanceAmount(BigDecimal.ZERO);
            invoice.setPaymentStatus(InvoiceEntity.PaymentStatus.PAID);
        } else if (request.getPaymentStatus() == InvoiceResponse.InvoicePaymentStatus.PARTIAL) {
            BigDecimal paid = request.getAmountPaid() != null
                    ? request.getAmountPaid()
                    : BigDecimal.ZERO;
            if (paid.compareTo(BigDecimal.ZERO) <= 0
                    || paid.compareTo(invoice.getGrandTotal()) >= 0) {
                throw new RuntimeException(
                        "Partial payment requires amount greater than 0 and less than grand total"
                );
            }
            invoice.setAmountPaid(paid);
            invoice.setBalanceAmount(invoice.getGrandTotal().subtract(paid));
            invoice.setPaymentStatus(InvoiceEntity.PaymentStatus.PARTIAL);
        } else if (request.getPaymentStatus() == InvoiceResponse.InvoicePaymentStatus.PENDING) {
            invoice.setAmountPaid(BigDecimal.ZERO);
            invoice.setBalanceAmount(invoice.getGrandTotal());
            invoice.setPaymentStatus(InvoiceEntity.PaymentStatus.PENDING);
        } else if (request.getAmountPaid() != null) {
            invoice.setAmountPaid(request.getAmountPaid());
            updatePaymentStatus(invoice);
            invoice.setBalanceAmount(
                    invoice.getGrandTotal().subtract(invoice.getAmountPaid())
            );
        }

        return convertToResponse(invoiceRepository.save(invoice));
    }

    private TenantBrandingResponse tenantBranding(TenantEntity tenant) {
        if (tenant == null) {
            return null;
        }
        return TenantBrandingResponse.builder()
                .tenantId(tenant.getTenantId())
                .companyName(tenant.getCompanyName())
                .email(tenant.getEmail())
                .phoneNumber(tenant.getPhoneNumber())
                .address(tenant.getAddress())
                .city(tenant.getCity())
                .state(tenant.getState())
                .pincode(tenant.getPincode())
                .gstin(tenant.getGstin())
                .website(tenant.getWebsite())
                .tagline(tenant.getTagline())
                .companyNameColor(tenant.getCompanyNameColor())
                .taglineColor(tenant.getTaglineColor())
                .headerImageUrl(tenant.getHeaderImageUrl())
                .headerBannerUrl(tenant.getHeaderBannerUrl())
                .signatureImageUrl(tenant.getSignatureImageUrl())
                .bankName(tenant.getBankName())
                .bankAccountNumber(tenant.getBankAccountNumber())
                .bankBranch(tenant.getBankBranch())
                .bankIfsc(tenant.getBankIfsc())
                .declarationText(tenant.getDeclarationText())
                .termsAndConditions(tenant.getTermsAndConditions())
                .build();
    }

    @Override
    public DashboardResponse getDashboard(int page, int size) {

        Long tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        LocalDate monthEnd = now.withDayOfMonth(now.lengthOfMonth());

        BigDecimal monthTotal =
                invoiceRepository.sumGrandTotalByTenantAndInvoiceDateBetween(
                        tenantId,
                        monthStart,
                        monthEnd
                );

        if (monthTotal == null) {
            monthTotal = BigDecimal.ZERO;
        }

        long monthCount =
                invoiceRepository.countByTenantAndInvoiceDateBetween(
                        tenantId,
                        monthStart,
                        monthEnd
                );

        int safeSize = Math.min(Math.max(size, 1), 50);
        Page<InvoiceEntity> invoicePage =
                invoiceRepository.findByTenantIdOrderByCreatedAtDesc(
                        tenantId,
                        PageRequest.of(Math.max(page, 0), safeSize)
                );

        List<InvoiceResponse> recent =
                invoicePage.getContent()
                        .stream()
                        .map(this::convertToResponse)
                        .toList();

        return DashboardResponse.builder()
                .monthSales(monthTotal.doubleValue())
                .monthInvoiceCount(monthCount)
                .recentInvoices(recent)
                .currentPage(invoicePage.getNumber())
                .totalPages(invoicePage.getTotalPages())
                .totalElements(invoicePage.getTotalElements())
                .build();
    }
}