import uuid

from django.db import models


class Component(models.Model):
    class Category(models.TextChoices):
        CARB = "CARB", "Hidrato"
        PROTEIN = "PROTEIN", "Proteína"
        VEGETABLE = "VEGETABLE", "Verdura"
        ELABORATION = "ELABORATION", "Elaboración"
        EXTRA = "EXTRA", "Extra"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    name = models.CharField(max_length=200)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
    )

    def __str__(self):
        return self.name


class ComponentVariant(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    component = models.ForeignKey(
        Component,
        on_delete=models.CASCADE,
        related_name="variants",
    )
    name = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.component.name} - {self.name}"


class SavedMenu(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    name = models.CharField(max_length=200)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name