# Despliegue de KRATOS en el servidor

Guía para publicar KRATOS en el servidor **PRIZMA Producción** (`200.234.235.164`, Ubuntu 24.04, 2 vCores, 8 GB de RAM, 20 GB de disco) **sin tocar PRIZMA**: KRATOS usa su propia carpeta, su propio puerto, su propia base de datos y su propio sitio de Nginx.

Todos los comandos se ejecutan **en el servidor**, conectado por SSH.

## Antes de empezar

1. **Sube el código a GitHub** (desde tu computadora, en la carpeta del proyecto):
   ```bash
   git push origin HEAD:main
   ```
2. **Respalda el servidor** (o saca un snapshot desde el panel del proveedor). Es producción de otro proyecto: conviene poder volver atrás.
3. **Mira qué hay en el servidor** para no chocar con PRIZMA:
   ```bash
   ss -ltnp            # puertos en uso: KRATOS necesita 4100 (interno) y 8081 (público); si alguno está ocupado, usa otro
   df -h /             # espacio libre (el disco es de solo 20 GB)
   node -v; nginx -v; mysql --version; pm2 -v
   ```

## 1. Programas necesarios (solo los que falten)

```bash
sudo apt update
sudo apt install -y nginx git mysql-server      # omite los que ya estén instalados
# Node.js 20 o superior (si "node -v" no lo tiene):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Base de datos propia

No uses `root` ni toques las bases de PRIZMA. Entra a MySQL (`sudo mysql`) y crea una base y un usuario solo para KRATOS:

```sql
CREATE DATABASE kratos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kratos_app'@'localhost' IDENTIFIED BY 'UNA_CLAVE_LARGA_Y_UNICA';
GRANT ALL PRIVILEGES ON kratos.* TO 'kratos_app'@'localhost';
FLUSH PRIVILEGES;
```

## 3. Código y configuración

```bash
sudo mkdir -p /var/www/kratos && sudo chown $USER:$USER /var/www/kratos
git clone https://github.com/Joseluiiizzz09/KRATOS-DESARRALLO.git /var/www/kratos
cd /var/www/kratos
cp deploy/.env.production.example backend/.env
nano backend/.env        # completar claves, DB_PASSWORD, JWT_SECRET (openssl rand -hex 48) y ADMIN_PASSWORD
```

## 4. Compilar y arrancar

```bash
bash /var/www/kratos/deploy/desplegar.sh main
```

La primera vez el servidor crea todas las tablas y el usuario **`admin`** (Jefatura) con la clave `ADMIN_PASSWORD`. Para que arranque solo al reiniciar el servidor:

```bash
pm2 startup        # ejecuta el comando que te muestre
pm2 save
```

> **No ejecutes `npm run seed` en producción.** Ese comando crea usuarios de ejemplo (`demo`, `supervisor`, `backoffice`) con claves conocidas y solo es para desarrollo.

## 5. Nginx

```bash
sudo cp /var/www/kratos/deploy/nginx-kratos.conf /etc/nginx/sites-available/kratos
sudo ln -s /etc/nginx/sites-available/kratos /etc/nginx/sites-enabled/kratos
sudo nginx -t && sudo systemctl reload nginx
sudo ufw allow 8081/tcp        # solo si usas el firewall UFW
```

Abre **http://200.234.235.164:8081** e ingresa con `admin` y tu `ADMIN_PASSWORD`.

El backend (puerto 4100) queda solo interno: **no abras el 4100 en el firewall**.

### Con dominio y HTTPS (recomendado)

Cuando tengas un dominio apuntando al servidor, en `/etc/nginx/sites-available/kratos` cambia `listen 8081;` por `listen 80;` y `server_name _;` por `server_name tu-dominio.com;`. Luego:

```bash
sudo certbot --nginx -d tu-dominio.com
```

Y actualiza `FRONTEND_URL` en `backend/.env` con `https://tu-dominio.com`, y reinicia con `pm2 reload kratos-api --update-env`.

## 6. Primeros pasos dentro de KRATOS

1. Entra como `admin` → **Usuarios** y crea las cuentas reales de asesores, supervisores, Back Office y Seguimiento (con su sala).
2. Cambia la clave de `admin` si usaste una provisional.

## Actualizar a una versión nueva

```bash
bash /var/www/kratos/deploy/desplegar.sh main
```

## Revisar que todo funciona

```bash
pm2 status kratos-api          # debe decir "online"
pm2 logs kratos-api --lines 50 # ver errores del servidor
curl -i http://127.0.0.1:4100/api/login   # 404 = el backend responde (solo acepta POST)
```

## Volver atrás

```bash
cd /var/www/kratos && git log --oneline -5      # elegir una versión anterior
git checkout <commit> && bash deploy/desplegar.sh <rama>
```

Para quitar KRATOS del servidor sin afectar a PRIZMA: `pm2 delete kratos-api`, borrar el sitio de Nginx (`/etc/nginx/sites-enabled/kratos`) y la carpeta `/var/www/kratos`.

## Cosas a tener en cuenta

- **Disco de 20 GB:** las fotos y audios de las ventas se guardan en `backend/uploads`. Revisa el espacio de vez en cuando (`df -h /`).
- **Respaldos:** programa un respaldo diario de la base: `mysqldump kratos > respaldo.sql` (con el usuario `kratos_app`).
- **Recursos compartidos:** el servidor ya atiende a PRIZMA; KRATOS usa un solo proceso de Node (limitado a 500 MB) para no competir por memoria.
