package holtun.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private UUID uuid;
    private String name;
    private String description;
    private String image;

    public CategoryDto(UUID uuid, String name) {
        this.uuid = uuid;
        this.name = name;
    }

    public CategoryDto(UUID uuid, String name, String description) {
        this.uuid = uuid;
        this.name = name;
        this.description = description;
    }
}
