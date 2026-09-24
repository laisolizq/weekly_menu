from django.core.management.base import BaseCommand

from recipes.models import Component, ComponentVariant


CATALOG = {
    "CARB": {
        "Arroz": ["Blanco", "Integral", "Basmati"],
        "Pasta": ["Blanca", "Integral", "Para sopa"],
        "Lentejas": ["Lentejas", "Pasta de lentejas"],
        "Garbanzos": ["Garbanzos", "Pasta de garbanzos"],
        "Patata": [],
        "Boniato": [],
        "Trigo tierno": [],
        "Cuscús": [],
        "Quinoa": [],
        "Fideos / noodles": [],
        "Fajitas": [],
        "Pan": [],
        "Avena": [],
        "Ñoquis": [],
    },
    "PROTEIN": {
        "Pollo": [
            "Pechuga",
            "Pechuga fileteada",
            "Contramuslo",
            "Contramuslo con piel",
            "Alitas",
            "Cuartos traseros",
            "Muslos",
        ],
        "Pavo": [
            "Filete de pechuga",
            "Filete de pechuga adobado",
        ],
        "Cerdo": [
            "Lomo",
            "Lomo adobado",
            "Solomillo",
            "Costillas",
        ],
        "Ternera": [
            "Filete",
            "Entrecot",
            "Solomillo",
            "Carne para guisar",
        ],
        "Pescado": [
            "Pescado blanco",
            "Salmón",
            "Pescado rebozado",
            "Merluza",
            "Bacalao",
            "Atún",
            "Dorada",
            "Lubina",
            "Pescado azul",
        ],
        "Gambas / langostinos": [],
        "Calamares": [],
        "Huevos": [],
        "Bacon": [
            "A tacos",
            "A tiras",
        ],
        "Jamón": [
            "A taquitos pequeños",
            "A taquitos grandes",
            "A tiras",
        ],
        "Frankfurt": [],
        "Salchichas": [
            "Cerdo",
            "Ternera",
            "Pollo",
            "Pavo",
        ],
        "Hamburguesa": [
            "Cerdo",
            "Ternera",
            "Pollo",
            "Pavo",
        ],
        "Albóndigas": [
            "Pollo",
            "Cerdo",
            "Ternera",
        ],
        "Carne picada": [
            "Pollo",
            "Ternera",
            "Cerdo",
            "Pavo",
        ],
        "Atún en lata": [],
        "Sardinas": [],
        "Tofu": [],
    },
    "VEGETABLE": {
        "Calabacín": [],
        "Espárragos verdes": [
            "Finos",
            "Gordos",
        ],
        "Brócoli": [],
        "Champiñones": [],
        "Setas variadas": [],
        "Pimiento": [
            "Rojo",
            "Verde",
        ],
        "Coliflor": [],
        "Zanahoria": [],
        "Berenjena": [],
        "Puerro": [],
        "Apio": [],
        "Cebolla": [],
        "Ajo": [],
        "Espinacas": [],
        "Judías verdes": [],
        "Guisantes": [],
        "Maíz": [],
        "Tomate": [],
        "Lechuga": [],
        "Alcachofa": [],
        "Acelgas": [],
    },
    "ELABORATION": {
        "Curry": [],
        "Soja": [],
        "Sésamo": [],
        "Teriyaki": [],
        "Mostaza": [],
        "Miel y mostaza": [],
        "Pesto": [],
        "Salsa de tomate": [],
        "Cerveza": [],
        "Vino blanco": [],
        "Vino tinto": [],
        "Guisado": [],
        "Estofado": [],
        "Salteado": [],
        "Wok": [],
        "Al horno": [],
        "A la plancha": [],
        "A la parrilla": [],
        "Rebozado": [],
        "Ajo y perejil": [],
        "Limón": [],
        "Miel": [],
        "Picante": [],
        "Especias": [],
        "Hierbas aromáticas": [],
    },
    "EXTRA": {
        "Preparado para lentejas": [],
        "Preparado de caldo": [],
        "Tortilla de patata preparada": [],
    },
}


class Command(BaseCommand):
    help = "Carga el catálogo inicial de componentes"

    def handle(self, *args, **options):
        for category, components in CATALOG.items():
            for component_name, variants in components.items():
                component, created = Component.objects.get_or_create(
                    name=component_name,
                    category=category,
                )

                if created:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Creado: {category} → {component_name}"
                        )
                    )

                for variant_name in variants:
                    variant, variant_created = (
                        ComponentVariant.objects.get_or_create(
                            component=component,
                            name=variant_name,
                        )
                    )

                    if variant_created:
                        self.stdout.write(
                            f"  Variante: {variant_name}"
                        )

        self.stdout.write(
            self.style.SUCCESS("\nCatálogo cargado correctamente.")
        )