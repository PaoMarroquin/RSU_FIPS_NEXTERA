# Guía de despliegue y restauración — RSU FIPS (servidor OTI)

## Arquitectura

| Servicio | Imagen | Puertos | Función |
|---|---|---|---|
| `nginx` | `deploy/nginx/Dockerfile` (frontend compilado + Nginx) | **80 y 443 públicos** | HTTPS, frontend, `/api` al backend, archivos estáticos y subidos |
| `backend` | `backend/Dockerfile` (Python 3.11, Django 5.2 LTS, Gunicorn) | 8000 solo red interna | API REST, admin, PDF/Excel |
| `db` | `postgres:15` | 5432 solo red interna | Base de datos |

Volúmenes: `postgres_data` (base de datos), `media` (evidencias, documentos, firmas) y `static` (estáticos del admin).

## Requisitos del servidor

Ubuntu Server 24.04 LTS (o la LTS de la OTI) con Docker Engine y Docker Compose v2. 2 núcleos, 8 GB de RAM y 50 GB SSD.

## Primer despliegue

```bash
git clone <repositorio> rsu-fips && cd rsu-fips/deploy
cp .env.example .env          # completar dominio, claves y GOOGLE_CLIENT_ID
mkdir certs                   # copiar el certificado de la OTI:
#   certs/certificado.crt  (certificado + cadena intermedia)
#   certs/certificado.key  (clave privada)
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml --env-file .env exec backend python manage.py createsuperuser
```

El backend aplica las migraciones y `collectstatic` en cada arranque.

Generar `DJANGO_SECRET_KEY`: `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`.

## Restricción del admin y la documentación

`/admin/`, `/api/v1/docs/`, `/api/v1/redoc/` y `/api/v1/schema/` solo responden a las redes de
`deploy/nginx/red-institucional.conf`. **La OTI debe reemplazar los rangos de ejemplo** por los de la red
institucional y la VPN, y reconstruir `nginx` (`up -d --build nginx`).

## Actualizar a una nueva versión

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Respaldos

`scripts/respaldo.sh` guarda la base de datos (`pg_dump`) y los archivos subidos en `RESPALDO_DIR`
(almacenamiento distinto al disco principal). Retención: 7 diarios y 4 semanales (domingos).

```bash
# cron del usuario de despliegue: todos los días a las 2:00
0 2 * * * cd /ruta/rsu-fips/deploy && RESPALDO_DIR=/mnt/respaldos ./scripts/respaldo.sh >> respaldo.log 2>&1
```

## Restauración

```bash
cd /ruta/rsu-fips/deploy
./scripts/restaurar.sh /mnt/respaldos/diario/bd_AAAAMMDD.sql.gz /mnt/respaldos/diario/media_AAAAMMDD.tar.gz
```

El script verifica primero que ambos respaldos estén sanos, pide escribir `RESTAURAR`, reemplaza la base de
datos y los archivos, y vuelve a levantar el backend. Probar la restauración al inicio del piloto y al menos una
vez por semestre (en un servidor de prueba o fuera del horario de uso).

## Seguridad aplicada

- Solo Nginx expone puertos; PostgreSQL y el backend quedan en la red interna de Docker.
- HTTPS obligatorio (HTTP redirige), HSTS y cabeceras de seguridad. `DEBUG` apagado.
- Archivos subidos solo con URL firmada y con vencimiento (2 horas por defecto, `MEDIA_URL_EXPIRACION_SEGUNDOS`).
  Nginx los entrega desde una ubicación interna después de que el backend valida la URL.
- Límite de intentos de inicio de sesión por IP (`LOGIN_THROTTLE_RATE`, 10 por minuto por defecto).
- Los usuarios creados por el Administrador deben cambiar su contraseña inicial en el primer ingreso.
- Inicio de sesión con Google solo para correos `@unsa.edu.pe`.

## Comandos útiles

```bash
C="docker compose -f docker-compose.prod.yml --env-file .env"
$C ps                      # estado
$C logs -f backend         # registros del backend
$C restart backend         # reiniciar el backend
```
