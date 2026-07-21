package holtun.backend.service;

import holtun.backend.dto.RegisterUserDto;
import holtun.backend.dto.UserDto;
import holtun.backend.exception.DuplicateUsernameException;
import holtun.backend.exception.RoleNotFoundException;
import holtun.backend.exception.UserNotFoundException;
import holtun.backend.model.RoleModel;
import holtun.backend.model.UserModel;
import holtun.backend.repository.RoleRepository;
import holtun.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        log.info("Inicio de obtención de todos los usuarios");
        List<UserModel> users = userRepository.findAll();
        log.info("Usuarios obtenidos exitosamente. Total: {}", users.size());
        return convertToDto(users);
    }

    @Transactional(readOnly = true)
    public UserDto getUserByUuid(UUID uuid) {
        log.info("Inicio de obtención de usuario con UUID: {}", uuid);
        UserModel user = userRepository.findByUuid(uuid)
                .orElseThrow(() -> {
                    log.error("Usuario no encontrado con UUID: {}", uuid);
                    return new UserNotFoundException("Usuario no encontrado");
                });
        log.info("Usuario obtenido exitosamente con UUID: {}", uuid);
        return convertToDto(user);
    }

    @Transactional(readOnly = true)
    public UserDto getUserByUsername(String username) {
        log.info("Inicio de obtención de usuario con nombre de usuario: {}", username);
        UserModel user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("Usuario no encontrado con nombre de usuario: {}", username);
                    return new UserNotFoundException("Usuario no encontrado");
                });
        log.info("Usuario obtenido exitosamente con nombre de usuario: {}", username);
        return convertToDto(user);
    }

    @Transactional(readOnly = true)
    public UserModel findByUsername(String username) {
        return userRepository.findByUsernameWithRole(username).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsersByRole(String roleName) {
        log.info("Inicio de obtención de usuarios con rol: {}", roleName);
        List<UserModel> users = userRepository.findByRole_RoleName(roleName);
        log.info("Usuarios con rol {} obtenidos exitosamente. Total: {}", roleName, users.size());
        return convertToDto(users);
    }

    @Transactional(rollbackFor = {SQLException.class, Exception.class})
    public UserDto registerUser(RegisterUserDto dto) {
        log.info("Inicio de registro de usuario: {}", dto.getUsername());

        if (dto.getPassword() == null || dto.getPassword().length() < 6) {
            log.warn("Intento de registro con contraseña inválida para usuario: {}", dto.getUsername());
            throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres.");
        }

        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            log.warn("Intento de registro con nombre de usuario ya existente: {}", dto.getUsername());
            throw new DuplicateUsernameException("El nombre de usuario ya está registrado");
        }

        RoleModel role = roleRepository.findByRoleName("ROLE_ADMIN")
                .orElseThrow(() -> {
                    log.error("Rol ADMIN no encontrado en la base de datos");
                    return new RoleNotFoundException("Rol ADMIN no encontrado");
                });

        UserModel user = new UserModel();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setName(dto.getName());
        user.setLastName(dto.getLastName());
        user.setRole(role);

        UserModel savedUser = userRepository.save(user);
        log.info("Usuario registrado exitosamente: {} con UUID: {}",
                savedUser.getUsername(), savedUser.getUuid());

        return convertToDto(savedUser);
    }

    @Transactional(rollbackFor = {SQLException.class, Exception.class})
    public UserDto updateUser(UUID uuid, RegisterUserDto dto) {
        log.info("Inicio de actualización de usuario con UUID: {}", uuid);

        UserModel user = userRepository.findByUuid(uuid)
                .orElseThrow(() -> {
                    log.error("Usuario no encontrado con UUID: {}", uuid);
                    return new UserNotFoundException("Usuario no encontrado");
                });

        user.setName(dto.getName());
        user.setLastName(dto.getLastName());

        if (!user.getUsername().equals(dto.getUsername())) {
            if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
                log.warn("Intento de actualizar a nombre de usuario ya existente: {}", dto.getUsername());
                throw new DuplicateUsernameException("El nombre de usuario ya está en uso");
            }
            log.debug("Actualizando nombre de usuario de {} a {}", user.getUsername(), dto.getUsername());
            user.setUsername(dto.getUsername());
        }

        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            if (dto.getPassword().length() < 6) {
                throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres.");
            }
            log.debug("Actualizando contraseña para usuario: {}", uuid);
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        UserModel updatedUser = userRepository.save(user);
        log.info("Usuario con UUID {} actualizado exitosamente.", uuid);

        return convertToDto(updatedUser);
    }

    @Transactional(rollbackFor = {SQLException.class, Exception.class})
    public void deleteUser(UUID uuid) {
        log.info("Inicio de eliminación de usuario con UUID: {}", uuid);

        UserModel user = userRepository.findByUuid(uuid)
                .orElseThrow(() -> {
                    log.error("Usuario no encontrado con UUID: {}", uuid);
                    return new UserNotFoundException("Usuario no encontrado");
                });

        userRepository.deleteByUuid(uuid);
        log.info("Usuario con UUID {} eliminado exitosamente.", uuid);
    }

    private UserDto convertToDto(UserModel user) {
        UserDto dto = new UserDto();
        dto.setUuid(user.getUuid());
        dto.setName(user.getName());
        dto.setLastName(user.getLastName());
        dto.setUsername(user.getUsername());
        dto.setRoleName(user.getRole().getRoleName());

        return dto;
    }

    private List<UserDto> convertToDto(List<UserModel> users) {
        List<UserDto> dtos = new ArrayList<>();
        for (UserModel user : users) {
            dtos.add(convertToDto(user));
        }
        return dtos;
    }
}