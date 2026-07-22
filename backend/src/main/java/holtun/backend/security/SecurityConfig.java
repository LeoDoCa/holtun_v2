package holtun.backend.security;

import holtun.backend.jwt.JwtTokenFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
@Log4j2
public class SecurityConfig {

    private final JwtTokenFilter jwtTokenFilter;

    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/auth/login"
    };

    private static final String[] PUBLIC_GET_ENDPOINTS = {
            "/api/products",
            "/api/products/{uuid}",
            "/api/products/category/{categoryUuid}",
            "/api/products/categories",
            "/api/products/filter",
            "/api/categories",
            "/api/categories/{uuid}",
            "/api/files/**",
            "/uploads/**"    
    };

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration
    ) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, ex) -> {
                            log.warn("Acceso denegado desde IP: {} al recurso: {}",
                                    request.getRemoteAddr(), request.getRequestURI());
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
                                    "No autorizado - Token requerido");
                        })
                )

                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(PUBLIC_ENDPOINTS).permitAll();

                    auth.requestMatchers(HttpMethod.GET, "/api/products/low-stock")
                            .hasAuthority(ROLE_ADMIN);

                    auth.requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll();

                    auth.requestMatchers("/api/products/**").hasAuthority(ROLE_ADMIN);
                    auth.requestMatchers("/api/categories/**").hasAuthority(ROLE_ADMIN);
                    auth.requestMatchers("/api/users/**").hasAuthority(ROLE_ADMIN);

                    auth.anyRequest().authenticated();
                });

        http.addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("Accept", "Content-Type", "Authorization"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}