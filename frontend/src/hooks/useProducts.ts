import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, Product, ProductFilter } from '../services/productService';

// Queries
export const useProductById = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id
  });
};

export const useProducts = (filter: ProductFilter) => {
  return useQuery({
    queryKey: ['products', filter],
    queryFn: () => productService.getProducts(filter)
  });
};

export const useSearchProducts = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['products-search', query],
    queryFn: () => productService.searchProducts(query),
    enabled: enabled && query.length > 0
  });
};

export const useProductByBarcode = (barcode: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['product-barcode', barcode],
    queryFn: () => productService.getProductByBarcode(barcode),
    enabled: enabled && !!barcode
  });
};

export const useStockLevels = (supplierId?: string) => {
  return useQuery({
    queryKey: ['stock-levels', supplierId],
    queryFn: () => productService.getStockLevels(supplierId)
  });
};

// Mutations
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
      productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useUpdateProduct = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) =>
      productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useBulkImportProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { products: any[]; updateExisting?: boolean }) =>
      productService.bulkImportProducts(data.products, data.updateExisting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useConvertUnits = () => {
  return useMutation({
    mutationFn: (data: { fromUnit: string; toUnit: string; quantity: number }) =>
      productService.convertUnits(data.fromUnit, data.toUnit, data.quantity)
  });
};

export const useGenerateLabels = () => {
  return useMutation({
    mutationFn: (data: { productIds: string[]; quantity?: number }) =>
      productService.generateLabelsHTML(data.productIds, data.quantity)
  });
};
