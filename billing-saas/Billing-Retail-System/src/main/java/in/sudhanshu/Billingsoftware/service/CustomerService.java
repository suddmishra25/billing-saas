package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.dto.CustomerRequest;
import in.sudhanshu.Billingsoftware.dto.CustomerResponse;

import java.util.List;

public interface CustomerService {

    CustomerResponse createCustomer(CustomerRequest request);

    List<CustomerResponse> getCustomers();

    CustomerResponse getCustomer(String customerId);

    CustomerResponse updateCustomer(String customerId, CustomerRequest request);

    void deleteCustomer(String customerId);
}