package com.bloommerce.backend.product;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@DiscriminatorValue("CLOTHING")
public class ClothingProduct extends Product {

    @Column(length = 100)
    private String fabric;

    @Column(length = 30)
    private String size;

    @Column(length = 60)
    private String color;

    protected ClothingProduct() {}

    public ClothingProduct(String sku, String name, String category,
                           BigDecimal price, int stockQuantity) {
        super(sku, name, category, price, stockQuantity);
    }

    public String getFabric() {
        return fabric;
    }
    public String getSize() {
        return size;
    }
    public String getColor() {
        return color;
    }

    public void setFabric(String fabric) {
        this.fabric = fabric;
    }
    public void setSize(String size) {
        this.size = size;
    }
    public void setColor(String color) {
        this.color = color;
    }
}
