# -*- coding: utf-8 -*-
"""
Generates GCOM import files with inverse rounding calculations, proper rubro letters, 
and account numbers (cuenta contable) mapped from the PostgreSQL database.

=======================================================
CONFIGURACION REQUERIDA EN GECOM (IMPORTACION DE TXT)
-------------------------------------------------------
Ancho: 500  |  Separador decimal: ,

Variables posicionales:
  1. CODIGO ARTICULO     | Caracteres         | Col: 1   | Ancho: 11
  2. DESCRIPCION         | Caracteres         | Col: 13  | Ancho: 40
  3. RUBRO               | Caracteres         | Col: 60  | Ancho: 4
  4. IMPUTACION COMPRA   | Entero blanqueado  | Col: 70  | Ancho: 6
  5. IMPUTACION VENTA    | Entero blanqueado  | Col: 85  | Ancho: 6
=======================================================

Outputs:
1. importacion_articulos.txt (100 chars, uses above layout)
2. importacion_precios.txt (32 chars: SKU, List Number, Costo Inverso)
3. precios_redondeados.txt (70 chars: SKU, Description, Gap, Cuenta Contable)
"""
import os
import re
import math
import psycopg2

# Paths
OUTPUT_DIR = r"d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\gcom"
ARTICULOS_TXT = os.path.join(OUTPUT_DIR, "ART.TXT")
PRECIOS_TXT = os.path.join(OUTPUT_DIR, "PRE.TXT")
REDONDEADOS_TXT = os.path.join(OUTPUT_DIR, "RED.TXT")

def clean_description(desc):
    """Clean description to fit GCOM constraints (uppercase, no accents, max 40/47 chars)."""
    if not desc:
        return ""
    desc = desc.replace(r"\n", " ").replace(r"\r", " ")
    desc = desc.replace("\n", " ").replace("\r", " ")
    
    # Translate accents and special Spanish characters
    trans = str.maketrans(
        "áéíóúüñÁÉÍÓÚÜÑ",
        "aeiouunAEIOUUN"
    )
    desc = desc.translate(trans)
    desc = desc.upper()
    
    # Convertir puntuación común en espacios para no unir números (ej 1/4 -> 1 4)
    import re
    desc = re.sub(r'[.,:/_]', ' ', desc)
    # Eliminar explícitamente puntos suspensivos o puntos restantes
    desc = desc.replace('.', '')
    # Eliminar cualquier otro caracter que no sea alfanumérico, espacio o guión
    desc = re.sub(r'[^A-Z0-9\s-]', '', desc)
    
    # Reducir espacios múltiples a uno solo
    desc = re.sub(r'\s+', ' ', desc)
    
    # Global brand abbreviation (replace full names with 3 letters)
    desc = re.sub(r'\bEGGER\b', 'EGG', desc)
    desc = re.sub(r'\bSADEPAN\b', 'SAD', desc)
    desc = re.sub(r'\bFAPLAC\b', 'FAP', desc)
    desc = re.sub(r'\bNOVAPLAC\b', 'NOV', desc)
    desc = re.sub(r'\bNOVA\b', 'NOV', desc)
    desc = re.sub(r'\bEINHELL\b', 'EIN', desc)
    desc = re.sub(r'\bGREENWAY\b', 'GRE', desc)
    desc = re.sub(r'\bCANTOCHAP\b', 'CAN', desc)
    desc = re.sub(r'\bKEKOL\b', 'KEK', desc)
    desc = re.sub(r'\bCUBER\b', 'CUB', desc)
    desc = re.sub(r'\bMACAVI\b', 'MAC', desc)
    
    # Remove redundant EGG EGG if any
    desc = re.sub(r'\bEGG EGG\b', 'EGG', desc)
    
    # Abbreviation dictionary
    abbreviations = {
        r'\bAGLOMERADO\b': 'AGLO',
        r'\bENCHAPADOS\b': 'ENC',
        r'\bENCHAPADO\b': 'ENC',
        r'\bESPESOR\b': 'ESP',
        r'\bSOPORTE\b': 'SOP',
        r'\bPLACARD\b': 'PLAC',
        r'\bINALAMBRICA\b': 'INAL',
        r'\bINALAMBRICO\b': 'INAL',
        r'\bELECTRICA\b': 'ELEC',
        r'\bELECTRICO\b': 'ELEC',
        r'\bBATERIA\b': 'BAT',
        r'\bAMOLADORA\b': 'AMOL',
        r'\bTALADRO\b': 'TAL',
        r'\bASPIRADORA\b': 'ASP',
        r'\bLIJADORA\b': 'LIJ',
        r'\bMOTOSIERRA\b': 'MOTO',
        r'\bINGLETEADORA\b': 'INGL',
        r'\bCORTADORA\b': 'CORT',
        r'\bBORDEADORA\b': 'BORD',
        r'\bMEZCLADOR\b': 'MEZC',
        r'\bACCESORIOS\b': 'ACC',
        r'\bACCESORIO\b': 'ACC',
        r'\bSISTEMA\b': 'SIST',
        r'\bTELESCOPICA\b': 'TELES',
        r'\bCORREDERA\b': 'CORR',
        r'\bCORREDIZA\b': 'CORR',
        r'\bPERFILES\b': 'PERF',
        r'\bBISAGRA\b': 'BIS',
        r'\bTAPAJUNTA\b': 'TAPA',
        r'\bELEVADORES\b': 'ELEV',
        r'\bCAJONES\b': 'CAJ',
        r'\bCUCHILLA\b': 'CUCH',
        r'\bCEPILLADO\b': 'CEP',
        r'\bCEPILLO\b': 'CEP',
        r'\bCARRETEL\b': 'CARR',
        r'\bCUADROS\b': 'CUAD',
        r'\bCIRCULAR\b': 'CIRC'
    }
    for pattern, replacement in abbreviations.items():
        desc = re.sub(pattern, replacement, desc)
    
    return desc.strip()

