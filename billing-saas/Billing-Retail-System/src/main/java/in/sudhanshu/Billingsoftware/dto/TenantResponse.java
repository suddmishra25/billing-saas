package in.sudhanshu.Billingsoftware.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;

@Getter
@Setter
@Builder
public class TenantResponse {

    private String tenantId;
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
    private String adminUserId;
    private String adminName;
    private String adminEmail;
    private boolean adminMustChangePassword;
    private Timestamp createdAt;
}
