package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.io.DashboardResponse;
import in.sudhanshu.Billingsoftware.io.OrderResponse;
import in.sudhanshu.Billingsoftware.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1.0")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final OrderService orderService;

    @GetMapping("/dashboard")
    public DashboardResponse getDashboardData() {
        log.info("In dashboard flow");
        LocalDate today = LocalDate.now();
        Double todaySale = orderService.sumSalesByDate(today);
        Long todayOrderCount = orderService.countByOrderDate(today);
        List<OrderResponse> recentOrders = orderService.findRecentOrders();
        return new DashboardResponse(
                todaySale != null ? todaySale : 0.0,
                todayOrderCount != null ? todayOrderCount : 0,
                recentOrders
        );
    }
}
