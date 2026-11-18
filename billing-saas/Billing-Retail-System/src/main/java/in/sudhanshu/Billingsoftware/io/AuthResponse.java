package in.sudhanshu.Billingsoftware.io;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {

    private String email;
    private String token;
    private String role;
    private boolean mustChangePassword;
}
