package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.dto.ClientRequest;
import in.sudhanshu.Billingsoftware.dto.ClientResponse;
import in.sudhanshu.Billingsoftware.entity.ClientEntity;
import in.sudhanshu.Billingsoftware.entity.TenantEntity;
import in.sudhanshu.Billingsoftware.repository.ClientRepository;
import in.sudhanshu.Billingsoftware.repository.TenantRepository;
import in.sudhanshu.Billingsoftware.service.ClientService;
import in.sudhanshu.Billingsoftware.util.PhoneNumberUtil;
import in.sudhanshu.Billingsoftware.util.TenantContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final TenantRepository tenantRepository;

    @Override
    @Transactional
    public ClientResponse createClient(ClientRequest request) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        if (request.getEmail() != null
                && clientRepository.existsByEmailAndTenantId(request.getEmail(), tenantId)) {
            throw new RuntimeException("Client with this email already exists");
        }

        ClientEntity client = ClientEntity.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(PhoneNumberUtil.normalizeOptional(request.getPhoneNumber()))
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .gstin(request.getGstin())
                .stateCode(request.getStateCode())
                .tenant(tenant)
                .build();

        client = clientRepository.save(client);
        return toResponse(client);
    }

    @Override
    public List<ClientResponse> getClients() {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        return clientRepository.findAllByTenantId(tenantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ClientResponse getClient(String clientId) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        ClientEntity client = clientRepository
                .findByClientIdAndTenantId(clientId, tenantId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        return toResponse(client);
    }

    @Override
    @Transactional
    public ClientResponse updateClient(String clientId, ClientRequest request) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        ClientEntity client = clientRepository
                .findByClientIdAndTenantId(clientId, tenantId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        client.setName(request.getName());
        client.setEmail(request.getEmail());
        client.setPhoneNumber(PhoneNumberUtil.normalizeOptional(request.getPhoneNumber()));
        client.setAddress(request.getAddress());
        client.setCity(request.getCity());
        client.setState(request.getState());
        client.setPincode(request.getPincode());
        client.setGstin(request.getGstin());
        client.setStateCode(request.getStateCode());

        client = clientRepository.save(client);
        return toResponse(client);
    }

    @Override
    @Transactional
    public void deleteClient(String clientId) {

        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("Tenant not found");
        }

        ClientEntity client = clientRepository
                .findByClientIdAndTenantId(clientId, tenantId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        clientRepository.delete(client);
    }

    private ClientResponse toResponse(ClientEntity client) {
        return ClientResponse.builder()
                .clientId(client.getClientId())
                .name(client.getName())
                .email(client.getEmail())
                .phoneNumber(client.getPhoneNumber())
                .address(client.getAddress())
                .city(client.getCity())
                .state(client.getState())
                .pincode(client.getPincode())
                .gstin(client.getGstin())
                .stateCode(client.getStateCode())
                .build();
    }
}
