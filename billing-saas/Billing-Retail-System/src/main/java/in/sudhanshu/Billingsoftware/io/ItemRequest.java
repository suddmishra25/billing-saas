package in.sudhanshu.Billingsoftware.io;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemRequest {

    private String customerId;

    private String name;

    private String description;

    private String hsnCode;

    private String unit;

    private BigDecimal sellingPrice;

    private BigDecimal purchasePrice;

    private BigDecimal gstRate;

    private BigDecimal discount;

    private BigDecimal stockQuantity;
}