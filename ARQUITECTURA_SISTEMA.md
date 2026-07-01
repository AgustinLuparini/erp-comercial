# ERP para Ferretería - Arquitectura General

## 📊 Visión General del Sistema

Este es un **ERP (Enterprise Resource Planning) completo para gestión de ferreterías**, construido con tecnologías modernas y arquitectura limpia.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE WEB (React + Vite)                   │
├─────────────────────────────────────────────────────────────────┤
│  ProductsPage │ SalesPage │ PurchasesPage │ InventoryPage │    │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/REST API
┌────────────────────────▼────────────────────────────────────────┐
│              BACKEND API (Express.js + TypeScript)              │
├─────────────────────────────────────────────────────────────────┤
│  Controllers (HTTP handlers)                                     │
│  ├── ProductController    ├── SalesController                   │
│  ├── AuthController       ├── PurchaseController                │
│  └── LabelController      └── InventoryController               │
├─────────────────────────────────────────────────────────────────┤
│  Services (Business Logic)                                       │
│  ├── ProductService       ├── SalesService                      │
│  ├── AuthService          ├── PurchaseService                   │
│  └── LabelService         └── InventoryService                  │
├─────────────────────────────────────────────────────────────────┤
│  Repositories (Data Access)                                      │
│  └── UserRepository  ProductRepository  SalesRepository         │
├─────────────────────────────────────────────────────────────────┤
│  Middleware                                                      │
│  ├── Auth (JWT)           ├── ErrorHandler                      │
│  └── Authorization (RBAC) └── Logging                           │
└────────────────────────┬────────────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼────────────────────────────────────────┐
│            BASE DE DATOS (PostgreSQL)                            │
├─────────────────────────────────────────────────────────────────┤
│  Users │ Roles │ Permissions │ Products │ Sales                 │
│  Purchases │ Stock │ Promotions │ Customers │ Suppliers         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estructura de Carpetas

```
aplicacion-web-ferreterias/
├── docker-compose.yml          # Orquestación de contenedores
├── README.md                    # Documentación general
├── DOCUMENTACION_MODULO_PRODUCTOS.md  # Docs del módulo
│
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── index.ts            # Entrada del servidor
│   │   ├── config/
│   │   │   └── config.ts       # Configuración de entorno
│   │   ├── controllers/        # Manejadores HTTP
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   └── label.controller.ts
│   │   ├── services/           # Lógica de negocio
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── product.service.ts
│   │   │   ├── label.service.ts
│   │   │   └── excel.service.ts
│   │   ├── repositories/       # Acceso a datos
│   │   │   └── user.repository.ts
│   │   ├── dtos/               # Interfaces de datos
│   │   │   ├── auth.dto.ts
│   │   │   ├── user.dto.ts
│   │   │   └── product.dto.ts
│   │   ├── validators/         # Validaciones
│   │   │   └── product.validator.ts
│   │   ├── routes/             # Rutas Express
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   └── label.routes.ts
│   │   ├── middlewares/        # Middleware Express
│   │   │   ├── auth.middleware.ts
│   │   │   └── errorHandler.ts
│   │   ├── utils/              # Utilidades
│   │   │   └── apiResponse.ts
│   │   ├── logs/               # Logger
│   │   │   └── logger.ts
│   │   ├── prisma/             # Cliente Prisma
│   │   │   └── client.ts
│   │   └── swagger.json        # Documentación API
│   │
│   ├── prisma/                 # Configuración de Prisma
│   │   ├── schema.prisma       # Esquema de BD (20+ modelos)
│   │   └── seed.ts             # Datos iniciales
│   │
│   ├── package.json            # Dependencias
│   ├── tsconfig.json           # Configuración TypeScript
│   ├── Dockerfile              # Imagen Docker
│   ├── .env                    # Variables de entorno
│   └── versions.txt            # Versiones de librerías
│
└── frontend/                    # React + Vite + TypeScript
    ├── src/
    │   ├── main.tsx            # Entrada React
    │   ├── App.tsx             # Componente raíz
    │   ├── index.css           # Estilos globales
    │   │
    │   ├── components/         # Componentes reutilizables
    │   │   ├── ProductFilters.tsx
    │   │   ├── BulkImportDialog.tsx
    │   │   ├── LabelsViewer.tsx
    │   │   └── POSCart.tsx
    │   │
    │   ├── pages/              # Páginas principales
    │   │   ├── HomePage.tsx
    │   │   └── ProductsPage.tsx
    │   │
    │   ├── hooks/              # Custom React Hooks
    │   │   └── useProducts.ts  # React Query hooks
    │   │
    │   ├── services/           # Clientes API
    │   │   └── productService.ts
    │   │
    │   ├── context/            # Context API
    │   ├── layouts/            # Layouts
    │   ├── routes/             # Configuración de rutas
    │   ├── theme/              # Tema Material UI
    │   └── utils/              # Funciones auxiliares
    │
    ├── package.json            # Dependencias
    ├── tsconfig.json           # Configuración TypeScript
    ├── vite.config.ts          # Configuración Vite
    ├── Dockerfile              # Imagen Docker
    ├── index.html              # HTML base
    └── .env.local              # Variables de entorno
```

