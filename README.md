# EDY Offline v1.2 — Inventario de abastecimiento

## Novedades
- Inventario familiar inicial con 19 productos reales de despensa, botiquín y herramientas.
- Cantidades, unidades, marcas y vencimientos precargados.
- Gestión por lotes con consumo FIFO: primero descuenta del lote que vence antes.
- Botones rápidos **Agregar** y **Consumir** dentro de cada producto.
- Stock mínimo y stock objetivo.
- Indicador de próximo vencimiento en la lista.
- Compatibilidad con el inventario local existente: los nuevos productos se incorporan sin borrar los anteriores.
- Actualización del caché offline a la versión 1.2.

## Privacidad
Los datos permanecen en el dispositivo mediante almacenamiento local. Las fotografías continúan guardándose localmente con IndexedDB. El archivo `inventory.json` contiene únicamente el inventario inicial precargado y no incluye documentación personal, números de serie ni fotografías.
