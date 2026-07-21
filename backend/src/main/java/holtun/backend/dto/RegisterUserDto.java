package holtun.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterUserDto {

    @NotBlank(message = "El nombre de usuario es obligatorio.")
    @Size(min = 4, max = 50, message = "El nombre de usuario debe tener entre 4 y 50 caracteres.")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos.")
    private String username;

    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres.")
    private String password;

    @NotBlank(message = "El nombre es obligatorio.")
    private String name;

    @NotBlank(message = "El apellido es obligatorio.")
    private String lastName;
}