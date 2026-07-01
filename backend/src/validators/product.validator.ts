import { CreateProductDTO, UpdateProductDTO, ProductFilterDTO } from '../dtos/product.dto.js';

const VALID_UNITS = ['UNIDAD', 'METRO', 'KILO', 'LITRO', 'CAJA'];
const VALID_UNIDADES_MEDIDA = ['GR', 'KG', 'UNIDAD'];

export const validateCreateProduct = (data: CreateProductDTO): string[] => {
  const errors: string[] = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('El nombre del producto es requerido');
  }

  if (data.categoryId !== undefined && data.categoryId.trim() === '') {
    errors.push('La categoría no puede estar vacía');
  }

  if (data.subcategoryId !== undefined && data.subcategoryId.trim() === '') {
    errors.push('La subcategoría no puede estar vacía');
  }

  if (data.categoryId && data.subcategoryId && data.categoryId.trim() === data.subcategoryId.trim()) {
    errors.push('La categoría y la subcategoría no pueden ser iguales');
  }

  if (data.supplierId !== undefined && data.supplierId.trim() === '') {
    errors.push('El proveedor no puede estar vacío');
  }

  if (typeof data.cost !== 'number' || data.cost < 0) {
    errors.push('El costo debe ser un número positivo');
  }

  if (typeof data.salePrice !== 'number' || data.salePrice < 0) {
    errors.push('El precio de venta debe ser un número positivo');
  }

  if (data.salePrice <= data.cost) {
    errors.push('El precio de venta debe ser mayor al costo');
  }

  if (typeof data.iva !== 'number' || data.iva < 0 || data.iva > 100) {
    errors.push('El IVA debe ser un número entre 0 y 100');
  }

  if (data.margin !== undefined && (typeof data.margin !== 'number' || data.margin < 0 || data.margin > 100)) {
    errors.push('El margen debe ser un número entre 0 y 100');
  }

  if (!VALID_UNITS.includes(data.unit)) {
    errors.push(`La unidad debe ser una de: ${VALID_UNITS.join(', ')}`);
  }

  if (data.unidadMedida !== undefined && !VALID_UNIDADES_MEDIDA.includes(data.unidadMedida)) {
    errors.push(`La unidad de medida debe ser una de: ${VALID_UNIDADES_MEDIDA.join(', ')}`);
  }

  if (data.alergenos !== undefined && !Array.isArray(data.alergenos)) {
    errors.push('Los alergenos deben enviarse como una lista');
  }

  if (data.fechaVencimiento !== undefined) {
    const parsedDate = new Date(data.fechaVencimiento);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push('La fecha de vencimiento no es valida');
    }
  }

  if (data.minStock !== undefined && typeof data.minStock !== 'number') {
    errors.push('El stock mínimo debe ser un número');
  }

  if (data.maxStock !== undefined && typeof data.maxStock !== 'number') {
    errors.push('El stock máximo debe ser un número');
  }

  if (data.weight !== undefined && typeof data.weight !== 'number') {
    errors.push('El peso debe ser un número');
  }

  return errors;
};

export const validateUpdateProduct = (data: UpdateProductDTO): string[] => {
  if (!data.id || data.id.trim() === '') {
    return ['El ID del producto es requerido'];
  }

  const errors: string[] = [];

  if (data.internalCode !== undefined && data.internalCode.trim() === '') {
    errors.push('El código interno no puede estar vacío');
  }

  if (data.name !== undefined && data.name.trim() === '') {
    errors.push('El nombre del producto no puede estar vacío');
  }

  if (data.cost !== undefined && (typeof data.cost !== 'number' || data.cost < 0)) {
    errors.push('El costo debe ser un número positivo');
  }

  if (data.salePrice !== undefined && (typeof data.salePrice !== 'number' || data.salePrice < 0)) {
    errors.push('El precio de venta debe ser un número positivo');
  }

  if (data.iva !== undefined && (typeof data.iva !== 'number' || data.iva < 0 || data.iva > 100)) {
    errors.push('El IVA debe ser un número entre 0 y 100');
  }

  if (data.margin !== undefined && (typeof data.margin !== 'number' || data.margin < 0 || data.margin > 100)) {
    errors.push('El margen debe ser un número entre 0 y 100');
  }

  if (data.unit !== undefined && !VALID_UNITS.includes(data.unit)) {
    errors.push(`La unidad debe ser una de: ${VALID_UNITS.join(', ')}`);
  }

  if (data.unidadMedida !== undefined && !VALID_UNIDADES_MEDIDA.includes(data.unidadMedida)) {
    errors.push(`La unidad de medida debe ser una de: ${VALID_UNIDADES_MEDIDA.join(', ')}`);
  }

  if (data.alergenos !== undefined && !Array.isArray(data.alergenos)) {
    errors.push('Los alergenos deben enviarse como una lista');
  }

  if (data.fechaVencimiento !== undefined) {
    const parsedDate = new Date(data.fechaVencimiento);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push('La fecha de vencimiento no es valida');
    }
  }

  if (data.categoryId !== undefined && data.categoryId.trim() === '') {
    errors.push('La categoría no puede estar vacía');
  }

  if (data.subcategoryId !== undefined && data.subcategoryId.trim() === '') {
    errors.push('La subcategoría no puede estar vacía');
  }

  if (data.categoryId && data.subcategoryId && data.categoryId.trim() === data.subcategoryId.trim()) {
    errors.push('La categoría y la subcategoría no pueden ser iguales');
  }

  return errors;
};

export const validateProductFilter = (data: ProductFilterDTO): string[] => {
  const errors: string[] = [];

  if (data.minPrice !== undefined && typeof data.minPrice !== 'number') {
    errors.push('El precio mínimo debe ser un número');
  }

  if (data.maxPrice !== undefined && typeof data.maxPrice !== 'number') {
    errors.push('El precio máximo debe ser un número');
  }

  if (data.page !== undefined && (typeof data.page !== 'number' || data.page < 1)) {
    errors.push('El número de página debe ser un número mayor a 0');
  }

  if (data.limit !== undefined && (typeof data.limit !== 'number' || data.limit < 1)) {
    errors.push('El límite debe ser un número mayor a 0');
  }

  return errors;
};
