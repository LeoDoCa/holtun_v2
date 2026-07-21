package holtun.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductDto {
    private UUID uuid;

    @NotBlank(message = "El nombre del producto es obligatorio.")
    @Size(max = 150, message = "El nombre no puede superar los 150 caracteres.")
    private String name;

    @NotBlank(message = "La descripción es obligatoria.")
    @Size(max = 1000, message = "La descripción no puede superar los 1000 caracteres.")
    private String description;

    @NotNull(message = "El precio es obligatorio.")
    @Positive(message = "El precio debe ser mayor a 0.")
    private Double price;

    @NotNull(message = "El stock es obligatorio.")
    @PositiveOrZero(message = "El stock no puede ser negativo.")
    private Integer stock;

    private List<UUID> categoryUuids;
    private List<String> imagePaths;
    private List<String> existingImagePaths;
}