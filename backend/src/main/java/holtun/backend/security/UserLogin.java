package holtun.backend.security;

import holtun.backend.model.UserModel;
import holtun.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Log4j2
public class UserLogin implements UserDetailsService  {
    private final UserService userService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("Intentando cargar usuario por nombre de usuario: {}", username);

        UserModel user = userService.findByUsername(username);

        if (user == null) {
            log.error("Usuario no encontrado: {}", username);
            throw new UsernameNotFoundException("Username " + username + " no existe en el sistema");
        }

        log.info("Usuario cargado exitosamente: {} con rol: {}", username, user.getRole().getRoleName());

        return new User(
                user.getUsername(),
                user.getPassword(),
                true,
                true,
                true,
                true,
                List.of(new SimpleGrantedAuthority(user.getRole().getRoleName()))
        );
    }
}
