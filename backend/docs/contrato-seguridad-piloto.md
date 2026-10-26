# Contrato — cambios de seguridad previos al piloto (para el frontend)

## 1. Cambio de contraseña obligatorio en el primer ingreso

Los usuarios que crea el Administrador (manual o importación desde Excel) entran con una contraseña inicial
conocida (por defecto, su correo). Deben cambiarla antes de usar el sistema. Los usuarios que ya existían y los
que entran con Google no se ven afectados.

**Login** (`POST /api/v1/auth/login/`): la respuesta trae el indicador.
```json
{"access": "...", "refresh": "...",
 "usuario": {"id": 9, "nombres": "...", "rol": "Docente", "estado": "activo",
             "debe_cambiar_password": true}}
```

Mientras `debe_cambiar_password` sea `true`, solo responden:
`GET/PATCH /api/v1/usuarios/me/`, `POST /api/v1/usuarios/me/cambiar-password/`,
`POST /api/v1/auth/logout/` y `POST /api/v1/auth/token/refresh/`.

Cualquier otra ruta responde **403**:
```json
{"error": "Forbidden", "detail": "Debe cambiar su contraseña inicial antes de continuar.",
 "errors": null, "codigo": "cambio_password_requerido"}
```

**Qué hacer en el frontend:** si el login trae `debe_cambiar_password: true` (o una respuesta trae
`codigo: "cambio_password_requerido"`), llevar al usuario a una pantalla de cambio de contraseña:
```
POST /api/v1/usuarios/me/cambiar-password/
{"password_actual": "<la inicial>", "password_nueva": "<mínimo 8 caracteres>"}
```
Al responder 200 ya puede usar el sistema con el mismo token. `GET /api/v1/usuarios/me/` también devuelve
`debe_cambiar_password`.

## 2. Límite de intentos de inicio de sesión

`POST /api/v1/auth/login/` y `POST /api/v1/auth/google/` aceptan 10 intentos por minuto por IP. Al superarlo
responden **429** ("Request was throttled. Expected available in N seconds."). Mostrar un mensaje como
"Demasiados intentos, espere un momento".

## 3. Archivos con URL firmada

Firmas, evidencias, documentos de sustento y documentos de apoyo se abren solo con la URL que entrega la API,
que ahora termina en `?t=<token>` y **vence en 2 horas**. Sin token, o con el token vencido, responde 404.

- Usar siempre la URL tal como viene de la API (no armarla a mano ni quitarle el `?t=`).
- No guardar las URLs (localStorage, borradores): si la pantalla queda abierta mucho tiempo, volver a pedir el
  dato para obtener una URL nueva.
- Las descargas de PDF y Excel no cambian.

## 4. Firma digital

`firma_digital` (en `PATCH /api/v1/usuarios/me/`) solo acepta **PNG o JPG de hasta 2 MB**. Otro formato o un
archivo más grande responde 400 con el motivo en `errors.firma_digital`.
