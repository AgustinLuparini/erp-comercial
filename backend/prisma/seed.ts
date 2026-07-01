import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const CATEGORY_STRUCTURE: Record<string, string[]> = {
  'Frutos Secos y Semillas': ['Nueces', 'Almendras', 'Mix keto', 'Semillas de chia', 'Semillas de lino'],
  'Harinas, Cereales y Legumbres': ['Harina de almendras', 'Avena integral', 'Lentejas', 'Quinoa', 'Garbanzos'],
  'Suplementos y Vitaminas': ['Proteina vegetal', 'Vitamina C', 'Magnesio', 'Colageno', 'Omega 3'],
  'Aceites, Conservas y Condimentos': ['Aceite de coco', 'Aceite de oliva', 'Conserva vegetal', 'Curcuma', 'Pimienta organica']
};

const CATEGORY_LABELS: Record<string, string[]> = {
  'Frutos Secos y Semillas': ['A Granel', 'Keto'],
  'Harinas, Cereales y Legumbres': ['Sin TACC', 'Integral'],
  'Suplementos y Vitaminas': ['Apto Vegano', 'Deportivo'],
  'Aceites, Conservas y Condimentos': ['Organico']
};

const PRODUCT_CATEGORY_EQUIVALENCE: Record<string, string> = {
  automatica: 'Frutos Secos y Semillas',
  herramientas: 'Frutos Secos y Semillas',
  electricidad: 'Aceites, Conservas y Condimentos',
  pinturas: 'Suplementos y Vitaminas',
  plomeria: 'Aceites, Conservas y Condimentos',
  tornilleria: 'Harinas, Cereales y Legumbres'
};

const PRODUCT_SUBCATEGORY_EQUIVALENCE: Record<string, string> = {
  automatica: 'Nueces',
  taladros: 'Nueces',
  cables: 'Aceite de oliva',
  pinceles: 'Vitamina C',
  tornillos: 'Avena integral'
};

const normalizeText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const validateCategoryStructure = (structure: Record<string, string[]>) => {
  const categoryNames = Object.keys(structure);
  const normalizedCategories = new Set<string>();

  for (const categoryName of categoryNames) {
    const trimmedCategory = categoryName.trim();
    if (!trimmedCategory) throw new Error('No se permiten categorias con nombre vacio');

    const normalizedCategory = normalizeText(trimmedCategory);
    if (normalizedCategories.has(normalizedCategory)) {
      throw new Error(`Categoria duplicada en seed: ${trimmedCategory}`);
    }
    normalizedCategories.add(normalizedCategory);

    const subcategories = structure[categoryName] ?? [];
    const normalizedSubcategories = new Set<string>();
    for (const subcategoryName of subcategories) {
      const trimmedSubcategory = subcategoryName.trim();
      if (!trimmedSubcategory) {
        throw new Error(`No se permiten subcategorias vacias en ${trimmedCategory}`);
      }

      const normalizedSubcategory = normalizeText(trimmedSubcategory);
      if (normalizedSubcategories.has(normalizedSubcategory)) {
        throw new Error(`Subcategoria duplicada en ${trimmedCategory}: ${trimmedSubcategory}`);
      }
      normalizedSubcategories.add(normalizedSubcategory);
    }
  }
};

