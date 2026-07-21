package holtun.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Date;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="users")
public class UserModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column( updatable = false, nullable = false,unique = true)
    private UUID uuid;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String lastName;
    @Column(unique = true, nullable = false)
    private String username;
    @Column(nullable = false)
    private String password;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private RoleModel role;

    public UserModel(UUID uuid, String username, String password, RoleModel role) {
        this.uuid = uuid;
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public UserModel(String username, String password, RoleModel role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    @PrePersist
    public void generateUUID() {
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
    }
}
