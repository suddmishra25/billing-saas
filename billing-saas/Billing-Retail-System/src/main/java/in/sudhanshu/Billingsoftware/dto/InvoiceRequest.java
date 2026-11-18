package in.sudhanshu.Billingsoftware.dto;

import in.sudhanshu.Billingsoftware.io.PaymentMethod;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class InvoiceRequest {

    private String clientId;

    private LocalDate invoiceDate;

    private LocalDate dueDate;

    private PaymentMethod paymentMethod;

    private BigDecimal amountPaid;

    private String placeOfSupply;

    private String vehicleNumber;

    private String transportName;

    private String eWayBillNumber;

    private String purchaseOrderNumber;

    private String referenceNumber;

    private String challanNumber;

    private String challanDated;

    private String notes;

    private List<InvoiceItemRequest> items;
}
