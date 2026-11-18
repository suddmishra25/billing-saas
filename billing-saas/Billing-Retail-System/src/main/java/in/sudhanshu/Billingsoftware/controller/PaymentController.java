package in.sudhanshu.Billingsoftware.controller;

import com.razorpay.RazorpayException;
import in.sudhanshu.Billingsoftware.io.OrderResponse;
import in.sudhanshu.Billingsoftware.io.PaymentRequest;
import in.sudhanshu.Billingsoftware.io.PaymentVerificationRequest;
import in.sudhanshu.Billingsoftware.io.RazorpayOrderResponse;
import in.sudhanshu.Billingsoftware.service.OrderService;
import in.sudhanshu.Billingsoftware.service.RazorpayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final RazorpayService razorpayService;
    private final OrderService orderService;

    @PostMapping("/create-order")
    @ResponseStatus(HttpStatus.CREATED)
    public RazorpayOrderResponse createRazorpayOrder(@RequestBody PaymentRequest request) throws RazorpayException {
        return razorpayService.createOrder(request.getAmount(), request.getCurrency());
    }

    @PostMapping("/verify")
    public OrderResponse verifyPayment(@RequestBody PaymentVerificationRequest request) {
        return orderService.verifyPayment(request);
    }
}
