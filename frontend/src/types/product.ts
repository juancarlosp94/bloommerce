
export interface Product {
  id: number;
  productFamily: "ELECTRONICS" | "CLOTHING";

  sku: string;
  name: string;
  description: string | null;
  model: string | null;
  manufacturer: string | null;
  category: string;

  price: number;
  stockQuantity: number;
  active: boolean;

  powerConsumptionWatts: number | null;
  warrantyMonths: number | null;
  voltage: number | null;

  fabric: string | null;
  size: string | null;
  color: string | null;
}

export interface PageResponse<T> {
  content: T[];

  totalElements: number;
  totalPages: number;

  number: number;
  size: number;

  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ProductFilters {
  name?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;

  page?: number;
  size?: number;
  sort?: string;
}
