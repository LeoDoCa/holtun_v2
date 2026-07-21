package holtun.backend.service;

import holtun.backend.dto.CategoryDto;
import holtun.backend.dto.CreateProductDto;
import holtun.backend.dto.ProductDto;
import holtun.backend.exception.DuplicateProductNameException;
import holtun.backend.exception.InvalidCategoryException;
import holtun.backend.exception.ProductNotFoundException;
import holtun.backend.model.Category;
import holtun.backend.model.Product;
import holtun.backend.model.ProductImages;
import holtun.backend.repository.CategoryRepository;
import holtun.backend.repository.ProductRepository;
import holtun.backend.repository.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<ProductDto> getAllProducts() {
        log.info("Inicio de obtención de todos los productos.");
        List<Product> products = productRepository.findAll();
        log.info("Productos obtenidos exitosamente. Total: {}", products.size());
        return convertToDto(products);
    }

    @Transactional(readOnly = true)
    public ProductDto getProductByUuid(UUID uuid) {
        log.info("Inicio de obtención de producto con UUID: {}", uuid);
        Product product = productRepository.findByUuid(uuid)
                .orElseThrow(() -> {
                    log.error("Producto no encontrado con UUID: {}", uuid);
                    return new RuntimeException("Producto no encontrado");
                });
        log.info("Producto obtenido exitosamente con UUID: {}", uuid);
        return convertToDto(product);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByCategory(UUID categoryUuid) {
        log.info("Inicio de obtención de productos por categoría UUID: {}", categoryUuid);

        categoryRepository.findByUuid(categoryUuid)
                .orElseThrow(() -> {
                    log.error("Categoría no encontrada con UUID: {}", categoryUuid);
                    return new RuntimeException("Categoría no encontrada");
                });

        List<Product> products = productRepository.findByCategories_Uuid(categoryUuid);
        log.info("Productos obtenidos por categoría. Total: {}", products.size());
        return convertToDto(products);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByCategories(List<UUID> categoryUuids) {
        log.info("Buscando productos por categorías: {}", categoryUuids);
        List<Product> products = productRepository.findByCategories_UuidIn(categoryUuids);
        return convertToDto(products);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getLowStockProducts(Integer threshold) {
        log.info("Buscando productos con stock <= {}", threshold);
        List<Product> products = productRepository.findByStockLessThanEqual(threshold);
        return convertToDto(products);
    }

    @Transactional(readOnly = true)
    public Page<ProductDto> getProductsFiltered(
            String name,
            UUID categoryUuid,
            Double minPrice,
            Double maxPrice,
            Boolean inStock,
            Integer minStock,
            Pageable pageable) {

        log.info("Filtrando productos (paginado) - name: {}, categoryUuid: {}, minPrice: {}, maxPrice: {}, inStock: {}, minStock: {}, page: {}, size: {}",
                name, categoryUuid, minPrice, maxPrice, inStock, minStock,
                pageable.getPageNumber(), pageable.getPageSize());

        Specification<Product> spec = Specification
                .where(ProductSpecification.hasName(name))
                .and(ProductSpecification.hasCategory(categoryUuid))
                .and(ProductSpecification.hasMinPrice(minPrice))
                .and(ProductSpecification.hasMaxPrice(maxPrice))
                .and(ProductSpecification.inStock(inStock))
                .and(ProductSpecification.hasMinStock(minStock));

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        log.info("Resultado paginado - total elementos: {}, total páginas: {}",
                productPage.getTotalElements(), productPage.getTotalPages());

        return productPage.map(this::convertToDto);
    }

    @Transactional(rollbackFor = {SQLException.class, Exception.class})
    public ProductDto createProduct(CreateProductDto dto) {
        log.info("Inicio de registro de producto - Nombre: {}, Descripción: {}",
                dto.getName(), dto.getDescription());

        if (productRepository.existsByNameIgnoreCase(dto.getName())) {
            log.warn("Intento de crear producto con nombre duplicado: {}", dto.getName());
            throw new DuplicateProductNameException("Ya existe un producto con ese nombre.");
        }

        Product product = new Product();
        if (dto.getUuid() != null) {
            product.setUuid(dto.getUuid());
        }
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setStock(dto.getStock());

        if (dto.getCategoryUuids() != null && !dto.getCategoryUuids().isEmpty()) {

            List<Category> categories =
                    categoryRepository.findByUuidIn(dto.getCategoryUuids());

            if (categories.size() != dto.getCategoryUuids().size()) {
                throw new InvalidCategoryException("Una o más categorías no existen.");
            }

            product.setCategories(categories);

        }

        if (dto.getImagePaths() != null && !dto.getImagePaths().isEmpty()) {
            log.debug("Agregando {} imágenes a los productos", dto.getImagePaths().size());
            List<ProductImages> images = new ArrayList<>();
            for (String imagePath : dto.getImagePaths()) {
                ProductImages image = new ProductImages();
                image.setImagePath(imagePath);
                image.setProduct(product);
                images.add(image);
            }
            product.setImages(images);
        }

        Product savedProduct = productRepository.save(product);
        log.info("Producto registrado exitosamente con UUID: {}", savedProduct.getUuid());

        ProductDto result = convertToDto(savedProduct);

        return result;
    }

    @Transactional(rollbackFor = {SQLException.class, Exception.class})
    public ProductDto updateProduct(UUID uuid, CreateProductDto dto) {
        log.info("Inicio de actualización de producto con UUID: {}", uuid);

        Product product = productRepository.findByUuid(uuid)
                .orElseThrow(() -> {
                    log.error("Producto no encontrado con UUID: {}", uuid);
                    return new ProductNotFoundException("Producto no encontrado");
                });

        boolean nameChanged = !product.getName().equalsIgnoreCase(dto.getName());

        if (nameChanged && productRepository.existsByNameIgnoreCase(dto.getName())) {
            log.warn("Intento de actualizar producto UUID {} con nombre duplicado: {}", uuid, dto.getName());
            throw new DuplicateProductNameException("Ya existe un producto con ese nombre.");
        }

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setStock(dto.getStock());

        if (dto.getCategoryUuids() != null) {
            log.debug("Actualizando categorías para UUID: {}", uuid);
            List<Category> categories = categoryRepository.findAllByUuidIn(dto.getCategoryUuids());
            product.setCategories(categories);
        }

        boolean hasExisting = dto.getExistingImagePaths() != null && !dto.getExistingImagePaths().isEmpty();
        boolean hasNew      = dto.getImagePaths()         != null && !dto.getImagePaths().isEmpty();

        if (hasExisting || hasNew) {
            log.info("Actualizando imágenes para producto con UUID: {}", uuid);

            List<String> oldImagePaths = product.getImages().stream()
                    .map(ProductImages::getImagePath)
                    .collect(Collectors.toList());

            List<String> keptPaths = hasExisting ? dto.getExistingImagePaths() : new ArrayList<>();
            deleteRemovedImages(oldImagePaths, keptPaths);

            product.getImages().clear();

            if (hasExisting) {
                for (String existingPath : dto.getExistingImagePaths()) {
                    ProductImages image = new ProductImages();
                    image.setImagePath(existingPath);
                    image.setProduct(product);
                    product.getImages().add(image);
                }
                log.debug("Conservadas {} imágenes existentes", dto.getExistingImagePaths().size());
            }

            if (hasNew) {
                for (String imagePath : dto.getImagePaths()) {
                    ProductImages image = new ProductImages();
                    image.setImagePath(imagePath);
                    image.setProduct(product);
                    product.getImages().add(image);
                }
                log.debug("Agregadas {} nuevas imágenes", dto.getImagePaths().size());
            }

            log.info("Total imágenes resultantes: {}", product.getImages().size());

        } else if (dto.getExistingImagePaths() != null && dto.getImagePaths() != null) {
            log.info("Eliminando todas las imágenes para producto con UUID: {}", uuid);

            List<String> oldImagePaths = product.getImages().stream()
                    .map(ProductImages::getImagePath)
                    .collect(Collectors.toList());
            deleteRemovedImages(oldImagePaths, new ArrayList<>());

            product.getImages().clear();
        }

        Product updatedProduct = productRepository.save(product);
        log.info("Producto actualizado exitosamente con UUID: {}", uuid);

        return convertToDto(updatedProduct);
    }

    private void deleteRemovedImages(List<String> oldPaths, List<String> keptPaths) {
        List<String> pathsToDelete = oldPaths.stream()
                .filter(path -> !keptPaths.contains(path))
                .collect(Collectors.toList());

        if (pathsToDelete.isEmpty()) {
            return;
        }

        log.info("Eliminando {} archivo(s) de imagen que ya no se conservan", pathsToDelete.size());
        for (String path : pathsToDelete) {
            try {
                fileStorageService.deleteFile(path);
            } catch (Exception e) {
                log.error("No se pudo eliminar el archivo de imagen '{}': {}", path, e.getMessage(), e);
            }
        }
    }

    @Transactional(rollbackFor = {SQLException.class, Exception.class})
    public void deleteProduct(UUID uuid) {
        log.info("Inicio de eliminación de producto con UUID: {}", uuid);

        Product product = productRepository.findByUuid(uuid)
                .orElseThrow(() -> {
                    log.error("Producto no encontrado con UUID: {}", uuid);
                    return new ProductNotFoundException("Producto no encontrado");
                });

        productRepository.deleteByUuid(uuid);
        log.info("Producto eliminado exitosamente con UUID: {}", uuid);

        try {
            fileStorageService.deleteEntityFiles(uuid);
            log.info("Archivos del producto con UUID {} eliminados exitosamente.", uuid);
        } catch (Exception e) {
            log.error("El producto se eliminó, pero hubo un error al borrar sus archivos: {}", e.getMessage(), e);
        }
    }

    private ProductDto convertToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setUuid(product.getUuid());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setStock(product.getStock());

        if (product.getCategories() != null && !product.getCategories().isEmpty()) {
            dto.setCategories(
                    product.getCategories()
                            .stream()
                            .map(category -> new CategoryDto(
                                    category.getUuid(),
                                    category.getName(),
                                    category.getDescription()
                            ))
                            .collect(Collectors.toList())
            );
        }

        if (product.getImages() != null && !product.getImages().isEmpty()) {
            List<String> imagePaths = product.getImages().stream()
                    .map(ProductImages::getImagePath)
                    .collect(Collectors.toList());
            dto.setImages(imagePaths);
        }

        return dto;
    }

    private List<ProductDto> convertToDto(List<Product> products) {
        List<ProductDto> dtos = new ArrayList<>();
        for (Product product : products) {
            dtos.add(convertToDto(product));
        }
        return dtos;
    }
}
