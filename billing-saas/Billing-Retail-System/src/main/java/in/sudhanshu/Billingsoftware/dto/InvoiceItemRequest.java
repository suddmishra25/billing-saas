package in.sudhanshu.Billingsoftware.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
public class InvoiceItemRequest {

    private String itemId;

    private BigDecimal quantity;

    private BigDecimal rate;

    private BigDecimal discount;
}