---

## 🗄️ Esquema de Base de Datos

### Entidades Principales (20+ modelos)

```
┌─────────────────────────────────────────────────────────────┐
│                    GESTIÓN DE USUARIOS                      │
├─────────────────────────────────────────────────────────────┤
│  User (email, contraseña, roleId)
│    ├── Role (nombre, permisos)
│    │   └── Permission (crear, editar, eliminar)
│    └── LoginAudit (fecha, IP, resultado)
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    GESTIÓN DE PRODUCTOS                     │
├─────────────────────────────────────────────────────────────┤
│  Product
│    ├── Category (Herramientas, Electricidad, etc.)
│    ├── Subcategory (Taladros, Cables, etc.)
│    ├── Supplier (proveedores)
│    └── Stock
│        └── StockMovement (entrada, salida, ajuste)
│
│  Promotion (descuentos, ofertas)
│    └── PromotionProduct (relación muchos-a-muchos)
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    GESTIÓN DE VENTAS                        │
├─────────────────────────────────────────────────────────────┤
│  Sale (FAC/REMITO/TICKET/PRESUPUESTO)
│    ├── SaleDetail (productos vendidos)
│    ├── Customer (clientes)
│    └── CustomerAccountEntry (deuda)
│
│  CashBox (cajas registradoras)
│    └── CashMovement (ingresos/egresos)
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    GESTIÓN DE COMPRAS                       │
├─────────────────────────────────────────────────────────────┤
│  Purchase (pedidos a proveedores)
│    ├── PurchaseDetail (productos comprados)
│    ├── Supplier (proveedores)
│    └── SupplierAccountEntry (deuda)
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AUDITORÍA Y LOGS                         │
├─────────────────────────────────────────────────────────────┤
│  AppLog (logs de aplicación)
│  AuditLog (historial de cambios)
│  RefreshToken (sesiones)
│  PasswordResetToken (recuperación de contraseña)
└─────────────────────────────────────────────────────────────┘
```

### Propiedades Estándar de Cada Modelo

```typescript
model Entity {
  id          String    @id @default(cuid())      // UUID único
  createdAt   DateTime  @default(now())           // Fecha de creación
  updatedAt   DateTime  @updatedAt                // Última actualización
  deletedAt   DateTime?                           // Soft delete
  
  // ... campos específicos ...
}
```

---

## 🔐 Autenticación y Autorización

### Flujo de Login

```
Usuario escribe credenciales
    ↓
POST /api/auth/login
    ↓
[AuthService]
  ├─ Buscar usuario por email
  ├─ Validar contraseña (bcrypt)
  ├─ Generar JWT token (1h)
  ├─ Generar Refresh token (7d)
  └─ Registrar auditoría
    ↓
Respuesta con tokens
    ↓
Cliente almacena en localStorage
    ↓
Envía en header Authorization: Bearer <token>
```

### Permisos (Role-Based Access Control)

```
Roles disponibles:
├── ADMIN (todos los permisos)
├── GERENTE (gestión de productos, ventas, reportes)
├── VENDEDOR (crear ventas, ver productos)
├── CAJERO (abrir caja, registrar ventas)
└── DEPOSITO (gestionar stock, recibir compras)

Permisos:
├── users.manage
├── roles.manage
├── products.manage
├── categories.manage
├── sales.manage
├── purchases.manage
├── cash.manage
└── stock.manage
```

### Middleware de Autenticación

```typescript
// Protege endpoints requiriendo JWT válido
authenticate()

// Autoriza basado en permisos
authorize(['products.manage'])
```

---

## 🚀 Módulos Implementados

### ✅ Módulo de Autenticación
- Login/Logout
- Registro de usuarios
- JWT tokens
- Roles y permisos
- Auditoría de login

### ✅ Módulo de Productos
- CRUD completo
- Búsqueda avanzada
- Filtrado por categoría, proveedor, precio, stock
- Múltiples unidades de medida con conversión
- Importación masiva desde CSV
- Generación de etiquetas con códigos de barras
- Gestión de stock

### ⏳ Módulos Pendientes
- Gestión de Ventas (POS)
- Gestión de Compras
- Inventario y Stock
- Caja Registradora
- Promociones y Descuentos
- Reportes y Análisis
- Gestión de Clientes
- Gestión de Proveedores

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js v24.13.0
- **Framework**: Express.js
- **Lenguaje**: TypeScript 5.9.3
- **Base de Datos**: PostgreSQL (con Prisma ORM 5.22.0)
- **Autenticación**: JWT + Bcrypt
- **Validación**: Custom validators
- **Logging**: Winston/Logger custom

### Frontend
- **Framework**: React 19
- **Build**: Vite
- **Lenguaje**: TypeScript 5.9.3
- **UI**: Material UI (MUI)
- **Estado**: React Query (@tanstack/react-query)
- **HTTP Client**: Axios
- **Router**: React Router

### DevOps
- **Containerización**: Docker
- **Orquestación**: Docker Compose
- **OS**: Windows (PowerShell)

