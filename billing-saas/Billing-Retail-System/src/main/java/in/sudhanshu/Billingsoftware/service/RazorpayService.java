package in.sudhanshu.Billingsoftware.service;

import com.razorpay.RazorpayException;
import in.sudhanshu.Billingsoftware.io.RazorpayOrderResponse;

public interface RazorpayService {

    RazorpayOrderResponse createOrder(Double amount, String currency) throws RazorpayException;
}
