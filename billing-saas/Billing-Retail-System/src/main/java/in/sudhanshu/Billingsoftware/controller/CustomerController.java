package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.dto.CustomerRequest;
import in.sudhanshu.Billingsoftware.dto.CustomerResponse;
import in.sudhanshu.Billingsoftware.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1.0/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse createCustomer(
            @RequestBody CustomerRequest request) {

        return customerService.createCustomer(request);
    }

    @GetMapping
    public List<CustomerResponse> getCustomers() {

        return customerService.getCustomers();
    }

    @GetMapping("/{customerId}")
    public CustomerResponse getCustomer(
            @PathVariable String customerId) {

        return customerService.getCustomer(customerId);
    }

    @PutMapping("/{customerId}")
    public CustomerResponse updateCustomer(
            @PathVariable String customerId,
            @RequestBody CustomerRequest request) {

        return customerService.updateCustomer(
                customerId,
                request
        );
    }

    @DeleteMapping("/{customerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCustomer(
            @PathVariable String customerId) {

        customerService.deleteCustomer(customerId);
    }
}