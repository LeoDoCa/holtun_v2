package holtun.backend.jwt;

import holtun.backend.model.UserModel;
import holtun.backend.repository.UserRepository;
import io.jsonwebtoken.*;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Log4j2
public class JwtTokenUtil {

    private static final long EXPIRE_DURATION = 24L * 60 * 60 * 1000;

    private final UserRepository userRepository;

    @Value("${jwt.secret}")
    private String secretKey;

    public JwtTokenUtil(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean validateAccessToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(secretKey)
                    .parseClaimsJws(token)
                    .getBody();

            String subject = claims.getSubject();
            String[] parts = subject.split(",\\s*");

            if (parts.length != 2) {
                log.error("Formato de subject del token inválido");
                return false;
            }

            String username = parts[1];

            Optional<UserModel> user = userRepository.findByUsername(username);
            if (user.isEmpty()) {
                log.error("Usuario del token no existe en la base de datos: {}", username);
                return false;
            }

            return true;

        } catch (ExpiredJwtException ex) {
            log.error("Token JWT expirado: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("Token nulo, vacío o contiene errores: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.error("JWT inválido", ex);
        } catch (UnsupportedJwtException ex) {
            log.error("JWT no soportado", ex);
        } catch (JwtException ex) {
            log.error("Validación de firma falló");
        }

        return false;
    }

    public String generateToken(UserModel user) {
        return Jwts.builder()
                .setSubject(String.format("%s, %s", user.getId(), user.getUsername()))
                .claim("uuid", user.getUuid().toString())
                .claim("role", user.getRole().getRoleName())
                .setIssuer("descar")
                .setIssuedAt(new java.util.Date())
                .setExpiration(new java.util.Date(System.currentTimeMillis() + EXPIRE_DURATION))
                .signWith(SignatureAlgorithm.HS512, secretKey)
                .compact();
    }

    public String getSubject(String token) {
        return parseClaims(token).getSubject();
    }

    public String getUserUuid(String token) {
        return (String) parseClaims(token).get("uuid");
    }

    public String getUserRole(String token) {
        return (String) parseClaims(token).get("role");
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .setSigningKey(secretKey)
                .parseClaimsJws(token)
                .getBody();
    }
}
