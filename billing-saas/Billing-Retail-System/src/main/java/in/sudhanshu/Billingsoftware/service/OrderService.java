package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.io.OrderRequest;
import in.sudhanshu.Billingsoftware.io.OrderResponse;
import in.sudhanshu.Billingsoftware.io.PaymentVerificationRequest;

import java.time.LocalDate;
import java.util.List;

public interface OrderService {

    OrderResponse createOrder(OrderRequest request);

    void deleteOrder(String orderId);

    List<OrderResponse> getLatestOrders();

    OrderResponse verifyPayment(PaymentVerificationRequest request);

    Double sumSalesByDate(LocalDate date);

    Long countByOrderDate(LocalDate date);

    List<OrderResponse> findRecentOrders();
}
