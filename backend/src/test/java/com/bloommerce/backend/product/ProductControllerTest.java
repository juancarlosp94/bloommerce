
package com.bloommerce.backend.product;

import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.dao.DataIntegrityViolationException;
import java.sql.SQLException;
import com.bloommerce.backend.product.dto.ProductRequest;
import com.bloommerce.backend.product.dto.ProductResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProductControllerTest {

    private ProductService productService;
    private MockMvc mockMvc;


    @BeforeEach
    void setUp() {
        productService = mock(ProductService.class);

        LocalValidatorFactoryBean validator =
            new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        PageableHandlerMethodArgumentResolver pageableResolver =
            new PageableHandlerMethodArgumentResolver();

        mockMvc = MockMvcBuilders
            .standaloneSetup(new ProductController(productService))
            .setValidator(validator)
            .setCustomArgumentResolvers(pageableResolver)
            .setControllerAdvice(new ProductExceptionHandler())
            .setMessageConverters(
                new JacksonJsonHttpMessageConverter(
                    JsonMapper.builder().build()
                )
            )
            .build();
    }


    @Test
    void shouldGetProductById() throws Exception {
        when(productService.findById(1L))
            .thenReturn(sampleProduct());

        mockMvc.perform(get("/api/products/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.sku").value("ELEC-001"))
            .andExpect(jsonPath("$.name").value("Smart TV"))
            .andExpect(jsonPath("$.productFamily").value("ELECTRONICS"));

        verify(productService).findById(1L);
    }

    @Test
    void shouldReturn404ForMissingProduct() throws Exception {
        when(productService.findById(99L))
            .thenThrow(new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product not found"
            ));

        mockMvc.perform(get("/api/products/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void shouldCreateProductAndReturn201() throws Exception {
        when(productService.create(any(ProductRequest.class)))
            .thenReturn(sampleProduct());

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validElectronicsJson()))
            .andExpect(status().isCreated())
            .andExpect(header().string(
                "Location", "/api/products/1"
            ))
            .andExpect(jsonPath("$.sku").value("ELEC-001"));

        verify(productService).create(any(ProductRequest.class));
    }

    @Test
    void shouldRejectInvalidProductRequest() throws Exception {
        String invalidJson = """
                {
                  "productFamily": "ELECTRONICS",
                  "sku": "",
                  "name": "",
                  "category": "",
                  "price": -10,
                  "stockQuantity": -1
                }
                """;

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.title").value("Validation failed"))
            .andExpect(jsonPath("$.errors.sku").exists())
            .andExpect(jsonPath("$.errors.price").exists());

        verifyNoInteractions(productService);
    }

    @Test
    void shouldUpdateProduct() throws Exception {
        when(productService.update(
            eq(1L),
            any(ProductRequest.class)
        )).thenReturn(sampleProduct());

        mockMvc.perform(put("/api/products/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validElectronicsJson()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Smart TV"));

        verify(productService).update(
            eq(1L),
            any(ProductRequest.class)
        );
    }

    @Test
    void shouldDeleteProductAndReturn204() throws Exception {
        mockMvc.perform(delete("/api/products/1"))
            .andExpect(status().isNoContent());

        verify(productService).delete(1L);
    }

    @Test
    void shouldReturnPaginatedProducts() throws Exception {
        when(productService.findAll(
            any(),
            any(),
            any(),
            any(),
            any(Pageable.class)
        )).thenReturn(new PageImpl<>(
            List.of(sampleProduct()),
            PageRequest.of(0, 12),
            1
        ));

        mockMvc.perform(get("/api/products")
                .param("name", "Smart")
                .param("category", "Televisions")
                .param("minPrice", "1000")
                .param("maxPrice", "3000"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].sku")
                .value("ELEC-001"))
            .andExpect(jsonPath("$.totalElements").value(1));

        verify(productService).findAll(
            eq("Smart"),
            eq("Televisions"),
            eq(new BigDecimal("1000")),
            eq(new BigDecimal("3000")),
            any(Pageable.class)
        );
    }


    @Test
    void shouldReturn409ForDatabaseUniqueViolation() throws Exception {
        SQLException sqlException = new SQLException(
            "Duplicate key",
            "23505"
        );

        when(productService.create(any(ProductRequest.class)))
            .thenThrow(new DataIntegrityViolationException(
                "Unique constraint violated",
                sqlException
            ));

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validElectronicsJson()))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.title")
                .value("Resource conflict"))
            .andExpect(jsonPath("$.status").value(409));
    }


    private ProductResponse sampleProduct() {
        return new ProductResponse(
            1L,
            "ELECTRONICS",
            "ELEC-001",
            "Smart TV",
            "4K Smart Television",
            "Q60D",
            "Samsung",
            "Televisions",
            new BigDecimal("2499.99"),
            10,
            true,
            new BigDecimal("120.00"),
            24,
            110,
            null,
            null,
            null
        );
    }

    private String validElectronicsJson() {
        return """
                {
                  "productFamily": "ELECTRONICS",
                  "sku": "ELEC-001",
                  "name": "Smart TV",
                  "description": "4K Smart Television",
                  "model": "Q60D",
                  "manufacturer": "Samsung",
                  "category": "Televisions",
                  "price": 2499.99,
                  "stockQuantity": 10,
                  "powerConsumptionWatts": 120,
                  "warrantyMonths": 24,
                  "voltage": 110
                }
                """;
    }
}
