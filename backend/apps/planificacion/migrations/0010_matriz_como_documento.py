"""
Convierte MatrizOperativa en un documento de guia (nombre, descripcion, archivo).

El cliente descarto la matriz operativa como instrumento que se armaba objetivo
por objetivo (reunion 2026-09-16: "no es facil de usarlo"). En su lugar la
Jefatura RSU sube documentos que los docentes consultan al formular proyectos.

Las filas existentes se eliminan: guardaban facultad, periodo y coordinador, y
no hay forma de convertirlas en un documento con archivo adjunto. Se acordo con
el equipo que no hay datos productivos que preservar.

ObjetivoInstitucional y ActividadSugerida pierden su FK a la matriz pero siguen
vivos: ProyectoRSU.objetivo_institucional los referencia.
"""
import django.core.validators
from django.db import migrations, models

import apps.planificacion.models


def borrar_matrices_antiguas(apps, schema_editor):
    MatrizOperativa = apps.get_model('planificacion', 'MatrizOperativa')
    MatrizOperativa.objects.all().delete()


def revertir(apps, schema_editor):
    """No se restauran: los datos originales ya no existen."""


class Migration(migrations.Migration):

    dependencies = [
        ('planificacion', '0009_fix_ods_icono_url'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='objetivoinstitucional',
            name='matriz',
        ),
        migrations.RemoveField(
            model_name='actividadsugerida',
            name='matriz',
        ),
        migrations.RunPython(borrar_matrices_antiguas, revertir),
        migrations.RemoveField(model_name='matrizoperativa', name='periodo'),
        migrations.RemoveField(model_name='matrizoperativa', name='facultad'),
        migrations.RemoveField(model_name='matrizoperativa', name='coordinador'),
        migrations.RemoveField(model_name='matrizoperativa', name='presupuesto_global'),
        migrations.RemoveField(model_name='matrizoperativa', name='estado'),
        migrations.RemoveField(model_name='matrizoperativa', name='observaciones'),
        migrations.AddField(
            model_name='matrizoperativa',
            name='nombre',
            field=models.CharField(
                default='', help_text='Nombre del documento', max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='matrizoperativa',
            name='descripcion',
            field=models.TextField(
                blank=True, default='',
                help_text='Breve descripcion de lo que abarca'),
        ),
        migrations.AddField(
            model_name='matrizoperativa',
            name='archivo',
            field=models.FileField(
                default='', upload_to='planificacion/matriz/',
                validators=[
                    django.core.validators.FileExtensionValidator(
                        allowed_extensions=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']),
                    apps.planificacion.models.validate_documento_size,
                ]),
            preserve_default=False,
        ),
        migrations.AlterModelOptions(
            name='matrizoperativa',
            options={
                'ordering': ['-created_at'],
                'verbose_name': 'Matriz Operativa',
                'verbose_name_plural': 'Matrices Operativas',
            },
        ),
    ]
