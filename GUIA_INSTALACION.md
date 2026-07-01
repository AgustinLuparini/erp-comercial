# 🚀 Guía de Instalación y Configuración

## Requisitos Previos

### Software Requerido
- **Node.js**: v24.13.0 o superior
- **npm**: v10.x o superior
- **PostgreSQL**: v12 o superior (puede ser local o en Docker)
- **Docker** (opcional pero recomendado): Para contenedores
- **Git**: Para control de versiones

### Verificar Instalación

```bash
node --version      # v24.13.0
npm --version       # 10.x.x
postgres --version  # postgres (PostgreSQL) 12 o superior
docker --version    # Docker version 20.x (opcional)
```

---

## Instalación Local

### Paso 1: Clonar o Descargar el Repositorio

```bash
cd "c:\progamacion proyectos"
# El proyecto ya debería estar en "aplicacion web para ferreterias"
```

### Paso 2: Instalar Dependencias Backend

```bash
cd "aplicacion web para ferreterias\backend"

# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate
```

**Salida esperada**:
```
added 180 packages in 45s
✔ Generated Prisma Client
```

### Paso 3: Instalar Dependencias Frontend

```bash
cd "..\frontend"

# Instalar dependencias
npm install
```

**Salida esperada**:
```
added 450 packages in 60s
```

---

## Configuración Base de Datos

### Opción A: PostgreSQL Local (Windows)

#### 1. Descargar e Instalar PostgreSQL

