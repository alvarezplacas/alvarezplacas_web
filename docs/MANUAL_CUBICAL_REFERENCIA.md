# Manual de Referencias y Uso de Despiece y Herrajes en CubiCal PRO
*Desarrollado para Alvarez Placas — Tu aliado en carpintería industrial*

Bienvenidos a la guía definitiva de carpintería y despiece para la plataforma **CubiCal PRO v1.2**. Si eres un aficionado que está dando sus primeros pasos en el armado de muebles o un carpintero profesional buscando optimizar sus tiempos de producción, este manual contiene las reglas de oro de la industria que garantizan despieces exactos y sin sorpresas.

---

## 1. El Arte del Despiece: "Medir dos veces, cortar una"

Inspirado en el flujo de pre-construcción 3D de herramientas líderes de diseño como SketchUp Woodworking, el despiece consiste en tomar las dimensiones exteriores de un mueble y dividirlas en cada una de las placas (laterales, base, estantes, frentes de cajón) que lo componen, restando los espesores de las placas adyacentes y las holguras necesarias para que los herrajes funcionen.

En la Argentina y América Latina, el espesor estándar más utilizado para melamina es de **18 mm**. CubiCal PRO utiliza este espesor por defecto para todos sus cálculos estructurales.

---

## 2. Correderas Telescópicas: La Regla de los 26 mm

Las correderas telescópicas son el estándar de oro para cajoneras modernas. Soportan gran capacidad de peso, tienen deslizamiento suave y permiten una apertura total del cajón.

### La Holgura Obligatoria
Cualquier corredera telescópica comercial (ya sea común, cierre suave o push-open) requiere exactamente **13 mm de espacio libre por lado** entre el lateral interno del mueble y el lateral del cajón. 

> [!IMPORTANT]
> **Fórmula de Descuento de Ancho para Contra-Frentes de Cajón:**
> Si tienes un mueble de ancho exterior `W` y laterales de `18 mm`:
> * Ancho Interior del Mueble = `W - 36 mm` (laterales izquierdo y derecho).
> * Espacio útil para el Cajón = `Ancho Interior - 26 mm` (holgura de correderas).
> * Ancho del Contra-Frente de Cajón (interior) = `Ancho Interior - 26 mm - 36 mm` (laterales del propio cajón).
>
> **CubiCal PRO hace este cálculo por ti automáticamente** para evitar que cortes piezas que luego queden trabadas o demasiado sueltas.

### Longitudes Comerciales Estándar
Las correderas se venden en largos que varían de 50 en 50 mm. Debes elegir siempre una corredera que sea al menos **50 mm más corta** que la profundidad total de tu mueble para evitar que golpee el fondo MDF trasero:

| Profundidad del Mueble (mm) | Largo de Corredera Recomendado (mm) |
| :--- | :--- |
| **300 mm** | 250 mm |
| **350 mm** | 300 mm |
| **400 mm** | 350 mm |
| **450 mm** | 400 mm |
| **500 mm** | 450 mm |
| **550 mm** | 500 mm |
| **600 mm** o más | 550 mm / 600 mm |

---

## 3. Bisagras de Cazoleta (35mm): Los Tres Codos Fundamentales

Las bisagras de cazoleta permiten regular la posición de las puertas en tres dimensiones (alto, ancho y profundidad), por lo que son ideales para corregir pequeñas imperfecciones de armado. 

La elección de la bisagra adecuada depende de **cómo quieras que tape la puerta el marco frontal (lateral) del mueble**:

```
[ Codo 0 (Superpuesta) ]       [ Codo 9 (Semi-superpuesta) ]       [ Codo 18 (Embutida) ]
      _________                            _________                         _________
     | Lateral |                          | Lateral |                       | Lateral |
   ==|_________|                        ==|_________|                       |_________|==
     [ Puerta  ]                            [Puerta]                            [Puerta]
  (Cubre todo el canto)                 (Cubre medio canto)                 (Queda adentro)
```

### 1. Bisagra Codo 0 (Recta o Superpuesta)
* **¿Qué es?** Es la bisagra más común. Al cerrar la puerta, esta **cubre por completo el canto frontal** del lateral del mueble (los 18mm de espesor).
* **¿Cuándo usarla?** En los laterales exteriores de cualquier mueble individual (un bajo mesada simple, una alacena solitaria, etc.). Es la opción por defecto en carpintería.

### 2. Bisagra Codo 9 (Semicodo o Semi-superpuesta)
* **¿Qué es?** Al cerrar la puerta, esta cubre únicamente **la mitad del canto frontal** del lateral (aproximadamente 9 mm).
* **¿Cuándo usarla?** Cuando tienes dos puertas consecutivas que se abren hacia lados opuestos y **comparten el mismo lateral central** divisorio. Esto evita que los frentes de las puertas choquen al estar cerrados.

### 3. Bisagra Codo 18 (Codo o Embutida)
* **¿Qué es?** La puerta queda **totalmente adentro** del marco del mueble. Al cerrarla, el canto frontal del mueble (los 18mm) queda completamente a la vista.
* **¿Cuándo usarla?** En diseños premium o de estilo industrial donde se quiere lucir el marco perimetral de madera o melamina de otro color, o cuando el diseño requiere frentes limpios embutidos.

---

## 4. Tabla de Distribución de Bisagras por Altura de Puerta

Para garantizar que una puerta no se curve con el paso del tiempo y que las bisagras soporten el peso del tablero, sigue esta regla de distribución recomendada en la industria:

* **Hasta 900 mm de altura:** 2 bisagras por puerta.
* **De 901 mm a 1500 mm:** 3 bisagras por puerta.
* **De 1501 mm a 2100 mm:** 4 bisagras por puerta.
* **Más de 2100 mm:** 5 bisagras por puerta.

---

## 5. Glosario Rápido para Aficionados

* **MDF (Tablero de Fibra de Densidad Media):** Madera reconstituida, ideal para fondos de cajones y traseras de muebles. CubiCal calcula los fondos en MDF de 3 mm para no encarecer tu proyecto.
* **Tapacantos:** Tira plástica (PVC) que se adhiere a los bordes expuestos de las placas cortadas para protegerlas de la humedad y darles una terminación estética.
* **Confirmat M7x50:** Tornillo especial de cuerpo ancho diseñado para ensamblar placas de melamina de 18mm de forma firme y segura, sin que se barra la rosca interna de la madera.
