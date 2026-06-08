from rest_framework import serializers
from .models import Usuario, Rol, Facultad, EscuelaProfesional, DepartamentoAcademico


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'activo']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre_completo', 'correo_institucional',
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
            'id', 'nombre_completo', 'celular',
            'facultad', 'escuela', 'departamento', 'estado',
        ]


class AsignarRolSerializer(serializers.Serializer):
    rol_id = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.filter(activo=True))
    motivo = serializers.CharField(max_length=500, required=False, allow_blank=True)


class UsuarioListSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    facultad_nombre = serializers.CharField(source='facultad.nombre', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre_completo', 'correo_institucional',
            'celular', 'rol_nombre', 'facultad_nombre', 'estado', 'created_at',
        ]