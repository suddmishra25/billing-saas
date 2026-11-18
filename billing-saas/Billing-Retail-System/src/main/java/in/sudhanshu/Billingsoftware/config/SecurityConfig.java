package in.sudhanshu.Billingsoftware.config;

import in.sudhanshu.Billingsoftware.filter.JwtRequestFilter;
import in.sudhanshu.Billingsoftware.filter.MustChangePasswordFilter;
import in.sudhanshu.Billingsoftware.service.impl.AppUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String corsAllowedOrigins;

    private final AppUserDetailsService appUserDetailsService;
    private final JwtRequestFilter jwtRequestFilter;
    private final MustChangePasswordFilter mustChangePasswordFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())

                // Stateless JWT in Authorization header (not cookies) — browser CSRF against API is mitigated.
                .csrf(AbstractHttpConfigurer::disable)

                .headers(
                        headers ->
                                headers
                                        .contentTypeOptions(Customizer.withDefaults())
                                        .frameOptions(frame -> frame.deny()))

                .authorizeHttpRequests(auth -> auth

                        // Public
                        .requestMatchers(
                                "/api/v1.0/login",
                                "/uploads/**"
                        ).permitAll()

                        // SaaS owner (tenants + platform customers)
                        .requestMatchers(
                                "/saas/**"
                        ).hasRole("SUPER_ADMIN")

                        // Tenant admin
                        .requestMatchers(
                                "/admin/**"
                        ).hasRole("TENANT_ADMIN")

                        // Tenant users
                        .requestMatchers(
                                "/api/v1.0/createInvoice",
                                "/api/v1.0/invoiceItems",
                                "/api/v1.0/items/**",
                                "/api/v1.0/invoices/**",
                                "/api/v1.0/clients/**",
                                "/api/v1.0/tenant/branding",
                                "/api/v1.0/tenant/branding/**",
                                "/api/v1.0/categories",
                                "/api/v1.0/categories/**",
                                "/api/v1.0/orders/**",
                                "/orders/**",
                                "/payments/**",
                                "/api/v1.0/dashboard",
                                "/api/v1.0/dashboard/**"
                        ).hasAnyRole(
                                "USER",
                                "TENANT_ADMIN"
                        )

                        .anyRequest()
                        .authenticated()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .addFilterBefore(
                        jwtRequestFilter,
                        UsernamePasswordAuthenticationFilter.class
                )
                .addFilterAfter(
                        mustChangePasswordFilter,
                        JwtRequestFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config =
                new CorsConfiguration();

        config.setAllowedOrigins(
                Arrays.stream(corsAllowedOrigins.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList());

        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        config.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type"
                )
        );

        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                config
        );

        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager() {

        DaoAuthenticationProvider authProvider =
                new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(
                appUserDetailsService
        );

        authProvider.setPasswordEncoder(
                passwordEncoder()
        );

        return new ProviderManager(authProvider);
    }
}