def calculate_inverse_price(cost, margin_percent, iva_percent):
    """
    1. Ideal public price = cost * (1 + margin) * (1 + IVA)
    2. Round to nearest 100 pesos (e.g. Math.ceil(ideal/100) * 100)
    3. Inverse cost = rounded / ((1 + margin) * (1 + IVA))
    """
    if cost is None or cost <= 0:
        return 0.0
    
    margin_mult = 1.0 + (float(margin_percent or 30.0) / 100.0)
    iva_mult = 1.0 + (float(iva_percent or 21.0) / 100.0)
    
    ideal_price = cost * margin_mult * iva_mult
    # Round to nearest 100 pesos (commercial rounding)
    rounded_price = math.ceil(ideal_price / 100.0) * 100.0
    
    # Inverse cost GCOM expects
    inverse_cost = rounded_price / (margin_mult * iva_mult)
    return inverse_cost

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("[1] Connecting to PostgreSQL database...")
    try:
        conn = psycopg2.connect("postgresql://alvarez_admin:AlvarezAdmin2026@100.127.6.20:5432/alvarezplacas")
    except Exception:
        try:
            conn = psycopg2.connect("postgresql://alvarez_admin:AlvarezAdmin2026@localhost:5433/alvarezplacas")
        except Exception as e:
            print(f"❌ Error connecting to database: {e}")
            return

    cur = conn.cursor()
    # Query products including rubro letter, account numbers, and brand name
    query = """
        SELECT p.sku, p.nombre, p.precio_efectivo, p."precio_L1", p.iva_porcentaje, p.margen_efectivo, p."Estado", 
               r.letra as rubro_letra, p.codigo_contable, m.nombre as marca_nombre
        FROM "Productos" p
        LEFT JOIN marcas m ON p.marca = m.id
        LEFT JOIN "Rubros" r ON p.rubro = r.id
        WHERE p."Estado" LIKE '%Stock%' AND p.marca IS NOT NULL AND p.rubro IS NOT NULL
        ORDER BY p.sku;
    """
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    print(f"  Loaded {len(rows)} active products from database.")

    print("\n[2] Generating GCOM posicional files...")
    lines_articulos = []
    lines_precios = []
    lines_redondeados = []
    
    seen_descriptions_47 = {}
    seen_descriptions_40 = {}

    for row in rows:
        sku = (row[0] or "").strip()
        nombre = (row[1] or "").strip()
        precio_efectivo = row[2]
        precio_l1 = row[3]
        iva_porcentaje = row[4]
        margen_efectivo = row[5]
        rubro_letra = (row[7] or "X").strip()
        codigo_contable = (row[8] or "").strip()
        marca_nombre = (row[9] or "").strip()
        
        # Clean SKU (GCOM wants alphanumeric without hyphens)
        sku_clean = sku.replace("-", "")
        
        # Determine cost (use L1 for Placas/Maderas, precio_efectivo for others)
        cost = float(precio_l1) if (sku.startswith("M-") and precio_l1 is not None) else float(precio_efectivo or 0.0)
        
        # Calculate GCOM Costo Inverso
        costo_inverso = calculate_inverse_price(cost, margen_efectivo, iva_porcentaje)
        costo_inverso_str = f"{costo_inverso:.2f}".replace(".", ",")
        
        # Clean name/descriptions
        desc_base = clean_description(nombre)
        
        # 1. Description for Articulos (47 chars max)
        desc_47 = desc_base[:47]
        if desc_47 in seen_descriptions_47:
            suffix = f" {sku[-4:]}"
            desc_47 = desc_47[:42] + suffix
            counter = 1
            while desc_47 in seen_descriptions_47:
                desc_47 = f"{desc_47[:39]}_{counter}{suffix}"
                counter += 1
        seen_descriptions_47[desc_47] = sku
        
        # 2. Description for Redondeados (40 chars max)
        desc_40 = desc_base[:40]
        if desc_40 in seen_descriptions_40:
            suffix = f" {sku[-4:]}"
            desc_40 = desc_40[:35] + suffix
            counter = 1
            while desc_40 in seen_descriptions_40:
                desc_40 = f"{desc_40[:32]}_{counter}{suffix}"
                counter += 1
        seen_descriptions_40[desc_40] = sku
        
        # Extract GCOM numeric account number (e.g. Ag0001 -> 0001)
        cuenta_num = codigo_contable[2:] if codigo_contable.startswith("Ag") else codigo_contable
        if not cuenta_num:
            cuenta_num = "0000"

        # --- A. importacion_articulos.txt (100 characters) ---
        # 0:11   -> SKU (Col 1, Ancho 11)
        # 12:52  -> Description (Col 13, Ancho 40)
        # 59:63  -> Rubro Letter (Col 60, Ancho 4)
        # 69:75  -> Imputacion Compra (Col 70, Ancho 6)
        # 84:90  -> Imputacion Venta (Col 85, Ancho 6)
        line_art = list(" " * 100)
        sku_art = sku_clean[:11].ljust(11)
        for i, c in enumerate(sku_art):
            line_art[0 + i] = c
            
        desc_art = desc_40.ljust(40) # usar desc_40 ya que ahora el ancho es 40
        for i, c in enumerate(desc_art):
            line_art[12 + i] = c
            
        rubro_art = rubro_letra[:4].ljust(4)
        for i, c in enumerate(rubro_art):
            line_art[59 + i] = c
            
        # Imputacion Compra y Venta (utiliza cuenta_num que deriva de codigo_contable)
        cuenta_pad = cuenta_num[:6].ljust(6)
        for i, c in enumerate(cuenta_pad):
            line_art[69 + i] = c
            line_art[84 + i] = c
            
        lines_articulos.append("".join(line_art))

        # --- B. importacion_precios.txt (32 characters) ---
        # 0:12   -> SKU (12 chars)
        # 12:15  -> List Number (3 chars)
        # 15:32  -> Price (17 chars)
        line_prc = list(" " * 32)
        for i, c in enumerate(sku_clean[:12].ljust(12)):
            line_prc[0 + i] = c
        for i, c in enumerate("1".ljust(3)):
            line_prc[12 + i] = c
        for i, c in enumerate(costo_inverso_str[:17].rjust(17)):
            line_prc[15 + i] = c
        lines_precios.append("".join(line_prc))

        # --- C. precios_redondeados.txt (70 characters) ---
        # 0:15   -> SKU (15 chars)
        # 15:55  -> Description (40 chars)
        # 55:62  -> Gap (7 chars)
        # 62:70  -> Cuenta Contable (8 chars)
        line_red = list(" " * 70)
        for i, c in enumerate(sku_clean[:15].ljust(15)):
            line_red[0 + i] = c
        for i, c in enumerate(desc_40.ljust(40)):
            line_red[15 + i] = c
        # Gap (55:62) remains spaces
        for i, c in enumerate(cuenta_num[:8].ljust(8)):
            line_red[62 + i] = c
        lines_redondeados.append("".join(line_red))

    # Save all files in ANSI format
    with open(ARTICULOS_TXT, 'w', encoding='ansi') as f:
        f.write("\n".join(lines_articulos) + "\n")
    with open(PRECIOS_TXT, 'w', encoding='ansi') as f:
        f.write("\n".join(lines_precios) + "\n")
    with open(REDONDEADOS_TXT, 'w', encoding='ansi') as f:
        f.write("\n".join(lines_redondeados) + "\n")

    print(f"\n[3] Export files successfully saved:")
    print(f"    - {ARTICULOS_TXT} ({os.path.getsize(ARTICULOS_TXT):,} bytes, 100 chars)")
    print(f"    - {PRECIOS_TXT} ({os.path.getsize(PRECIOS_TXT):,} bytes, 32 chars)")
    print(f"    - {REDONDEADOS_TXT} ({os.path.getsize(REDONDEADOS_TXT):,} bytes, 70 chars)")
    print(f"    - Total processed: {len(rows)}")

if __name__ == "__main__":
    main()
