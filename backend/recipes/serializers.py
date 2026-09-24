from rest_framework import serializers

from .models import Component, ComponentVariant


class ComponentVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponentVariant
        fields = ["id", "name"]


class ComponentSerializer(serializers.ModelSerializer):
    variants = ComponentVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Component
        fields = ["id", "name", "category", "variants"]