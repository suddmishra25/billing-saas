package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.dto.CustomerRequest;
import in.sudhanshu.Billingsoftware.dto.CustomerResponse;
import in.sudhanshu.Billingsoftware.entity.CustomerEntity;
import in.sudhanshu.Billingsoftware.repository.CustomerRepository;
import in.sudhanshu.Billingsoftware.service.CustomerService;
import in.sudhanshu.Billingsoftware.util.PhoneNumberUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    @Override
    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {

        if (request.getEmail() != null
                && customerRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Customer with this email already exists");
        }

        CustomerEntity customer = CustomerEntity.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(PhoneNumberUtil.normalizeOptional(request.getPhoneNumber()))
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .gstin(request.getGstin())
                .stateCode(request.getStateCode())
                .build();

        customer = customerRepository.save(customer);
        return convertToResponse(customer);
    }

    @Override
    public List<CustomerResponse> getCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Override
    public CustomerResponse getCustomer(String customerId) {
        CustomerEntity customer = customerRepository
                .findByCustomerId(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return convertToResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomer(String customerId, CustomerRequest request) {

        CustomerEntity customer = customerRepository
                .findByCustomerId(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhoneNumber(PhoneNumberUtil.normalizeOptional(request.getPhoneNumber()));
        customer.setAddress(request.getAddress());
        customer.setCity(request.getCity());
        customer.setState(request.getState());
        customer.setPincode(request.getPincode());
        customer.setGstin(request.getGstin());
        customer.setStateCode(request.getStateCode());

        customer = customerRepository.save(customer);
        return convertToResponse(customer);
    }

    @Override
    @Transactional
    public void deleteCustomer(String customerId) {
        CustomerEntity customer = customerRepository
                .findByCustomerId(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        customerRepository.delete(customer);
    }

    private CustomerResponse convertToResponse(CustomerEntity customer) {
        return CustomerResponse.builder()
                .customerId(customer.getCustomerId())
                .name(customer.getName())
                .email(customer.getEmail())
                .phoneNumber(customer.getPhoneNumber())
                .address(customer.getAddress())
                .city(customer.getCity())
                .state(customer.getState())
                .pincode(customer.getPincode())
                .gstin(customer.getGstin())
                .stateCode(customer.getStateCode())
                .build();
    }
}
