package in.sudhanshu.Billingsoftware.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT APIs use the Authorization header (not cookies), which browsers cannot set on cross-site
 * form posts — typical CSRF is already mitigated. This filter blocks anonymous cross-origin
 * state-changing requests without a Bearer token (defence in depth).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class SpaOriginGuardFilter extends OncePerRequestFilter {

  private final List<String> allowedOrigins;

  public SpaOriginGuardFilter(
      @Value("${app.cors.allowed-origins:http://localhost:5173}") String originsCsv) {
    this.allowedOrigins =
        List.of(originsCsv.split(",")).stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String method = request.getMethod();
    if (HttpMethod.OPTIONS.matches(method) || HttpMethod.GET.matches(method) || HttpMethod.HEAD.matches(method)) {
      return true;
    }
    String path = request.getRequestURI();
    return path.startsWith("/uploads/") || "/api/v1.0/login".equals(path);
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String auth = request.getHeader("Authorization");
    if (auth != null && auth.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    String origin = request.getHeader("Origin");
    if (origin != null && !origin.isBlank()) {
      if (!allowedOrigins.contains(origin)) {
        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Origin not allowed");
        return;
      }
    } else {
      String referer = request.getHeader("Referer");
      if (referer != null
          && !referer.isBlank()
          && allowedOrigins.stream().noneMatch(referer::startsWith)) {
        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Referer not allowed");
        return;
      }
    }

    filterChain.doFilter(request, response);
  }
}
