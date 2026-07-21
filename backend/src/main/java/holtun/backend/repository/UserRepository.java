package holtun.backend.repository;

import holtun.backend.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserModel, Long> {
    Optional<UserModel> findByUuid(UUID uuid);

    Optional<UserModel> findByUsername(String username);

    @Query("SELECT u FROM UserModel u JOIN FETCH u.role WHERE u.username = :username")
    Optional<UserModel> findByUsernameWithRole(@Param("username") String username);

    List<UserModel> findByRole_RoleName(String roleName);

    void deleteByUuid(UUID uuid);
}
