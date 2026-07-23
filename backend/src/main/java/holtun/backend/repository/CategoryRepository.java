package holtun.backend.repository;

import holtun.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    Optional<Category> findByUuid(UUID uuid);

    List<Category> findByUuidIn(List<UUID> uuids);

    List<Category> findAllByUuidIn(List<UUID> uuids);

    List<Category> findByProducts_Uuid(UUID productUuid);

    boolean existsByNameIgnoreCase(String name);

    Optional<Category> findByNameIgnoreCase(String name);

    void deleteByUuid(UUID uuid);

    @Query("SELECT c.uuid AS uuid, COUNT(p) AS count " +
            "FROM Category c LEFT JOIN c.products p " +
            "GROUP BY c.uuid")
    List<Object[]> countProductsPerCategory();
}
