package com.bloommerce.backend.product;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@DiscriminatorValue("ELECTRONICS")
public class ElectronicsProduct extends Product {

    @Column(name = "power_consumption_watts", precision = 10, scale = 2)
    private BigDecimal powerConsumptionWatts;

    @Column(name = "warranty_months")
    private Integer warrantyMonths;

    @Column(name = "voltage")
    private Integer voltage;

    protected ElectronicsProduct() {
    }

    public ElectronicsProduct(String sku, String name, String category,
                              BigDecimal price, int stockQuantity) {
        super(sku, name, category, price, stockQuantity);
    }

    public BigDecimal getPowerConsumptionWatts() {
        return powerConsumptionWatts;
    }

    public Integer getWarrantyMonths() {
        return warrantyMonths;
    }

    public Integer getVoltage() {
        return voltage;
    }

    public void setPowerConsumptionWatts(BigDecimal powerConsumptionWatts) {
        this.powerConsumptionWatts = powerConsumptionWatts;
    }

    public void setWarrantyMonths(Integer warrantyMonths) {
        this.warrantyMonths = warrantyMonths;
    }

    public void setVoltage(Integer voltage) {
        this.voltage = voltage;
    }
}
