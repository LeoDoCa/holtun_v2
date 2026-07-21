package holtun.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "roles")
public class RoleModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column( updatable = false, nullable = false,unique = true)
    private UUID uuid;
    private String roleName;

    @OneToMany(mappedBy = "role")
    @JsonIgnore
    private List<UserModel> users = new ArrayList<>();

    public RoleModel(String roleName) {
        this.roleName = roleName;
    }

    @PrePersist
    public void generateUUID() {
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
    }
}
