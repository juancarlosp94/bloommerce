
package com.bloommerce.backend.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(

    @NotBlank
    String productFamily,

    @NotBlank
    @Size(max = 100)
    String sku,

    @NotBlank
    @Size(max = 255)
    String name,

    String description,

    @Size(max = 150)
    String model,

    @Size(max = 150)
    String manufacturer,

    @NotBlank
    @Size(max = 100)
    String category,

    @NotNull
    @DecimalMin("0.00")
    BigDecimal price,

    @Min(0)
    int stockQuantity,

    // Electronics-specific properties
    @DecimalMin("0.00")
    BigDecimal powerConsumptionWatts,

    @Min(0)
    Integer warrantyMonths,

    @Min(0)
    Integer voltage,

    // Clothing-specific properties
    @Size(max = 100)
    String fabric,

    @Size(max = 30)
    String size,

    @Size(max = 60)
    String color
) {}
