
package com.bloommerce.backend.product.dto;

import com.bloommerce.backend.product.ClothingProduct;
import com.bloommerce.backend.product.ElectronicsProduct;
import com.bloommerce.backend.product.Product;

import java.math.BigDecimal;

public record ProductResponse(
    Long id,
    String productFamily,
    String sku,
    String name,
    String description,
    String model,
    String manufacturer,
    String category,
    BigDecimal price,
    int stockQuantity,
    boolean active,
    BigDecimal powerConsumptionWatts,
    Integer warrantyMonths,
    Integer voltage,
    String fabric,
    String size,
    String color
) {

    public static ProductResponse fromEntity(Product product) {

        ElectronicsProduct electronics =
            product instanceof ElectronicsProduct e ? e : null;

        ClothingProduct clothing =
            product instanceof ClothingProduct c ? c : null;

        return new ProductResponse(
            product.getId(),
            electronics != null ? "ELECTRONICS" : "CLOTHING",
            product.getSku(),
            product.getName(),
            product.getDescription(),
            product.getModel(),
            product.getManufacturer(),
            product.getCategory(),
            product.getPrice(),
            product.getStockQuantity(),
            product.isActive(),
            electronics != null
                ? electronics.getPowerConsumptionWatts()
                : null,
            electronics != null
                ? electronics.getWarrantyMonths()
                : null,
            electronics != null
                ? electronics.getVoltage()
                : null,
            clothing != null ? clothing.getFabric() : null,
            clothing != null ? clothing.getSize() : null,
            clothing != null ? clothing.getColor() : null
        );
    }
}
