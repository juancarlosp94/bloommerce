
package com.bloommerce.backend.auth;

import com.bloommerce.backend.auth.dto.RegisterRequest;
import com.bloommerce.backend.auth.dto.UserResponse;
import com.bloommerce.backend.user.User;
import com.bloommerce.backend.user.UserRepository;
import com.bloommerce.backend.user.UserRole;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {

        String email = request.email()
            .trim()
            .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Email is already registered"
            );
        }

        User user = new User(
            request.firstName().trim(),
            request.lastName().trim(),
            email,
            passwordEncoder.encode(request.password())
        );

        user.setRole(UserRole.CUSTOMER);
        user.setActive(true);

        if (request.phone() != null) {
            user.setPhone(request.phone().trim());
        }

        try {
            User savedUser = userRepository.saveAndFlush(user);
            return UserResponse.fromEntity(savedUser);

        } catch (DataIntegrityViolationException ex) {
            if (isUniqueViolation(ex)) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered",
                    ex
                );
            }

            throw ex;
        }
    }

    private boolean isUniqueViolation(Throwable exception) {
        Throwable cause = exception;

        while (cause != null) {
            if (cause instanceof java.sql.SQLException sqlException
                && "23505".equals(sqlException.getSQLState())) {
                return true;
            }

            cause = cause.getCause();
        }

        return false;
    }
}
