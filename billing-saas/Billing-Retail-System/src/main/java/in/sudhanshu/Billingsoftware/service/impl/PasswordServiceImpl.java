package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.entity.UserEntity;
import in.sudhanshu.Billingsoftware.io.ChangePasswordRequest;
import in.sudhanshu.Billingsoftware.repository.UserRepository;
import in.sudhanshu.Billingsoftware.service.PasswordService;
import in.sudhanshu.Billingsoftware.util.PasswordPolicyValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PasswordServiceImpl implements PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyValidator passwordPolicyValidator;

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getNewPassword() == null
                || !request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirmation do not match");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("New password must be different from your current password");
        }

        passwordPolicyValidator.validate(request.getNewPassword());

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }
}
