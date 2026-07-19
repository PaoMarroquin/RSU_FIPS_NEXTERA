"""
seed_proyectos.py
=================
Script de datos de prueba para ProyectoRSU.

Uso:
    python seed_proyectos.py          (desde la carpeta backend/)

Crea:
  - 3 proyectos en estado 'borrador'
  - 3 proyectos en estado 'en_revision'
  - 2 proyectos en estado 'aprobado'
  - 1 proyecto  en estado 'observado'
  - Al menos 1 MetaIndicadorProyecto por proyecto

Requisitos previos:
  - Haber ejecutado seed_users.py (o tener al menos un usuario Docente en la BD)
  - La BD debe estar migrada
"""

import os
import sys
import django

# ─── Configuración de Django ──────────────────────────────────────────────────
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
# ─────────────────────────────────────────────────────────────────────────────

from datetime import date
from django.db import transaction

from apps.usuarios.models import (
    Usuario, Rol, Facultad, EscuelaProfesional, DepartamentoAcademico
)
from apps.planificacion.models import PeriodoAcademico, EjeRSU
from apps.proyectos.models import ProyectoRSU, MetaIndicadorProyecto


# ─── Resumen global ───────────────────────────────────────────────────────────
resumen = {
    'facultades': [],
    'escuelas': [],
    'departamentos': [],
    'ejes_rsu': [],
    'periodos': [],
    'docentes': [],
    'proyectos_creados': [],
    'proyectos_existentes': [],
    'metas_creadas': 0,
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def crear_o_obtener_infraestructura():
    """
    Garantiza que existan los objetos institucionales básicos
    (Facultad, Escuela, Departamento, EjeRSU, PeriodoAcademico).
    Usa get_or_create para no duplicar.
    """
    print("\n─── [1] Infraestructura institucional ───")

    # Facultad principal
    fac1, c = Facultad.objects.get_or_create(
        codigo='FING',
        defaults={'nombre': 'Facultad de Ingeniería de Producción y Servicios'}
    )
    if c:
        print(f"  ✓ Facultad creada: {fac1.nombre}")
    else:
        print(f"  · Facultad existente: {fac1.nombre}")
    resumen['facultades'].append(fac1.nombre)

    # Facultad secundaria
    fac2, c = Facultad.objects.get_or_create(
        codigo='FCCSS',
        defaults={'nombre': 'Facultad de Ciencias de la Salud'}
    )
    if c:
        print(f"  ✓ Facultad creada: {fac2.nombre}")
    else:
        print(f"  · Facultad existente: {fac2.nombre}")
    resumen['facultades'].append(fac2.nombre)

    # Escuelas
    esc1, c = EscuelaProfesional.objects.get_or_create(
        codigo='EP-SISTIN',
        defaults={'nombre': 'Escuela de Ingeniería de Sistemas', 'facultad': fac1}
    )
    if c: print(f"  ✓ Escuela creada: {esc1.nombre}")
    resumen['escuelas'].append(esc1.nombre)

    esc2, c = EscuelaProfesional.objects.get_or_create(
        codigo='EP-MEDIC',
        defaults={'nombre': 'Escuela Profesional de Medicina', 'facultad': fac2}
    )
    if c: print(f"  ✓ Escuela creada: {esc2.nombre}")
    resumen['escuelas'].append(esc2.nombre)

    esc3, c = EscuelaProfesional.objects.get_or_create(
        codigo='EP-INDUSTR',
        defaults={'nombre': 'Escuela de Ingeniería Industrial', 'facultad': fac1}
    )
    if c: print(f"  ✓ Escuela creada: {esc3.nombre}")
    resumen['escuelas'].append(esc3.nombre)

    # Departamentos
    dep1, c = DepartamentoAcademico.objects.get_or_create(
        codigo='DSIST',
        defaults={'nombre': 'Departamento de Sistemas', 'facultad': fac1}
    )
    if c: print(f"  ✓ Departamento creado: {dep1.nombre}")
    resumen['departamentos'].append(dep1.nombre)

    dep2, c = DepartamentoAcademico.objects.get_or_create(
        codigo='DMEDIC',
        defaults={'nombre': 'Departamento de Medicina', 'facultad': fac2}
    )
    if c: print(f"  ✓ Departamento creado: {dep2.nombre}")
    resumen['departamentos'].append(dep2.nombre)

    dep3, c = DepartamentoAcademico.objects.get_or_create(
        codigo='DINDUSTR',
        defaults={'nombre': 'Departamento de Ingeniería Industrial', 'facultad': fac1}
    )
    if c: print(f"  ✓ Departamento creado: {dep3.nombre}")
    resumen['departamentos'].append(dep3.nombre)

    # Ejes RSU
    ejes_data = [
        ('Gestión Organizacional', 'Eje de gestión interna responsable'),
        ('Formación Académica',    'Eje de formación y ciudadanía'),
        ('Investigación',         'Eje de investigación con impacto social'),
        ('Extensión Universitaria', 'Eje de proyección y extensión a la comunidad'),
    ]
    ejes = []
    for nombre_eje, desc_eje in ejes_data:
        eje, c = EjeRSU.objects.get_or_create(
            nombre=nombre_eje,
            defaults={'descripcion': desc_eje}
        )
        if c: print(f"  ✓ Eje RSU creado: {eje.nombre}")
        ejes.append(eje)
        resumen['ejes_rsu'].append(eje.nombre)

    # Periodo académico activo
    periodo, c = PeriodoAcademico.objects.get_or_create(
        anio=2026, semestre='I',
        defaults={
            'nombre': 'Semestre 2026-I',
            'fecha_inicio': date(2026, 3, 1),
            'fecha_fin': date(2026, 7, 31),
            'activo': True,
        }
    )
    if c:
        print(f"  ✓ Periodo creado: {periodo.nombre}")
    else:
        # Asegurarse de que esté activo
        if not periodo.activo:
            periodo.activo = True
            periodo.save()
        print(f"  · Periodo existente: {periodo.nombre}")
    resumen['periodos'].append(periodo.nombre)

    return {
        'facultades': [fac1, fac2, fac1],   # una por grupo de proyectos
        'escuelas':   [esc1, esc2, esc3],
        'departamentos': [dep1, dep2, dep3],
        'ejes': ejes,
        'periodo': periodo,
    }


def garantizar_docentes(fac_map):
    """
    Obtiene o crea usuarios con rol Docente suficientes para los proyectos.
    Retorna lista de docentes.
    """
    print("\n─── [2] Docentes ───")

    rol_docente, _ = Rol.objects.get_or_create(
        nombre='Docente',
        defaults={'descripcion': 'Docente de la UNSA', 'activo': True}
    )

    docentes_data = [
        {
            'email': 'docente1@unsa.edu.pe',
            'nombres': 'Carlos Alberto',
            'apellidos': 'Mendoza Quispe',
            'depto': fac_map['departamentos'][0],
            'facultad': fac_map['facultades'][0],
        },
        {
            'email': 'docente2@unsa.edu.pe',
            'nombres': 'María Elena',
            'apellidos': 'Torres Vargas',
            'depto': fac_map['departamentos'][1],
            'facultad': fac_map['facultades'][1],
        },
        {
            'email': 'docente3@unsa.edu.pe',
            'nombres': 'Jorge Luis',
            'apellidos': 'Flores Salinas',
            'depto': fac_map['departamentos'][2],
            'facultad': fac_map['facultades'][2],
        },
        {
            'email': 'docente4@unsa.edu.pe',
            'nombres': 'Ana Sofía',
            'apellidos': 'Paredes Cárdenas',
            'depto': fac_map['departamentos'][0],
            'facultad': fac_map['facultades'][0],
        },
        {
            'email': 'docente5@unsa.edu.pe',
            'nombres': 'Roberto',
            'apellidos': 'Vilca Mamani',
            'depto': fac_map['departamentos'][1],
            'facultad': fac_map['facultades'][1],
        },
    ]

    docentes = []
    for d in docentes_data:
        user, created = Usuario.objects.get_or_create(
            correo_institucional=d['email'],
            defaults={
                'nombres': d['nombres'],
                'apellidos': d['apellidos'],
                'rol': rol_docente,
                'departamento': d['depto'],
                'facultad': d['facultad'],
                'is_active': True,
            }
        )
        if created:
            user.set_password('123456')
            user.save()
            print(f"  ✓ Docente creado: {d['email']}")
        else:
            print(f"  · Docente existente: {d['email']}")
        resumen['docentes'].append(user.correo_institucional)
        docentes.append(user)

    return docentes


def crear_meta_indicador(proyecto, num=1):
    """Crea una MetaIndicadorProyecto de ejemplo para el proyecto dado."""
    metas_data = [
        {
            'meta_descripcion': f'Capacitar a 30 personas de la comunidad en habilidades digitales (Proy #{num})',
            'indicador_nombre': 'Número de personas capacitadas',
            'unidad_medida': 'personas',
            'linea_base': 0,
            'valor_meta': 30,
            'metodo_verificacion': 'Lista de asistencia firmada',
            'fuente_verificacion': 'Registro de asistencia del taller',
            'orden': 1,
        },
        {
            'meta_descripcion': f'Realizar 4 talleres de sensibilización ambiental (Proy #{num})',
            'indicador_nombre': 'Número de talleres realizados',
            'unidad_medida': 'talleres',
            'linea_base': 0,
            'valor_meta': 4,
            'metodo_verificacion': 'Informe de actividades y fotografías',
            'fuente_verificacion': 'Informe mensual del proyecto',
            'orden': 1,
        },
        {
            'meta_descripcion': f'Atender a 50 pacientes en campaña de salud preventiva (Proy #{num})',
            'indicador_nombre': 'Número de pacientes atendidos',
            'unidad_medida': 'pacientes',
            'linea_base': 0,
            'valor_meta': 50,
            'metodo_verificacion': 'Fichas de atención médica',
            'fuente_verificacion': 'Registro clínico de la campaña',
            'orden': 1,
        },
    ]
    # Usar modulo para rotar entre las plantillas
    data = metas_data[(num - 1) % len(metas_data)]
    meta = MetaIndicadorProyecto.objects.create(proyecto=proyecto, **data)
    resumen['metas_creadas'] += 1
    return meta


def crear_proyectos(infra, docentes):
    """Crea los 9 proyectos de prueba."""
    print("\n─── [3] Proyectos RSU ───")

    periodo    = infra['periodo']
    ejes       = infra['ejes']
    facultades = infra['facultades']
    escuelas   = infra['escuelas']
    deptos     = infra['departamentos']

    # ── Definición de los 9 proyectos ─────────────────────────────────────────
    proyectos_def = [
        # ── BORRADORES (3) ─────────────────────────────────────────────────────
        {
            'titulo': 'Programa de Alfabetización Digital para Adultos Mayores del Distrito de Yanahuara',
            'estado': 'borrador',
            'docente_idx': 0,
            'fac_idx': 0, 'esc_idx': 0, 'dep_idx': 0,
            'eje_idx': 1,  # Formación Académica
        },
        {
            'titulo': 'Taller de Reciclaje y Gestión de Residuos Sólidos en el Mercado San Camilo',
            'estado': 'borrador',
            'docente_idx': 1,
            'fac_idx': 1, 'esc_idx': 1, 'dep_idx': 1,
            'eje_idx': 0,  # Gestión Organizacional
        },
        {
            'titulo': 'Capacitación en Emprendimiento Sostenible para Comunidades Rurales de Pampacolca',
            'estado': 'borrador',
            'docente_idx': 2,
            'fac_idx': 2, 'esc_idx': 2, 'dep_idx': 2,
            'eje_idx': 3,  # Extensión Universitaria
        },
        # ── EN REVISIÓN (3) ────────────────────────────────────────────────────
        {
            'titulo': 'Campaña de Prevención de Enfermedades Crónicas No Transmisibles en Zonas Periurbanas',
            'estado': 'en_revision',
            'docente_idx': 3,
            'fac_idx': 1, 'esc_idx': 1, 'dep_idx': 1,
            'eje_idx': 2,  # Investigación
        },
        {
            'titulo': 'Proyecto de Seguridad Alimentaria y Huertos Urbanos Comunitarios en Hunter',
            'estado': 'en_revision',
            'docente_idx': 4,
            'fac_idx': 0, 'esc_idx': 0, 'dep_idx': 0,
            'eje_idx': 3,  # Extensión Universitaria
        },
        {
            'titulo': 'Formación en Habilidades Blandas y Empleabilidad para Jóvenes en Situación de Vulnerabilidad',
            'estado': 'en_revision',
            'docente_idx': 0,
            'fac_idx': 2, 'esc_idx': 2, 'dep_idx': 2,
            'eje_idx': 1,  # Formación Académica
        },
        # ── APROBADOS (2) ──────────────────────────────────────────────────────
        {
            'titulo': 'Programa de Reforestación y Conservación Ambiental en la Reserva Paisajística Sub Cuenca del Cotahuasi',
            'estado': 'aprobado',
            'docente_idx': 1,
            'fac_idx': 0, 'esc_idx': 2, 'dep_idx': 0,
            'eje_idx': 0,  # Gestión Organizacional
        },
        {
            'titulo': 'Asistencia Jurídica Gratuita para Personas de Escasos Recursos del Cono Norte de Arequipa',
            'estado': 'aprobado',
            'docente_idx': 2,
            'fac_idx': 1, 'esc_idx': 1, 'dep_idx': 1,
            'eje_idx': 2,  # Investigación
        },
        # ── OBSERVADO (1) ──────────────────────────────────────────────────────
        {
            'titulo': 'Intervención Psicosocial en Adultos Mayores con Depresión del Centro Poblado de La Joya',
            'estado': 'observado',
            'docente_idx': 3,
            'fac_idx': 1, 'esc_idx': 1, 'dep_idx': 1,
            'eje_idx': 2,  # Investigación
        },
    ]

    num = 0
    for i, pdef in enumerate(proyectos_def, start=1):
        num += 1
        docente  = docentes[pdef['docente_idx'] % len(docentes)]
        facultad = facultades[pdef['fac_idx']]
        escuela  = escuelas[pdef['esc_idx']]
        depto    = deptos[pdef['dep_idx']]
        eje      = ejes[pdef['eje_idx']]

        try:
            proyecto, created = ProyectoRSU.objects.get_or_create(
                titulo=pdef['titulo'],
                defaults={
                    'estado':              pdef['estado'],
                    'docente_responsable': docente,
                    'facultad':            facultad,
                    'escuela':             escuela,
                    'departamento':        depto,
                    'eje_rsu':             eje,
                    'periodo':             periodo,
                    'semestre_academico':  '2026-I',
                    'lugar_ejecucion':     'Campus UNSA - Arequipa',
                    'fecha_inicio':        date(2026, 3, 15),
                    'fecha_termino':       date(2026, 7, 15),
                    'tipo_actividad':      ['asesoria'],
                    'nro_docentes':        1,
                    'nro_estudiantes':     20,
                    'monto_financiamiento': 0,
                    'fuente_financiamiento': 'autofinanciado',
                }
            )

            if created:
                # Crear meta/indicador
                crear_meta_indicador(proyecto, num)
                print(f"  ✓ [{pdef['estado'].upper():13s}] {pdef['titulo'][:70]}...")
                resumen['proyectos_creados'].append({
                    'titulo': pdef['titulo'],
                    'estado': pdef['estado'],
                    'docente': docente.correo_institucional,
                })
            else:
                print(f"  · [YA EXISTÍA] {pdef['titulo'][:70]}...")
                resumen['proyectos_existentes'].append(pdef['titulo'])

                # Crear meta si no tiene ninguna
                if not proyecto.metas_indicadores.exists():
                    crear_meta_indicador(proyecto, num)
                    print(f"    └─ Meta/indicador añadida al proyecto existente.")

        except Exception as e:
            print(f"  ✗ Error creando proyecto #{num} ({pdef['estado']}): {e}")


# ─── Función principal ────────────────────────────────────────────────────────

@transaction.atomic
def seed():
    print("=" * 70)
    print("  SEED DE PROYECTOS RSU")
    print("=" * 70)

    # 1. Crear/verificar infraestructura
    infra = crear_o_obtener_infraestructura()

    # 2. Garantizar docentes
    docentes = garantizar_docentes(infra)

    # 3. Crear proyectos
    crear_proyectos(infra, docentes)

    # ── Resumen final ──────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  RESUMEN DEL SEED")
    print("=" * 70)
    print(f"\n  Facultades activas en BD:    {Facultad.objects.count()}")
    print(f"  Escuelas activas en BD:      {EscuelaProfesional.objects.count()}")
    print(f"  Departamentos en BD:         {DepartamentoAcademico.objects.count()}")
    print(f"  Ejes RSU en BD:              {EjeRSU.objects.count()}")
    print(f"  Periodos académicos en BD:   {PeriodoAcademico.objects.count()}")
    print(f"  Docentes en BD:              {Usuario.objects.filter(rol__nombre='Docente').count()}")
    print(f"\n  Proyectos CREADOS ahora:     {len(resumen['proyectos_creados'])}")
    print(f"  Proyectos YA EXISTÍAN:       {len(resumen['proyectos_existentes'])}")
    print(f"  Metas/Indicadores creados:   {resumen['metas_creadas']}")

    total = ProyectoRSU.objects.count()
    print(f"\n  Total proyectos en BD:       {total}")

    print("\n  Desglose por estado:")
    for estado_code, estado_label in ProyectoRSU.ESTADOS:
        cnt = ProyectoRSU.objects.filter(estado=estado_code).count()
        if cnt:
            print(f"    {estado_label:20s}: {cnt}")

    if resumen['proyectos_creados']:
        print("\n  Proyectos creados en esta ejecución:")
        for p in resumen['proyectos_creados']:
            print(f"    [{p['estado'].upper():13s}] {p['titulo'][:60]}... → {p['docente']}")

    print("\n" + "=" * 70)
    print("  SEED COMPLETADO EXITOSAMENTE")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    seed()
