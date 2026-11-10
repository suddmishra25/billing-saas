package in.sudhanshu.Billingsoftware.dto;

import lombok.Data;

@Data
public class TenantUpdateRequest {

    private String companyName;
    private String email;
    private String phoneNumber;
    private String address;
    private String tagline;
    private String website;
    private String companyNameColor;
    private String taglineColor;
    private String gstin;
    private String headerImageUrl;

    private String headerBannerUrl;
    private String signatureImageUrl;
    private String bankName;
    private String bankAccountNumber;
    private String bankBranch;
    private String bankIfsc;
    private String adminName;
    private String adminEmail;
    /** When set, resets tenant admin password and forces change on next login. */
    private String defaultPassword;
}
