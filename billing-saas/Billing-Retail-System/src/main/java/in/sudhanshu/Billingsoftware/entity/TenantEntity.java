package in.sudhanshu.Billingsoftware.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;

@Entity
@Table(name = "tbl_tenants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String companyName;

    private String email;

    private String phoneNumber;

    private String address;

    private String city;

    private String state;

    private String pincode;

    private String gstin;

    private String website;

    /** e.g. Manufacturers of: … */
    private String tagline;

    /** Hex color for company name on invoice header, e.g. #CC0000 */
    private String companyNameColor;

    /** Hex color for tagline on invoice header */
    private String taglineColor;

    @Column(length = 512)
    private String headerImageUrl;

    /** Full-width invoice header image; when set, replaces logo + name block on printed invoice. */
    @Column(length = 512)
    private String headerBannerUrl;

    @Column(length = 512)
    private String signatureImageUrl;

    private String bankName;

    private String bankAccountNumber;

    private String bankBranch;

    private String bankIfsc;

    @Column(length = 2000)
    private String declarationText;

    @Column(length = 4000)
    private String termsAndConditions;

    /** Optional prefix, e.g. INV → INV-2026-27-159. Blank = omit prefix. */
    private String invoiceNumberPrefix;

    /** When false, FY is omitted from bill no. and numbering does not reset each FY. */
    private Boolean invoiceNumberIncludeFinancialYear;

    @CreationTimestamp
    @Column(updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;
}