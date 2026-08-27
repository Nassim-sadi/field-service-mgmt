from django.contrib.auth import get_user_model
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    search_fields = ["username", "email", "first_name", "last_name"]
    filterset_fields = ["role", "is_active"]

    @action(detail=False)
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return RegisterSerializer
        return UserSerializer
