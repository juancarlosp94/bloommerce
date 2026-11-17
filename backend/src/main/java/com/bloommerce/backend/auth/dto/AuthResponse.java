
package com.bloommerce.backend.auth.dto;

public record AuthResponse(

    String accessToken,
    String tokenType,
    long expiresIn,
    Long userId,
    String email,
    String role

) {}
