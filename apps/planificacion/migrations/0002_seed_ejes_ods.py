from django.db import migrations

def seed_ejes_and_ods(apps, schema_editor):
    EjeRSU = apps.get_model('planificacion', 'EjeRSU')
    ODS = apps.get_model('planificacion', 'ODS')

    # Seed ejes RSU
    ejes = [
        ('Gestión', 'Relacionado con impacto institucional interno (ética, ecoeficiencia, clima laboral, inclusión, etc.)'),
        ('Formación', 'Relacionado con el aprendizaje de los estudiantes (ética profesional, derechos humanos, ODS, etc.)'),
        ('Investigación', 'Relacionado con investigaciones con enfoque social y ambiental'),
        ('Extensión', 'Relacionado con la proyección social e intervenciones en la comunidad'),
        ('Voluntariado', 'Relacionado con el voluntariado universitario'),
    ]
    for nombre, desc in ejes:
        EjeRSU.objects.get_or_create(nombre=nombre, defaults={'descripcion': desc})

    # Seed ODS
    ods_list = [
        (1, 'Fin de la pobreza', 'Poner fin a la pobreza en todas sus formas en todo el mundo.'),
        (2, 'Hambre cero', 'Poner fin al hambre, lograr la seguridad alimentaria y la mejora de la nutrición.'),
        (3, 'Salud y bienestar', 'Garantizar una vida sana y promover el bienestar para todos en todas las edades.'),
        (4, 'Educación de calidad', 'Garantizar una educación inclusiva, equitativa y de calidad.'),
        (5, 'Igualdad de género', 'Lograr la igualdad entre los géneros y empoderar a todas las mujeres y las niñas.'),
        (6, 'Agua limpia y saneamiento', 'Garantizar la disponibilidad de agua y su gestión sostenible y el saneamiento para todos.'),
        (7, 'Energía asequible y no contaminante', 'Garantizar el acceso a una energía asequible, segura, sostenible y moderna para todos.'),
        (8, 'Trabajo decente y crecimiento económico', 'Promover el crecimiento económico sostenido, inclusivo y sostenible, el empleo pleno y productivo.'),
        (9, 'Industria, innovación e infraestructura', 'Construir infraestructuras resilientes, promover la industrialización inclusiva y sostenible y fomentar la innovación.'),
        (10, 'Reducción de las desigualdades', 'Reducir la desigualdad en y entre los países.'),
        (11, 'Ciudades y comunidades sostenibles', 'Lograr que las ciudades y los asentamientos humanos sean inclusivos, seguros, resilientes y sostenibles.'),
        (12, 'Producción y consumo responsables', 'Garantizar modalidades de consumo y producción sostenibles.'),
        (13, 'Acción por el clima', 'Adoptar medidas urgentes para combatir el cambio climático y sus efectos.'),
        (14, 'Vida submarina', 'Conservar y utilizar sosteniblemente los océanos, los mares y los recursos marinos para el desarrollo sostenible.'),
        (15, 'Vida de ecosistemas terrestres', 'Proteger, restablecer y promover el uso sostenible de los ecosistemas terrestres y detener la pérdida de biodiversidad.'),
        (16, 'Paz, justicia e instituciones sólidas', 'Promover sociedades justas, pacíficas e inclusivas.'),
        (17, 'Alianzas para lograr los objetivos', 'Fortalecer los medios de ejecución y revitalizar la Alianza Mundial para el Desarrollo Sostenible.'),
    ]
    for numero, nombre, desc in ods_list:
        ODS.objects.get_or_create(
            numero=numero,
            defaults={
                'nombre': nombre,
                'descripcion': desc,
                'icono_url': f'https://raw.githubusercontent.com/UN-SDG/SDG-Icons/master/Icons/es/SDG-{numero}.png'
            }
        )

def revert_seed(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('planificacion', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(seed_ejes_and_ods, revert_seed),
    ]
