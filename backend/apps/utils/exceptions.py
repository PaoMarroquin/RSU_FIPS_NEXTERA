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


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    error_name = _STATUS_NAMES.get(response.status_code, 'Error')

    if isinstance(data, dict):
        detail = data.get('detail', str(exc))
        inner_errors = data.get('errors')
        field_errors = {k: v for k, v in data.items() if k not in ('detail', 'error', 'errors')}
        errors = inner_errors if inner_errors is not None else (field_errors or None)
    elif isinstance(data, list):
        detail = 'Errores de validación.'
        errors = {'non_field_errors': data}
    else:
        detail = str(data)
        errors = None

    response.data = {
        'error': error_name,
        'detail': detail,
        'errors': errors,
    }
    return response
