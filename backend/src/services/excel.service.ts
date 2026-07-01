import { CreateProductDTO, BulkProductImportDTO } from '../dtos/product.dto.js';
import { AppError } from '../utils/apiResponse.js';

export interface ExcelProductRow {
  'Código Interno': string;
  'Código de Barras'?: string;
  'Nombre': string;
  'Descripción'?: string;
  'Marca'?: string;
  'Categoría': string;
  'Subcategoría': string;
  'Proveedor': string;
  'Costo': number;
  'Precio de Venta': number;
  'IVA %': number;
  'Margen %': number;
  'Stock'?: number;
  'Stock Mínimo'?: number;
  'Stock Máximo'?: number;
  'Unidad': 'UNIDAD' | 'METRO' | 'KILO' | 'LITRO' | 'CAJA';
  'Ubicación'?: string;
  'Peso'?: number;
  'Imagen Principal'?: string;
  'Galería'?: string;
  'Activo': boolean;
}

export class ExcelImportService {
  /**
   * Procesa un archivo Excel y retorna los productos
   * Nota: Requiere que se instale la librería 'xlsx'
   */
  async importFromExcel(
    _fileBuffer: Buffer,
    _categoryMap: Map<string, string>,
    _supplierMap: Map<string, string>,
    _subcategoryMap: Map<string, string>
  ): Promise<BulkProductImportDTO> {
    try {
      // Aquí se usaría la librería 'xlsx' para parsear el archivo
      // const XLSX = require('xlsx');
      // const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      // const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      // const rows = XLSX.utils.sheet_to_json(worksheet);

      // Por ahora, retornamos un error indicando que se necesita instalar la librería
      throw new Error('Excel import requires xlsx library: npm install xlsx');
    } catch (error: any) {
      throw new AppError(`Error al procesar archivo Excel: ${error.message}`, 400);
    }
  }

  /**
   * Valida los datos del Excel
   */
  validateExcelRow(row: Partial<ExcelProductRow>, rowNumber: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!row['Código Interno']) errors.push(`Fila ${rowNumber}: Código interno requerido`);
    if (!row['Nombre']) errors.push(`Fila ${rowNumber}: Nombre requerido`);
    if (!row['Categoría']) errors.push(`Fila ${rowNumber}: Categoría requerida`);
    if (!row['Subcategoría']) errors.push(`Fila ${rowNumber}: Subcategoría requerida`);
    if (!row['Proveedor']) errors.push(`Fila ${rowNumber}: Proveedor requerido`);
    if (row['Costo'] === undefined || row['Costo'] < 0) errors.push(`Fila ${rowNumber}: Costo inválido`);
    if (row['Precio de Venta'] === undefined || row['Precio de Venta'] < 0)
      errors.push(`Fila ${rowNumber}: Precio de venta inválido`);
    if (!row['Unidad']) errors.push(`Fila ${rowNumber}: Unidad requerida`);

    return { valid: errors.length === 0, errors };
  }

  /**
   * Convierte una fila de Excel a DTO de producto
   */
  rowToProductDTO(
    row: ExcelProductRow,
    categoryMap: Map<string, string>,
    supplierMap: Map<string, string>,
    subcategoryMap: Map<string, string>
  ): CreateProductDTO {
    const categoryId = categoryMap.get(row['Categoría']) || '';
    const supplierId = supplierMap.get(row['Proveedor']) || '';
    const subcategoryId = subcategoryMap.get(`${row['Categoría']}:${row['Subcategoría']}`) || '';

    return {
      internalCode: row['Código Interno'],
      barcode: row['Código de Barras'],
      name: row['Nombre'],
      description: row['Descripción'],
      brand: row['Marca'],
      categoryId,
      subcategoryId,
      supplierId,
      cost: Number(row['Costo']),
      salePrice: Number(row['Precio de Venta']),
      iva: 21,
      margin: Number(row['Margen %']) || 0,
      stock: Number(row['Stock']) || 0,
      minStock: Number(row['Stock Mínimo']) || 0,
      maxStock: Number(row['Stock Máximo']) || 0,
      unit: row['Unidad'],
      location: row['Ubicación'],
      weight: row['Peso'] ? Number(row['Peso']) : undefined,
      mainImage: row['Imagen Principal'],
      gallery: row['Galería'] ? row['Galería'].split(';').map((img) => img.trim()) : [],
      isActive: row['Activo'] !== false
    };
  }

  /**
   * Genera un archivo CSV de template para importación
   */
  generateTemplateCSV(): string {
    const headers = [
      'Código Interno',
      'Código de Barras',
      'Nombre',
      'Descripción',
      'Marca',
      'Categoría',
      'Subcategoría',
      'Proveedor',
      'Costo',
      'Precio de Venta',
      'IVA %',
      'Margen %',
      'Stock',
      'Stock Mínimo',
      'Stock Máximo',
      'Unidad',
      'Ubicación',
      'Peso',
      'Imagen Principal',
      'Galería',
      'Activo'
    ];

    const sampleRow = [
      'P001',
      '7790000000017',
      'Producto de ejemplo A',
      'Descripcion general del producto',
      'Marca Demo',
      'Categoria General',
      'Subcategoria A',
      'Proveedor Demo SA',
      '120000',
      '185000',
      '21',
      '35',
      '12',
      '5',
      '30',
      'UNIDAD',
      'Deposito 1',
      '3.4',
      'https://example.com/image.jpg',
      'https://example.com/img1.jpg;https://example.com/img2.jpg',
      'true'
    ];

    return [headers.map((h) => `"${h}"`).join(','), sampleRow.map((v) => `"${v}"`).join(',')].join('\n');
  }
}

export default new ExcelImportService();
