package holtun.backend.service;

import holtun.backend.dto.CategoryDto;
import holtun.backend.dto.CreateCategoryDto;
import holtun.backend.exception.CategoryInUseException;
import holtun.backend.exception.CategoryNotFoundException;
import holtun.backend.exception.DuplicateCategoryNameException;
import holtun.backend.model.Category;
import holtun.backend.model.Product;
import holtun.backend.repository.CategoryRepository;
import holtun.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        log.info("Inicio de obtención de todas las categorias.");
        List<Category> categories = categoryRepository.findAll();
        log.info("Categorias obtenidas exitosamente. Total: {}", categories.size());
        return convertToDto(categories);
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryByUuid(UUID uuid) {
        log.info("Inicio de obtención de categoria con UUID: {}", uuid);
        Category category = categoryRepository.findByUuid(uuid)
                .orElseThrow(() -> {
                    log.error("Categoria no encontrada con UUID: {}", uuid);
                    return new RuntimeException("Categoria no encontrada");
                });
        log.info("Categoria obtenida exitosamente con UUID: {}", uuid);
        return convertToDto(category);
    }

    @Transactional(rollbackFor = {SQLException.class, Exception.class})
    public CategoryDto createCategory(CreateCategoryDto dto) {
        log.info("Inicio de registro de categoria - Nombre: {}, Descripción: {}",
                dto.getName(), dto.getDescription());

        if (categoryRepository.existsByNameIgnoreCase(dto.getName())) {
            log.warn("Intento de crear categoria con nombre duplicado: {}", dto.getName());
            throw new DuplicateCategoryNameException("Ya existe una categoria con ese nombre.");
        }

        Category category = new Category();
        if (dto.getUuid() != null) {
            category.setUuid(dto.getUuid());
        }
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setImage(dto.getImage());

        Category savedCategory = categoryRepository.save(category);
        log.info("Categoria registrada exitosamente con UUID: {}", savedCategory.getUuid());

        CategoryDto result = convertToDto(savedCategory);

        return result;
    }

    @Transactional(rollbackFor = {SQLException.class, Exception.class})
    public CategoryDto updateCategory(UUID uuid, CreateCategoryDto dto) {
        log.info("Inicio de actualización de categoria con UUID: {}", uuid);

        Category category = categoryRepository.findByUuid(uuid)
                .orElseThrow(() -> {
                    log.error("Categoria no encontrada con UUID: {}", uuid);
                    return new CategoryNotFoundException("Categoria no encontrada");
                });

        boolean nameChanged = !category.getName().equalsIgnoreCase(dto.getName());

        if (nameChanged && categoryRepository.existsByNameIgnoreCase(dto.getName())) {
            log.warn("Intento de actualizar categoria UUID {} con nombre duplicado: {}", uuid, dto.getName());
            throw new DuplicateCategoryNameException("Ya existe una categoria con ese nombre.");
        }

        category.setName(dto.getName());
        category.setDescription(dto.getDescription());

        String oldImage = category.getImage();
        String newImage = dto.getImage();

        if (newImage != null && !newImage.equals(oldImage)) {
            if (oldImage != null && !oldImage.isBlank()) {
                log.info("Reemplazando imagen de categoria UUID {}. Eliminando imagen anterior: {}", uuid, oldImage);
                try {
                    fileStorageService.deleteFile(oldImage);
                } catch (Exception e) {
                    log.error("No se pudo eliminar la imagen anterior '{}': {}", oldImage, e.getMessage(), e);
                }
            }
            category.setImage(newImage);
        }

        Category updatedCategory = categoryRepository.save(category);
        log.info("Categoria actualizada exitosamente con UUID: {}", uuid);

        return convertToDto(updatedCategory);
    }

    @Transactional(rollbackFor = {SQLException.class, Exception.class})
    public void deleteCategory(UUID uuid) {
        log.info("Inicio de eliminación de categoria con UUID: {}", uuid);

        Category category = categoryRepository.findByUuid(uuid)
                .orElseThrow(() -> {
                    log.error("Categoria no encontrada con UUID: {}", uuid);
                    return new CategoryNotFoundException("Categoria no encontrada");
                });

        List<Product> associatedProducts = productRepository.findByCategories_Uuid(uuid);
        if (!associatedProducts.isEmpty()) {
            log.warn("Intento de eliminar categoria UUID {} con {} productos asociados",
                    uuid, associatedProducts.size());
            throw new CategoryInUseException(
                    "No se puede eliminar la categoría porque tiene " + associatedProducts.size()
                            + " producto(s) asociado(s). Reasigna o elimina esos productos primero."
            );
        }

        categoryRepository.deleteByUuid(uuid);
        log.info("Categoria eliminada exitosamente con UUID: {}", uuid);

        try {
            fileStorageService.deleteEntityFiles(uuid);
            log.info("Archivos de la categoria con UUID {} eliminados exitosamente.", uuid);
        } catch (Exception e) {
            log.error("La categoria se eliminó, pero hubo un error al borrar sus archivos: {}", e.getMessage(), e);
        }
    }

    private CategoryDto convertToDto(Category category) {
        CategoryDto dto = new CategoryDto();
        dto.setUuid(category.getUuid());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setImage(category.getImage());

        return dto;
    }

    private List<CategoryDto> convertToDto(List<Category> categories) {
        List<CategoryDto> dtos = new ArrayList<>();
        for (Category category : categories) {
            dtos.add(convertToDto(category));
        }
        return dtos;
    }
}
