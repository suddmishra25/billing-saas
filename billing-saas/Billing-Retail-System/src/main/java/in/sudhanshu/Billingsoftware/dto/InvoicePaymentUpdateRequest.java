package in.sudhanshu.Billingsoftware.dto;

import in.sudhanshu.Billingsoftware.dto.InvoiceResponse.InvoicePaymentStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class InvoicePaymentUpdateRequest {

    private InvoicePaymentStatus paymentStatus;
    private BigDecimal amountPaid;
}
