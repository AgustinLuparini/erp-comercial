# ERP Comercial MultiRubro

Sistema integral de gestion comercial para distintos rubros, basado en arquitectura React + Vite (frontend) y Node.js + Express + Prisma (backend).

## Objetivo del sistema

Gestionar ventas, compras, stock y caja con una base adaptable para diferentes tipos de negocio.

## Requisitos previos

1. Node.js 20 LTS o superior.
2. npm 10 o superior.
3. Docker Desktop (con docker compose habilitado).
4. Git (opcional, recomendado).
5. Windows 10/11, Linux o macOS.

Verificacion rapida:

```bash
node -v
npm -v
docker -v
docker compose version
```

## Estructura del proyecto

1. backend/: API REST, Prisma, servicios de negocio, autenticacion y reportes.
2. frontend/: app React para operacion comercial en mostrador y gestion.
3. docker-compose.yml: base de datos y servicios auxiliares en local.

## Instalacion local paso a paso

### 1) Clonar o copiar proyecto

```bash
git clone <repo>
cd dietetica-almacen-natural
```

### 2) Variables de entorno

1. Crear backend/.env con la cadena DATABASE_URL y secretos JWT.
2. Crear frontend/.env con VITE_API_URL apuntando al backend local.

### 3) Levantar dependencias de infraestructura

```bash
docker-compose up -d
```

### 4) Instalar dependencias de Node

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 5) Migraciones de base de datos

Desde backend:

```bash
npx prisma migrate dev
npx prisma generate
```

### 6) Datos iniciales

```bash
npm run prisma:seed
```

### 7) Ejecutar backend y frontend

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Accesos:

1. Frontend: http://localhost:5173
2. Backend API: http://localhost:4000/api

## Puesta en produccion local para comercio

Para que el sistema quede operativo todos los dias en la PC del local:

1. Configurar arranque automatico de Docker Desktop.
2. Crear tareas de inicio para backend y frontend.
3. Usar una URL fija en red local si se comparte con caja o deposito.

### Script de arranque en Windows (.bat)

Crear archivo iniciar-sistema-dietetica.bat con:

```bat
@echo off
cd /d C:\progamacion proyectos\aplicacion web para ferreterias\dietetica-almacen-natural

start "Docker" cmd /k "docker-compose up -d"
start "Backend" cmd /k "cd /d backend && npm run dev"
start "Frontend" cmd /k "cd /d frontend && npm run dev"
```

Opcional: agregar acceso directo en Inicio de Windows para abrir al encender la PC.

## Consejos de optimizacion para local comercial

1. Usar SSD para mejorar tiempos de arranque y carga de reportes.
2. Programar backup diario de la base de datos (madrugada).
3. Mantener una UPS para evitar cortes bruscos durante ventas.
4. Definir perfiles de usuario (caja, gerencia, deposito) con permisos separados.
5. Revisar alertas de stock minimo y vencimiento al abrir el turno.
6. Reservar una impresora termica para tickets y otra para reportes A4.

## Checklist de operacion diaria

1. Verificar que Docker este activo.
2. Confirmar backend y frontend en ejecucion.
3. Abrir caja al inicio del turno.
4. Controlar alertas de stock/vencimientos.
5. Cierre de caja y backup al finalizar jornada.

## Comandos utiles

Backend:

```bash
npm run dev
npm run build
npm run prisma:seed
```

Frontend:

```bash
npm run dev
npm run build
```

## Notas tecnicas

1. El modelo de producto contempla productos a granel, unidad de medida y fecha de vencimiento.
2. El modulo de stock expone alertas por minimo y proximidad de vencimiento.
3. La arquitectura mantiene separacion por capas para facilitar mantenimiento y escalado.
