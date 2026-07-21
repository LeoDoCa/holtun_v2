package holtun.backend.controller;

import holtun.backend.dto.RegisterUserDto;
import holtun.backend.dto.UserDto;
import holtun.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"*"})
@RequiredArgsConstructor
@Log4j2
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{uuid}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserDto> getUserByUuid(@PathVariable UUID uuid) {
        return ResponseEntity.ok(userService.getUserByUuid(uuid));
    }

    @GetMapping("/username/{username}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserDto> getUserByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }

    @GetMapping("/role/{roleName}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<UserDto>> getUsersByRole(@PathVariable String roleName) {
        return ResponseEntity.ok(userService.getUsersByRole(roleName));
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> registerUser(@Valid @RequestBody RegisterUserDto dto) {
        log.info("Petición de registro de usuario recibida: {}", dto.getUsername());
        UserDto created = userService.registerUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{uuid}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable UUID uuid, @Valid @RequestBody RegisterUserDto dto) {
        return ResponseEntity.ok(userService.updateUser(uuid, dto));
    }

    @DeleteMapping("/{uuid}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID uuid) {
        userService.deleteUser(uuid);
        return ResponseEntity.noContent().build();
    }
}