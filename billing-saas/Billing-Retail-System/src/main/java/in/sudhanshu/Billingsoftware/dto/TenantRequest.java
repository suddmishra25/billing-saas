package in.sudhanshu.Billingsoftware.dto;

import lombok.Data;

@Data
public class TenantRequest {

    private String companyName;

    private String email;

    private String phoneNumber;

    private String address;

    private String adminName;

    private String adminEmail;

    private String adminPassword;
}