# Roadmap: Superación del Optimizador Industrial

Este documento registra los hitos necesarios para superar la funcionalidad de Lepton Optimizer y cumplir con las expectativas de Alvarez Placas.

## 1. Interfaz y Experiencia de Usuario (UX)
- [x] Rediseñar el formulario Lepton para evitar desplazamientos (Grid fijo).
- [x] Implementar visualización de medidas sobre las líneas (v5.2).
- [ ] Reducir el canvas para mejorar el flujo de lectura.
- [ ] Eliminar datos redundantes dentro de las piezas.

## 2. Gestión de Sesión y Flujo de Trabajo
- [ ] **Multi-Tablero**: Permitir al usuario guardar la optimización actual y volver a la lista principal para agregar otra marca/espesor.
- [ ] **Dashboard de Proyectos**: Pantalla inicial con las optimizaciones activas y opción de editar/borrar.
- [ ] **Botón Re-Calcular**: Ejecutar nuevas pasadas del algoritmo ASH para buscar mejores patrones.

## 3. Funcionalidades Avanzadas (The "Lepton" Killer)
- [ ] **Drag & Drop Manual**: Permitir al usuario mover piezas con el ratón sobre el canvas para ajustes finales de último minuto.
- [ ] **Snap Grid**: Ayuda visual al mover piezas para respetar el espesor de la sierra (4mm).
- [ ] **Exportación PDF Industrial**: Generar hoja de corte con etiquetas para el taller.

## 4. Persistencia (Fase 3)
- [ ] Sincronización con PostgreSQL V16.
- [ ] Historial de optimizaciones por cliente.
