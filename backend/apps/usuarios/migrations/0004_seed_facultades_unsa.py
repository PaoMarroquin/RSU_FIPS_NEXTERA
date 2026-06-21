"""
Migración de datos: carga las 13 facultades oficiales de la UNSA
tal como aparecen en el formulario del frontend RSU.
"""
from django.db import migrations


# Datos de las 13 facultades UNSA con sus códigos, escuelas y departamentos representativos
FACULTADES_UNSA = [
    {
        'codigo': 'FIPS',
        'nombre': 'Ingeniería de Producción y Servicios',
        'escuelas': [
            ('EPIS', 'Ingeniería de Sistemas'),
            ('EPII', 'Ingeniería Industrial'),
            ('EPIM', 'Ingeniería Mecánica'),
            ('EPIE', 'Ingeniería Electrónica'),
            ('EPIC', 'Ingeniería de Telecomunicaciones'),
        ],
        'departamentos': [
            ('DAISI', 'Ingeniería de Sistemas e Informática'),
            ('DAIIND', 'Ingeniería Industrial'),
        ],
    },
    {
        'codigo': 'FCNF',
        'nombre': 'Ciencias Naturales y Formales',
        'escuelas': [
            ('EPMAT', 'Matemática'),
            ('EPFIS', 'Física'),
            ('EPQUI', 'Química'),
            ('EPEST', 'Estadística'),
            ('EPINF', 'Informática'),
        ],
        'departamentos': [
            ('DAMAT', 'Matemáticas'),
            ('DAFIS', 'Física'),
        ],
    },
    {
        'codigo': 'FCBIO',
        'nombre': 'Ciencias Biológicas',
        'escuelas': [
            ('EPBIO', 'Biología'),
            ('EPMIA', 'Microbiología, Parasitología e Inmunología'),
        ],
        'departamentos': [
            ('DABIO', 'Biología'),
        ],
    },
    {
        'codigo': 'FMED',
        'nombre': 'Medicina',
        'escuelas': [
            ('EPMED', 'Medicina Humana'),
        ],
        'departamentos': [
            ('DACIR', 'Cirugía y Especialidades Quirúrgicas'),
            ('DAMEDINT', 'Medicina Interna'),
        ],
    },
    {
        'codigo': 'FDER',
        'nombre': 'Derecho',
        'escuelas': [
            ('EPDER', 'Derecho'),
        ],
        'departamentos': [
            ('DADER', 'Ciencias Jurídicas y Políticas'),
        ],
    },
    {
        'codigo': 'FECO',
        'nombre': 'Economía',
        'escuelas': [
            ('EPECON', 'Economía'),
            ('EPCON', 'Contabilidad y Finanzas'),
            ('EPADM', 'Administración de Empresas'),
        ],
        'departamentos': [
            ('DAECON', 'Economía'),
            ('DACON', 'Contabilidad'),
        ],
    },
    {
        'codigo': 'FCIHS',
        'nombre': 'Ciencias Histórico Sociales',
        'escuelas': [
            ('EPHIS', 'Historia'),
            ('EPSOC', 'Sociología'),
            ('EPTRAB', 'Trabajo Social'),
            ('EPTUR', 'Turismo y Hotelería'),
        ],
        'departamentos': [
            ('DAHIS', 'Historia, Geografía y Turismo'),
            ('DASOC', 'Ciencias Sociales'),
        ],
    },
    {
        'codigo': 'FGGM',
        'nombre': 'Geología, Geofísica y Minas',
        'escuelas': [
            ('EPGEO', 'Geología'),
            ('EPGEOF', 'Geofísica'),
            ('EPMIN', 'Ingeniería de Minas'),
        ],
        'departamentos': [
            ('DAGEO', 'Geología y Geoquímica'),
            ('DAMIN', 'Ingeniería de Minas'),
        ],
    },
    {
        'codigo': 'FAU',
        'nombre': 'Arquitectura y Urbanismo',
        'escuelas': [
            ('EPARQ', 'Arquitectura'),
        ],
        'departamentos': [
            ('DAARQ', 'Arquitectura y Urbanismo'),
        ],
    },
    {
        'codigo': 'FENF',
        'nombre': 'Enfermería',
        'escuelas': [
            ('EPENF', 'Enfermería'),
        ],
        'departamentos': [
            ('DAENF', 'Enfermería'),
        ],
    },
    {
        'codigo': 'FPSI',
        'nombre': 'Psicología',
        'escuelas': [
            ('EPPSI', 'Psicología'),
        ],
        'departamentos': [
            ('DAPSI', 'Psicología'),
        ],
    },
    {
        'codigo': 'FRII',
        'nombre': 'Relaciones Industriales',
        'escuelas': [
            ('EPRII', 'Relaciones Industriales'),
        ],
        'departamentos': [
            ('DARII', 'Ciencias del Trabajo y Relaciones Laborales'),
        ],
    },
    {
        'codigo': 'FCOM',
        'nombre': 'Ciencias de la Comunicación',
        'escuelas': [
            ('EPCOM', 'Ciencias de la Comunicación'),
        ],
        'departamentos': [
            ('DACOM', 'Comunicación Social y Periodismo'),
        ],
    },
    {
        'codigo': 'FFHH',
        'nombre': 'Filosofía y Humanidades',
        'escuelas': [
            ('EPFIL', 'Filosofía'),
            ('EPIDIO', 'Literatura y Lingüística'),
        ],
        'departamentos': [
            ('DAFIL', 'Filosofía y Humanidades'),
        ],
    },
]


def seed_facultades_unsa(apps, schema_editor):
    Facultad = apps.get_model('usuarios', 'Facultad')
    EscuelaProfesional = apps.get_model('usuarios', 'EscuelaProfesional')
    DepartamentoAcademico = apps.get_model('usuarios', 'DepartamentoAcademico')

    for data in FACULTADES_UNSA:
        facultad, _ = Facultad.objects.get_or_create(
            codigo=data['codigo'],
            defaults={'nombre': data['nombre']},
        )
        # Actualizar nombre si ya existía (por si cambió)
        if facultad.nombre != data['nombre']:
            facultad.nombre = data['nombre']
            facultad.save()

        for cod_esc, nom_esc in data['escuelas']:
            EscuelaProfesional.objects.get_or_create(
                codigo=cod_esc,
                defaults={'nombre': nom_esc, 'facultad': facultad},
            )

        for cod_dep, nom_dep in data['departamentos']:
            DepartamentoAcademico.objects.get_or_create(
                codigo=cod_dep,
                defaults={'nombre': nom_dep, 'facultad': facultad},
            )


def revert_seed(apps, schema_editor):
    # No revertimos para no borrar datos que podrían estar en uso
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('usuarios', '0003_seed_roles'),
    ]
    operations = [
        migrations.RunPython(seed_facultades_unsa, revert_seed),
    ]
