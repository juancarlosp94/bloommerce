
package com.bloommerce.backend.product;

import org.springframework.data.domain.Sort;
import java.util.Set;
import com.bloommerce.backend.product.dto.ProductRequest;
import com.bloommerce.backend.product.dto.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    private static final int MAX_PAGE_SIZE = 100;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
        "id",
        "name",
        "sku",
        "category",
        "price",
        "createdAt"
    );

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Page<ProductResponse> findAll(
        String name,
        String category,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Pageable pageable
    ) {
        validatePageable(pageable);
        validatePriceRange(minPrice, maxPrice);

        Specification<Product> specification =
            (root, query, cb) -> cb.isTrue(root.get("active"));

        if (name != null && !name.isBlank()) {
            String search = "%" + name.trim().toLowerCase(Locale.ROOT) + "%";

            specification = specification.and(
                (root, query, cb) -> cb.like(
                    cb.lower(root.get("name")), search
                )
            );
        }

        if (category != null && !category.isBlank()) {
            String categoryValue = category.trim().toLowerCase(Locale.ROOT);

            specification = specification.and(
                (root, query, cb) -> cb.equal(
                    cb.lower(root.get("category")), categoryValue
                )
            );
        }

        if (minPrice != null) {
            specification = specification.and(
                (root, query, cb) -> cb.greaterThanOrEqualTo(
                    root.get("price"), minPrice
                )
            );
        }

        if (maxPrice != null) {
            specification = specification.and(
                (root, query, cb) -> cb.lessThanOrEqualTo(
                    root.get("price"), maxPrice
                )
            );
        }

        return productRepository.findAll(specification, pageable)
            .map(ProductResponse::fromEntity);
    }

    public ProductResponse findById(Long id) {
        return ProductResponse.fromEntity(findActiveProduct(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        String sku = request.sku().trim();
        String family = normalizeFamily(request.productFamily());

        if (productRepository.existsBySku(sku)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A product with this SKU already exists"
            );
        }

        Product product = switch (family) {
            case "ELECTRONICS" -> new ElectronicsProduct();
            case "CLOTHING" -> new ClothingProduct();
            default -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Unsupported product family"
            );
        };

        applyCommonFields(product, request);
        applyFamilyFields(product, request);

        product.setActive(true);

        return ProductResponse.fromEntity(
            productRepository.saveAndFlush(product)
        );
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = findActiveProduct(id);

        String requestedFamily = normalizeFamily(request.productFamily());

        String existingFamily =
            product instanceof ElectronicsProduct
                ? "ELECTRONICS"
                : "CLOTHING";

        if (!existingFamily.equals(requestedFamily)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Product family cannot be changed"
            );
        }

        String sku = request.sku().trim();

        if (productRepository.existsBySkuAndIdNot(sku, id)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A product with this SKU already exists"
            );
        }

        applyCommonFields(product, request);
        applyFamilyFields(product, request);

        return ProductResponse.fromEntity(
            productRepository.saveAndFlush(product)
        );
    }

    @Transactional
    public void delete(Long id) {
        Product product = findActiveProduct(id);

        // Soft deletion: preserve historical order references.
        product.setActive(false);

        productRepository.save(product);
    }

    private Product findActiveProduct(Long id) {
        return productRepository.findByIdAndActiveTrue(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product not found"
            ));
    }

    private void applyCommonFields(
        Product product,
        ProductRequest request
    ) {
        product.setSku(request.sku().trim());
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setModel(request.model());
        product.setManufacturer(request.manufacturer());
        product.setCategory(request.category().trim());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
    }

    private void applyFamilyFields(
        Product product,
        ProductRequest request
    ) {
        if (product instanceof ElectronicsProduct electronics) {
            electronics.setPowerConsumptionWatts(
                request.powerConsumptionWatts()
            );
            electronics.setWarrantyMonths(request.warrantyMonths());
            electronics.setVoltage(request.voltage());
        }

        if (product instanceof ClothingProduct clothing) {
            clothing.setFabric(request.fabric());
            clothing.setSize(request.size());
            clothing.setColor(request.color());
        }
    }

    private String normalizeFamily(String family) {
        if (family == null || family.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Product family is required"
            );
        }

        return family.trim().toUpperCase(Locale.ROOT);
    }

    private void validatePriceRange(
        BigDecimal minPrice,
        BigDecimal maxPrice
    ) {
        if ((minPrice != null && minPrice.signum() < 0)
            || (maxPrice != null && maxPrice.signum() < 0)
            || (minPrice != null && maxPrice != null
            && minPrice.compareTo(maxPrice) > 0)) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid price range"
            );
        }
    }

    private void validatePageable(Pageable pageable) {

        if (pageable.isUnpaged()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Pagination is required"
            );
        }

        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Maximum page size is " + MAX_PAGE_SIZE
            );
        }

        for (Sort.Order order : pageable.getSort()) {
            if (!ALLOWED_SORT_FIELDS.contains(order.getProperty())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported sort field: " + order.getProperty()
                );
            }
        }
    }

}
