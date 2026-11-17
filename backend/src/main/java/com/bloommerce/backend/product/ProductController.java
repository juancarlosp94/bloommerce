
package com.bloommerce.backend.product;

import com.bloommerce.backend.product.dto.ProductRequest;
import com.bloommerce.backend.product.dto.ProductResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public Page<ProductResponse> findAll(
        @RequestParam(required = false) String name,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) BigDecimal minPrice,
        @RequestParam(required = false) BigDecimal maxPrice,
        @PageableDefault(size = 12, sort = "name") Pageable pageable
    ) {
        return productService.findAll(
            name,
            category,
            minPrice,
            maxPrice,
            pageable
        );
    }

    @GetMapping("/{id}")
    public ProductResponse findById(@PathVariable Long id) {
        return productService.findById(id);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(
        @Valid @RequestBody ProductRequest request
    ) {
        ProductResponse product = productService.create(request);

        return ResponseEntity
            .created(URI.create("/api/products/" + product.id()))
            .body(product);
    }

    @PutMapping("/{id}")
    public ProductResponse update(
        @PathVariable Long id,
        @Valid @RequestBody ProductRequest request
    ) {
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
