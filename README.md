# Menú semanal

Este proyecto se ha desarrollado mayoritariamente con ayuda de inteligencia artificial para uso personal. Nace para facilitar la planificación de menús y la lista de la compra en casa, y va evolucionando según nuestras necesidades.

App publicada: https://laisolizq.github.io/weekly_menu/

## Desarrollo

```bash
npm install
npm run dev
```

El frontend funciona sin Django. La semana, la asistencia y las recetas propias se guardan en este navegador, sin sincronización entre dispositivos.

## Planificar

1. «Vaciar semana» en «Mi semana» quita los platos y reinicia la asistencia a 2 por turno. Conserva recetas y componentes. «Deshacer vaciado» recupera la semana anterior durante los siguientes 10 segundos (o hasta recargar la página).
2. En «Quién come», cambia solo las excepciones: 0, 1, 2 o + para invitados.
3. «Listo, elegir menús» recorre los turnos con gente en casa y usa sus cantidades sin volver a preguntarlas.
4. «Mi semana» permite editar platos y personas. La compra se recalcula.

## Componentes en JSON

Edita `public/components.json`. Es el catálogo que se incluye en el despliegue; ya no se sobrescribe descargando una release. Al recargar la app se vuelve a leer y se actualiza la copia local. Sin conexión se utiliza el catálogo guardado.

Ejemplo de componente:

```json
{
  "id": "cuscus-integral",
  "name": "Cuscús integral",
  "category": "CARB",
  "variants": []
}
```

Categorías: `CARB`, `PROTEIN`, `VEGETABLE`, `CONDIMENT` (salsas, condimentos, caldos y preparados que se compran), `ELABORATION` (formas de preparación que no se compran) y `EXTRA`.

Para variantes, usa `"variants": [{ "id": "pollo-pechuga", "name": "Pechuga" }]`.

Usa IDs únicos y estables. Cambia el nombre conservando el ID para mantener las referencias de recetas y semanas guardadas. Los componentes antiguos en la copia local se conservan aunque desaparezcan del JSON, para no romper esas referencias. El JSON tiene prioridad al actualizar un ID existente. Los componentes añadidos desde la interfaz también se conservan localmente.

Para publicar cambios, utiliza el despliegue habitual del repositorio. Las recetas se crean en «Mis recetas» con tarjetas de hidratos, proteínas, verduras, salsas/condimentos, preparación y extras; admiten variantes y etiquetas de comida/cena.

## Comprobaciones

```bash
npm run build
npm run lint
npm test
```

## Llevar las recetas del móvil al catálogo público

1. En el móvil, guarda tus recetas y pulsa **Descargar recetas JSON** en «Mis recetas».
2. Pasa `recipes.json` al ordenador. Incluye las recetas personales y compartidas, sus etiquetas, variantes y todo el catálogo de componentes. No incluye tu planificación semanal ni la asistencia.
3. Sustituye `public/recipes.json` en este proyecto por el archivo descargado. Conserva una copia del archivo anterior si quieres poder recuperarlo. Para combinar exportaciones de varios dispositivos, une `recipes` y `components` por su `id` sin cambiar las referencias.
4. Ejecuta `npm run build` y publica con el despliegue habitual. Al abrir o recargar la app, todos reciben las recetas y componentes del archivo, que también se guardan para usarlos sin conexión.

Descargar o pasar el archivo al ordenador no lo publica automáticamente: hay que incorporarlo al proyecto y desplegar. Las recetas personales ya guardadas en cada navegador se conservan; si coinciden por ID con una compartida, tiene prioridad la personal. Las recetas compartidas se gestionan desde el JSON del proyecto.


## Salsas y preparación

La lista de la compra excluye siempre los componentes `ELABORATION`, incluidos los métodos nuevos que añadas. Soja, curry, salsas, caldos y preparados pertenecen a `CONDIMENT` y sí se suman a las raciones de la compra.

Las recetas usan `meal.condiments` y `meal.elaborations` por separado. La descarga de recetas utiliza el formato `version: 2`. La app sigue leyendo exportaciones `version: 1`, separa los métodos conocidos de los condimentos y conserva los IDs y las raciones. El catálogo local anterior y las semanas/recetas guardadas se adaptan al abrir la app.
