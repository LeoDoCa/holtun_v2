package holtun.backend.controller;

import holtun.backend.jwt.AuthRequest;
import holtun.backend.jwt.AuthResponse;
import holtun.backend.jwt.JwtTokenUtil;
import holtun.backend.model.UserModel;
import holtun.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"*"})
@RequiredArgsConstructor
@Log4j2
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            log.info("Inicio de intento de login para usuario: {}", request.getUsername());

            if (request.getUsername() == null || request.getUsername().isEmpty() ||
                    request.getPassword() == null || request.getPassword().isEmpty()) {
                log.warn("Intento de login con credenciales vacías");
                return ResponseEntity.badRequest().body(
                        errorBody("Usuario y contraseña son requeridos")
                );
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            UserModel user = userService.findByUsername(request.getUsername());

            String accessToken = jwtTokenUtil.generateToken(user);

            AuthResponse response = new AuthResponse();
            response.setName(user.getName());
            response.setLastName(user.getLastName());
            response.setUsername(user.getUsername());
            response.setRole(user.getRole().getRoleName());
            response.setAccessToken(accessToken);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.info("Login exitoso para usuario: {} con rol: {}",
                    request.getUsername(), user.getRole().getRoleName());

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            log.warn("Credenciales inválidas para usuario: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    errorBody("Usuario o contraseña incorrectos")
            );
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Intento de logout sin token desde IP: {}", request.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    errorBody("Token requerido para cerrar sesión")
            );
        }

        String token = authHeader.substring(7);

        if (!jwtTokenUtil.validateAccessToken(token)) {
            log.warn("Intento de logout con token inválido desde IP: {}", request.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    errorBody("Token inválido o expirado")
            );
        }

        String username = extractUsername(token);

        SecurityContextHolder.clearContext();

        log.info("Logout exitoso para usuario: {}", username);

        return ResponseEntity.ok(Map.of("mensaje", "Sesión cerrada correctamente"));
    }

    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        if (!jwtTokenUtil.validateAccessToken(token)) {
            log.warn("Token inválido recibido para validación");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    errorBody("Token inválido o expirado")
            );
        }

        String username = extractUsername(token);
        UserModel user = userService.findByUsername(username);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    errorBody("Usuario no encontrado")
            );
        }

        AuthResponse response = new AuthResponse();
        response.setName(user.getName());
        response.setLastName(user.getLastName());
        response.setUsername(user.getUsername());
        response.setRole(user.getRole().getRoleName());
        response.setAccessToken(token);

        log.info("Token válido para usuario: {}", username);

        return ResponseEntity.ok(response);
    }

    private String extractUsername(String token) {
        String subject = jwtTokenUtil.getSubject(token);
        String[] parts = subject.split(",\\s*");
        return parts.length == 2 ? parts[1].trim() : subject;
    }

    private Map<String, Object> errorBody(String message) {
        return Map.of(
                "Estado", HttpStatus.UNAUTHORIZED.value(),
                "Mensaje", message
        );
    }
}