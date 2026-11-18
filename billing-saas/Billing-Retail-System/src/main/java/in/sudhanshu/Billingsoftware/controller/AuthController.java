package in.sudhanshu.Billingsoftware.controller;

import in.sudhanshu.Billingsoftware.entity.UserEntity;
import in.sudhanshu.Billingsoftware.io.AuthRequest;
import in.sudhanshu.Billingsoftware.io.AuthResponse;
import in.sudhanshu.Billingsoftware.io.ChangePasswordRequest;
import in.sudhanshu.Billingsoftware.repository.UserRepository;
import in.sudhanshu.Billingsoftware.security.CustomUserDetails;
import in.sudhanshu.Billingsoftware.service.PasswordService;
import in.sudhanshu.Billingsoftware.io.UserRequest;
import in.sudhanshu.Billingsoftware.io.UserResponse;
import in.sudhanshu.Billingsoftware.service.UserService;
import in.sudhanshu.Billingsoftware.service.impl.AppUserDetailsService;
import in.sudhanshu.Billingsoftware.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/v1.0")
public class AuthController {

    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final AppUserDetailsService appUserDetailsService;
    private final UserService userService;
    private final PasswordService passwordService;
    private final UserRepository userRepository;

    private final JwtUtil jwtUtil;


    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse registerUser(@RequestBody UserRequest request) {
        try {
            log.info("In Register flow");
            return userService.createUser(request);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to create user "+e.getMessage());
        }
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) throws Exception {
        authenticate(request.getEmail(), request.getPassword());
        final UserDetails userDetails = appUserDetailsService.loadUserByUsername(request.getEmail());
        final String jwtToken = jwtUtil.generateToken(userDetails);
        String role = userService.getUserRole(request.getEmail());
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));
        boolean mustChange = Boolean.TRUE.equals(user.getMustChangePassword());
        return new AuthResponse(request.getEmail(), jwtToken, role, mustChange);
    }

    @PostMapping("/auth/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody ChangePasswordRequest request) {

        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        try {
            passwordService.changePassword(principal.getEmail(), request);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    private void authenticate(String email, String password) throws Exception {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        }catch (DisabledException e) {
            throw new Exception("User disabled");
        }catch (BadCredentialsException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email or password is incorrect");
        }
    }

    @PostMapping("/encode")
    public String encodePassword(@RequestBody Map<String, String> request) {
        return passwordEncoder.encode(request.get("password"));
    }
}
