package in.sudhanshu.Billingsoftware.io;

import in.sudhanshu.Billingsoftware.dto.InvoiceResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardResponse {

    private Double monthSales;
    private Long monthInvoiceCount;
    private List<InvoiceResponse> recentInvoices;
    private int currentPage;
    private int totalPages;
    private long totalElements;
}
