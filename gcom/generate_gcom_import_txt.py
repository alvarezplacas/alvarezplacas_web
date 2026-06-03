# -*- coding: utf-8 -*-
"""
Generates the fixed-width TXT import file for GECOM using the CATALOGADOR (Directus Products) as the Source of Truth.
Format specified by the user:
Col 1: CODIGO ARTICULO (Characters, Width 11)
Col 13: DESCRIPCION (Characters, Width 40)
Col 60: RUBRO (Characters, Width 4)
"""
import os
import json
import re

# Paths
DIRECTUS_PRODUCTS_CACHE = r"\\Server-alvarezp\c\CATALOGADOR\scratch\directus_products.json"
MAP_PATH = r"d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\scratch\gcom_to_directus_map_smart_correct.json"
OUTPUT_DIR = r"d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\gcom"
OUTPUT_TXT = os.path.join(OUTPUT_DIR, "importacion_articulos.txt")
OUTPUT_PRN = os.path.join(OUTPUT_DIR, "importacion_articulos.prn")

def clean_description(desc):
    """Clean description to fit 40 characters, remove newlines, and strip accents."""
    if not desc:
        return ""
    # Replace literal backslash-n/r and real newlines
    desc = desc.replace(r"\n", " ").replace(r"\r", " ")
    desc = desc.replace("\n", " ").replace("\r", " ")
    # Translate accents
    trans = str.maketrans(
        "áéíóúüÁÉÍÓÚÜ",
        "aeiouuAEIOUU"
    )
    desc = desc.translate(trans)
    # Remove excessive spaces
    desc = re.sub(r'\s+', ' ', desc).strip()
    # Limit to 40 chars
    return desc[:40]

