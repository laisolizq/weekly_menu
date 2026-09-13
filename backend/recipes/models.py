import uuid
from django.db import models


class Ingredient(models.Model):
    name = models.CharField(max_length=200, unique=True)

class Recipe(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    name = models.CharField(max_length=200)
    ingredients = models.ManyToManyField(
        Ingredient,
        related_name="recipes",
    )
    created_at = models.DateTimeField(auto_now_add=True)