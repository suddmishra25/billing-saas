package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.io.DashboardResponse;
import in.sudhanshu.Billingsoftware.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1.0")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final InvoiceService invoiceService;

    @GetMapping("/dashboard")
    public DashboardResponse getDashboardData(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("In dashboard flow, page={}, size={}", page, size);
        return invoiceService.getDashboard(page, size);
    }
}
