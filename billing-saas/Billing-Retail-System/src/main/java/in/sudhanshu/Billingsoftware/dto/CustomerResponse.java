package in.sudhanshu.Billingsoftware.dto;

import lombok.*;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponse {

    private String customerId;

    private String name;
    private String email;
    private String phoneNumber;

    private String address;
    private String city;
    private String state;
    private String pincode;

    private String gstin;
    private String stateCode;
}