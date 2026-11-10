package in.sudhanshu.Billingsoftware.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class TenantBrandingResponse {

    private String tenantId;
    private String companyName;
    private String email;
    private String phoneNumber;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String gstin;
    private String website;
    private String tagline;
    private String companyNameColor;
    private String taglineColor;
    private String headerImageUrl;

    private String headerBannerUrl;
    private String signatureImageUrl;
    private String bankName;
    private String bankAccountNumber;
    private String bankBranch;
    private String bankIfsc;
    private String declarationText;
    private String termsAndConditions;
    private String invoiceNumberPrefix;
    private Boolean invoiceNumberIncludeFinancialYear;
    private String financialYear;
    private Long nextBillNumber;
    private String billNumberPreview;
}
