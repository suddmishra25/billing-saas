package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.io.ChangePasswordRequest;

public interface PasswordService {

    void changePassword(String email, ChangePasswordRequest request);
}
