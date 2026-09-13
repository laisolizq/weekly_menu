from rest_framework import serializers

from .models import Recipe, Ingredient

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ["name"]

class RecipeSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField()
    ingredients = IngredientSerializer(many=True)

    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients")

        recipe = Recipe.objects.create(**validated_data)

        for ingredient_data in ingredients_data:
            ingredient, _ = Ingredient.objects.get_or_create(
                name=ingredient_data["name"]
            )
            recipe.ingredients.add(ingredient)

        return recipe

    class Meta:
        model = Recipe
        fields = ["id", "name", "ingredients", "created_at"]