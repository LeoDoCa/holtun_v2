package holtun.backend.controller;

import holtun.backend.dto.CreateProductDto;
import holtun.backend.dto.ProductDto;
import holtun.backend.service.FileStorageService;
import holtun.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = {"*"})
@RequiredArgsConstructor
@Log4j2
public class ProductController {

    private final ProductService productService;
    private final FileStorageService fileStorageService;

    private static final int MAX_IMAGE_SIZE_MB = 50;
    private static final int MAX_IMAGES = 5;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<ProductDto> getProductByUuid(@PathVariable UUID uuid) {
        return ResponseEntity.ok(productService.getProductByUuid(uuid));
    }

    @GetMapping("/category/{categoryUuid}")
    public ResponseEntity<List<ProductDto>> getByCategory(@PathVariable UUID categoryUuid) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryUuid));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<ProductDto>> getByCategories(@RequestParam List<UUID> uuids) {
        return ResponseEntity.ok(productService.getProductsByCategories(uuids));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<ProductDto>> getLowStock(
            @RequestParam(defaultValue = "5") Integer threshold) {
        return ResponseEntity.ok(productService.getLowStockProducts(threshold));
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<ProductDto>> getFiltered(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) UUID categoryUuid,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Integer minStock,
            @PageableDefault(page = 0, size = 10, sort = "name") Pageable pageable) {

        return ResponseEntity.ok(
                productService.getProductsFiltered(
                        name, categoryUuid, minPrice, maxPrice, inStock, minStock, pageable)
        );
    }

    @PostMapping(value = "", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductDto> createProduct(
            @RequestParam String name,
            @RequestParam String description,
            @RequestParam Double price,
            @RequestParam Integer stock,
            @RequestParam(required = false) List<UUID> categoryUuids,
            @RequestParam(value = "images", required = false) MultipartFile[] images) {

        log.info("Inicio de registro de producto: {}", name);

        UUID productUuid = UUID.randomUUID();

        List<String> imagePaths = saveImages(images, productUuid);

        CreateProductDto dto = new CreateProductDto();
        dto.setUuid(productUuid);
        dto.setName(name);
        dto.setDescription(description);
        dto.setPrice(price);
        dto.setStock(stock);
        dto.setCategoryUuids(categoryUuids);
        dto.setImagePaths(imagePaths);

        ProductDto created = productService.createProduct(dto);
        log.info("Producto registrado exitosamente.");

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping(value = "/{uuid}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable UUID uuid,
            @RequestParam String name,
            @RequestParam String description,
            @RequestParam Double price,
            @RequestParam Integer stock,
            @RequestParam(required = false) List<UUID> categoryUuids,
            @RequestParam(value = "images", required = false) MultipartFile[] newImages,
            @RequestParam(value = "existingImages", required = false) List<String> existingImages) {

        log.info("Inicio de actualización de producto con UUID: {}", uuid);

        List<String> newImagePaths = saveImages(newImages, uuid);

        CreateProductDto dto = new CreateProductDto();
        dto.setName(name);
        dto.setDescription(description);
        dto.setPrice(price);
        dto.setStock(stock);
        dto.setCategoryUuids(categoryUuids);
        dto.setImagePaths(newImagePaths);
        dto.setExistingImagePaths(existingImages);

        return ResponseEntity.ok(productService.updateProduct(uuid, dto));
    }

    private List<String> saveImages(MultipartFile[] images, UUID entityUuid) {
        List<String> paths = new ArrayList<>();

        if (images == null || images.length == 0) {
            return paths;
        }

        int maxImages = Math.min(images.length, MAX_IMAGES);
        for (int i = 0; i < maxImages; i++) {
            MultipartFile image = images[i];
            if (image != null && !image.isEmpty()) {
                validateImageFile(image, "images[" + i + "]");
                String uniqueFileName = "image-" + UUID.randomUUID();
                paths.add(fileStorageService.saveFile(image, entityUuid, uniqueFileName));
            }
        }
        return paths;
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID uuid) {
        productService.deleteProduct(uuid);
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