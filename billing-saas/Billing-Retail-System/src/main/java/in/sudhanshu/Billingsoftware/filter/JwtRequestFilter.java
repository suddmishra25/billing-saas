package in.sudhanshu.Billingsoftware.filter;

import in.sudhanshu.Billingsoftware.security.CustomUserDetails;
import in.sudhanshu.Billingsoftware.service.impl.AppUserDetailsService;
import in.sudhanshu.Billingsoftware.util.JwtUtil;
import in.sudhanshu.Billingsoftware.util.TenantContext;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtRequestFilter extends OncePerRequestFilter {

    private final AppUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {

        String path = request.getServletPath();

        return path.equals("/api/v1.0/login")
                || path.equals("/api/v1.0/register")
                || path.equals("/api/v1.0/admin/register");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        try {

            String authorizationHeader =
                    request.getHeader("Authorization");

            String email = null;
            String jwt = null;

            if (authorizationHeader != null
                    && authorizationHeader.startsWith("Bearer ")) {

                jwt = authorizationHeader.substring(7);

                email = jwtUtil.extractUsername(jwt);
            }

            if (email != null
                    && SecurityContextHolder
                    .getContext()
                    .getAuthentication() == null) {

                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(email);

                if (jwtUtil.validateToken(jwt, userDetails)) {

                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authenticationToken.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(authenticationToken);

                    // Set tenant
                    if (userDetails instanceof CustomUserDetails customUserDetails) {

                        TenantContext.setTenantId(
                                customUserDetails.getTenantId()
                        );
                    }
                }
            }

            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException e) {

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        } catch (MalformedJwtException | SignatureException e) {

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        } finally {

            TenantContext.clear();
        }
    }
}