---

## 📦 Dependencias Clave

### Backend
```json
{
  "@prisma/client": "^5.22.0",
  "express": "^4.21.2",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.1.2",
  "typescript": "^5.9.3",
  "dotenv": "^16.4.7"
}
```

### Frontend
```json
{
  "react": "^19.0.0-rc.1",
  "react-dom": "^19.0.0-rc.1",
  "@mui/material": "^6.0.0",
  "@tanstack/react-query": "^5.64.0",
  "axios": "^1.7.5",
  "typescript": "^5.9.3"
}
```

---

## 🔄 Flujos de Datos

### Crear Producto

```
Frontend: ProductsPage
    ↓ (click "Nuevo")
ProductFormDialog (recolecta datos)
    ↓ (submit)
productService.createProduct(data)
    ↓ (POST /api/products)
Backend: ProductController.create()
    ↓
validateCreateProduct(data)
    ↓ (si válido)
productService.createProduct(data)
    ↓
Prisma: db.product.create({data})
    ↓
Retorna respuesta JSON
    ↓
Frontend: useCreateProduct() mutation
    ↓
Invalidate React Query cache
    ↓
ProductsPage re-renderiza con nuevo producto
```

### Buscar Productos

```
Usuario escribe en barra de búsqueda
    ↓
onChange → handleSearch(query)
    ↓
useSearchProducts(query) hook
    ↓ (React Query)
GET /api/products/search?q=query
    ↓
ProductController.search()
    ↓
ProductService.searchProducts()
    ↓
Prisma query con WHERE condición
    ↓
Retorna matches
    ↓
Frontend renderiza resultados en tiempo real
```

### Importar Productos desde CSV

```
Usuario descarga plantilla
    ↓ GET /api/labels/import-template
    ↓
Usuario edita CSV localmente
    ↓
Usuario sube archivo (BulkImportDialog)
    ↓
Parsear CSV a array de productos
    ↓
POST /api/products/bulk-import
    ↓
ProductService.bulkImportProducts()
    ↓
Para cada producto:
  ├─ Validar
  ├─ Crear o actualizar
  └─ Guardar errores
    ↓
Retorna { created: 45, updated: 0, errors: [] }
    ↓
Frontend muestra resultados con errores si aplica
```

---

## 📊 Modelos de Datos (SQL)

### Tabla Products

```sql
CREATE TABLE products (
  id STRING PRIMARY KEY,
  internalCode STRING UNIQUE NOT NULL,
  barcode STRING UNIQUE,
  name STRING NOT NULL,
  description STRING,
  brand STRING,
  
  categoryId STRING NOT NULL REFERENCES categories(id),
  subcategoryId STRING NOT NULL REFERENCES subcategories(id),
  supplierId STRING NOT NULL REFERENCES suppliers(id),
  
  cost DECIMAL(10,2) NOT NULL,
  salePrice DECIMAL(10,2) NOT NULL,
  iva INT DEFAULT 21,
  margin INT DEFAULT 0,
  
  stock INT DEFAULT 0,
  minStock INT DEFAULT 0,
  maxStock INT,
  
  unit VARCHAR(20) DEFAULT 'UNIDAD',
  location STRING,
  weight DECIMAL(8,2),
  
  mainImage STRING,
  gallery STRING[],
  
  isActive BOOLEAN DEFAULT true,
  
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP,
  
  INDEXES:
    - categoryId
    - subcategoryId
    - supplierId
    - internalCode
    - barcode
);
```

---

## ⚙️ Configuración de Entorno

### Backend (.env)

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ferreteria?schema=public
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
NODE_ENV=development
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:4000/api
```

---

## 🚢 Despliegue

### Docker Compose

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Servicios

- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:5173
- **PostgreSQL**: localhost:5432 (usuario: postgres)

---

## 🧪 Testing

### Backend

```bash
cd backend

# Ejecutar tests
npm test

# Con cobertura
npm test -- --coverage
```

### Frontend

```bash
cd frontend

# Ejecutar tests
npm test

# Con cobertura
npm test -- --coverage
```

---

## 📚 Recursos Adicionales

### Documentación
- [Documentación de Productos](./DOCUMENTACION_MODULO_PRODUCTOS.md)
- [API Swagger](./backend/src/swagger.json)

### Links Útiles
- [Express.js](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [React Query](https://tanstack.com/query)
- [Material UI](https://mui.com/)
- [PostgreSQL](https://www.postgresql.org/)

---

## 📝 Notas Importantes

1. **Versiones Alineadas**: Prisma CLI (5.22.0) y @prisma/client (5.22.0) deben coincidir
2. **PostgreSQL Requerido**: La aplicación está configurada para PostgreSQL, no soporta SQLite en producción
3. **JWT Secret**: Cambiar JWT_SECRET en producción
4. **CORS**: Configurar headers CORS en producción
5. **Rate Limiting**: Implementar rate limiting antes de producción

---

**Última actualización**: 2024-01-15
**Versión**: 1.0
**Estado**: En desarrollo activo
