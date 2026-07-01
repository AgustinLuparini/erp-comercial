# Módulo de Productos - Documentación Completa

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Endpoints API](#endpoints-api)
4. [Frontend](#frontend)
5. [Base de Datos](#base-de-datos)
6. [Guía de Uso](#guía-de-uso)
7. [Ejemplos de Código](#ejemplos-de-código)

---

## Descripción General

El módulo de productos es un sistema completo de gestión de inventario para una ferretería, que permite:

✓ Crear, leer, actualizar y eliminar productos (CRUD)
✓ Búsqueda y filtrado avanzado
✓ Gestión de múltiples unidades de medida (UNIDAD, METRO, KILO, LITRO, CAJA)
✓ Conversión entre unidades
✓ Importación masiva desde CSV/Excel
✓ Generación de etiquetas de productos con códigos de barras
✓ Gestión de stock y niveles de inventario
✓ Búsqueda por código interno o código de barras

### Características Principales

- **Gestión Completa de Productos**: CRUD con validaciones
- **Unidades de Medida Múltiples**: Conversión automática entre unidades
- **Búsqueda Avanzada**: Por nombre, código interno, código de barras
- **Filtrado Flexible**: Por categoría, proveedor, rango de precios, niveles de stock
- **Importación Masiva**: Carga de múltiples productos desde CSV con manejo de errores
- **Etiquetas Imprimibles**: Generación de etiquetas con códigos de barras en formato HTML
- **Control de Acceso**: Protección basada en roles (requiere permiso 'products.manage')

---

## Arquitectura

### Estructura de Capas

```
Presentación (Frontend)
    ↓
API REST (Express + TypeScript)
    ↓
Servicios (Lógica de Negocio)
    ↓
Repositorios (Acceso a Datos)
    ↓
Base de Datos (Prisma ORM)
```

### Archivos Backend

```
backend/src/
├── controllers/
│   ├── product.controller.ts      # Manejadores HTTP
│   └── label.controller.ts        # Etiquetas e importación
├── services/
│   ├── product.service.ts         # Lógica de negocio
│   ├── label.service.ts           # Generación de etiquetas
│   └── excel.service.ts           # Importación Excel
├── dtos/
│   └── product.dto.ts             # Interfaces de datos
├── validators/
│   └── product.validator.ts       # Validaciones
├── routes/
│   ├── product.routes.ts          # Rutas de productos
│   └── label.routes.ts            # Rutas de etiquetas
└── utils/
    └── apiResponse.ts             # Utilidades de respuesta
```

### Archivos Frontend

```
frontend/src/
├── services/
│   └── productService.ts          # Cliente API
├── hooks/
│   └── useProducts.ts             # React Query hooks
├── pages/
│   └── ProductsPage.tsx           # Página principal
├── components/
│   ├── ProductFilters.tsx         # Panel de filtros
│   ├── BulkImportDialog.tsx       # Importación masiva
│   ├── LabelsViewer.tsx           # Visor de etiquetas
│   └── POSCart.tsx                # Carrito de ventas (bonus)
```

---

## Endpoints API

### 1. Crear Producto
```
POST /api/products
```

**Autenticación**: Requerida (permiso: `products.manage`)

**Body**:
```json
{
  "internalCode": "P001",
  "barcode": "7790000000017",
  "name": "Taladro eléctrico 500W",
  "description": "Taladro percutor profesional",
  "brand": "Makera",
  "categoryId": "uuid",
  "subcategoryId": "uuid",
  "supplierId": "uuid",
  "cost": 120000,
  "salePrice": 185000,
  "iva": 21,
  "margin": 35,
  "stock": 12,
  "minStock": 5,
  "maxStock": 30,
  "unit": "UNIDAD",
  "location": "Depósito 1",
  "weight": 3.4,
  "isActive": true
}
```

**Respuesta**:
```json
{
  "status": "success",
  "message": "Producto creado exitosamente",
  "data": {
    "id": "uuid",
    "internalCode": "P001",
    "name": "Taladro eléctrico 500W",
    "category": {
      "id": "uuid",
      "name": "Herramientas"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Obtener Todos los Productos
```
GET /api/products?page=1&limit=10&search=taladro&categoryId=uuid&minPrice=50000&maxPrice=200000&sortBy=price&sortOrder=asc
```

**Parámetros**:
- `page`: Número de página (default: 1)
- `limit`: Productos por página (default: 10)
- `search`: Búsqueda en nombre/código/barcode
- `categoryId`: Filtrar por categoría
- `subcategoryId`: Filtrar por subcategoría
- `supplierId`: Filtrar por proveedor
- `minPrice`: Precio mínimo
- `maxPrice`: Precio máximo
- `minStock`: Stock mínimo
- `unit`: Unidad de medida
- `isActive`: Activos/Inactivos
- `sortBy`: Campo para ordenar (name|price|stock|createdAt)
- `sortOrder`: Orden (asc|desc)

**Respuesta**:
```json
{
  "status": "success",
  "data": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5,
    "products": [
      {
        "id": "uuid",
        "internalCode": "P001",
        "name": "Taladro eléctrico",
        "salePrice": 185000,
        "stock": 12,
        "category": { "name": "Herramientas" }
      }
    ]
  }
}
```

---

### 3. Obtener Producto por ID
```
GET /api/products/:id
```

---

### 4. Actualizar Producto
```
PUT /api/products/:id
```

**Autenticación**: Requerida (permiso: `products.manage`)

**Body**: Misma estructura que create (todos los campos opcionales)

---

### 5. Eliminar Producto
```
DELETE /api/products/:id
```

**Autenticación**: Requerida (permiso: `products.manage`)

**Nota**: Realiza soft delete (establece deletedAt)

---

### 6. Buscar Productos
```
GET /api/products/search?q=taladro&limit=10
```

**Parámetros**:
- `q`: Texto de búsqueda (requerido)
- `limit`: Máximo de resultados

**Respuesta**: Array de productos coincidentes

---

### 7. Obtener por Código de Barras
```
GET /api/products/barcode/:barcode
```

**Uso**: Lectura de códigos de barras en POS

---

### 8. Obtener por Código Interno
```
GET /api/products/code/:code
```

---

### 9. Convertir Unidades
```
POST /api/products/convert-units
```

**Body**:
```json
{
  "fromUnit": "METRO",
  "toUnit": "CAJA",
  "quantity": 50
}
```

**Respuesta**:
```json
{
  "status": "success",
  "data": {
    "original": 50,
    "converted": 5,
    "fromUnit": "METRO",
    "toUnit": "CAJA"
  }
}
```

---

### 10. Importación Masiva
```
POST /api/products/bulk-import
```

**Autenticación**: Requerida (permiso: `products.manage`)

**Body**:
```json
{
  "products": [
    {
      "internalCode": "P001",
      "name": "Producto 1",
      "cost": 100,
      "salePrice": 150,
      "categoryId": "uuid",
      "subcategoryId": "uuid",
      "supplierId": "uuid",
      "unit": "UNIDAD"
    }
  ],
  "updateExisting": false
}
```

**Respuesta**:
```json
{
  "status": "success",
  "message": "Importación completada",
  "data": {
    "created": 45,
    "updated": 0,
    "errors": []
  }
}
```

---

### 11. Obtener Niveles de Stock
```
GET /api/products/stock/levels?supplierId=uuid
```

**Respuesta**: Productos agrupados por estado de stock (BAJO, NORMAL, ALTO)

---

### 12. Generar Etiquetas (HTML)
```
POST /api/labels/generate-html
```

**Autenticación**: Requerida (permiso: `products.manage`)

**Body**:
```json
{
  "productIds": ["uuid1", "uuid2"],
  "quantity": 1
}
```

**Respuesta**: Descarga HTML con etiquetas imprimibles

---

### 13. Descargar Plantilla CSV
```
GET /api/labels/import-template
```

**Respuesta**: Descarga archivo CSV con estructura esperada

---

## Frontend

### Página Principal: ProductsPage

**Ubicación**: `frontend/src/pages/ProductsPage.tsx`

**Características**:
- Tabla de productos con paginación
- Búsqueda en tiempo real
- Filtros avanzados (categoría, proveedor, precio, stock, unidad)
- Ordenamiento por nombre, precio, stock, fecha
- Diálogo de creación/edición de productos
- Botón de importación masiva
- Generación de etiquetas
- Indicadores visuales de stock bajo

**Funcionalidades**:
```tsx
const ProductsPage = () => {
  // Estado de tabla y paginación
  // Búsqueda y filtrado
  // CRUD de productos
  // Importación masiva
  // Generación de etiquetas
}
```

### Componentes Auxiliares

#### ProductFilters
```tsx
<ProductFilters
  filters={activeFilters}
  onFilterChange={handleFilterChange}
  onClearFilters={handleClearFilters}
/>
```

**Filtros disponibles**:
- Categoría (select)
- Proveedor (select)
- Unidad (select)
- Rango de precio (slider)
- Stock mínimo (input)
- Ordenamiento

#### BulkImportDialog
```tsx
<BulkImportDialog
  open={importDialogOpen}
  onClose={() => setImportDialogOpen(false)}
  onSuccess={() => refetchProducts()}
/>
```

**Workflow**:
1. Descargar plantilla CSV
2. Editar archivo localmente
3. Seleccionar archivo CSV
4. Opcionalmente actualizar existentes
5. Ver resultados (creados, errores)

#### LabelsViewer
```tsx
<LabelsViewer
  isOpen={showLabels}
  onClose={() => setShowLabels(false)}
  generationData={labelGenerationData}
/>
```

**Características**:
- Previsualización de etiquetas
- Impresión directa desde navegador
- Descarga de archivo HTML

### Custom Hooks (useProducts)

```tsx
// Queries
const { data: products, isLoading } = useProducts(filters);
const { data: product } = useProductById(id);
const { data: searchResults } = useSearchProducts(query);
const { data: stockLevels } = useStockLevels();

// Mutations
const { mutate: createProduct } = useCreateProduct();
const { mutate: updateProduct } = useUpdateProduct();
const { mutate: deleteProduct } = useDeleteProduct();
const { mutate: bulkImport } = useBulkImportProducts();
const { mutate: generateLabels } = useGenerateLabels();
```

---

## Base de Datos

### Modelo Product

```prisma
model Product {
  id                String    @id @default(cuid())
  internalCode      String    @unique
  barcode           String?   @unique
  name              String
  description       String?
  brand             String?
  
  // Relaciones
  categoryId        String
  category          Category      @relation(fields: [categoryId], references: [id])
  
  subcategoryId     String
  subcategory       Subcategory   @relation(fields: [subcategoryId], references: [id])
  
  supplierId        String
  supplier          Supplier      @relation(fields: [supplierId], references: [id])
  
  // Precios
  cost              Decimal   @db.Decimal(10, 2)
  salePrice         Decimal   @db.Decimal(10, 2)
  iva               Int       @default(21)
  margin            Int       @default(0)
  
  // Stock
  stock             Int       @default(0)
  minStock          Int       @default(0)
  maxStock          Int?
  
  // Especificaciones
  unit              String    @default("UNIDAD")
  location          String?
  weight            Decimal?  @db.Decimal(8, 2)
  
  // Imágenes
  mainImage         String?
  gallery           String[]  @default([])
  
  // Control
  isActive          Boolean   @default(true)
  
  // Auditoría
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  // Relaciones inversas
  saleDetails       SaleDetail[]
  purchaseDetails   PurchaseDetail[]
  promotions        PromotionProduct[]
  stockMovements    StockMovement[]
}
```

### Modelos Relacionados

```prisma
model Category {
  id            String         @id @default(cuid())
  name          String         @unique
  description   String?
  products      Product[]
  subcategories Subcategory[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?
}

model Subcategory {
  id         String    @id @default(cuid())
  name       String
  categoryId String
  category   Category  @relation(fields: [categoryId], references: [id])
  products   Product[]
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime?
  
  @@unique([categoryId, name])
}

model Supplier {
  id                String    @id @default(cuid())
  name              String    @unique
  email             String?
  phone             String?
  website           String?
  products          Product[]
  purchaseDetails   PurchaseDetail[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
}
```

### Stock y Movimientos

```prisma
model Stock {
  id            String           @id @default(cuid())
  productId     String           @unique
  product       Product          @relation(fields: [productId], references: [id])
  quantity      Int              @default(0)
  movements     StockMovement[]
  lastUpdated   DateTime         @updatedAt
  createdAt     DateTime         @default(now())
}

model StockMovement {
  id            String    @id @default(cuid())
  productId     String
  product       Product   @relation(fields: [productId], references: [id])
  stockId       String
  stock         Stock     @relation(fields: [stockId], references: [id])
  type          String    // INCOMING, OUTGOING, ADJUSTMENT, TRANSFER
  quantity      Int
  reference     String?   // Número de compra, venta, etc
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  createdAt     DateTime  @default(now())
}
```

---

## Guía de Uso

### Instalación y Setup

#### 1. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Migrar base de datos
npm run prisma:migrate

# Seed con datos de ejemplo
npm run seed
```

#### 2. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variable de entorno
echo "VITE_API_URL=http://localhost:4000/api" > .env.local

# Ejecutar servidor de desarrollo
npm run dev
```

### Workflow Típico

#### 1. Crear un Producto

```bash
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "internalCode": "P001",
    "barcode": "7790000000017",
    "name": "Taladro eléctrico 500W",
    "categoryId": "cat-id",
    "subcategoryId": "subcat-id",
    "supplierId": "sup-id",
    "cost": 120000,
    "salePrice": 185000,
    "iva": 21,
    "margin": 35,
    "stock": 12,
    "unit": "UNIDAD"
  }'
```

#### 2. Buscar Productos

```bash
curl http://localhost:4000/api/products/search?q=taladro&limit=10
```

#### 3. Importar Desde CSV

1. Descargar plantilla:
```bash
curl -O http://localhost:4000/api/labels/import-template
```

2. Completar CSV con productos

3. Importar:
```bash
curl -X POST http://localhost:4000/api/products/bulk-import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [...],
    "updateExisting": false
  }'
```

#### 4. Generar Etiquetas

```bash
curl -X POST http://localhost:4000/api/labels/generate-html \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["id1", "id2"],
    "quantity": 1
  }' \
  -o etiquetas.html
```

---

## Ejemplos de Código

### Backend Service

```typescript
import { ProductService } from '../services/product.service.js';

const productService = new ProductService();

// Crear producto
const product = await productService.createProduct({
  internalCode: 'P001',
  name: 'Taladro',
  cost: 100,
  salePrice: 150,
  categoryId: 'cat-id',
  subcategoryId: 'subcat-id',
  supplierId: 'sup-id',
  unit: 'UNIDAD'
});

// Buscar
const products = await productService.searchProducts('taladro', 10);

// Convertir unidades
const converted = await productService.convertUnits({
  fromUnit: 'METRO',
  toUnit: 'CAJA',
  quantity: 50,
  conversionFactor: 1
});
```

### Frontend Hook

```tsx
import { useProducts, useCreateProduct, useGenerateLabels } from '@/hooks/useProducts';

export function ProductList() {
  const { data: products, isLoading } = useProducts({ page: 1, limit: 10 });
  const { mutate: createProduct } = useCreateProduct();
  const { mutate: generateLabels } = useGenerateLabels();

  const handleCreate = (data) => {
    createProduct(data, {
      onSuccess: () => {
        // Refetch products
      }
    });
  };

  const handlePrintLabels = () => {
    generateLabels({
      productIds: products.map(p => p.id),
      quantity: 1
    });
  };

  return (
    <>
      <table>
        <tbody>
          {products?.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.salePrice}</td>
              <td>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handlePrintLabels}>Imprimir Etiquetas</button>
    </>
  );
}
```

### CSV Import Template

```csv
"Código Interno","Código de Barras","Nombre","Descripción","Marca","Categoría","Subcategoría","Proveedor","Costo","Precio de Venta","IVA %","Margen %","Stock","Stock Mínimo","Stock Máximo","Unidad","Ubicación","Peso","Imagen Principal","Galería","Activo"
"P001","7790000000017","Taladro eléctrico 500W","Taladro percutor profesional","Makera","Herramientas","Taladros","Suministros Industriales SA","120000","185000","21","35","12","5","30","UNIDAD","Depósito 1","3.4","https://example.com/image.jpg","https://example.com/img1.jpg;https://example.com/img2.jpg","true"
```

---

## Unidades de Medida Soportadas

| Unidad | Descripción | Factor de Conversión |
|--------|-------------|---------------------|
| UNIDAD | Piezas | 1:1 |
| METRO | Metros | 1 METRO = 0.1 CAJA |
| KILO | Kilogramos | 1 KILO = 0.001 GRAMO |
| LITRO | Litros | 1 LITRO = 0.001 ML |
| CAJA | Cajas | 1:1 |

---

## Códigos de Error

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | Validación fallida | Datos incompletos o inválidos |
| 401 | No autorizado | Token JWT inválido |
| 403 | Acceso denegado | Permiso 'products.manage' requerido |
| 404 | Producto no encontrado | ID de producto no existe |
| 409 | Conflicto | Código interno o barcode duplicado |

---

## Performance y Optimización

### Índices de Base de Datos

```prisma
model Product {
  // ...
  @@index([categoryId])
  @@index([subcategoryId])
  @@index([supplierId])
  @@index([internalCode])
  @@index([barcode])
}
```

### Paginación

Usar siempre paginación con límites máximos:
- Página por defecto: 1
- Límite por defecto: 10
- Límite máximo: 100

### Caché

React Query cache por defecto: 5 minutos

---

## Próximas Mejoras

- [ ] Integración con Excel (xlsx library)
- [ ] Generación de PDF para etiquetas (puppeteer)
- [ ] Multer para upload de archivos
- [ ] Generación de reportes
- [ ] Códigos QR en lugar de códigos de barras
- [ ] Integración con sistema de compras
- [ ] Alertas de bajo stock
- [ ] Histórico de precios
- [ ] Fotos de productos con almacenamiento en cloud

---

**Última actualización**: 2024-01-15
**Versión**: 1.0
