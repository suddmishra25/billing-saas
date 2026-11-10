package in.sudhanshu.Billingsoftware.io;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemResponse {

    private String itemId;

    private String clientId;

    private String clientName;

    private String name;

    private String description;

    private String hsnCode;

    private String unit;

    private BigDecimal sellingPrice;

    private BigDecimal purchasePrice;

    private BigDecimal gstRate;

    private BigDecimal cgstRate;

    private BigDecimal sgstRate;

    private BigDecimal discount;

    private BigDecimal stockQuantity;
}