def get_gcom_rubro(sku, name):
    """
    Intelligently map Directus products to GCOM's 4-character rubro codes
    based on SKU prefix and name context.
    """
    sku = (sku or "").upper()
    name = (name or "").upper()
    
    if sku.startswith("M-"):
        # Maderas / Tableros
        if "MDF" in name or "FIBRO" in name:
            return "Ag0002"  # MDF
        elif "AGLO" in name or "AGLOMERADO" in name:
            return "Ag0001"  # AGLOMERADO
        elif "FENOLICO" in name:
            return "Ag0032"  # FENOLICO
        elif "TERCIADO" in name:
            return "Ag0023"  # TERCIADO
        elif "OSB" in name:
            return "Ag0055"  # OSB
        elif "PINO" in name or "EUCA" in name or "FINGER" in name:
            return "Ag0013"  # TABLEROS
        elif "CHAPADUR" in name or "FIPLASTO" in name:
            return "Ag0058"  # CHAPADUR
        elif "WPC" in name or "ALISTONADA" in name:
            return "Ag0044"  # PLACA ALISTONADA
        else:
            if "-10-" in sku or "-20-" in sku or "-30-" in sku:
                return "Ag0002"  # Default melamine boards to MDF
            return "Ag0013"  # Default to Tableros
            
    elif sku.startswith("H-"):
        # Herrajes
        if "BISAGRA" in name:
            return "Ag0039"  # BISAGRAS
        elif "TORNILLO" in name or "AUTOPERFORANTE" in name:
            return "Ag0012"  # TORNILLOS
        elif "CORREDERA" in name:
            return "Ag0027"  # CORREDERAS
        elif "TIRADOR" in name:
            return "Ag0014"  # TIRADORES
        elif "MANIJA" in name:
            return "Ag0033"  # MANIJAS
        elif "RIEL" in name or "GUIA" in name:
            return "Ag0019"  # RIELES
        elif "TAPA" in name:
            return "Ag0011"  # HOJA TAPATORNILLO
        else:
            return "Ag0057"  # ACCESORIOS HERRAJES
            
    elif sku.startswith("T-"):
        # Tapacantos
        if "PVC" in name:
            return "Ag0005"  # PVC
        elif "ABS" in name:
            return "Ag0006"  # ABS
        else:
            return "Ag0005"  # PVC default
            
    elif sku.startswith("R-"):
        # Herramientas
        return "Ag0024"  # HERRAMIENTAS
        
    elif sku.startswith("D-"):
        # Molduras / Zocalos
        if "ZOCALO" in name:
            return "Ag0017"  # ZOCALOS
        elif "VARILLA" in name:
            return "Ag0015"  # VARILLAS
        else:
            return "Ag0017"  # ZOCALOS default
            
    elif sku.startswith("I-"):
        # Insumos / Quimica
        if "LACA" in name or "BARNIZ" in name or "PINTURA" in name:
            return "Ag0051"  # LACAS
        elif "MASILLA" in name:
            return "Ag0052"  # MASILLAS
        elif "ADHESIVO" in name or "COLA" in name or "PEGAMENTO" in name:
            return "Ag0016"  # ADHESIVOS
        else:
            return "Ag0053"  # COMPLEMENTOS DE PINTURA
            
    elif sku.startswith("S-"):
        # Servicios
        if "CORTE" in name:
            return "Ag0003"  # CORTES A MEDIDA
        elif "PEGADO" in name or "FILO" in name:
            return "Ag0009"  # PEGADO DE FILO
        elif "PERFORACION" in name or "BISAGRA" in name:
            return "Ag0056"  # SERVICIO PERFORACION BISAGRAS
        else:
            return "Ag0003"  # CORTES default
            
    else:
        return "Ag0067"  # SIN DETALLE

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    products = []
    source_name = ""

    # Try to load from Catalogador source of truth
    if os.path.exists(DIRECTUS_PRODUCTS_CACHE):
        print(f"[1] Loading Directus products from Catalogador: {DIRECTUS_PRODUCTS_CACHE}")
        try:
            with open(DIRECTUS_PRODUCTS_CACHE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            raw_list = data.get("data", [])
            for item in raw_list:
                sku = item.get("sku")
                nombre = item.get("nombre")
                precio_efectivo = item.get("precio_efectivo")
                if sku and nombre:
                    products.append({
                        "sku": sku,
                        "nombre": nombre,
                        "precio_efectivo": precio_efectivo
                     })
            source_name = "Catalogador Cache (directus_products.json)"
        except Exception as e:
            print(f"  Error reading from Catalogador: {e}")

    # Fallback to smart correct mapping file if Catalogador is empty/unreadable
    if not products and os.path.exists(MAP_PATH):
        print(f"[1] Fallback: Loading matched products from {MAP_PATH}")
        try:
            with open(MAP_PATH, 'r', encoding='utf-8') as f:
                map_data = json.load(f)
            matched = map_data.get("matched", [])
            for item in matched:
                sku = item.get("directus_sku")
                nombre = item.get("directus_name") or item.get("gcom_desc")
                if sku and nombre:
                    products.append({
                        "sku": sku,
                        "nombre": nombre,
                        "precio_efectivo": None
                    })
            source_name = "Smart Matches Fallback"
        except Exception as e:
            print(f"  Error reading fallback: {e}")

    if not products:
        print("  Error: No products could be loaded from any source!")
        return

    print(f"  Loaded {len(products)} products from {source_name}")

    print("\n[2] Generating GCOM fixed-width import lines...")
    lines = []
    rubros_count = {}

    for item in products:
        sku = item["sku"].strip()
        nombre = item["nombre"].strip()
        
        # Limit description to 40 chars and clean spaces
        desc_clean = clean_description(nombre)
        
        # Get the corresponding GCOM rubro
        rubro_raw = get_gcom_rubro(sku, nombre)
        # GCOM expects the rubro code in the import file without the 'Ag' prefix
        rubro = rubro_raw[2:] if rubro_raw.startswith("Ag") else rubro_raw
        rubros_count[rubro] = rubros_count.get(rubro, 0) + 1

        # We build an 80-character line (since Col 69 + 12 - 1 = 80)
        # Python string slicing is 0-indexed, so:
        # Col 1 (index 0) to 11 (index 10)
        # Col 13 (index 12) to 52 (index 51)
        # Col 60 (index 59) to 67 (index 66)
        # Col 69 (index 68) to 80 (index 79)
        
        line_chars = list(" " * 80)
        
        # CODIGO ARTICULO
        sku_str = sku[:11].ljust(11)
        for i, c in enumerate(sku_str):
            line_chars[0 + i] = c
            
        # DESCRIPCION
        desc_str = desc_clean[:40].ljust(40)
        for i, c in enumerate(desc_str):
            line_chars[12 + i] = c
            
        # RUBRO (width 8)
        rubro_str = rubro[:8].ljust(8)
        for i, c in enumerate(rubro_str):
            line_chars[59 + i] = c
            
        # PRECIO (width 12)
        precio_val = item.get("precio_efectivo")
        if precio_val is not None and precio_val > 0:
            precio_final = precio_val * 1.33
            precio_str = f"{precio_final:.2f}".replace(".", ",").rjust(12)
        else:
            precio_str = " " * 12
            
        for i, c in enumerate(precio_str):
            line_chars[68 + i] = c
            
        lines.append("".join(line_chars))

    print(f"  Generated {len(lines)} lines.")
    print("  Rubros distribution:")
    for rb, count in sorted(rubros_count.items()):
        print(f"    Rubro {rb}: {count} items")

    # Save to TXT file in ANSI format
    with open(OUTPUT_TXT, 'w', encoding='ansi') as f:
        f.write("\n".join(lines) + "\n")
    
    # Save to PRN file in ANSI format
    with open(OUTPUT_PRN, 'w', encoding='ansi') as f:
        f.write("\n".join(lines) + "\n")

    print(f"\n[3] Import files successfully saved to:")
    print(f"    - {OUTPUT_TXT} ({os.path.getsize(OUTPUT_TXT):,} bytes)")
    print(f"    - {OUTPUT_PRN} ({os.path.getsize(OUTPUT_PRN):,} bytes)")

if __name__ == "__main__":
    main()
