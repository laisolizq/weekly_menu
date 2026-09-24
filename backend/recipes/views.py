from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Component
from .serializers import ComponentSerializer


class ComponentListView(APIView):
    def get(self, request):
        components = Component.objects.prefetch_related("variants").all()
        serializer = ComponentSerializer(components, many=True)
        return Response(serializer.data)