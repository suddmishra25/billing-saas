package in.sudhanshu.Billingsoftware.filter;

import in.sudhanshu.Billingsoftware.entity.UserEntity;
import in.sudhanshu.Billingsoftware.repository.UserRepository;
import in.sudhanshu.Billingsoftware.security.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class MustChangePasswordFilter extends OncePerRequestFilter {

    private static final String CHANGE_PASSWORD_PATH = "/api/v1.0/auth/change-password";

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.getPrincipal() instanceof CustomUserDetails principal
                && !CHANGE_PASSWORD_PATH.equals(request.getServletPath())) {

            UserEntity user = userRepository.findByEmail(principal.getEmail()).orElse(null);

            if (user != null && Boolean.TRUE.equals(user.getMustChangePassword())) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                response.getWriter().write(
                        "{\"message\":\"You must change your password before continuing\"}"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
