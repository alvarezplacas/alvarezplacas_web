#Control de stock 
##Tableros, almacenamiento en direcuts con postgreeSQL V16

1. Vamos a desarrollar un nuevo usuario con un dashboard pensado para ser usado con teléfono móvil. El usuario trabaja en el deposito exclusivamente con tableros, será el encargado de ingresar de forma intuitiva los tableros que existen en el deposito. 
2. Las métricas introducidas se verán reflejadas en el dashboar del resto agregaremos un nuevo icono para poder visualizar el stock en tiempo real.

#Como se ingresan los datos
1.UX: El ingreso de información debe ser muy fácil pensado para una persona rudimentaria que trabaja en un galpón manejando maquinas debe poder visualizar rápidamente las placas. 
2. Los tableros están en "Torres" pensando la disposición de los tableros como en una mesa de ajedrez, el operador ingresara lo que contiene cada torre, siendo la primer torre "A1", estas torres contienen Tableros enteros, luego tenemos en forma vertical apiladas en "plaqueros" 1/2 tableros, deberíamos denominarlos "Plaquero 1" y sus sucesivas espacios: 1, 2, 3 Etc. 
3. Para agregar rápidamente el tablero existente puede seleccionar de una lista desplegable utilizando el catalogo existente en directus, donde podrá ir filtrando por marca (Egger, Faplac, Etc) para buscar rápidamente y agregarle cantidad y torre en la que se encuentra. Para su mejor visualización debe mostrar la imagen y nombre del producto a media pantalla, luego le queda por cantidad y torre en la que se encuentra o plaquero. 
4. A medida que se carga el stock se tiene que poder ver la cantidad existente en el catalogador. 

Desarrollar un plan superador, investigar otros sitios web avanzados para incorporar ideas superadoras.
Pensar carga de stock similar para herrajes, insumos, tapacantos con la diferencia que no están en torres están dispersos. 