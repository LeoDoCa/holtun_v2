package holtun.backend.dto;

import holtun.backend.model.Category;
import holtun.backend.model.ProductImages;
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
public class ProductDto {
    private UUID uuid;
    private String name;
    private String description;
    private Double price;
    private Integer stock;
    private List<CategoryDto> categories;
    private List<String> images;
}
