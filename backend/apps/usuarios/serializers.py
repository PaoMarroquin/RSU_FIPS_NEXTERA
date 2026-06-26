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


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = [
            'id', 'nombres', 'apellidos', 'correo_institucional',
            'password', 'celular', 'rol', 'facultad',
            'escuela', 'departamento', 'estado',
        ]

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
