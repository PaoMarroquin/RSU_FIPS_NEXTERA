"""
Copia los archivos subidos (disco o tabla archivos_media) al bucket de Supabase.

Uso:
    python migrate_supabase.py --dry-run     # solo muestra qué haría
    python migrate_supabase.py               # sube lo que falte
    python migrate_supabase.py --overwrite   # re-sube aunque ya exista
    python migrate_supabase.py --fuente disco|bd|auto

No depende de MEDIA_BACKEND: usa directamente las variables SUPABASE_* del .env.
Se puede correr varias veces (solo sube lo que falte).
"""
import argparse
import mimetypes
import os
import sys
from pathlib import Path

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import boto3  # noqa: E402
from botocore.client import Config  # noqa: E402
from botocore.exceptions import ClientError  # noqa: E402
from decouple import config  # noqa: E402
from django.apps import apps  # noqa: E402
from django.conf import settings  # noqa: E402
from django.db import models  # noqa: E402


def cliente_s3():
    return boto3.client(
        's3',
        endpoint_url=config('SUPABASE_S3_ENDPOINT'),
        region_name=config('SUPABASE_S3_REGION'),
        aws_access_key_id=config('SUPABASE_S3_KEY_ID'),
        aws_secret_access_key=config('SUPABASE_S3_SECRET'),
        config=Config(signature_version='s3v4', s3={'addressing_style': 'path'}),
    )


def campos_archivo():
    """Todos los FileField/ImageField de modelos reales (sin proxies)."""
    for modelo in apps.get_models():
        if modelo._meta.proxy:
            continue
        for campo in modelo._meta.concrete_fields:
            if isinstance(campo, models.FileField):
                yield modelo, campo


def nombres_en_bd(modelo, campo):
    qs = (modelo._default_manager
          .exclude(**{campo.name: ''})
          .exclude(**{f'{campo.name}__isnull': True}))
    return qs.values_list(campo.name, flat=True).iterator()


def leer_origen(nombre, fuente, raiz):
    if fuente in ('auto', 'disco'):
        ruta = (raiz / nombre).resolve()
        if raiz in ruta.parents and ruta.is_file():
            return ruta.read_bytes()
    if fuente in ('auto', 'bd'):
        try:
            from apps.archivos.models import ArchivoMedia
        except ImportError:
            return None
        archivo = ArchivoMedia.objects.filter(nombre=nombre).first()
        if archivo is not None:
            return bytes(archivo.contenido)
    return None


def tamano_destino(s3, bucket, key):
    try:
        return s3.head_object(Bucket=bucket, Key=key)['ContentLength']
    except ClientError as e:
        if e.response['Error']['Code'] in ('404', 'NoSuchKey', 'NotFound'):
            return None
        raise


def main():
    ap = argparse.ArgumentParser(description='Migra archivos subidos a Supabase Storage.')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--overwrite', action='store_true')
    ap.add_argument('--fuente', choices=['auto', 'disco', 'bd'], default='auto')
    args = ap.parse_args()

    bucket = config('SUPABASE_BUCKET')
    s3 = cliente_s3()
    raiz = Path(settings.MEDIA_ROOT).resolve()
    print(f'Origen disco: {raiz}\nDestino: bucket "{bucket}"'
          f'{"  [DRY-RUN]" if args.dry_run else ""}\n')

    vistos = set()
    subidos = omitidos = faltantes = errores = 0

    for modelo, campo in campos_archivo():
        etiqueta = f'{modelo._meta.label}.{campo.name}'
        for nombre in nombres_en_bd(modelo, campo):
            key = nombre.replace('\\', '/').lstrip('/')
            if key in vistos:
                continue
            vistos.add(key)

            datos = leer_origen(key, args.fuente, raiz)
            if datos is None:
                print(f'[FALTA]   {etiqueta}: {key}')
                faltantes += 1
                continue

            try:
                if not args.overwrite and tamano_destino(s3, bucket, key) == len(datos):
                    omitidos += 1
                    continue
                if args.dry_run:
                    print(f'[SUBIRIA] {etiqueta}: {key} ({len(datos)} bytes)')
                    subidos += 1
                    continue
                tipo = mimetypes.guess_type(key)[0] or 'application/octet-stream'
                s3.put_object(Bucket=bucket, Key=key, Body=datos, ContentType=tipo)
                if tamano_destino(s3, bucket, key) != len(datos):
                    raise RuntimeError('el tamaño en destino no coincide')
                print(f'[OK]      {etiqueta}: {key}')
                subidos += 1
            except Exception as e:  # noqa: BLE001
                print(f'[ERROR]   {etiqueta}: {key} -> {e}')
                errores += 1

    print(f'\nSubidos: {subidos} | Ya estaban: {omitidos} | '
          f'No encontrados: {faltantes} | Errores: {errores}')
    sys.exit(1 if (faltantes or errores) else 0)


if __name__ == '__main__':
    main()