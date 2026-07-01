export interface CreateProductDTO {
  internalCode?: string;
  barcode?: string;
  name: string;
  description?: string;
  brand?: string;
  categoryId?: string;
  subcategoryId?: string;
  supplierId?: string;
  cost: number;
  salePrice: number;
  iva: number;
  margin?: number;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  esAlPeso?: boolean;
  unidadMedida?: 'GR' | 'KG' | 'UNIDAD';
  fechaVencimiento?: string | Date;
  alergenos?: string[];
  unit: 'UNIDAD' | 'METRO' | 'KILO' | 'LITRO' | 'CAJA';
  location?: string;
  weight?: number;
  mainImage?: string;
  gallery?: string[];
  isActive?: boolean;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  id: string;
}

export interface ProductFilterDTO {
  categoryId?: string;
  subcategoryId?: string;
  supplierId?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  isActive?: boolean;
  search?: string;
  unit?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductResponseDTO {
  id: string;
  internalCode: string;
  barcode?: string;
  name: string;
  description?: string;
  brand?: string;
  category: {
    id: string;
    name: string;
  };
  subcategory: {
    id: string;
    name: string;
  };
  supplier: {
    id: string;
    businessName: string;
  };
  cost: number;
  salePrice: number;
  margin: number;
  iva: number;
  stock: number;
  minStock: number;
  maxStock: number;
  esAlPeso: boolean;
  unidadMedida: 'GR' | 'KG' | 'UNIDAD';
  fechaVencimiento?: string;
  alergenos: string[];
  unit: string;
  location?: string;
  weight?: number;
  mainImage?: string;
  gallery?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnitConversionDTO {
  fromUnit: string;
  toUnit: string;
  quantity: number;
  conversionFactor: number;
}

export interface BulkProductImportDTO {
  products: CreateProductDTO[];
  updateExisting?: boolean;
}

export interface ProductLabelDTO {
  productId: string;
  quantity: number;
  format?: 'A4' | 'A5' | 'LABEL';
}
