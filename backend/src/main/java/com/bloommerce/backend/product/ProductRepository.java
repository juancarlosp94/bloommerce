
package com.bloommerce.backend.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface ProductRepository extends
    JpaRepository<Product, Long>,
    JpaSpecificationExecutor<Product> {

    Optional<Product> findByIdAndActiveTrue(Long id);

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);

    @Modifying(
        flushAutomatically = true,
        clearAutomatically = true
    )
    @Query(value = """
            UPDATE products
            SET stock_quantity = stock_quantity - :quantity
            WHERE id = :productId
              AND active = true
              AND stock_quantity >= :quantity
            """, nativeQuery = true)
    int deductStock(
        @Param("productId") Long productId,
        @Param("quantity") int quantity
    );


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT p
        FROM Product p
        WHERE p.id = :productId
          AND p.active = true
        """)
    Optional<Product> findActiveByIdForUpdate(
        @Param("productId") Long productId
    );

}
