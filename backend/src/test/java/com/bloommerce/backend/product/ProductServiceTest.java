
package com.bloommerce.backend.product;

import com.bloommerce.backend.product.dto.ProductRequest;
import com.bloommerce.backend.product.dto.ProductResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void shouldCreateElectronicsProduct() {
        ProductRequest request = electronicsRequest();

        when(productRepository.existsBySku("ELEC-001"))
            .thenReturn(false);

        when(productRepository.saveAndFlush(any(Product.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.create(request);

        assertEquals("ELECTRONICS", response.productFamily());
        assertEquals("ELEC-001", response.sku());
        assertEquals("Smart TV", response.name());
        assertEquals(new BigDecimal("2499.99"), response.price());
        assertEquals(10, response.stockQuantity());
        assertEquals(24, response.warrantyMonths());
        assertTrue(response.active());

        verify(productRepository).saveAndFlush(
            isA(ElectronicsProduct.class)
        );
    }

    @Test
    void shouldCreateClothingProduct() {
        ProductRequest request = clothingRequest();

        when(productRepository.existsBySku("CLOTH-001"))
            .thenReturn(false);

        when(productRepository.saveAndFlush(any(Product.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.create(request);

        assertEquals("CLOTHING", response.productFamily());
        assertEquals("CLOTH-001", response.sku());
        assertEquals("Cotton T-Shirt", response.name());
        assertEquals("Cotton", response.fabric());
        assertEquals("M", response.size());
        assertEquals("Black", response.color());

        verify(productRepository).saveAndFlush(
            isA(ClothingProduct.class)
        );
    }

    @Test
    void shouldRejectDuplicateSku() {
        when(productRepository.existsBySku("ELEC-001"))
            .thenReturn(true);

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> productService.create(electronicsRequest())
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());

        verify(productRepository, never()).save(any());
    }

    @Test
    void shouldReturnActiveProductById() {
        ElectronicsProduct product = existingElectronicsProduct();

        when(productRepository.findByIdAndActiveTrue(1L))
            .thenReturn(Optional.of(product));

        ProductResponse response = productService.findById(1L);

        assertEquals("ELEC-001", response.sku());
        assertEquals("Smart TV", response.name());

        verify(productRepository).findByIdAndActiveTrue(1L);
    }

    @Test
    void shouldReturnNotFoundForMissingProduct() {
        when(productRepository.findByIdAndActiveTrue(99L))
            .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> productService.findById(99L)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void shouldSoftDeleteProduct() {
        ElectronicsProduct product = existingElectronicsProduct();

        when(productRepository.findByIdAndActiveTrue(1L))
            .thenReturn(Optional.of(product));

        productService.delete(1L);

        assertFalse(product.isActive());

        verify(productRepository).save(product);
        verify(productRepository, never()).delete(any(Product.class));
    }

    @Test
    void shouldRejectProductFamilyChange() {
        ElectronicsProduct product = existingElectronicsProduct();

        when(productRepository.findByIdAndActiveTrue(1L))
            .thenReturn(Optional.of(product));

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> productService.update(1L, clothingRequest())
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());

        verify(productRepository, never()).save(any());
    }

    @Test
    void shouldRejectInvalidPriceRange() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> productService.findAll(
                null,
                null,
                new BigDecimal("500"),
                new BigDecimal("100"),
                PageRequest.of(0, 10)
            )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());

        verifyNoInteractions(productRepository);
    }

    @Test
    void shouldReturnPaginatedProducts() {
        ElectronicsProduct product = existingElectronicsProduct();

        Page<Product> products = new PageImpl<>(
            List.of(product),
            PageRequest.of(0, 10),
            1
        );

        when(productRepository.findAll(
            any(Specification.class),
            any(PageRequest.class)
        )).thenReturn(products);

        Page<ProductResponse> result = productService.findAll(
            "Smart",
            "Televisions",
            new BigDecimal("1000"),
            new BigDecimal("3000"),
            PageRequest.of(0, 10)
        );

        assertEquals(1, result.getTotalElements());
        assertEquals("Smart TV", result.getContent().getFirst().name());

        verify(productRepository).findAll(
            any(Specification.class),
            any(PageRequest.class)
        );
    }

    private ElectronicsProduct existingElectronicsProduct() {
        ElectronicsProduct product = new ElectronicsProduct();

        product.setSku("ELEC-001");
        product.setName("Smart TV");
        product.setCategory("Televisions");
        product.setPrice(new BigDecimal("2499.99"));
        product.setStockQuantity(10);
        product.setActive(true);
        product.setWarrantyMonths(24);

        return product;
    }

    private ProductRequest electronicsRequest() {
        return new ProductRequest(
            "ELECTRONICS",
            "ELEC-001",
            "Smart TV",
            "4K Smart Television",
            "Q60D",
            "Samsung",
            "Televisions",
            new BigDecimal("2499.99"),
            10,
            new BigDecimal("120.00"),
            24,
            110,
            null,
            null,
            null
        );
    }

    private ProductRequest clothingRequest() {
        return new ProductRequest(
            "CLOTHING",
            "CLOTH-001",
            "Cotton T-Shirt",
            "Premium cotton shirt",
            null,
            "Bloommerce",
            "Clothing",
            new BigDecimal("29.99"),
            50,
            null,
            null,
            null,
            "Cotton",
            "M",
            "Black"
        );
    }


    @Test
    void shouldRejectPageSizeGreaterThan100() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> productService.findAll(
                null,
                null,
                null,
                null,
                PageRequest.of(0, 101)
            )
        );

        assertEquals(
            HttpStatus.BAD_REQUEST,
            exception.getStatusCode()
        );

        verifyNoInteractions(productRepository);
    }

    @Test
    void shouldRejectUnsupportedSortField() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> productService.findAll(
                null,
                null,
                null,
                null,
                PageRequest.of(
                    0,
                    10,
                    org.springframework.data.domain.Sort.by("unknownField")
                )
            )
        );

        assertEquals(
            HttpStatus.BAD_REQUEST,
            exception.getStatusCode()
        );

        verifyNoInteractions(productRepository);
    }

}
