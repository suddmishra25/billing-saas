package in.sudhanshu.Billingsoftware.service;

import in.sudhanshu.Billingsoftware.io.UserRequest;
import in.sudhanshu.Billingsoftware.io.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse createUser(UserRequest request);

    String getUserRole(String email);

    List<UserResponse> readUsers();

    void deleteUser(String id);
}
