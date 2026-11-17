
package com.bloommerce.backend.auth.dto;

import com.bloommerce.backend.user.User;

public record UserResponse(
    Long id,
    String firstName,
    String lastName,
    String email,
    String role
) {

    public static UserResponse fromEntity(User user) {
        return new UserResponse(
            user.getId(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getRole().name()
        );
    }
}
