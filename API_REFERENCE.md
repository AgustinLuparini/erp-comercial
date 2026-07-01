# API Reference - Referencia Rápida de Endpoints

## 📡 Base URL

```
http://localhost:4000/api
```

## 🔐 Autenticación

Todos los endpoints requieren token JWT en el header:

```
Authorization: Bearer <access_token>
```

Algunos endpoints pueden ser públicos (especificado con "⚠️ No requiere autenticación")

---

## 👤 Autenticación

### Login
```
POST /auth/login
Body: {
  "email": "admin@erp.local",
  "password": "admin123"
}
Response: {
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### Register
```
POST /auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Refresh Token
```
POST /auth/refresh
Body: {
  "refreshToken": "..."
}
```

### Logout
```
POST /auth/logout
```

---

## 📦 Productos

### Crear Producto
```
POST /products
✋ Requiere: products.manage
Body: {
  "internalCode": "P001",
  "barcode": "7790000000017",
  "name": "Taladro eléctrico",
  "cost": 120000,
  "salePrice": 185000,
  "categoryId": "uuid",
  "subcategoryId": "uuid",
  "supplierId": "uuid",
  "unit": "UNIDAD",
  "stock": 10,
  "minStock": 5,
  "maxStock": 50,
  "iva": 21,
  "margin": 35,
  "isActive": true
}
Status: 201
```

### Obtener Todos los Productos
```
GET /products?page=1&limit=10&search=taladro&sortBy=name&sortOrder=asc
Parámetros:
  page: 1..n (default: 1)
  limit: 1..100 (default: 10)
  search: string (búsqueda en nombre/código)
  categoryId: uuid
  subcategoryId: uuid
  supplierId: uuid
  minPrice: number
  maxPrice: number
  minStock: number
  unit: UNIDAD|METRO|KILO|LITRO|CAJA
  isActive: true|false
  sortBy: name|price|stock|createdAt
  sortOrder: asc|desc
Status: 200
```

### Obtener Producto por ID
```
GET /products/:id
Status: 200
```

### Actualizar Producto
```
PUT /products/:id
✋ Requiere: products.manage
Body: { ... (campos opcionales) }
Status: 200
```

### Eliminar Producto
```
DELETE /products/:id
✋ Requiere: products.manage
Status: 200
Nota: Soft delete (no borra, marca como deletedAt)
```

### Buscar Productos
```
GET /products/search?q=taladro&limit=10
⚠️ No requiere autenticación
Status: 200
```

### Obtener por Código de Barras
```
GET /products/barcode/:barcode
⚠️ No requiere autenticación
Status: 200
Nota: Útil para lectores de códigos de barras
```

### Obtener por Código Interno
```
GET /products/code/:internalCode
Status: 200
```

### Convertir Unidades
```
POST /products/convert-units
Body: {
  "fromUnit": "METRO",
  "toUnit": "CAJA",
  "quantity": 50
}
Response: {
  "original": 50,
  "converted": 5,
  "fromUnit": "METRO",
  "toUnit": "CAJA"
}
Status: 200
```

### Importación Masiva
```
POST /products/bulk-import
✋ Requiere: products.manage
Body: {
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
    },
    ...
  ],
  "updateExisting": false
}
Response: {
  "created": 45,
  "updated": 0,
  "errors": []
}
Status: 200
```

### Obtener Niveles de Stock
```
GET /products/stock/levels?supplierId=uuid
Response: {
  "BAJO": [...],
  "NORMAL": [...],
  "ALTO": [...]
}
Status: 200
```

---

## 🏷️ Etiquetas

### Generar Etiquetas (HTML)
```
POST /labels/generate-html
✋ Requiere: products.manage
Body: {
  "productIds": ["uuid1", "uuid2"],
  "quantity": 1
}
Response: HTML file download
Headers: Content-Type: text/html; charset=utf-8
Status: 200
```

### Generar Etiquetas (PDF)
```
POST /labels/generate-pdf
✋ Requiere: products.manage
Body: {
  "productIds": ["uuid1", "uuid2"],
  "format": "A4"
}
Status: 400 (requiere dependencias adicionales)
```

### Descargar Plantilla CSV
```
GET /labels/import-template
⚠️ No requiere autenticación
Response: CSV file download
Headers: Content-Type: text/csv; charset=utf-8
Status: 200
```

### Importar Productos
```
POST /labels/import
✋ Requiere: products.manage
Content-Type: multipart/form-data
Body: {
  "file": <archivo.csv>,
  "updateExisting": false
}
Status: 200
Nota: Requiere Multer configurado
```

---

## 👥 Usuarios

### Crear Usuario
```
POST /users
✋ Requiere: users.manage
Body: {
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "roleId": "uuid"
}
Status: 201
```

### Obtener Todos los Usuarios
```
GET /users?page=1&limit=10
✋ Requiere: users.manage
Status: 200
```

