package holtun.backend.repository;

import holtun.backend.model.RoleModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<RoleModel, Integer> {
    Optional<RoleModel> findByUuid(UUID uuid);

    Optional<RoleModel> findByRoleName(String roleName);
}
