import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Facultad, EscuelaProfesional
from apps.proyectos.models import ProyectoRSU

for code in ['PRY-FULL-001', 'PRY-FULL-002']:
    p = ProyectoRSU.objects.filter(codigo=code).first()
    if p:
        facultad = p.facultad
        # Try to find an escuela for this facultad
        escuela = EscuelaProfesional.objects.filter(facultad=facultad).first()
        if not escuela:
            # Create one if it doesn't exist
            escuela = EscuelaProfesional.objects.create(
                nombre=f"Escuela de {facultad.nombre}",
                codigo=f"EP-{facultad.codigo}",
                facultad=facultad
            )
        p.escuela = escuela
        p.save()
        print(f"Fixed {code}: Facultad {facultad.id}, Escuela {escuela.id} (Facultad de escuela: {escuela.facultad_id})")