1. Ir a [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Descargar PostgreSQL 15 o superior
3. Ejecutar instalador
   - Password de usuario `postgres`: `postgres`
   - Puerto: `5432` (default)
4. Terminar instalación

#### 2. Crear Base de Datos

```bash
# Conectarse a PostgreSQL
psql -U postgres -h localhost

# En la consola psql, ejecutar:
CREATE DATABASE erp_comercial ENCODING 'UTF8';
\q  # Salir
```

#### 3. Verificar Conexión

```bash
# Desde el backend
cd backend
npx prisma db push
```

**Salida esperada**:
```
✔ Your database is now in sync with your Prisma schema.
```

### Opción B: PostgreSQL en Docker Compose

#### 1. Iniciar Contenedor

```bash
cd "aplicacion web para ferreterias"
docker-compose up -d postgres
```

#### 2. Esperar a que esté listo (10-15 segundos)

```bash
docker-compose logs postgres
```

**Indicador**: Verás "database system is ready to accept connections"

---

## Configuración de Variables de Entorno

### Backend (.env)

```bash
cd backend
```

**Crear archivo**: `backend/.env`

```env
# Puerto del servidor
PORT=4000

# Base de datos PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp_comercial?schema=public

# Nombre comercial para comprobantes y documentos
BUSINESS_NAME=ERP Comercial

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=8h
REFRESH_TOKEN_EXPIRES_IN=7d

# Environment
NODE_ENV=development
```

### Frontend (.env.local)

```bash
cd ../frontend
```

**Crear archivo**: `frontend/.env.local`

```env
VITE_API_URL=http://localhost:4000/api
```

---

## Inicializar Base de Datos

### 1. Ejecutar Migraciones

```bash
cd backend

# Opción 1: Usando Prisma (recomendado en desarrollo)
npm run prisma:migrate

# Opción 2: Sincronizar schema (simplemente)
npx prisma db push
```

### 2. Generar Datos de Seed

```bash
npm run seed
```

**Salida esperada**:
```
✔ Seeding database ...
✔ Created 8 permissions
✔ Created 5 roles
✔ Created admin user
✔ Created 3 categories with subcategories
✔ Created 1 supplier
✔ Created 1 customer
✔ Created 1 sample product
✔ Seeding completed successfully
```

### 3. Verificar Base de Datos (Opcional)

```bash
npx prisma studio
```

Esto abrirá una interfaz web en http://localhost:5555 para explorar los datos.

---

## Iniciar la Aplicación

### Terminal 1: Backend

```bash
cd "c:\progamacion proyectos\aplicacion web para ferreterias\backend"

# Modo desarrollo (con recarga automática)
npm run dev
```

**Salida esperada**:
```
Server running on http://localhost:4000
Prisma Client generated
```

### Terminal 2: Frontend

```bash
cd "c:\progamacion proyectos\aplicacion web para ferreterias\frontend"

# Modo desarrollo (con recarga en caliente)
npm run dev
```

**Salida esperada**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## Acceder a la Aplicación

1. **Frontend**: Abrir navegador en http://localhost:5173
2. **Backend API**: http://localhost:4000/api
3. **Documentación Swagger** (si está configurada): http://localhost:4000/swagger

### Credenciales por Defecto

**Usuario**: `admin@erp.local`
**Contraseña**: `admin123`

---

## Compilar para Producción

### Backend

```bash
cd backend

# Compilar TypeScript
npm run build

# Salida generada en ./dist/
```

### Frontend

```bash
cd frontend

# Compilar Vite
npm run build

# Salida generada en ./dist/
```

---

## Docker Compose (Alternativa Completa)

### Estructura del docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: erp_comercial
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/erp_comercial
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:4000/api
    depends_on:
      - backend
```

### Iniciar Todo

```bash
cd "c:\progamacion proyectos\aplicacion web para ferreterias"

# Construir y levantar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## Verificación de Instalación

### Checklist

- [ ] Node.js y npm instalados
- [ ] PostgreSQL accesible
- [ ] Dependencias backend instaladas (`npm install` sin errores)
- [ ] Dependencias frontend instaladas (`npm install` sin errores)
- [ ] Variables de entorno configuradas (`.env` y `.env.local`)
- [ ] Base de datos migrada (`npm run prisma:migrate`)
- [ ] Datos seed cargados (`npm run seed`)
- [ ] Backend compila sin errores (`npm run build`)
- [ ] Frontend compila sin errores (`npm run build`)

### Test de Conectividad

#### 1. Backend Health Check

```bash
curl http://localhost:4000/health
```

**Respuesta esperada**:
```json
{
  "status": "ok"
}
```

#### 2. Login Test

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.local","password":"admin123"}'
```

**Respuesta esperada**:
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "...",
      "email": "admin@erp.local",
      "firstName": "Admin",
      "role": "ADMIN"
    }
  }
}
```

#### 3. Get Products

```bash
curl http://localhost:4000/api/products
```

**Respuesta esperada**: Array de productos

---

## Troubleshooting

### Error: "Cannot find module @prisma/client"

```bash
cd backend
npm install
npm run prisma:generate
```

### Error: "ECONNREFUSED 127.0.0.1:5432"

PostgreSQL no está ejecutándose. Soluciones:

**Windows - PostgreSQL Service**:
```bash
# Verificar servicio
Get-Service postgresql-x64-15

# Iniciar si está detenido
Start-Service postgresql-x64-15
```

**Docker**:
```bash
docker-compose up -d postgres
docker-compose logs postgres
```

### Error: "listen EADDRINUSE :::4000"

Puerto 4000 ya en uso. Soluciones:

```bash
# Encontrar proceso usando puerto 4000
netstat -ano | findstr :4000

# Matar proceso (reemplazar PID)
taskkill /PID <PID> /F

# O usar puerto diferente
set PORT=4001
npm run dev
```

### Error: "VITE_API_URL not defined"

```bash
# Crear .env.local en frontend
cd frontend
echo "VITE_API_URL=http://localhost:4000/api" > .env.local
```

### TypeScript Compilation Errors

```bash
# En backend
cd backend

# Validar tipos
npx tsc --noEmit

# Limpiar y reinstalar
rm -r node_modules package-lock.json
npm install
npm run build
```

---

## Scripts npm Disponibles

### Backend

```bash
npm run dev              # Ejecutar en modo desarrollo
npm run build            # Compilar TypeScript
npm run start            # Ejecutar código compilado
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:seed      # Cargar datos seed
npm run seed             # Alias para prisma:seed
npm run prisma:studio    # Abrir interfaz gráfica de Prisma
npm test                 # Ejecutar tests
npm run lint             # Validar código
```

### Frontend

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Construir para producción
npm run preview          # Preview del build
npm run lint             # Validar código
npm test                 # Ejecutar tests
npm run type-check       # Verificar tipos TypeScript
```

---

## Próximos Pasos

1. **Explorar la Aplicación**
   - Ir a http://localhost:5173
  - Login con admin@erp.local / admin123
   - Navegar al módulo de Productos

2. **Leer Documentación**
   - [DOCUMENTACION_MODULO_PRODUCTOS.md](./DOCUMENTACION_MODULO_PRODUCTOS.md)
   - [ARQUITECTURA_SISTEMA.md](./ARQUITECTURA_SISTEMA.md)

3. **Crear Productos**
   - Ir a Productos → Nuevo Producto
   - O descargar plantilla CSV e importar masivamente

4. **Generar Etiquetas**
   - Seleccionar productos
   - Botón "Imprimir Etiquetas"
   - Descargar como HTML

5. **Integrar Módulos Adicionales**
   - Ventas (POS)
   - Compras
   - Inventario
   - Reportes

---

## Soporte y Ayuda

### Recursos
- **Backend Logs**: Ver en terminal/consola del backend
- **Frontend Console**: F12 → Console en navegador
- **Database**: `npx prisma studio`
- **API Docs**: Swagger en http://localhost:4000/swagger

### Comandos Útiles

```bash
# Ver último commit del git
git log --oneline -1

# Limpiar cache de npm
npm cache clean --force

# Reinstalar todo desde cero
rm -r node_modules package-lock.json
npm install

# Ver variables de entorno
cat .env

# Resetear base de datos (ADVERTENCIA: borra todo)
npx prisma migrate reset
```

---

**Última actualización**: 2024-01-15
**Versión**: 1.0
