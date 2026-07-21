package holtun.backend.jwt;

import holtun.backend.model.UserModel;
import holtun.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Log4j2
public class JwtTokenFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwtTokenUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (!hasAuthorizationBearer(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = getAccessToken(request);

        if (!jwtTokenUtil.validateAccessToken(token)) {
            log.warn("Token inválido recibido desde IP: {}", request.getRemoteAddr());
            filterChain.doFilter(request, response);
            return;
        }

        setAuthenticationContext(token, request);
        filterChain.doFilter(request, response);
    }

    private boolean hasAuthorizationBearer(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return !ObjectUtils.isEmpty(header) && header.startsWith("Bearer");
    }

    private String getAccessToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return header.split(" ")[1].trim();
    }

    private void setAuthenticationContext(String token, HttpServletRequest request) {
        UserModel userDetails = getUserDetails(token);

        if (userDetails == null) {
            log.error("No se pudo obtener los detalles del usuario del token");
            return;
        }

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority(userDetails.getRole().getRoleName())
        );

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, authorities);

        authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.debug("Autenticación establecida para usuario: {} con rol: {}",
                userDetails.getUsername(), userDetails.getRole().getRoleName());
    }

    private UserModel getUserDetails(String token) {
        try {
            String[] jwtSubject = jwtTokenUtil.getSubject(token).split(",");

            if (jwtSubject.length != 2) {
                log.error("Formato de subject inválido en el token");
                return null;
            }

            String username = jwtSubject[1].trim();

            Optional<UserModel> userDetails = userRepository.findByUsernameWithRole(username);

            return userDetails.orElse(null);

        } catch (Exception e) {
            log.error("Error al obtener detalles del usuario: {}", e.getMessage());
            return null;
        }
    }
}
