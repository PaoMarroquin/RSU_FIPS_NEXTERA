from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Facultad(models.Model):
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=20, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'facultades'
        verbose_name = 'Facultad'
        verbose_name_plural = 'Facultades'

    def __str__(self):
        return self.nombre


class EscuelaProfesional(models.Model):
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=20, unique=True, null=True, blank=True)
    facultad = models.ForeignKey(Facultad, on_delete=models.PROTECT, related_name='escuelas')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'escuelas_profesionales'
        verbose_name = 'Escuela Profesional'
        verbose_name_plural = 'Escuelas Profesionales'

    def __str__(self):
        return self.nombre


class DepartamentoAcademico(models.Model):
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=20, unique=True, null=True, blank=True)
    facultad = models.ForeignKey(Facultad, on_delete=models.PROTECT, related_name='departamentos')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'departamentos_academicos'
        verbose_name = 'Departamento Académico'
        verbose_name_plural = 'Departamentos Académicos'

    def __str__(self):
        return self.nombre


class Rol(models.Model):
    ADMINISTRADOR = 'Administrador'
    COORDINADOR   = 'Coordinador'
    COMITE        = 'Comite'
    DOCENTE       = 'Docente'
    AUTORIDAD     = 'Autoridad'
    ESTUDIANTE    = 'Estudiante'

    ROLES = [
        (ADMINISTRADOR, 'Administrador'),
        (COORDINADOR,   'Coordinador RSU'),
        (COMITE,        'Comité RSU'),
        (DOCENTE,       'Docente'),
        (AUTORIDAD,     'Autoridad Universitaria'),
        (ESTUDIANTE,    'Estudiante'),
    ]

    nombre      = models.CharField(max_length=50, unique=True, choices=ROLES)
    descripcion = models.CharField(max_length=255, blank=True)
    activo      = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.nombre


class UsuarioManager(BaseUserManager):
    def create_user(self, correo_institucional, password=None, **extra_fields):
        if not correo_institucional:
            raise ValueError('El correo institucional es obligatorio')
        correo_institucional = self.normalize_email(correo_institucional)
        user = self.model(correo_institucional=correo_institucional, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo_institucional, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(correo_institucional, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    nombres      = models.CharField(max_length=150)
    apellidos            = models.CharField(max_length=100, blank=True, default='')
    correo_institucional = models.EmailField(unique=True)
    celular              = models.CharField(max_length=20, blank=True, null=True)
    rol                  = models.ForeignKey(Rol, on_delete=models.PROTECT,
                                             null=True, blank=True, related_name='usuarios')
    facultad             = models.ForeignKey(Facultad, on_delete=models.SET_NULL,
                                             null=True, blank=True, related_name='usuarios')
    escuela              = models.ForeignKey(EscuelaProfesional, on_delete=models.SET_NULL,
                                             null=True, blank=True, related_name='usuarios')
    departamento         = models.ForeignKey(DepartamentoAcademico, on_delete=models.SET_NULL,
                                             null=True, blank=True, related_name='usuarios')
    estado               = models.CharField(max_length=20, default='activo',
                                            choices=[('activo', 'Activo'), ('inactivo', 'Inactivo')])
    firma_digital        = models.ImageField(
                                             upload_to='firmas/', null=True, blank=True,
                                             help_text='Firma digital del usuario (JPG/PNG)')
    is_staff             = models.BooleanField(default=False)
    ultimo_acceso        = models.DateTimeField(null=True, blank=True)
    created_at           = models.DateTimeField(auto_now_add=True)
    updated_at           = models.DateTimeField(auto_now=True)

    USERNAME_FIELD  = 'correo_institucional'
    REQUIRED_FIELDS = ['nombres']

    objects = UsuarioManager()

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.nombres} ({self.correo_institucional})'


class Sesion(models.Model):
    usuario    = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='sesiones')
    token      = models.CharField(max_length=500, unique=True)
    expira_en  = models.DateTimeField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sesiones'
        verbose_name = 'Sesión'
        verbose_name_plural = 'Sesiones'

    def __str__(self):
        return f'Sesión de {self.usuario} — {self.created_at:%Y-%m-%d %H:%M}'


class HistorialRolUsuario(models.Model):
    usuario       = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='historial_roles')
    cambiado_por  = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='cambios_roles')
    rol_anterior  = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, related_name='+')
    rol_nuevo     = models.ForeignKey(Rol, on_delete=models.PROTECT, related_name='+')
    motivo        = models.CharField(max_length=500, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'historial_roles_usuario'
        verbose_name = 'Historial de Rol'


class AuditoriaUsuario(models.Model):
    ACCIONES = [
        ('CREAR',        'Crear usuario'),
        ('EDITAR',       'Editar usuario'),
        ('ACTIVAR',      'Activar usuario'),
        ('DESACTIVAR',   'Desactivar usuario'),
        ('CAMBIAR_ROL',  'Cambiar rol'),
    ]
    ejecutado_por     = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='auditorias_ejecutadas')
    usuario_afectado  = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='auditorias_recibidas')
    accion            = models.CharField(max_length=50, choices=ACCIONES)
    detalle           = models.TextField(blank=True)
    ip_address        = models.GenericIPAddressField(null=True, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'auditoria_usuarios'
        verbose_name = 'Auditoría'