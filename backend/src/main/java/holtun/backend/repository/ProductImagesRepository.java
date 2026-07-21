package holtun.backend.repository;

import holtun.backend.model.Product;
import holtun.backend.model.ProductImages;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductImagesRepository extends JpaRepository<ProductImages, Integer> {
    Optional<ProductImages> findByUuid(UUID uuid);

    List<ProductImages> findByProduct_Uuid(UUID productUuid);

    void deleteByUuid(UUID uuid);
}
