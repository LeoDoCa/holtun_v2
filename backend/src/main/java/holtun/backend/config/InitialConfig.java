package holtun.backend.config;

import holtun.backend.model.RoleModel;
import holtun.backend.model.UserModel;
import holtun.backend.repository.RoleRepository;
import holtun.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

@Configuration
@RequiredArgsConstructor
@Log4j2
public class InitialConfig implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        log.info("Verificando configuración inicial del sistema...");

        RoleModel adminRole = getOrCreateRole("ROLE_ADMIN");
        createAdminIfNotExists(adminRole);

        log.info("Configuración inicial completada.");
    }

    private RoleModel getOrCreateRole(String roleName) {
        return roleRepository.findByRoleName(roleName)
                .orElseGet(() -> {
                    log.info("Rol {} no encontrado, creándolo...", roleName);
                    RoleModel role = new RoleModel();
                    role.setUuid(UUID.randomUUID());
                    role.setRoleName(roleName);
                    return roleRepository.save(role);
                });
    }

    private void createAdminIfNotExists(RoleModel adminRole) {
        if (userRepository.findByUsername(adminUsername).isPresent()) {
            log.info("El usuario administrador '{}' ya existe. Se omite creación.", adminUsername);
            return;
        }

        log.info("Creando usuario administrador inicial: {}", adminUsername);

        UserModel admin = new UserModel();
        admin.setUuid(UUID.randomUUID());
        admin.setUsername(adminUsername);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setName("Administrador");
        admin.setLastName("Holtun");
        admin.setRole(adminRole);

        userRepository.save(admin);

        log.info("Usuario administrador creado exitosamente.");
    }
}