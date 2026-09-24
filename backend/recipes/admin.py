from django.contrib import admin

from .models import Component, ComponentVariant, SavedMenu


admin.site.register(Component)
admin.site.register(ComponentVariant)
admin.site.register(SavedMenu)