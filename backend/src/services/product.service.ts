import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductFilterDTO,
  ProductResponseDTO,
  UnitConversionDTO,
  BulkProductImportDTO
} from '../dtos/product.dto.js';
import { AppError } from '../utils/apiResponse.js';
import { prisma } from '../prisma/client.js';
import type { Prisma } from '@prisma/client';

const FIXED_IVA_PERCENT = 21;

const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  METRO: { METRO: 1, CAJA: 10 },
  KILO: { KILO: 1, GRAMO: 1000, CAJA: 20 },
  LITRO: { LITRO: 1, MILILITRO: 1000, CAJA: 12 },
  CAJA: { CAJA: 1 }
};

export class ProductService {
  async getFormOptions(): Promise<{
    categories: Array<{ id: string; name: string }>;
    subcategories: Array<{ id: string; name: string; categoryId: string }>;
    suppliers: Array<{ id: string; businessName: string }>;
  }> {
    const [categories, subcategories, suppliers] = await Promise.all([
      prisma.category.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
      }),
      prisma.subcategory.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, categoryId: true }
      }),
      prisma.supplier.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { businessName: 'asc' },
        select: { id: true, businessName: true }
      })
    ]);

    return { categories, subcategories, suppliers };
  }

  async generateInternalCode(): Promise<string> {
    const latestProduct = await prisma.product.findFirst({
      where: {
        internalCode: {
          startsWith: 'P'
        }
      },
      orderBy: { createdAt: 'desc' },
      select: { internalCode: true }
    });

    const current = latestProduct?.internalCode ?? '';
    const matches = current.match(/^P(\d+)$/);
    const latestNumber = matches ? Number(matches[1]) : await prisma.product.count();
    const nextNumber = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;

    return `P${String(nextNumber).padStart(3, '0')}`;
  }

  async createProduct(data: CreateProductDTO): Promise<ProductResponseDTO> {
    const internalCode = data.internalCode?.trim() || await this.generateInternalCode();
    const images = this.buildImages(data.mainImage, data.gallery);
    const location = this.normalizeLocation(data.location);

    const categoryId = data.categoryId || await this.getDefaultCategoryId();
    const subcategoryId = data.subcategoryId || await this.getDefaultSubcategoryId(categoryId);
    const supplierId = data.supplierId || await this.getDefaultSupplierId();
    const margin = data.margin ?? this.calculateMargin(data.cost, data.salePrice);

    const targetStock = Math.max(0, data.stock || 0);

    const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdProduct = await tx.product.create({
        data: {
          internalCode,
          barcode: data.barcode,
          name: data.name,
          description: data.description,
          brand: data.brand,
          categoryId,
          subcategoryId,
          supplierId,
          cost: data.cost,
          salePrice: data.salePrice,
          iva: FIXED_IVA_PERCENT,
          margin,
          stock: targetStock,
          minStock: data.minStock || 0,
          maxStock: data.maxStock || 0,
          esAlPeso: data.esAlPeso ?? false,
          unidadMedida: data.unidadMedida ?? 'UNIDAD',
          fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
          alergenos: data.alergenos ?? [],
          unit: data.unit,
          location,
          weight: data.weight,
          images,
          isActive: data.isActive ?? true
        }
      });

      await tx.stock.upsert({
        where: { productId_location: { productId: createdProduct.id, location } },
        update: { quantity: targetStock, deletedAt: null },
        create: { productId: createdProduct.id, location, quantity: targetStock }
      });

      return tx.product.findUniqueOrThrow({
        where: { id: createdProduct.id },
        include: {
          category: { select: { id: true, name: true } },
          subcategory: { select: { id: true, name: true } },
          supplier: { select: { id: true, businessName: true } }
        }
      });
    });

    return this.formatProductResponse(product);
  }

  async getProductById(id: string): Promise<ProductResponseDTO> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        supplier: { select: { id: true, businessName: true } }
      }
    });

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    return this.formatProductResponse(product);
  }

  async getProducts(filter: ProductFilterDTO): Promise<{ data: ProductResponseDTO[]; total: number; page: number; limit: number }> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.subcategoryId) where.subcategoryId = filter.subcategoryId;
    if (filter.supplierId) where.supplierId = filter.supplierId;
    if (filter.unit) where.unit = filter.unit;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;

    if (filter.minPrice || filter.maxPrice) {
      where.salePrice = {};
      if (filter.minPrice) where.salePrice.gte = filter.minPrice;
      if (filter.maxPrice) where.salePrice.lte = filter.maxPrice;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { internalCode: { contains: filter.search, mode: 'insensitive' } },
        { barcode: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          subcategory: { select: { id: true, name: true } },
          supplier: { select: { id: true, businessName: true } }
        }
      }),
      prisma.product.count({ where })
    ]);

    return {
      data: products.map((product: any) => this.formatProductResponse(product)),
      total,
      page,
      limit
    };
  }

  async updateProduct(id: string, data: UpdateProductDTO): Promise<ProductResponseDTO> {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { cost: true, margin: true, location: true }
    });

    if (!existing) {
      throw new AppError('Producto no encontrado', 404);
    }

    const nextCost = data.cost ?? Number(existing.cost);
    const marginForAutoPrice = data.margin ?? Number(existing.margin);
    const nextStock = data.stock !== undefined ? Math.max(0, data.stock) : undefined;
    let nextSalePrice = data.salePrice;
    let nextMargin = data.margin;

    // Si cambia el costo y no se envía precio de venta, recalcula usando el margen actual.
    if (data.cost !== undefined && data.salePrice === undefined) {
      nextSalePrice = this.calculateSalePrice(nextCost, marginForAutoPrice);
    }

    // Si cambia el margen y no se envía precio, recalcula el precio de venta con ese nuevo margen.
    if (data.margin !== undefined && data.salePrice === undefined) {
      nextSalePrice = this.calculateSalePrice(nextCost, data.margin);
    }

    // Si se envían costo y precio de venta, actualizar margen para mantener consistencia.
    if (data.cost !== undefined && data.salePrice !== undefined && data.margin === undefined) {
      nextMargin = this.calculateMargin(nextCost, data.salePrice);
    }

    const images = data.mainImage !== undefined || data.gallery !== undefined ? this.buildImages(data.mainImage, data.gallery) : undefined;

    const location = data.location !== undefined ? this.normalizeLocation(data.location) : undefined;

    const preferredStockLocation = this.normalizeLocation(location ?? existing.location ?? 'GENERAL');

    const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          internalCode: data.internalCode,
          barcode: data.barcode,
          name: data.name,
          description: data.description,
          brand: data.brand,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId,
          supplierId: data.supplierId,
          cost: data.cost,
          salePrice: nextSalePrice,
          iva: FIXED_IVA_PERCENT,
          margin: nextMargin,
          stock: nextStock,
          minStock: data.minStock,
          maxStock: data.maxStock,
          esAlPeso: data.esAlPeso,
          unidadMedida: data.unidadMedida,
          fechaVencimiento: data.fechaVencimiento !== undefined ? (data.fechaVencimiento ? new Date(data.fechaVencimiento) : null) : undefined,
          alergenos: data.alergenos,
          unit: data.unit,
          location,
          weight: data.weight,
          images,
          isActive: data.isActive
        }
      });

      if (nextStock !== undefined) {
        await this.syncTotalStock(tx, id, nextStock, preferredStockLocation);
      }

      return tx.product.findUniqueOrThrow({
        where: { id: updatedProduct.id },
        include: {
          category: { select: { id: true, name: true } },
          subcategory: { select: { id: true, name: true } },
          supplier: { select: { id: true, businessName: true } }
        }
      });
    });

    return this.formatProductResponse(product);
  }

  async deleteProduct(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async searchProducts(query: string, limit = 10): Promise<ProductResponseDTO[]> {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { internalCode: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        supplier: { select: { id: true, businessName: true } }
      }
    });

    return products.map((product: any) => this.formatProductResponse(product));
  }

  async getProductByBarcode(barcode: string): Promise<ProductResponseDTO> {
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        supplier: { select: { id: true, businessName: true } }
      }
    });

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    return this.formatProductResponse(product);
  }

  async getProductByInternalCode(internalCode: string): Promise<ProductResponseDTO> {
    const product = await prisma.product.findUnique({
      where: { internalCode },
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        supplier: { select: { id: true, businessName: true } }
      }
    });

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    return this.formatProductResponse(product);
  }

  async bulkImportProducts(data: BulkProductImportDTO): Promise<{ created: number; updated: number; errors: Array<{ row: number; error: string }> }> {
    const errors: Array<{ row: number; error: string }> = [];
    let created = 0;
    let updated = 0;

    for (let i = 0; i < data.products.length; i++) {
      try {
        const product = data.products[i];
        const existing = await prisma.product.findUnique({
          where: { internalCode: product.internalCode }
        });

        if (existing && data.updateExisting) {
          await this.updateProduct(existing.id, { ...product, id: existing.id });
          updated++;
        } else if (!existing) {
          await this.createProduct(product);
          created++;
        }
      } catch (error: any) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    return { created, updated, errors };
  }

  async convertUnits(data: UnitConversionDTO): Promise<number> {
    const fromConversions = UNIT_CONVERSIONS[data.fromUnit];
    const toConversions = UNIT_CONVERSIONS[data.toUnit];

    if (!fromConversions || !toConversions) {
      throw new AppError('Unidad de conversión no válida', 400);
    }

    const factorToBase = fromConversions[data.toUnit] || 1;
    return data.quantity * factorToBase;
  }

  async getStockLevels(supplierId?: string): Promise<any[]> {
    const where: any = { deletedAt: null };
    if (supplierId) where.supplierId = supplierId;

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        internalCode: true,
        stock: true,
        minStock: true,
        maxStock: true,
        supplier: { select: { businessName: true } }
      }
    });

    return products.map((product: any) => ({
      ...product,
      status: product.stock < product.minStock ? 'BAJO' : product.stock > product.maxStock ? 'ALTO' : 'NORMAL'
    }));
  }

  private formatProductResponse(product: any): ProductResponseDTO {
    return {
      id: product.id,
      internalCode: product.internalCode,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
      supplier: product.supplier,
      cost: product.cost,
      salePrice: product.salePrice,
      margin: product.margin,
      iva: FIXED_IVA_PERCENT,
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      esAlPeso: Boolean(product.esAlPeso),
      unidadMedida: product.unidadMedida,
      fechaVencimiento: product.fechaVencimiento ? product.fechaVencimiento.toISOString() : undefined,
      alergenos: product.alergenos ?? [],
      unit: product.unit,
      location: product.location,
      weight: product.weight,
      mainImage: product.images ? product.images[0] : undefined,
      gallery: product.images,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    };
  }

  private buildImages(mainImage?: string, gallery?: string[]) {
    return [...new Set([mainImage, ...(gallery ?? [])].filter((image): image is string => Boolean(image)))];
  }

  private calculateMargin(cost: number, salePrice: number): number {
    if (cost <= 0) return 0;
    const margin = ((salePrice - cost) / cost) * 100;
    return Number(margin.toFixed(2));
  }

  private calculateSalePrice(cost: number, margin: number): number {
    if (cost <= 0) return 0;
    const salePrice = cost * (1 + margin / 100);
    return Number(salePrice.toFixed(2));
  }

  private normalizeLocation(location?: string): string {
    const normalized = location?.trim();
    return normalized && normalized.length > 0 ? normalized : 'GENERAL';
  }

  private async syncTotalStock(tx: Prisma.TransactionClient, productId: string, targetStock: number, preferredLocation: string): Promise<void> {
    const stocks = await tx.stock.findMany({
      where: { productId, deletedAt: null }
    });

    let preferredStock = stocks.find((stock) => stock.location === preferredLocation) ?? null;

    if (!preferredStock) {
      preferredStock = await tx.stock.upsert({
        where: { productId_location: { productId, location: preferredLocation } },
        update: { deletedAt: null },
        create: { productId, location: preferredLocation, quantity: 0 }
      });
    }

    const totalCurrentStock = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const stockOutsidePreferredLocation = totalCurrentStock - preferredStock.quantity;

    if (targetStock < stockOutsidePreferredLocation) {
      throw new AppError('No se puede bajar el stock total por debajo del stock existente en otras ubicaciones', 400);
    }

    const nextPreferredQuantity = targetStock - stockOutsidePreferredLocation;

    if (nextPreferredQuantity !== preferredStock.quantity) {
      await tx.stock.update({
        where: { id: preferredStock.id },
        data: { quantity: nextPreferredQuantity }
      });
    }

    await tx.product.update({
      where: { id: productId },
      data: { stock: targetStock }
    });
  }

  private async getDefaultCategoryId(): Promise<string> {
    const category = await prisma.category.findFirst({
      where: { deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });

    if (!category) {
      throw new AppError('No hay categorías disponibles. Cree una categoría para continuar.', 400);
    }

    return category.id;
  }

  private async getDefaultSubcategoryId(categoryId: string): Promise<string> {
    const subcategory = await prisma.subcategory.findFirst({
      where: { deletedAt: null, isActive: true, categoryId },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });

    if (!subcategory) {
      throw new AppError('La categoría seleccionada no tiene subcategorías activas.', 400);
    }

    return subcategory.id;
  }

  private async getDefaultSupplierId(): Promise<string> {
    const supplier = await prisma.supplier.findFirst({
      where: { deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });

    if (!supplier) {
      throw new AppError('No hay proveedores disponibles. Cree un proveedor para continuar.', 400);
    }

    return supplier.id;
  }
}

export default new ProductService();