### Obtener Usuario por ID
```
GET /users/:id
Status: 200
```

### Actualizar Usuario
```
PUT /users/:id
✋ Requiere: users.manage
Body: { ... (campos opcionales) }
Status: 200
```

### Eliminar Usuario
```
DELETE /users/:id
✋ Requiere: users.manage
Status: 200
```

---

## 🔑 Roles y Permisos

### Crear Rol
```
POST /roles
✋ Requiere: roles.manage
Body: {
  "name": "VENDEDOR",
  "permissions": ["products.view", "sales.create"]
}
Status: 201
```

### Obtener Todos los Roles
```
GET /roles
Status: 200
```

### Actualizar Rol
```
PUT /roles/:id
✋ Requiere: roles.manage
Body: { ... }
Status: 200
```

### Eliminar Rol
```
DELETE /roles/:id
✋ Requiere: roles.manage
Status: 200
```

---

## Códigos de Respuesta HTTP

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 200 | OK | Consulta exitosa |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Datos inválidos |
| 401 | Unauthorized | Token faltante o inválido |
| 403 | Forbidden | Permiso insuficiente |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Duplicado (ej: código duplicado) |
| 500 | Server Error | Error del servidor |

---

## Estructura de Respuesta

### Respuesta Exitosa
```json
{
  "status": "success",
  "message": "Operación completada",
  "data": { ... }
}
```

### Respuesta con Error
```json
{
  "status": "error",
  "message": "Descripción del error",
  "errors": [
    { "field": "email", "message": "Email inválido" }
  ]
}
```

---

## Unidades de Medida Soportadas

```
UNIDAD    = Piezas
METRO     = Metros
KILO      = Kilogramos
LITRO     = Litros
CAJA      = Cajas
```

---

## Enums Disponibles

### Sale Type
```
FAC          = Factura
REMITO       = Remito
TICKET       = Ticket
PRESUPUESTO  = Presupuesto
```

### Payment Method
```
CASH         = Efectivo
TRANSFER     = Transferencia
QR           = QR Code
DEBIT        = Débito
CREDIT       = Crédito
ACCOUNT      = Cuenta
```

### Stock Movement Type
```
INCOMING     = Entrada
OUTGOING     = Salida
ADJUSTMENT   = Ajuste
TRANSFER     = Transferencia
```

---

## Ejemplos con cURL

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.local","password":"admin123"}'
```

### Crear Producto
```bash
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "internalCode": "P001",
    "name": "Taladro",
    "cost": 100,
    "salePrice": 150,
    "categoryId": "uuid",
    "subcategoryId": "uuid",
    "supplierId": "uuid",
    "unit": "UNIDAD"
  }'
```

### Buscar Productos
```bash
curl "http://localhost:4000/api/products/search?q=taladro&limit=10"
```

### Obtener por Código de Barras
```bash
curl "http://localhost:4000/api/products/barcode/7790000000017"
```

### Descargar Plantilla
```bash
curl -O "http://localhost:4000/api/labels/import-template"
```

---

## Ejemplos con JavaScript/Axios

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:4000/api'
});

// Login
const loginResponse = await API.post('/auth/login', {
  email: 'admin@erp.local',
  password: 'admin123'
});

const token = loginResponse.data.data.accessToken;

// Configurar header para siguientes requests
API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Crear producto
const newProduct = await API.post('/products', {
  internalCode: 'P001',
  name: 'Taladro eléctrico',
  cost: 120000,
  salePrice: 185000,
  categoryId: 'uuid',
  subcategoryId: 'uuid',
  supplierId: 'uuid',
  unit: 'UNIDAD'
});

console.log(newProduct.data);

// Obtener productos con filtros
const products = await API.get('/products', {
  params: {
    page: 1,
    limit: 10,
    search: 'taladro',
    sortBy: 'price',
    sortOrder: 'asc'
  }
});

// Búsqueda rápida
const searchResults = await API.get('/products/search', {
  params: { q: 'taladro', limit: 10 }
});

// Obtener por código de barras
const product = await API.get('/products/barcode/7790000000017');

// Generar etiquetas HTML
const labels = await API.post('/labels/generate-html', {
  productIds: ['uuid1', 'uuid2'],
  quantity: 1
}, {
  responseType: 'blob'
});

// Descargar archivo
const url = window.URL.createObjectURL(new Blob([labels.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', 'etiquetas.html');
link.click();
```

---

## Rate Limiting (Futuro)

```
No implementado aún
Será añadido en producción: máx 1000 requests/minuto por IP
```

---

## CORS Configuration

```javascript
// Actualmente permite localhost:5173
// En producción, configurar:
CORS_ORIGIN=https://erp.example.com
```

---

**Última actualización**: 2024-01-15
**Versión**: 1.0
**Estado**: Productos módulo completo, otros en desarrollo
