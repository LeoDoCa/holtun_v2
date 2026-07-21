package holtun.backend.controller;

import holtun.backend.dto.CategoryDto;
import holtun.backend.dto.CreateCategoryDto;
import holtun.backend.service.CategoryService;
import holtun.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = {"*"})
@RequiredArgsConstructor
@Log4j2
public class CategoryController {

    private final CategoryService categoryService;
    private final FileStorageService fileStorageService;

    private static final int MAX_IMAGE_SIZE_MB = 50;

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<CategoryDto> getCategoryByUuid(@PathVariable UUID uuid) {
        return ResponseEntity.ok(categoryService.getCategoryByUuid(uuid));
    }

    @PostMapping(value = "", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CategoryDto> createCategory(
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam("image") MultipartFile image) {

        log.info("Inicio de registro de categoría: {}", name);

        validateImageFile(image, "image");

        UUID categoryUuid = UUID.randomUUID();
        String imagePath = fileStorageService.saveFile(image, categoryUuid, "category-image");

        CreateCategoryDto dto = new CreateCategoryDto();
        dto.setUuid(categoryUuid);
        dto.setName(name);
        dto.setDescription(description);
        dto.setImage(imagePath);

        CategoryDto created = categoryService.createCategory(dto);
        log.info("Categoría registrada exitosamente.");

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping(value = "/{uuid}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CategoryDto> updateCategory(
            @PathVariable UUID uuid,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "existingImage", required = false) String existingImage) {

        log.info("Inicio de actualización de categoría con UUID: {}", uuid);

        String finalImagePath = existingImage;
        if (image != null && !image.isEmpty()) {
            validateImageFile(image, "image");
            finalImagePath = fileStorageService.saveFile(image, uuid, "category-image");
        }

        CreateCategoryDto dto = new CreateCategoryDto();
        dto.setName(name);
        dto.setDescription(description);
        dto.setImage(finalImagePath);

        return ResponseEntity.ok(categoryService.updateCategory(uuid, dto));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID uuid) {
        categoryService.deleteCategory(uuid);
        return ResponseEntity.noContent().build();
    }

    private void validateImageFile(MultipartFile file, String fieldName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El campo '" + fieldName + "' es obligatorio");
        }
        if (!fileStorageService.isImage(file)) {
            throw new IllegalArgumentException("El archivo '" + fieldName + "' debe ser una imagen (JPG, PNG, WEBP)");
        }
        if (!fileStorageService.validateSize(file, MAX_IMAGE_SIZE_MB)) {
            throw new IllegalArgumentException("El archivo '" + fieldName + "' excede el tamaño máximo de " + MAX_IMAGE_SIZE_MB + "MB");
        }
    }
}