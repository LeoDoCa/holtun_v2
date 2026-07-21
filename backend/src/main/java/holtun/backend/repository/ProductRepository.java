package holtun.backend.repository;

import holtun.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer>,
        JpaSpecificationExecutor<Product> {

    Optional<Product> findByUuid(UUID uuid);
    void deleteByUuid(UUID uuid);
    boolean existsByNameIgnoreCase(String name);

    Optional<Product> findByNameIgnoreCase(String name);

    List<Product> findByCategories_Uuid(UUID categoryUuid);
    List<Product> findByCategories_UuidIn(List<UUID> categoryUuids);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByPriceBetween(Double minPrice, Double maxPrice);
    List<Product> findByStockGreaterThan(Integer stock);

    List<Product> findByStockLessThanEqual(Integer threshold);
    List<Product> findByStockGreaterThanEqual(Integer minStock);
}
