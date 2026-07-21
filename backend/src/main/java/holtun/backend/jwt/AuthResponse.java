package holtun.backend.jwt;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String name;
    private String lastName;
    private String username;
    private String role;
    private String accessToken;
}