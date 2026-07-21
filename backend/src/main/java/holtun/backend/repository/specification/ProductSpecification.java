package holtun.backend.repository.specification;

import holtun.backend.model.Product;
import holtun.backend.model.Category;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public class ProductSpecification {

    public static Specification<Product> hasName(String name) {
        return (root, query, cb) -> name == null ? null :
                cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<Product> hasMinPrice(Double minPrice) {
        return (root, query, cb) -> minPrice == null ? null :
                cb.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    public static Specification<Product> hasMaxPrice(Double maxPrice) {
        return (root, query, cb) -> maxPrice == null ? null :
                cb.lessThanOrEqualTo(root.get("price"), maxPrice);
    }

    public static Specification<Product> hasCategory(UUID categoryUuid) {
        return (root, query, cb) -> {
            if (categoryUuid == null) return null;
            Join<Product, Category> categories = root.join("categories");
            return cb.equal(categories.get("uuid"), categoryUuid);
        };
    }

    public static Specification<Product> inStock(Boolean inStock) {
        return (root, query, cb) -> {
            if (inStock == null) return null;
            return inStock
                    ? cb.greaterThan(root.get("stock"), 0)
                    : cb.equal(root.get("stock"), 0);
        };
    }

    public static Specification<Product> hasMinStock(Integer minStock) {
        return (root, query, cb) -> minStock == null ? null :
                cb.greaterThanOrEqualTo(root.get("stock"), minStock);
    }
}