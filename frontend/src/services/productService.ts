import axios from 'axios';

export interface Product {
  id: string;
  categoryId?: string;
  subcategoryId?: string;
  supplierId?: string;
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
  esAlPeso?: boolean;
  unidadMedida?: 'GR' | 'KG' | 'UNIDAD';
  fechaVencimiento?: string;
  alergenos?: string[];
  unit: string;
  location?: string;
  weight?: number;
  mainImage?: string;
  gallery?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
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

export interface ProductFormOptions {
  categories: Array<{ id: string; name: string }>;
  subcategories: Array<{ id: string; name: string; categoryId: string }>;
  suppliers: Array<{ id: string; businessName: string }>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const FIXED_IVA_PERCENT = 21;

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeProduct = (product: any): Product => ({
  ...product,
  cost: toNumber(product.cost),
  salePrice: toNumber(product.salePrice),
  margin: toNumber(product.margin),
  iva: FIXED_IVA_PERCENT,
  stock: toNumber(product.stock),
  minStock: toNumber(product.minStock),
  maxStock: toNumber(product.maxStock),
  weight: product.weight !== undefined && product.weight !== null ? toNumber(product.weight) : undefined
});

const normalizeUnit = (value: unknown): Product['unit'] | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  return normalized || undefined;
};

const sanitizeProductPayload = (data: Record<string, any>) => ({
  internalCode: normalizeOptionalString(data.internalCode),
  barcode: normalizeOptionalString(data.barcode),
  name: normalizeOptionalString(data.name),
  description: normalizeOptionalString(data.description),
  brand: normalizeOptionalString(data.brand),
  categoryId: data.categoryId,
  subcategoryId: data.subcategoryId,
  supplierId: data.supplierId,
  cost: data.cost !== undefined ? toNumber(data.cost) : undefined,
  salePrice: data.salePrice !== undefined ? toNumber(data.salePrice) : undefined,
  iva: FIXED_IVA_PERCENT,
  margin: data.margin !== undefined ? toNumber(data.margin) : undefined,
  stock: data.stock !== undefined ? toNumber(data.stock) : undefined,
  minStock: data.minStock !== undefined ? toNumber(data.minStock) : undefined,
  maxStock: data.maxStock !== undefined ? toNumber(data.maxStock) : undefined,
  esAlPeso: data.esAlPeso,
  unidadMedida: data.unidadMedida,
  fechaVencimiento: data.fechaVencimiento,
  alergenos: data.alergenos,
  unit: normalizeUnit(data.unit),
  location: normalizeOptionalString(data.location),
  weight: data.weight !== undefined && data.weight !== null ? toNumber(data.weight) : undefined,
  mainImage: normalizeOptionalString(data.mainImage),
  gallery: data.gallery,
  isActive: data.isActive
});

const removeUndefinedFields = <T extends Record<string, any>>(data: T): T =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T;

export const productService = {
  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const payload = removeUndefinedFields(sanitizeProductPayload(data as any));
    const response = await axios.post(`${API_URL}/products`, payload);
    return normalizeProduct(response.data.data);
  },

  async getProductById(id: string): Promise<Product> {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return normalizeProduct(response.data.data);
  },

  async getProducts(filter: ProductFilter): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const response = await axios.get(`${API_URL}/products`, { params: filter });
    const payload = response.data.data;
    return {
      ...payload,
      data: (payload.data || []).map(normalizeProduct)
    };
  },

  async updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    const payload = removeUndefinedFields(sanitizeProductPayload(data as any));
    const response = await axios.put(`${API_URL}/products/${id}`, payload);
    return normalizeProduct(response.data.data);
  },

  async deleteProduct(id: string): Promise<void> {
    await axios.delete(`${API_URL}/products/${id}`);
  },

  async searchProducts(query: string, limit?: number): Promise<Product[]> {
    const response = await axios.get(`${API_URL}/products/search`, { params: { q: query, limit } });
    return (response.data.data || []).map(normalizeProduct);
  },

  async getProductByBarcode(barcode: string): Promise<Product> {
    const response = await axios.get(`${API_URL}/products/barcode/${barcode}`);
    return normalizeProduct(response.data.data);
  },

  async getProductByCode(code: string): Promise<Product> {
    const response = await axios.get(`${API_URL}/products/code/${code}`);
    return normalizeProduct(response.data.data);
  },

  async getStockLevels(supplierId?: string): Promise<any[]> {
    const response = await axios.get(`${API_URL}/products/stock/levels`, { params: { supplierId } });
    return response.data.data;
  },

  async getFormOptions(): Promise<ProductFormOptions> {
    const response = await axios.get(`${API_URL}/products/form-options`);
    return response.data.data;
  },

  async convertUnits(fromUnit: string, toUnit: string, quantity: number): Promise<number> {
    const response = await axios.post(`${API_URL}/products/convert-units`, { fromUnit, toUnit, quantity });
    return response.data.data.converted;
  },

  async bulkImportProducts(products: any[], updateExisting: boolean = false): Promise<any> {
    const response = await axios.post(`${API_URL}/products/bulk-import`, { products, updateExisting });
    return response.data.data;
  },

  async generateLabelsHTML(productIds: string[], quantity: number = 1): Promise<string> {
    const response = await axios.post(`${API_URL}/labels/generate-html`, { productIds, quantity });
    return response.data;
  },

  async getImportTemplate(): Promise<string> {
    const response = await axios.get(`${API_URL}/labels/import-template`);
    return response.data;
  }
};
