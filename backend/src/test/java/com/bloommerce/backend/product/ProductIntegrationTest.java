
package com.bloommerce.backend.product;

import com.bloommerce.backend.product.dto.ProductResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("integration")
@Testcontainers
@Transactional
class ProductIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres =
        new PostgreSQLContainer("postgres:17");

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    @Test
    void shouldPersistAndRetrieveElectronicsProduct() {
        ElectronicsProduct product = createElectronics(
            "ELEC-INT-001",
            "Samsung Smart TV",
            "Televisions",
            "2499.99"
        );

        product.setWarrantyMonths(24);
        product.setVoltage(110);
        product.setPowerConsumptionWatts(
            new BigDecimal("120.00")
        );

        Product saved = productRepository.saveAndFlush(product);

        ProductResponse response = productService.findById(
            saved.getId()
        );

        assertNotNull(response.id());
        assertEquals("ELECTRONICS", response.productFamily());
        assertEquals("ELEC-INT-001", response.sku());
        assertEquals(24, response.warrantyMonths());
        assertEquals(110, response.voltage());
    }

    @Test
    void shouldPersistAndRetrieveClothingProduct() {
        ClothingProduct product = new ClothingProduct();

        product.setSku("CLOTH-INT-001");
        product.setName("Cotton T-Shirt");
        product.setCategory("Clothing");
        product.setPrice(new BigDecimal("29.99"));
        product.setStockQuantity(50);
        product.setActive(true);
        product.setFabric("Cotton");
        product.setSize("M");
        product.setColor("Black");

        Product saved = productRepository.saveAndFlush(product);

        ProductResponse response = productService.findById(
            saved.getId()
        );

        assertEquals("CLOTHING", response.productFamily());
        assertEquals("Cotton", response.fabric());
        assertEquals("M", response.size());
        assertEquals("Black", response.color());
    }

    @Test
    void shouldFilterProductsByNameCategoryAndPrice() {
        productRepository.saveAndFlush(
            createElectronics(
                "ELEC-INT-002",
                "Samsung Smart TV",
                "Televisions",
                "2499.99"
            )
        );

        productRepository.saveAndFlush(
            createElectronics(
                "ELEC-INT-003",
                "LG Smart TV",
                "Televisions",
                "1899.99"
            )
        );

        productRepository.saveAndFlush(
            createElectronics(
                "ELEC-INT-004",
                "Sony Headphones",
                "Audio",
                "299.99"
            )
        );

        Page<ProductResponse> results = productService.findAll(
            "smart",
            "TELEVISIONS",
            new BigDecimal("2000"),
            new BigDecimal("3000"),
            PageRequest.of(0, 10)
        );

        assertEquals(1, results.getTotalElements());
        assertEquals(
            "ELEC-INT-002",
            results.getContent().getFirst().sku()
        );
    }

    @Test
    void shouldExcludeInactiveProductsAndPaginate() {
        ElectronicsProduct first = createElectronics(
            "ELEC-INT-005",
            "Product A",
            "Audio",
            "100.00"
        );

        ElectronicsProduct second = createElectronics(
            "ELEC-INT-006",
            "Product B",
            "Audio",
            "200.00"
        );

        ElectronicsProduct inactive = createElectronics(
            "ELEC-INT-007",
            "Product C",
            "Audio",
            "300.00"
        );

        inactive.setActive(false);

        productRepository.saveAndFlush(first);
        productRepository.saveAndFlush(second);
        productRepository.saveAndFlush(inactive);

        Page<ProductResponse> results = productService.findAll(
            null,
            "Audio",
            null,
            null,
            PageRequest.of(
                0,
                1,
                Sort.by("price").ascending()
            )
        );

        assertEquals(2, results.getTotalElements());
        assertEquals(1, results.getContent().size());
        assertEquals(2, results.getTotalPages());
        assertEquals(
            "ELEC-INT-005",
            results.getContent().getFirst().sku()
        );
    }

    private ElectronicsProduct createElectronics(
        String sku,
        String name,
        String category,
        String price
    ) {
        ElectronicsProduct product = new ElectronicsProduct();

        product.setSku(sku);
        product.setName(name);
        product.setCategory(category);
        product.setPrice(new BigDecimal(price));
        product.setStockQuantity(10);
        product.setActive(true);

        return product;
    }
}
