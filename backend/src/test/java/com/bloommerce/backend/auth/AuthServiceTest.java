
package com.bloommerce.backend.auth;

import com.bloommerce.backend.auth.dto.RegisterRequest;
import com.bloommerce.backend.auth.dto.UserResponse;
import com.bloommerce.backend.user.User;
import com.bloommerce.backend.user.UserRepository;
import com.bloommerce.backend.user.UserRole;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private AuthService authService;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(
            userRepository,
            passwordEncoder
        );
    }

    private RegisterRequest validRequest() {
        return new RegisterRequest(
            "John",
            "Doe",
            "john@example.com",
            "SecurePassword123!",
            "3001234567"
        );
    }

    @Test
    void shouldRegisterCustomerWithHashedPassword() {
        when(userRepository.existsByEmailIgnoreCase(
            "john@example.com"
        )).thenReturn(false);

        when(userRepository.saveAndFlush(any(User.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = authService.register(validRequest());

        ArgumentCaptor<User> captor =
            ArgumentCaptor.forClass(User.class);

        verify(userRepository).saveAndFlush(captor.capture());

        User savedUser = captor.getValue();

        assertEquals("john@example.com", savedUser.getEmail());
        assertEquals(UserRole.CUSTOMER, savedUser.getRole());
        assertTrue(savedUser.isActive());

        assertNotEquals(
            "SecurePassword123!",
            savedUser.getPasswordHash()
        );

        assertTrue(passwordEncoder.matches(
            "SecurePassword123!",
            savedUser.getPasswordHash()
        ));

        assertEquals("CUSTOMER", response.role());
        assertEquals("john@example.com", response.email());
    }

    @Test
    void shouldRejectDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase(
            "john@example.com"
        )).thenReturn(true);

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> authService.register(validRequest())
        );

        assertEquals(
            HttpStatus.CONFLICT,
            exception.getStatusCode()
        );

        verify(userRepository, never())
            .saveAndFlush(any(User.class));
    }

    @Test
    void shouldNormalizeEmailBeforeRegistration() {
        RegisterRequest request = new RegisterRequest(
            "John",
            "Doe",
            "  JOHN@EXAMPLE.COM  ",
            "SecurePassword123!",
            null
        );

        when(userRepository.saveAndFlush(any(User.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        authService.register(request);

        ArgumentCaptor<User> captor =
            ArgumentCaptor.forClass(User.class);

        verify(userRepository).existsByEmailIgnoreCase(
            eq("john@example.com")
        );

        verify(userRepository).saveAndFlush(captor.capture());

        assertEquals(
            "john@example.com",
            captor.getValue().getEmail()
        );
    }

    @Test
    void shouldHandleDatabaseUniqueConstraintViolation() {
        SQLException sqlException = new SQLException(
            "Duplicate email",
            "23505"
        );

        when(userRepository.saveAndFlush(any(User.class)))
            .thenThrow(new DataIntegrityViolationException(
                "Unique constraint violated",
                sqlException
            ));

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> authService.register(validRequest())
        );

        assertEquals(
            HttpStatus.CONFLICT,
            exception.getStatusCode()
        );
    }
}
