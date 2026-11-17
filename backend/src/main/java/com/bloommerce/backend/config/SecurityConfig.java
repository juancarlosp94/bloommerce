
package com.bloommerce.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import com.bloommerce.backend.user.User;
import com.bloommerce.backend.user.UserRepository;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationConverter jwtAuthenticationConverter
    ) throws Exception {

        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session
                .sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)

            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**")
                .permitAll()

                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**",
                    "/error"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/products",
                    "/api/products/**"
                ).permitAll()

                .requestMatchers("/api/products/**", "/api/products")
                .hasRole("ADMIN")

                .requestMatchers("/api/orders/**")
                .authenticated()

                .anyRequest()
                .authenticated()
            )

            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter)
                )
            )

            .build();
    }


    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter(
        UserRepository userRepository
    ) {
        JwtAuthenticationConverter converter =
            new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(jwt -> {

            String email = jwt.getSubject();

            if (email == null || email.isBlank()) {
                throw new BadCredentialsException(
                    "Invalid token subject"
                );
            }

            User user = userRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                    new BadCredentialsException(
                        "User no longer exists"
                    )
                );

            if (!user.isActive()) {
                throw new BadCredentialsException(
                    "User account is inactive"
                );
            }

            Object userIdClaim = jwt.getClaim("userId");

            if (!(userIdClaim instanceof Number tokenUserId)
                || !user.getId().equals(tokenUserId.longValue())) {
                throw new BadCredentialsException(
                    "Token identity does not match account"
                );
            }

            String currentRole = user.getRole().name();

            if (!java.util.List.of(currentRole).equals(
                jwt.getClaimAsStringList("roles")
            )) {
                throw new BadCredentialsException(
                    "User permissions have changed"
                );
            }

            return java.util.List.of(
                new SimpleGrantedAuthority(
                    "ROLE_" + currentRole
                )
            );
        });

        return converter;
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
            new CorsConfiguration();

        configuration.setAllowedOrigins(
            List.of("http://localhost:5173")
        );

        configuration.setAllowedMethods(
            List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );

        configuration.setAllowedHeaders(
            List.of("Authorization", "Content-Type")
        );

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/api/**",
            configuration
        );

        return source;
    }
}
