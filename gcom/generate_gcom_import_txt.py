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

def clean_description(desc):
    """Clean description to fit 40 characters and remove non-ansi chars."""
    if not desc:
        return ""
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
            return "0002"  # MDF
        elif "AGLO" in name or "AGLOMERADO" in name:
            return "0001"  # AGLOMERADO
        elif "FENOLICO" in name:
            return "0032"  # FENOLICO
        elif "TERCIADO" in name:
            return "0023"  # TERCIADO
        elif "OSB" in name:
            return "0055"  # OSB
        elif "PINO" in name or "EUCA" in name or "FINGER" in name:
            return "0013"  # TABLEROS
        elif "CHAPADUR" in name or "FIPLASTO" in name:
            return "0058"  # CHAPADUR
        elif "WPC" in name or "ALISTONADA" in name:
            return "0044"  # PLACA ALISTONADA
        else:
            if "-10-" in sku or "-20-" in sku or "-30-" in sku:
                return "0002"  # Default melamine boards to MDF
            return "0013"  # Default to Tableros
            
    elif sku.startswith("H-"):
        # Herrajes
        if "BISAGRA" in name:
            return "0039"  # BISAGRAS
        elif "TORNILLO" in name or "AUTOPERFORANTE" in name:
            return "0012"  # TORNILLOS
        elif "CORREDERA" in name:
            return "0027"  # CORREDERAS
        elif "TIRADOR" in name:
            return "0014"  # TIRADORES
        elif "MANIJA" in name:
            return "0033"  # MANIJAS
        elif "RIEL" in name or "GUIA" in name:
            return "0019"  # RIELES
        elif "TAPA" in name:
            return "0011"  # HOJA TAPATORNILLO
        else:
            return "0057"  # ACCESORIOS HERRAJES
            
    elif sku.startswith("T-"):
        # Tapacantos
        if "PVC" in name:
            return "0005"  # PVC
        elif "ABS" in name:
            return "0006"  # ABS
        else:
            return "0005"  # PVC default
            
    elif sku.startswith("R-"):
        # Herramientas
        return "0024"  # HERRAMIENTAS
        
    elif sku.startswith("D-"):
        # Molduras / Zocalos
        if "ZOCALO" in name:
            return "0017"  # ZOCALOS
        elif "VARILLA" in name:
            return "0015"  # VARILLAS
        else:
            return "0017"  # ZOCALOS default
            
    elif sku.startswith("I-"):
        # Insumos / Quimica
        if "LACA" in name or "BARNIZ" in name or "PINTURA" in name:
            return "0051"  # LACAS
        elif "MASILLA" in name:
            return "0052"  # MASILLAS
        elif "ADHESIVO" in name or "COLA" in name or "PEGAMENTO" in name:
            return "0016"  # ADHESIVOS
        else:
            return "0053"  # COMPLEMENTOS DE PINTURA
            
    elif sku.startswith("S-"):
        # Servicios
        if "CORTE" in name:
            return "0003"  # CORTES A MEDIDA
        elif "PEGADO" in name or "FILO" in name:
            return "0009"  # PEGADO DE FILO
        elif "PERFORACION" in name or "BISAGRA" in name:
            return "0056"  # SERVICIO PERFORACION BISAGRAS
        else:
            return "0003"  # CORTES default
            
    else:
        return "0067"  # SIN DETALLE

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
                if sku and nombre:
                    products.append({
                        "sku": sku,
                        "nombre": nombre
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
                        "nombre": nombre
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
        rubro = get_gcom_rubro(sku, nombre)
        rubros_count[rubro] = rubros_count.get(rubro, 0) + 1

        # We build a 63-character line (since Col 60 + 4 - 1 = 63)
        # Python string slicing is 0-indexed, so:
        # Col 1 (index 0) to 11 (index 10)
        # Col 13 (index 12) to 52 (index 51)
        # Col 60 (index 59) to 63 (index 62)
        
        line_chars = list(" " * 63)
        
        # CODIGO ARTICULO
        sku_str = sku[:11].ljust(11)
        for i, c in enumerate(sku_str):
            line_chars[0 + i] = c
            
        # DESCRIPCION
        desc_str = desc_clean[:40].ljust(40)
        for i, c in enumerate(desc_str):
            line_chars[12 + i] = c
            
        # RUBRO
        rubro_str = rubro[:4].ljust(4)
        for i, c in enumerate(rubro_str):
            line_chars[59 + i] = c
            
        lines.append("".join(line_chars))

    print(f"  Generated {len(lines)} lines.")
    print("  Rubros distribution:")
    for rb, count in sorted(rubros_count.items()):
        print(f"    Rubro {rb}: {count} items")

    # Save to TXT file in ANSI format
    with open(OUTPUT_TXT, 'w', encoding='ansi') as f:
        f.write("\n".join(lines) + "\n")
    print(f"\n[3] Import file successfully saved to: {OUTPUT_TXT}")
    print(f"    File size: {os.path.getsize(OUTPUT_TXT):,} bytes")

if __name__ == "__main__":
    main()
