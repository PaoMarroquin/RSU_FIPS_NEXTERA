from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.usuarios.models import Sesion


class Command(BaseCommand):
    help = 'Elimina del registro las sesiones JWT que han expirado.'

    def handle(self, *args, **options):
        deleted, _ = Sesion.objects.filter(expira_en__lt=timezone.now()).delete()
        self.stdout.write(self.style.SUCCESS(f'Sesiones expiradas eliminadas: {deleted}'))
