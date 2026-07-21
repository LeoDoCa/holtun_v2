package holtun.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryDto {
    private UUID uuid;

    @NotBlank(message = "El nombre de la categoría es obligatorio.")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres.")
    private String name;

    @Size(max = 500, message = "La descripción no puede superar los 500 caracteres.")
    private String description;

    private String image;
}