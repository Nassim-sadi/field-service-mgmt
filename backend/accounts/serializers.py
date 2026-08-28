from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.models import Technician

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "is_staff",
        ]
        read_only_fields = ["is_staff"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_new_password"]:
            raise serializers.ValidationError(
                {"confirm_new_password": "New passwords do not match."}
            )
        if attrs["old_password"] == attrs["new_password"]:
            raise serializers.ValidationError(
                {"new_password": "New password must differ from the current password."}
            )
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name", "role"]
        extra_kwargs = {"role": {"required": False}}

    def create(self, validated_data):
        role = validated_data.get("role", "customer")
        is_staff = role in ("admin", "manager")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=role,
            is_staff=is_staff,
        )
        if role == "technician":
            Technician.objects.create(user=user)
        return user


class TechnicianRegistrationSerializer(serializers.ModelSerializer):
    user = RegisterSerializer()

    class Meta:
        model = Technician
        fields = ["id", "user", "specialty", "hourly_rate", "is_active"]
