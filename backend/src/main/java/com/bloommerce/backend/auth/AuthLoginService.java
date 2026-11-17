
package com.bloommerce.backend.auth;

import com.bloommerce.backend.auth.dto.AuthResponse;
import com.bloommerce.backend.auth.dto.LoginRequest;
import com.bloommerce.backend.user.User;
import com.bloommerce.backend.user.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class AuthLoginService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final long expirationSeconds;
    private final String issuer;

    public AuthLoginService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtEncoder jwtEncoder,
        @Value("${bloommerce.jwt.expiration-seconds}")
        long expirationSeconds,
        @Value("${bloommerce.jwt.issuer}") String issuer
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.expirationSeconds = expirationSeconds;
        this.issuer = issuer;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        String email = request.email()
            .trim()
            .toLowerCase(Locale.ROOT);

        User user = userRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(this::invalidCredentials);

        if (!user.isActive()
            || !passwordEncoder.matches(
            request.password(),
            user.getPasswordHash()
        )) {
            throw invalidCredentials();
        }

        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(issuer)
            .subject(user.getEmail())
            .issuedAt(now)
            .expiresAt(now.plusSeconds(expirationSeconds))
            .claim("userId", user.getId())
            .claim("roles", List.of(user.getRole().name()))
            .build();

        JwsHeader header = JwsHeader
            .with(MacAlgorithm.HS256)
            .build();

        String token = jwtEncoder.encode(
            JwtEncoderParameters.from(header, claims)
        ).getTokenValue();

        return new AuthResponse(
            token,
            "Bearer",
            expirationSeconds,
            user.getId(),
            user.getEmail(),
            user.getRole().name()
        );
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "Invalid email or password"
        );
    }
}
