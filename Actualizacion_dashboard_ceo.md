# Analizar funcionamiento del reloj sync_reloj.js auditar codigo en busca de errores y optimizarlo si es necesario

# Actualizar diseño de

<https://alvarezplacas.com.ar/ceo/personal>

1. Reducir titulo "Gestion De Personal" colocar luego version del dashboard
2. A continuacion boton de menu para mostrar la nomina de empleado y presentismo.
3. En mesa de trabajo de presentismo se tiene que poder visualizar estadisticas generales del personal. por semana por mes por año, diario.tambien la cantidad de horas trabajadas y la cantidad de horas extras, colocar boton de exportar excel con los datos correspondientes. boton para imprimir datos.
4. En un panel arriba se dara alerta de el nombre de la persona ausente indicando la cantidad de faltas en el mes
5. En mesa de trabajo de nomina; lista de empleados con opciones de editar , borrar y agregar personal.
6. En la nomina de empleados se debe agregar, la forma de pago, y en presentismo se debe agregar, las horas trabajadas y las horas extras, la cantidad de faltas en el mes, indumentaria entregada y fecha de entrega, observaciones y adelantos.
7. Analizar exautivamente la documentacion de los empleados en para obtener datos para su base de datos,se debe crear en directus en segun los datos que existan en la siguiente carpeta D:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\web01\Empleados\DRIVE_MARU_extracted\DRIVE MARU\RRHH
para el manejo de personal.
8. Crea un plan optimizado y mejorado para su control diario.
------------------------------------------------------------------
# Actualizacion importante para Smart Cut 
## Aclarar En Agosto incorporacion de nuevas herramientas para nuestros aliados comerciales!
1. Analiza en la web todo lo refernte a soft SCM Maestro Converter Cut intenta obtener acceso a su codigo.
Rol y Contexto: Eres un desarrollador Backend experto (Node.js/Python) encargado de construir una integración industrial limpia a través de nuestro VPS. Administramos la plataforma web SmartCut PRO (v5.6.5), un motor de corte industrial
. Nuestro cliente acaba de adquirir una seccionadora automática horizontal SCM Gabbiani F
. Necesitamos automatizar el envío de planos de corte desde nuestro VPS directamente al ecosistema de software de la máquina SCM.
Arquitectura de Destino: La máquina utiliza un software puente llamado Maestro Converter Cut, diseñado para absorber datos de optimizadores de terceros
. Este conversor espera recibir la lista de corte optimizada en un archivo estructurado con formato .ptx o un .csv
. Una vez ingerido, el conversor transmite automáticamente los programas a la pantalla táctil de la máquina, operada por el software Maestro Active Cut
.
Requisitos del Desarrollo (Tu Tarea): Necesito que escribas el código para el endpoint de nuestro VPS que interceptará el proyecto de corte guardado en SmartCut PRO y generará el archivo de exportación compatible con SCM. Debes cumplir estrictamente con las siguientes reglas de negocio:
Formato de Salida: Escribe un generador/parser que tome el objeto JSON de nuestro algoritmo (piezas, dimensiones, orientación de veta MIX/HOR/VER) y lo convierta en un archivo .csv estructurado o .ptx estándar
.
Lógica de Descuento de Tapacantos (CRÍTICO): SmartCut PRO inyecta tapacantos estructurales en el cálculo
. Las medidas ingresadas por el usuario son medidas finales. Antes de escribir las dimensiones de cada pieza en el archivo .csv/.ptx, el código debe identificar si la pieza tiene tapacantos aplicados (espesores de 0.45mm, 1.0mm o 2.0mm) y restar automáticamente esos valores de las dimensiones de la pieza a cortar
. La máquina debe cortar la pieza más pequeña para que, tras pasar por la pegadora de cantos, alcance la medida final exacta.
Etiquetado y Metadatos: Asegúrate de que el script asigne correctamente los metadatos a cada pieza (Nombre del cliente, Descripción de la pieza, Material/Color) para que el "Editor de etiquetas" del sistema Maestro de SCM pueda imprimirlas correctamente en la fábrica
.
Entrega limpia: El endpoint debe generar este archivo, guardarlo temporalmente en el VPS y devolver un enlace de descarga segura, o bien enviarlo por SFTP/API a la carpeta compartida que Maestro Converter Cut esté monitoreando en la red de la fábrica.
Por favor, comienza proponiendo la estructura de clases/funciones para el "SCM_Export_Service" y define cómo estructurarías las cabeceras (headers) del CSV basándote en estándares de importación de listas de corte industriales. No asumas librerías extrañas, mantén el código eficiente y nativo.

2.
Propuesta de Textos para la Interfaz (UI Prompt)
[Título - Etiqueta Destacada] 🚀 NUEVO: Corte Industrial Premium (Seccionadora SCM Gabbiani F)
[Descripción Principal] Eleva la calidad de tu proyecto utilizando nuestra nueva seccionadora automática horizontal. Al elegir esta opción, tus planos adquieren un estado de producción preferencial: el algoritmo de SmartCut PRO enviará los planos optimizados de forma remota y directa a la máquina para un procesamiento de máxima prioridad
.
[Aviso de Costos - Letra clara y visible] Aviso de facturación: Por tratarse de un servicio automatizado de alta precisión que permite cortes simultáneos y un escuadrado milimétrico, el costo por placa/corte es ligeramente superior al de nuestro servicio estándar (cortadoras verticales manuales). Es la opción ideal para proyectos que exigen un nivel de detalle perfecto.
[Sección Técnica Crítica: Pegado de Cantos] ⚠️ Ajuste de Tapacantos y Medidas: Para garantizar un flujo perfecto entre la nueva seccionadora y nuestra pegadora de cantos, recuerda la regla de oro de SmartCut PRO: La medida que ingresas en la lista de piezas es la MEDIDA FINAL que deseas obtener
.
Ingresa las dimensiones finales de tu pieza.
Selecciona el espesor del tapacanto activo (0.45 mm, 1.0 mm o 2.0 mm) en la grilla
.
El sistema hará el descuento del espesor automáticamente antes de enviar el plano a la seccionadora. ¡No restes los milímetros manualmente!
[Botones de Acción] [ Seleccionar Corte Premium (Gabbiani F) ]   [ Mantener Corte Vertical Estándar ]

--------------------------------------------------------------------------------
Notas de implementación para tu desarrollador (Astro / SmartCut PRO):
Lógica de Tapacantos: En tu sistema actual v5.6.5, el reporte de tapacantos para el taller se inyecta de forma estructural
. Es vital que, si el cliente elige la Gabbiani F, el archivo que genera SmartCut PRO (el que absorbe Maestro Converter Cut) ya lleve el descuento del tapacanto realizado en las dimensiones de la pieza. La máquina cortará el panel un poco más chico para que, al pasar por la pegadora de cantos, recupere la medida final solicitada por el usuario.
Jerarquía Visual: Te sugiero colocar este prompt justo antes de que el usuario presione el botón GUARDAR o IMPRIMIR
, como un paso de "Selección de Calidad de Producción".
Justificación del Costo: Al mencionar explícitamente el "estado preferencial" y la conexión directa a la máquina, el cliente percibe el aumento de precio no como un gasto, sino como un servicio VIP que acortará sus tiempos de espera en los "7 días hábiles" estándar que maneja tu empresa
.
