package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.dto.ClientRequest;
import in.sudhanshu.Billingsoftware.dto.ClientResponse;

import java.util.List;

public interface ClientService {

    ClientResponse createClient(ClientRequest request);

    List<ClientResponse> getClients();

    ClientResponse getClient(String clientId);

    ClientResponse updateClient(String clientId, ClientRequest request);

    void deleteClient(String clientId);
}
