# Backend real de KRONO (copia literal)

Esta carpeta es una copia exacta, sin modificar, del backend de
`netcontact-api` (rama `codex-desarrollo`): la lógica real detrás del
Back Office de KRONO (`routes/leads.js`, `routes/ventas.js`,
`routes/usuarios.js`, etc.).

Corre como un servidor completamente aparte de KRATOS, con su propia base
de datos (`krono_local`, distinta de `kratos`), para no mezclar datos ni
tocar la producción real de KRONO (`krono.net.pe`).

## Cómo correrlo

1. Crear la base de datos (una sola vez):
   ```sql
   CREATE DATABASE IF NOT EXISTS krono_local CHARACTER SET utf8mb4;
   ```
2. Copiar `.env.example` a `.env` y completar `JWT_SECRET` y `ADMIN_PASSWORD`
   (con `ADMIN_PASSWORD` puesta, la primera vez que arranca crea el usuario
   `admin` con ese cargo `jefatura`).
3. `npm install`
4. `node server.js` (puerto 3000 por defecto).

## Cómo se conecta con el frontend

El Back Office de KRONO copiado en
`frontend/src/krono-backoffice/pages/Backoffice.jsx` usa rutas relativas
`/api/...` (igual que en KRONO real, donde un proxy del mismo dominio las
lleva al backend). Aquí ese proxy lo hace Vite: ver `proxy` en
`frontend/vite.config.js`, que reenvía `/api` a `http://localhost:3000`
(este servidor) solo en desarrollo.

Para iniciar sesión ahí: `http://localhost:5174/krono-backoffice/login`,
con un usuario que exista en `krono_local` con `cargo = 'backoffice'`.

## Qué se cambió a propósito (todo lo demás es literal)

- `frontend/src/krono-backoffice/pages/Login.jsx`: la constante `API` pasa
  de `/api` (relativa) a `http://localhost:3000/api`, porque esta página
  se abre antes de que exista el proxy de sesión — el resto del archivo
  no se tocó.
- `frontend/src/krono-backoffice/utils/rutas.js`: la ruta del cargo
  `backoffice` pasa de `/backoffice` a `/krono-backoffice`, porque
  `/backoffice` ya es el Back Office propio de KRATOS.

## Qué no funciona igual que en producción

- No hay datos: es una base nueva y vacía, no la de `krono.net.pe`.
- Google Sheets (reclutamiento) está desactivado
  (`GOOGLE_SHEETS_RECLUTAMIENTO_ENABLED=false`).
- Los archivos `logo3.png` y otros assets estáticos de KRONO no se copiaron;
  el logo del login sale roto por eso.
