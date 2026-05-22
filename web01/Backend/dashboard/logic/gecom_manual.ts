export const gecomManualData = [
  {
    title: `Anulacion de factura`,
    content: `Anulacion de factura

Herramientas→comprobantes( ver el numero de factura para anular)
Luego entrar en comprobantes→anular→letra y numero→confirma→b→c

Luego hay que cambiar la numeracion automatica en :

Parametros→puntos de trabajo→punto de venta afectado en las facturas realizadas, ejemplo 0001→modificar→numeradores→Elegir tipo de comprobante(ej, fact A, B , etc)→ colocar el numero correlativo correspondiente u obtener el número desde AFIP.

*En el caso que el comprobante tenga remito, hay que comenzar anular desde el remito para poder borrar la factura, nota de pedido, etc.


*las boletas en negro las anulamos sin borrar y sin cambiar la numeracion.`
  },
  {
    title: `Anulacion de REMITO`,
    content: `Anulacion de REMITO

Herramientas→comprobantes(Colocar periodo y dia-ver el numero de factura para anular)
Luego entrar en ventas→comprobantes→anular(para acceder al menu poner ESC una vez)→flecha arriba y poner REMITO numero(cerciorarse de poner el mes correcto)→confirma.Si proviene de una factura hay que borrar definitivamente y cambiar la correlatividad de parametros.Si es de una boleta en negro se anula sin borrar y sin cambiar la numeracion.


Luego hay que cambiar la numeracion automatica en :

Parametros→puntos de trabajo→punto de venta afectado en el remito afectado, ejemplo 0001→modificar→numeradores→Elegir tipo de comprobante remito→ colocar el numero correlativo correspondiente.`
  },
  {
    title: `Configuracion PDF Creator en Gecom`,
    content: `Configuracion PDF Creator

1-Configurar Chrome o cualquier buscador para abrir automaticamente el PDF.

2-En Pdf Creator:
Perfiles
Acciones→send/open→usar por defecto el visor de windows

3-En guardar→automatico (en carpeta de destino, crear una que diga PDF Creator dentro de la cazrpeta Documentos→ Behavior for exixting file→◉Asegure nombres unicos de archivo...→correcto→guardar y cerrar

4-Al crear el primer pdf el programa sugiere intalar`
  },
  {
    title: `datos de srl para gecom`,
    content: `ALVAREZ PLACAS S.R.L
C.U.I.T. Nº: 33-71848620-9
Av. Vergara 1605 - CP 1688 - Villa Santos Tesei- Bs.As.
Ing Brutos:33-71848620-9
Tel: 1160834918   Mail: info@alvarezplacas.com.ar
Inicio de Actividades:01-04-2024
www.alvarezplacas.com.ar`
  },
  {
    title: `Ejercicio nuevo Gecom`,
    content: `Ejercicio nuevo:
Antes que nada realizar el backup por si hay algún fallo.

Seguir con:
Herramientas→ iniciar ejercicio nuevo (doble clic)→aceptar. El sistema arroja por defecto numeracion correlativa, en este caso seria 2526(cambiar los dos primeros digitos para que no quede 2426)

Luego:
Herramientas→Especiales→Saldos iniciales(en el desplegable)dejar tildado todo y proceder.

Para finalizar:
Parametros→puntos de trabajo(modificar los relacionados con la tienda 1 en blanco. ejemplo 0001 y 0005 )→ventas→recibo(dejar un bache considerable para que en el ejercicio anterior se puedan ingresar los recibos faltantes.En el caso de no llegar a la numeracion establecida, anular los recibos que no se usaron en el ejercicio anterior).Hacer lo mismo en la solapa de compras, en las ordenes de pago.

Parametros→periodos habilitados(tildar los correspondientes al ejercicio)`
  },
  {
    title: `importacion de datos Gecom`,
    content: `IMPORTACION DATOS EN GECOM
--------------------------


1 Preparar archivo Excel 

*No dejar filas arriba y a la izquierda en blanco.
*No dejar datos vacios, en su defecto colocar asterisco(*)
*Los numeros de los rubros y subrubros tienen que estar en formato de texto(formato de celdas-numero-texto)
*Exportar en formato txt- texto con formato delimitado por espacios
*En el lugar que se guardó se genera un archivo con formato .prn (se tiene que guardar en el escritorio ya que si se guarda en una carpeta el GECOM no lo reconoce, o en sudefecto el nombre de la carpeta debe estar separado por guiones bajos.Luego (editar, boton derecho del mouse, cambiar nombre y poner txt como extension del archivo)
*Se recomienda que en el bloc de notas la primer referencia, en este caso CODIGO DE ARTICULO, esté ubicada en la primer columna(01).




2 Abrir el archivo con  bloc de notas

*Abajo de todo, teniendo la pantalla maximizada, verificar el numero de columna correspondiente para hacer la importacion en GECOM.




3 En GECOM 

*Ir a BASES-FORMATOS-IMPORTACION Y EXPORTACION
*Clic una vez en IMPORTACION DE ARTICULOS, luego clic en MODIFICAR
*En modificar:
ancho de columna 500, separador decimal (colocar una coma,)reg(poner1) col(colocar el numero de columna correspondiente que figura en el bloc de notas) variable (utilizar los predeterminados de GECOM)
*ANCHO, ejemplo:
CODIGO ARTICULO 01
DESCRIPCION 29
RUBRO(conviene que sea el subrubro ya que hay mas cantidad)58




4 Importar en GECOM

*Ir a STOCK-RUBROS Y ARTICULOS
*Control + clic en cualquier articulo en la columna descripcion(se pone en azul)
*Ir a HERRAMIENTAS Y FUNCIONES ESPECIALES
*En el desplegable poner IMPORTAR ARTICULOS
*Elegir la ruta del arxhivo txt
*Tilde verde(ejecutar)




5 Rearmar la estructura

*Control + clic en cualquier articulo en la columna descripcion(se pone en azul)
*Ir a HERRAMIENTAS Y FUNCIONES ESPECIALES
*En el desplegable poner REARMAR ESTRUCTURA`
  },
  {
    title: `Informe de ventas`,
    content: `VENTAS-INFORME DE VENTAS-COMPROBANTES(puede ser general o vendedor)

Si no se tilda TOTALES POR SITUACION DE IVA y TOTALES %IVA, SALE SIN TANTO DETALLE`
  },
  {
    title: `Ingreso de medios de pago al GECOM`,
    content: `INGRESO MEDIOS DE PAGO EN GECOM
-------------------------------


1*Si es un banco, en primer lugar hay que ingresarlo en la agenda, en el apartado VISTA.En ESPECIFICIDAD no tildar nada.Verificar que la casilla DISPONIBLE quede tildada.

2*Para hacer un plan de cuentas:

BANCOS :

BASES-CONTABLES-PLAN DE CUENTAS, copiar el que dice BANCOS, cambiar el nombre en este caso BCO GALICIA, tildar en disponible, RUBRO bancos, tildar imputable, ACEPTAR.
ASES-BANCARIAS-BANCOS, agregar(codigo 1, poner Banco Galicia, abreviatura GALICIA)Luego...
BASES-BANCARIAS-CUENTAS, agregar (codigo 1 , Banco Galicia, tipo de cuenta: caja de ahorro o cuenta corriente,datos de la cuenta, CBU, ficha agenda en este caso Banco Galicia, imputaciones bco Galicia, descripcion de asientos poner COMUN y COMPRAS

MERCADO PAGO:

BASES-CONTABLES-PLAN DE CUENTAS, agregar nuevo, en nombre poner MERCADOPAGO, RUBRO caja, disponible e imputable deben estar tildados, ACEPTAR.

Para contro caja:
parametros-contables-control caja`
  },
  {
    title: `Procedimiento pendientes por vendedor`,
    content: `Procedimiento revisar pendientes:


Ventas→pendientes→factura de ventas o notas de pedido

Icono de imprimir

Tipo "Completo"

Agrupacion por vendedor

No filtrar fecha, colocar todo por defecto


En excel quitar los cortes y pegados, las fechas mas actuales.

Ordenar columna de saldo y quitar las que figuran en cero

Filtar por vendedor y filtrar por numero de menor a mayor

Quitar columnas que no son necesarias.`
  },
  {
    title: `Ranking de articulos, clientes, etc`,
    content: `STOCK-INFORME MOVIMIENTOS-ESTADISTICA GENERAL ( o lo que se quiera buscar)`
  },
  {
    title: `RECUPERACION BACKUP`,
    content: `Al hacer una recuperacion de Backup:

*Cuando se pone la ruta del Backup poner barra / al final( o sea se copia y pega la ruta y se agrega la barra /)
*Si sale error y no te deja restaurar hay que ir a → bases→Nueva(desde copia) poner nombre cualquiera, por ejemplo nueva.Luego levantar el archivo de recuperacion.Una vez realizado cambiar nombre de la carpeta, en este caso nueva y poner el que corresponde al ejercicio ej AP2425, la carpeta AP2425 vieja borrarla , cerciorarse que dentro de la carpeta tenga muchos archivos y no dos o tres que quiere decir que se hizo mal la recuperacion.
Fijarse que la ruta de la lista sea \\server-alvarezp\c\gecom\datos\AP2425, en este ejemplo. BASES →LISTA`
  },
  {
    title: `Retenciones y percepciones`,
    content: `Retenciones y percepciones.

*Cuando un cliente es agente de retencion: Se va a la opcion de Cobranzas y se ingresa todos los datos en la parte de Pagos.

*Las percepciones se cargan en las compras.`
  },
  {
    title: `Temas Apertura SRL GECOM`,
    content: `*Cómo modificar numeración de un asiento?

Se cambia a mano para mantener la correlatividad del ejercicio anterior
Parametros→Punto de trabajo→0001→Modificar→Numeradores→Otros→Asiento(ahí colocar el número que corresponde)

*Cuando filtro un periodo  por qué no coicide la fecha de ejercicio?

Porque Gecom pone 13 mese por defecto.


*Cómo ingresar comprobante de pago, para el deposito de la constitucion de la sociedad?

Compras→pagos→donde dice proveedor poner F3

Otra variante sería agregarlo como asiento

Contabilidad→asientos→agregar→colocar descripcion→etc ( no tildar cuenta corriente)


*Dónde se ve libro iva, iva compras, iva ventas?

Habilitar

Parametros→generales→impositivos→en presentacion de comprobantes AFIP elegir LIBRO IVA DIGITAL→aceptar

Ir luego

Impuestos→exportaciones AFIP→libro IVA digital→ esta compras y ventas →clic en el icono que tiene el cuadrado, triangulo y circulo(generar registros)→colocar el periodo y aceptar→para generar los resultador de exportacion clic en el icono que tiene una hoja vertical y otra horizontal con la flecha curvada hacia abajo.`
  },
  {
    title: `VER DEUDA DE CLIENTES`,
    content: `Por cuenta de corriente:

VENTAS-CUENTA CORRIENTE-COMPOSICION DE SALDOS

Por resumen de cuenta:

VENTAS-RESUMEN DE CUENTA, poner cliente, rango de fechas, etc.`
  }
];
