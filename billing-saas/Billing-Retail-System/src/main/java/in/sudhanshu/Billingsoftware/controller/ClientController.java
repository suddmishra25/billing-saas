package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.dto.ClientRequest;
import in.sudhanshu.Billingsoftware.dto.ClientResponse;
import in.sudhanshu.Billingsoftware.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1.0/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientResponse createClient(@RequestBody ClientRequest request) {
        return clientService.createClient(request);
    }

    @GetMapping
    public List<ClientResponse> getClients() {
        return clientService.getClients();
    }

    @GetMapping("/{clientId}")
    public ClientResponse getClient(@PathVariable String clientId) {
        return clientService.getClient(clientId);
    }

    @PutMapping("/{clientId}")
    public ClientResponse updateClient(
            @PathVariable String clientId,
            @RequestBody ClientRequest request) {
        return clientService.updateClient(clientId, request);
    }

    @DeleteMapping("/{clientId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClient(@PathVariable String clientId) {
        clientService.deleteClient(clientId);
    }
}
