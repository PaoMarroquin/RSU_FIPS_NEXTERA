"""
Serializers del modulo de usuarios.

Traducen los modelos de usuarios y estructura academica a JSON y validan la
entrada de la API. Hay un serializer distinto por operacion porque las reglas
cambian: al crear se exige contrasena, al editar no; al listar se devuelven
los nombres de rol y facultad ya resueltos para que el frontend no tenga que
hacer llamadas extra.

Serializers:
- RolSerializer, FacultadSerializer, EscuelaProfesionalSerializer,
  DepartamentoAcademicoSerializer: catalogos de solo lectura.
- UsuarioCreateSerializer: alta de usuario, cifra la contrasena.
- UsuarioEditSerializer: edicion administrativa.
- UsuarioListSerializer: listado y detalle, con campos derivados.
- MiPerfilUpdateSerializer: lo que el propio usuario puede cambiar de si
  mismo.
- AsignarRolSerializer: cambio de rol con motivo.
- HistorialRolSerializer, AuditoriaUsuarioSerializer: lectura de bitacoras.

Validacion transversal: _validate_escuela_departamento_facultad comprueba que
la escuela y el departamento pertenezcan a la facultad elegida.

Conecta con:
- apps/usuarios/models.py: modelos que serializa.
- apps/usuarios/views.py: vistas que los usan.
"""
from rest_framework import serializers

from .models import (
    AuditoriaUsuario,
    DepartamentoAcademico,
    EscuelaProfesional,
    Facultad,
    HistorialRolUsuario,
    Rol,
    Usuario,
)


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'activo']


class FacultadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facultad
        fields = ['id', 'nombre', 'codigo']


class EscuelaProfesionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = EscuelaProfesional
        fields = ['id', 'nombre', 'codigo', 'facultad']


class DepartamentoAcademicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartamentoAcademico
        fields = ['id', 'nombre', 'codigo', 'facultad']


def _validate_escuela_departamento_facultad(attrs):
    """Escuela y Departamento deben pertenecer a la Facultad indicada, si se envían."""
    facultad = attrs.get('facultad')
    escuela = attrs.get('escuela')
    departamento = attrs.get('departamento')

    if escuela and facultad and escuela.facultad_id != facultad.pk:
        raise serializers.ValidationError(
            {'escuela': 'La escuela profesional no pertenece a la facultad seleccionada.'})
    if departamento and facultad and departamento.facultad_id != facultad.pk:
        raise serializers.ValidationError(
            {'departamento': 'El departamento académico no pertenece a la facultad seleccionada.'})
    return attrs


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = [
            'id', 'nombres', 'apellidos', 'correo_institucional',
            'password', 'celular', 'rol', 'facultad',
            'escuela', 'departamento', 'estado',
        ]

    def validate(self, attrs):
        return _validate_escuela_departamento_facultad(attrs)

    def create(self, validated_data):
        password = validated_data.pop('password')
        usuario = Usuario(**validated_data)
        usuario.set_password(password)
        usuario.save()
        return usuario


class UsuarioEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombres', 'apellidos', 'celular',
            'facultad', 'escuela', 'departamento', 'estado',
        ]

    def validate(self, attrs):
        merged = {
            'facultad': self.instance.facultad if self.instance else None,
            'escuela': self.instance.escuela if self.instance else None,
            'departamento': self.instance.departamento if self.instance else None,
        }
        merged.update(attrs)
        _validate_escuela_departamento_facultad(merged)
        return attrs


class UsuarioListSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    facultad_nombre = serializers.CharField(source='facultad.nombre', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'nombres', 'apellidos', 'correo_institucional',
            'celular', 'rol_nombre', 'facultad_nombre', 'estado',
            'firma_digital', 'created_at',
        ]


class AsignarRolSerializer(serializers.Serializer):
    rol_id = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.filter(activo=True))
    motivo = serializers.CharField(max_length=500, required=False, allow_blank=True)


class HistorialRolSerializer(serializers.ModelSerializer):
    cambiado_por_nombre  = serializers.CharField(source='cambiado_por.nombres', read_only=True)
    rol_anterior_nombre  = serializers.CharField(source='rol_anterior.nombre', read_only=True)
    rol_nuevo_nombre     = serializers.CharField(source='rol_nuevo.nombre', read_only=True)

    class Meta:
        model = HistorialRolUsuario
        fields = [
            'id', 'cambiado_por_nombre',
            'rol_anterior_nombre', 'rol_nuevo_nombre',
            'motivo', 'created_at',
        ]


class MiPerfilUpdateSerializer(serializers.ModelSerializer):
    """Serializer para que el usuario edite su propio perfil. No expone el campo estado."""
    class Meta:
        model = Usuario
        fields = ['id', 'nombres', 'apellidos', 'celular', 'facultad', 'escuela', 'departamento', 'firma_digital']


class AuditoriaUsuarioSerializer(serializers.ModelSerializer):
    ejecutado_por_nombre     = serializers.CharField(source='ejecutado_por.nombres', read_only=True)
    usuario_afectado_nombre  = serializers.CharField(source='usuario_afectado.nombres', read_only=True)

    class Meta:
        model = AuditoriaUsuario
        fields = [
            'id', 'ejecutado_por_nombre', 'usuario_afectado_nombre',
            'accion', 'detalle', 'ip_address', 'created_at',
        ]
