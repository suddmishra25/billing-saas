package in.sudhanshu.Billingsoftware.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItemResponse {

    private String itemId;

    private String name;

    private String description;

    private String hsnCode;

    private String unit;

    private BigDecimal sellingPrice;

    private BigDecimal purchasePrice;

    private BigDecimal gstRate;

    private BigDecimal cgstRate;

    private BigDecimal sgstRate;

    private BigDecimal stockQuantity;

    private BigDecimal quantity;

    private BigDecimal rate;

    private BigDecimal discount;

    private BigDecimal taxableAmount;

    private BigDecimal totalTax;

    private BigDecimal totalAmount;
}