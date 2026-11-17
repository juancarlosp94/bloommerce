
package com.bloommerce.backend.auth;

import com.bloommerce.backend.auth.dto.*;
import com.bloommerce.backend.user.User;
import com.bloommerce.backend.user.UserRepository;

import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthLoginService authLoginService;
    private final UserRepository userRepository;

    public AuthController(
        AuthService authService,
        AuthLoginService authLoginService,
        UserRepository userRepository
    ) {
        this.authService = authService;
        this.authLoginService = authLoginService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(
        @Valid @RequestBody RegisterRequest request
    ) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(
        @Valid @RequestBody LoginRequest request
    ) {
        return authLoginService.login(request);
    }

    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/me")
    public UserResponse me(
        @AuthenticationPrincipal Jwt jwt
    ) {
        User user = userRepository
            .findByEmailIgnoreCase(jwt.getSubject())
            .filter(User::isActive)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "User is no longer active"
            ));

        return UserResponse.fromEntity(user);
    }
}
