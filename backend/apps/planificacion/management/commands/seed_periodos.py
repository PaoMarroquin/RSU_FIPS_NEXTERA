"""
Carga el catalogo de periodos academicos.

Los selects de "periodo academico" del formulario de proyecto y del dialogo
de continuacion se alimentan de esta tabla: si esta vacia, el desplegable
sale sin opciones aunque el endpoint responda 200. Este comando la llena con
los dos semestres de cada anio del rango pedido y marca como activo el
periodo que contiene la fecha de hoy.

Es idempotente: se apoya en get_or_create sobre (anio, semestre), asi que se
puede volver a correr sin duplicar nada.

Uso:
    python manage.py seed_periodos                 # anio actual y el siguiente
    python manage.py seed_periodos --desde 2024 --hasta 2027
    python manage.py seed_periodos --anual         # agrega tambien el Anual

Conecta con:
- apps/planificacion/models.py: PeriodoAcademico.
- apps/planificacion/views.py: vistas que exponen este catalogo.
"""
import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.planificacion.models import PeriodoAcademico

# Ventanas tipicas de cada semestre (mes, dia) de inicio y de fin.
SEMESTRES = {
    'I':  ((4, 1), (8, 31)),
    'II': ((9, 1), (12, 31)),
}
ANUAL = ((4, 1), (12, 31))


class Command(BaseCommand):
    help = 'Crea los periodos academicos de un rango de anios (idempotente).'

    def add_arguments(self, parser):
        anio_actual = timezone.localdate().year
        parser.add_argument('--desde', type=int, default=anio_actual)
        parser.add_argument('--hasta', type=int, default=anio_actual + 1)
        parser.add_argument('--anual', action='store_true',
                            help='Crea tambien el periodo Anual de cada anio.')

    def handle(self, *args, **options):
        desde, hasta = options['desde'], options['hasta']
        if desde > hasta:
            desde, hasta = hasta, desde

        ventanas = dict(SEMESTRES)
        if options['anual']:
            ventanas['Anual'] = ANUAL

        hoy = timezone.localdate()
        creados = 0

        for anio in range(desde, hasta + 1):
            for semestre, ((mes_i, dia_i), (mes_f, dia_f)) in ventanas.items():
                inicio = datetime.date(anio, mes_i, dia_i)
                fin = datetime.date(anio, mes_f, dia_f)
                nombre = f'{anio}-{semestre}' if semestre != 'Anual' else f'Anual {anio}'

                periodo, creado = PeriodoAcademico.objects.get_or_create(
                    anio=anio, semestre=semestre,
                    defaults={
                        'nombre': nombre,
                        'fecha_inicio': inicio,
                        'fecha_fin': fin,
                        'activo': False,
                    },
                )
                creados += int(creado)
                self.stdout.write(f'  {"+" if creado else "="} {periodo.nombre}')

        # Solo un periodo deberia estar activo: el que contiene la fecha de hoy.
        vigente = (PeriodoAcademico.objects
                   .filter(fecha_inicio__lte=hoy, fecha_fin__gte=hoy)
                   .exclude(semestre='Anual')
                   .order_by('fecha_inicio')
                   .first())
        if vigente:
            PeriodoAcademico.objects.exclude(pk=vigente.pk).update(activo=False)
            PeriodoAcademico.objects.filter(pk=vigente.pk).update(activo=True)
            self.stdout.write(f'  Periodo activo: {vigente.nombre}')
        else:
            self.stdout.write(self.style.WARNING(
                '  Ningun periodo contiene la fecha de hoy: no se marco ninguno como activo.'))

        total = PeriodoAcademico.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f'Periodos creados: {creados}. Total en catalogo: {total}.'))