async function main() {
  validateCategoryStructure(CATEGORY_STRUCTURE);

  const permissions = [
    { code: 'users.manage', name: 'Administrar usuarios' },
    { code: 'roles.manage', name: 'Administrar roles' },
    { code: 'products.manage', name: 'Administrar productos' },
    { code: 'categories.manage', name: 'Administrar categorías' },
    { code: 'sales.manage', name: 'Administrar ventas' },
    { code: 'purchases.manage', name: 'Administrar compras' },
    { code: 'cash.manage', name: 'Administrar caja' },
    { code: 'stock.manage', name: 'Administrar stock' }
  ];

  await Promise.all(
    permissions.map((permission) =>
      prisma.permission.upsert({
        where: { code: permission.code },
        update: permission,
        create: { ...permission, isActive: true }
      })
    )
  );

  const roles = [
    { name: 'ADMIN', description: 'Administrador con todos los permisos' },
    { name: 'GERENTE', description: 'Gerente con permisos de gestión' },
    { name: 'VENDEDOR', description: 'Vendedor con permisos de ventas' },
    { name: 'CAJERO', description: 'Cajero con permisos de caja' },
    { name: 'DEPOSITO', description: 'Depósito con permisos de stock' }
  ];

  const roleRecords = await Promise.all(
    roles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: role,
        create: { ...role, isActive: true }
      })
    )
  );

  const allPermissions = await prisma.permission.findMany();
  const adminRole = roleRecords.find((role) => role.name === 'ADMIN');
  if (adminRole) {
    await Promise.all(
      allPermissions.map((permission) =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
          update: {},
          create: { roleId: adminRole.id, permissionId: permission.id }
        })
      )
    );
  }

  const userPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@erp.local' },
    update: { password: userPassword, firstName: 'Admin', lastName: 'Sistema', isActive: true, roleId: adminRole?.id ?? '' },
    create: {
      email: 'admin@erp.local',
      password: userPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      roleId: adminRole?.id ?? '',
      isActive: true
    }
  });

  const categoryRecords = await Promise.all(
    Object.keys(CATEGORY_STRUCTURE).map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {
          name,
          description: `Categoria ${name}. Labels: ${(CATEGORY_LABELS[name] || []).join(', ')}`,
          isActive: true,
          deletedAt: null
        },
        create: {
          name,
          description: `Categoria ${name}. Labels: ${(CATEGORY_LABELS[name] || []).join(', ')}`,
          isActive: true
        }
      })
    )
  );

  const categoryByName = new Map(categoryRecords.map((category) => [category.name, category]));

  const subcategoryRecords = [] as Array<{ id: string; name: string; categoryId: string }>;
  for (const [categoryName, subcategories] of Object.entries(CATEGORY_STRUCTURE)) {
    const category = categoryByName.get(categoryName);
    if (!category) throw new Error(`Categoria no encontrada en seed: ${categoryName}`);

    for (const subcategoryName of subcategories) {
      const record = await prisma.subcategory.upsert({
        where: {
          name_categoryId: {
            name: subcategoryName,
            categoryId: category.id
          }
        },
        update: {
          isActive: true,
          deletedAt: null
        },
        create: {
          name: subcategoryName,
          categoryId: category.id,
          isActive: true
        }
      });
      subcategoryRecords.push(record);
    }
  }

  const fallbackCategory = categoryByName.get('Frutos Secos y Semillas');
  if (!fallbackCategory) throw new Error('No se pudo resolver la categoria fallback Frutos Secos y Semillas');

  const fallbackSubcategory = subcategoryRecords.find(
    (subcategory) => subcategory.categoryId === fallbackCategory.id
  );
  if (!fallbackSubcategory) throw new Error('No se pudo resolver subcategoria fallback para Frutos Secos y Semillas');

  const targetSubcategoriesByCategory = new Map<string, Set<string>>();
  for (const [categoryName, names] of Object.entries(CATEGORY_STRUCTURE)) {
    targetSubcategoriesByCategory.set(
      normalizeText(categoryName),
      new Set(names.map((name) => normalizeText(name)))
    );
  }

  const uniqueCategoryBySubcategory = new Map<string, string | null>();
  for (const [categoryName, names] of Object.entries(CATEGORY_STRUCTURE)) {
    for (const subcategoryName of names) {
      const normalizedSubcategoryName = normalizeText(subcategoryName);
      const existing = uniqueCategoryBySubcategory.get(normalizedSubcategoryName);
      if (existing && existing !== categoryName) {
        uniqueCategoryBySubcategory.set(normalizedSubcategoryName, null);
      } else if (!existing) {
        uniqueCategoryBySubcategory.set(normalizedSubcategoryName, categoryName);
      }
    }
  }

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      internalCode: true,
      name: true,
      category: { select: { name: true } },
      subcategory: { select: { name: true } }
    }
  });

  const reassignmentLogs: string[] = [];

  for (const product of products) {
    const currentCategoryName = product.category?.name ?? '';
    const currentSubcategoryName = product.subcategory?.name ?? '';
    const normalizedCurrentCategory = normalizeText(currentCategoryName);
    const normalizedCurrentSubcategory = normalizeText(currentSubcategoryName);

    let targetCategoryName = PRODUCT_CATEGORY_EQUIVALENCE[normalizedCurrentCategory] || currentCategoryName;
    let targetSubcategoryName = PRODUCT_SUBCATEGORY_EQUIVALENCE[normalizedCurrentSubcategory] || currentSubcategoryName;

    const categoryExists = categoryByName.has(targetCategoryName);
    const subcategoryInCategory = targetSubcategoriesByCategory.get(normalizeText(targetCategoryName));

    if (!categoryExists) {
      const uniqueCategory = uniqueCategoryBySubcategory.get(normalizedCurrentSubcategory);
      targetCategoryName = uniqueCategory || 'Frutos Secos y Semillas';
    }

    const targetCategorySubcategories =
      targetSubcategoriesByCategory.get(normalizeText(targetCategoryName)) ||
      targetSubcategoriesByCategory.get(normalizeText('Frutos Secos y Semillas')) ||
      new Set<string>();

    if (!targetCategorySubcategories.has(normalizeText(targetSubcategoryName))) {
      if (targetCategorySubcategories.has(normalizedCurrentSubcategory)) {
        targetSubcategoryName = currentSubcategoryName;
      } else {
        const [firstSubcategoryName] = CATEGORY_STRUCTURE[targetCategoryName] || [];
        targetSubcategoryName = firstSubcategoryName || fallbackSubcategory.name;
      }
    }

    const targetCategory = categoryByName.get(targetCategoryName) || fallbackCategory;
    const targetSubcategory = subcategoryRecords.find(
      (subcategory) =>
        subcategory.categoryId === targetCategory.id &&
        normalizeText(subcategory.name) === normalizeText(targetSubcategoryName)
    ) || fallbackSubcategory;

    if (product.category?.name !== targetCategory.name || product.subcategory?.name !== targetSubcategory.name) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          categoryId: targetCategory.id,
          subcategoryId: targetSubcategory.id
        }
      });

      reassignmentLogs.push(
        `[MIGRACION] ${product.internalCode} - ${product.name}: ${currentCategoryName}/${currentSubcategoryName} -> ${targetCategory.name}/${targetSubcategory.name}`
      );
    }
  }

  const targetCategoryIds = new Set(categoryRecords.map((category) => category.id));
  const targetSubcategoryIds = new Set(subcategoryRecords.map((subcategory) => subcategory.id));

  await prisma.subcategory.updateMany({
    where: {
      deletedAt: null,
      id: { notIn: Array.from(targetSubcategoryIds) }
    },
    data: {
      isActive: false,
      deletedAt: new Date()
    }
  });

  await prisma.category.updateMany({
    where: {
      deletedAt: null,
      id: { notIn: Array.from(targetCategoryIds) }
    },
    data: {
      isActive: false,
      deletedAt: new Date()
    }
  });

  console.log(`[SEED] Categorias activas: ${categoryRecords.length}`);
  console.log(`[SEED] Subcategorias activas: ${subcategoryRecords.length}`);
  if (reassignmentLogs.length === 0) {
    console.log('[SEED] No hubo productos reasignados.');
  } else {
    console.log(`[SEED] Productos reasignados: ${reassignmentLogs.length}`);
    reassignmentLogs.forEach((entry) => console.log(entry));
  }

  const supplier = await prisma.supplier.upsert({
    where: { taxId: '30712345678' },
    update: {
      businessName: 'Distribuidora Central SRL',
      address: 'Av. Central 150',
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      email: 'contacto@distribuidoracentral.com',
      phone: '011-555-1234',
      contact: 'Maria Gomez',
      notes: 'Proveedor principal de mercaderia general'
    },
    create: {
      businessName: 'Distribuidora Central SRL',
      taxId: '30712345678',
      address: 'Av. Central 150',
      city: 'Buenos Aires',
      province: 'Buenos Aires',
      email: 'contacto@distribuidoracentral.com',
      phone: '011-555-1234',
      contact: 'Maria Gomez',
      notes: 'Proveedor principal de mercaderia general'
    }
  });

  const customer = await prisma.customer.upsert({
    where: { email: 'cliente@empresa.local' },
    update: {
      firstName: 'Juan',
      lastName: 'Pérez',
      businessName: 'Comercial Pérez SRL',
      taxId: '20333444555',
      dni: '30111222',
      phone: '011-555-9876',
      address: 'Calle Falsa 123',
      city: 'La Plata',
      province: 'Buenos Aires',
      creditLimit: 200000,
      discount: 5,
      balance: 0
    },
    create: {
      firstName: 'Juan',
      lastName: 'Pérez',
      businessName: 'Comercial Pérez SRL',
      taxId: '20333444555',
      dni: '30111222',
      email: 'cliente@empresa.local',
      phone: '011-555-9876',
      address: 'Calle Falsa 123',
      city: 'La Plata',
      province: 'Buenos Aires',
      creditLimit: 200000,
      discount: 5,
      balance: 0
    }
  });

  const product = await prisma.product.upsert({
    where: { internalCode: 'P001' },
    update: {
      name: 'Almendras premium',
      description: 'Fruto seco a granel de origen seleccionado',
      brand: 'Natural Life',
      cost: 8500,
      salePrice: 13200,
      margin: 35,
      iva: 21,
      stock: 12,
      minStock: 5,
      maxStock: 30,
      location: 'Deposito Principal',
      unit: 'KILO',
      weight: 1,
      esAlPeso: true,
      unidadMedida: 'KG',
      fechaVencimiento: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      alergenos: ['Frutos secos'],
      isActive: true,
      supplierId: supplier.id,
      categoryId: categoryByName.get('Frutos Secos y Semillas')?.id || categoryRecords[0].id,
      subcategoryId:
        subcategoryRecords.find((subcategory) => {
          const targetCategory = categoryByName.get('Frutos Secos y Semillas');
          return Boolean(targetCategory) && subcategory.categoryId === targetCategory?.id && subcategory.name === 'Nueces';
        })?.id || subcategoryRecords[0].id
    },
    create: {
      internalCode: 'P001',
      barcode: '7790000000017',
      name: 'Almendras premium',
      description: 'Fruto seco a granel de origen seleccionado',
      brand: 'Natural Life',
      cost: 8500,
      salePrice: 13200,
      margin: 35,
      iva: 21,
      stock: 12,
      minStock: 5,
      maxStock: 30,
      location: 'Deposito Principal',
      unit: 'KILO',
      weight: 1,
      esAlPeso: true,
      unidadMedida: 'KG',
      fechaVencimiento: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      alergenos: ['Frutos secos'],
      isActive: true,
      supplierId: supplier.id,
      categoryId: categoryByName.get('Frutos Secos y Semillas')?.id || categoryRecords[0].id,
      subcategoryId:
        subcategoryRecords.find((subcategory) => {
          const targetCategory = categoryByName.get('Frutos Secos y Semillas');
          return Boolean(targetCategory) && subcategory.categoryId === targetCategory?.id && subcategory.name === 'Nueces';
        })?.id || subcategoryRecords[0].id
    }
  });

  await prisma.stock.upsert({
    where: { productId_location: { productId: product.id, location: 'Deposito Principal' } },
    update: { quantity: 12 },
    create: { productId: product.id, quantity: 12, location: 'Deposito Principal' }
  });

  const promotion = await prisma.promotion.upsert({
    where: { name: 'Descuento frutos secos 10%' },
    update: {
      description: 'Promocion valida para frutos secos y semillas',
      promotionType: 'DISCOUNT_PERCENTAGE',
      discountPercent: 10,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true
    },
    create: {
      name: 'Descuento frutos secos 10%',
      description: 'Promocion valida para frutos secos y semillas',
      promotionType: 'DISCOUNT_PERCENTAGE',
      discountPercent: 10,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      active: true
    }
  });

  await prisma.promotionProduct.upsert({
    where: { promotionId_productId: { promotionId: promotion.id, productId: product.id } },
    update: {},
    create: { promotionId: promotion.id, productId: product.id }
  });

  console.log('Seed completed successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
