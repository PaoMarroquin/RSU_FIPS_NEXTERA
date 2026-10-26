"""
Manejador de excepciones de la API: da un formato unico a todos los errores.

Sin esto, DRF responde con formas distintas segun el tipo de error (un dict
con "detail", un dict de errores por campo, o una lista). El frontend
tendria que contemplar los tres casos. Aqui se normaliza todo a:

    {
      "error":  "Bad Request",              nombre legible del codigo HTTP
      "detail": "mensaje principal",        que salio mal, en una frase
      "errors": {"campo": ["motivo"]}       detalle por campo, o null
    }

Se activa desde REST_FRAMEWORK['EXCEPTION_HANDLER'] en config/settings.py y
aplica a todas las vistas de la API sin que estas tengan que hacer nada.

Conecta con:
- config/settings.py: donde se registra como EXCEPTION_HANDLER.
- Todas las vistas de apps/: consumen este formato al lanzar
  ValidationError, PermissionDenied o Http404.
"""
from rest_framework.views import exception_handler

_STATUS_NAMES = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
}


def _primer_mensaje(valor):
    """Primer texto dentro de un error de DRF (dict o lista anidados), o None."""
    if isinstance(valor, dict):
        valores = valor.values()
    elif isinstance(valor, (list, tuple)):
        valores = valor
    else:
        return str(valor) if valor not in (None, '') else None
    for item in valores:
        mensaje = _primer_mensaje(item)
        if mensaje:
            return mensaje
    return None


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    error_name = _STATUS_NAMES.get(response.status_code, 'Error')

    # "detail" siempre es una frase legible: si el error no la trae (errores
    # por campo o ValidationError('texto')), se usa el primer mensaje que haya,
    # en vez de la representación del dict.
    if isinstance(data, dict):
        inner_errors = data.get('errors')
        field_errors = {k: v for k, v in data.items() if k not in ('detail', 'error', 'errors')}
        errors = inner_errors if inner_errors is not None else (field_errors or None)
        detail = _primer_mensaje(data.get('detail')) or _primer_mensaje(errors) or str(exc)
    elif isinstance(data, list):
        detail = _primer_mensaje(data) or 'Errores de validación.'
        errors = {'non_field_errors': data}
    else:
        detail = str(data)
        errors = None

    response.data = {
        'error': error_name,
        'detail': detail,
        'errors': errors,
    }
    # Código estable para que el frontend reconozca el caso sin depender del texto.
    if getattr(exc, 'default_code', None) == 'cambio_password_requerido':
        response.data['codigo'] = 'cambio_password_requerido'
    return response
