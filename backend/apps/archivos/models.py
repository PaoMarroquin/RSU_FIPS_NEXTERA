"""
Archivos subidos guardados dentro de la base de datos.

Se usa solo con MEDIA_EN_BD=True, en servidores cuyo disco se borra al reiniciarse (Render gratis).
En la OTI los archivos siguen en el volumen media.

Conecta con:
- apps/utils/almacenamiento.py: MediaBDStorage guarda y lee estas filas.
"""
from django.db import models


class ArchivoMedia(models.Model):
    nombre = models.CharField(max_length=255, unique=True)
    contenido = models.BinaryField()
    tamano = models.PositiveIntegerField()
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'archivos_media'
        verbose_name = 'Archivo guardado en la base de datos'
        verbose_name_plural = 'Archivos guardados en la base de datos'

    def __str__(self):
        return self.nombre
