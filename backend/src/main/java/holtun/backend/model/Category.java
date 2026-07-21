package holtun.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "categories")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column( updatable = false, nullable = false,unique = true)
    private UUID uuid;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String description;
    @Column(nullable = false)
    private String image;

    @ManyToMany(mappedBy = "categories")
    private List<Product> products;

    @PrePersist
    public void generateUUID() {
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
    }
}
