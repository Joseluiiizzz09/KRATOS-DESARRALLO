# Backend de KRATOS

Un solo servidor (Node + Express + MySQL) para todos los módulos: Asesor, Supervisor, Back Office,
Seguimiento y Jefatura. Una sola base de datos (`kratos`), un solo login y una sola sesión.

## Puesta en marcha

1. Crea la base de datos vacía:  `CREATE DATABASE kratos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. Copia `.env.example` a `.env` y completa los datos (`DB_*`, `JWT_SECRET`, `ADMIN_PASSWORD`).
3. `npm install`
4. `npm run dev` (la primera vez crea las tablas y el usuario `admin` de Jefatura).
5. Con el servidor ya iniciado una vez, en otra terminal: `npm run seed` carga usuarios y contactos de ejemplo.

## Usuarios de ejemplo (solo desarrollo)

| Usuario | Clave | Cargo |
|---|---|---|
| `admin` | `ADMIN_PASSWORD` del `.env` | Jefatura |
| `demo` | `demo1234` | Asesor |
| `supervisor` | `super1234` | Supervisor |
| `backoffice` | `back1234` | Back Office (+ Seguimiento) |

## Rutas

- `/api/login`, `/api/usuarios`, `/api/leads`, `/api/ventas`, … — Back Office, Seguimiento y Jefatura.
- `/api/kr/*` — módulos Asesor y Supervisor (`routes/kratos.js`). Leen y escriben las mismas tablas
  (`usuarios`, `leads`, `ventas`), por eso un número asignado en Back Office aparece al instante en
  la base de llamadas del asesor, y una venta del asesor entra directo a Seguimiento.
- El supervisor ve a los asesores y ventas de **su sala**; Jefatura ve todas.
- Jefatura puede entrar a cualquier módulo "como" otro usuario (encabezados `X-NC-View-User` / `X-NC-View-Area`).
