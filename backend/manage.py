#!/usr/bin/env python
"""
Utilidad de linea de comandos de Django para el backend RSU.

Punto de entrada de todas las tareas administrativas del proyecto:
runserver, makemigrations, migrate, createsuperuser, test y los comandos
propios (seed_rsu, seed_proyectos).

Uso habitual:
    python manage.py migrate
    python manage.py runserver
    python manage.py seed_rsu

Conecta con:
- config/settings.py: modulo de configuracion que se activa via
  DJANGO_SETTINGS_MODULE.
- apps/*/management/commands/: comandos personalizados que expone.
"""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
