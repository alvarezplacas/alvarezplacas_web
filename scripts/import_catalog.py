import pandas as pd
import requests
import json
import sys
import re
import argparse

# =====================================================================
# IMPORTADOR CATÁLOGO SEGURO - Alvarez Placas v16
# Manual: https://alvarezplacas.com.ar/manuales/Manual_Catalogacion_Alvarez_Placas.html
# Fuente: web01/database/Catalogo_de_productos.xlsx
# =====================================================================

DIRECTUS_URL = "https://admin.alvarezplacas.com.ar"
ADMIN_EMAIL = "admin@alvarezplacas.com.ar"
ADMIN_PASSWORD = "JavierMix2026!"
EXCEL_PATH = "Z:/ingesta/Catalogo_de_productos.xlsx"

# Hojas del Excel → Rubro MADERAS (letra M)
SHEETS_TO_IMPORT_DEFAULT = ['EGGER', 'FAPLAC', 'SADEPAN', 'ENCHAPADOS', 'NOVA']

# ---- Mapeo de COLOR REAL desde el nombre del artículo ----
COLOR_MAP = [
    (["BLANCO", "WHITE", "LACA BLANCA"],            "Blanco"),
    (["NEGRO", "BLACK"],                             "Negro"),
    (["GRIS", "GREY", "GRAY", "GRAPHITE"],           "Gris"),
    (["MARRON", "MARRÓN", "CAOBA", "CEDRO",
      "NOGAL", "ROBLE", "WENGUE", "MOKA",
      "CHOCOLATE", "CACAO", "TECA", "QUEBRACHO",
      "JATOBA", "PINO", "EUCALIPTO", "CASTAÑO",
      "BROWN", "CASTAÑO"],                           "Marrón"),
    (["ROJO", "RED", "BORDO", "BORDÓ", "CEREZA"],   "Rojo"),
    (["AZUL", "BLUE", "NAVY"],                       "Azul"),
    (["VERDE", "GREEN"],                             "Verde"),
    (["BEIGE", "CAJU", "CREMA", "ARENA", "LINO",
      "CHAMPAGNE"],                                  "Beige"),
]

def infer_color(articulo_str):
    """Infiere el color real desde el nombre del artículo."""
    s = str(articulo_str).upper()
    for keywords, color in COLOR_MAP:
        if any(k in s for k in keywords):
            return color
    return None

TOKEN = "H7iZ2nObk97TrpvxTlpGnHFWq52pLXox"

def infer_color(articulo_str):
    """Infiere el color real desde el nombre del artículo."""
    s = str(articulo_str).upper()
    for keywords, color in COLOR_MAP:
        if any(k in s for k in keywords):
            return color
    return None

def get_token():
    # Retornar directamente el token administrativo estático verificado
    return TOKEN

def extract_number(val):
    if pd.isnull(val):
        return None
    if isinstance(val, (int, float)):
        return float(val)
    match = re.search(r"(\d+\.?\d*)", str(val))
    return float(match.group(1)) if match else None

def import_data(token, force_update=False, dry_run=False, specific_sheet=None):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    print("Obteniendo IDs de Rubros y Marcas...")
    try:
        rubros_data = requests.get(f"{DIRECTUS_URL}/items/Rubros", headers=headers).json()["data"]
        marcas_data = requests.get(f"{DIRECTUS_URL}/items/marcas", headers=headers).json()["data"]
    except Exception as e:
        print(f"ERROR AL OBTENER METADATOS: {e}")
        return

    rubros_map = {r["nombre"].strip().upper(): r["id"] for r in rubros_data}
    marcas_map = {m["nombre"].upper().strip(): m["id"] for m in marcas_data}

    maderas_id = rubros_map.get("MADERAS") or rubros_map.get("PLACAS")
    if not maderas_id:
        print("CRÍTICO: Rubro 'Maderas' o 'Placas' no encontrado.")
        return

    created_count = 0
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    xl = pd.ExcelFile(EXCEL_PATH)
    sheets = [specific_sheet] if specific_sheet else xl.sheet_names

    for sheet in sheets:
        # Ignorar hojas vacías o internas
        if sheet.startswith('Hoja') or sheet == 'SERVICIOS':
            continue
            
        if sheet not in xl.sheet_names:
            print(f"[SKIP] Hoja '{sheet}' no encontrada.")
            continue

        df = pd.read_excel(EXCEL_PATH, sheet_name=sheet)
        df.columns = [str(c).upper().strip() for c in df.columns]

        if len(df) == 0:
            print(f"[SKIP] Hoja '{sheet}' vacía.")
            continue

        print(f"\n--- Procesando hoja: {sheet} ({len(df)} filas) ---")

        for index, row in df.iterrows():
            # Buscar ARTICULO/COLOR REAL con fallback a ARTICULO
            articulo = str(row.get("ARTICULO/COLOR REAL", row.get("ARTICULO", ""))).strip()
            if not articulo or articulo in ("nan", "None", ""):
                skipped_count += 1
                continue
            
            import re
            # Clean punctuation from the name: commas, periods, colons, slashes
            articulo = articulo.replace('...', ' ')
            articulo = re.sub(r'[,.:/]', ' ', articulo)
            articulo = re.sub(r'\s+', ' ', articulo).strip()

            # Determinar Marca
            marca_raw = str(row.get("MARCA", sheet)).upper().strip()
            if marca_raw == "ENCHAPADOS": marca_raw = "ENCHAPADO"
            if marca_raw == "TPC EGGER": marca_raw = "EGGER"
            if marca_raw == "MADERAS SELECTAS S.A.": marca_raw = "MADERAS SELECTAS SA"
            
            marca_id = marcas_map.get(marca_raw) or marcas_map.get(sheet.upper())
            
            if not marca_id:
                print(f"  [WARN] Marca '{marca_raw}' no encontrada para '{articulo}'")
                skipped_count += 1
                continue

            payload = {
                "nombre":         articulo,
                "rubro":          maderas_id,
                "marca":          marca_id,
                "modelo":         articulo,
                "espesor":        extract_number(row.get("ESPESOR")),
                "soporte":        str(row.get("SOPORTE", "")).strip() if str(row.get("SOPORTE", "")).strip() != "nan" else None,
                "color_real":     infer_color(articulo),
                "unidad_medida":  "Placa",
                "textura":        str(row.get("TEXTURA", "")).strip() if str(row.get("TEXTURA", "")).strip() != "nan" else None,
                "linea":          str(row.get("LINEA/GRUPO", "")).strip() if str(row.get("LINEA/GRUPO", "")).strip() != "nan" else None,
                "codigo_articulo": str(row.get("CODIGO", "")).strip() if str(row.get("CODIGO", "")).strip() != "nan" else None,
                "activo":         True,
            }
            # Limpiar nulos
            payload = {k: v for k, v in payload.items() if v is not None}

            try:
                # Buscamos por Modelo y Marca
                search_url = f"{DIRECTUS_URL}/items/Productos?filter[modelo][_eq]={articulo}&filter[marca][_eq]={marca_id}"
                search_res = requests.get(search_url, headers=headers).json()
                existing_item = search_res["data"][0] if search_res.get("data") else None

                if existing_item:
                    if not force_update:
                        # Si existe y no forzamos update, saltamos
                        skipped_count += 1
                        continue
                    
                    # Si forzamos update
                    if dry_run:
                        print(f"  [DRY-RUN] Se actualizaría: {articulo}")
                        updated_count += 1
                    else:
                        item_id = existing_item["id"]
                        res = requests.patch(f"{DIRECTUS_URL}/items/Productos/{item_id}", headers=headers, json=payload)
                        if res.status_code == 200:
                            updated_count += 1
                        else:
                            error_count += 1
                            print(f"  [ERROR] Al actualizar {articulo}: {res.text[:100]}")
                else:
                    # Producto nuevo
                    if dry_run:
                        print(f"  [DRY-RUN] Se crearía: {articulo}")
                        created_count += 1
                    else:
                        res = requests.post(f"{DIRECTUS_URL}/items/Productos", headers=headers, json=payload)
                        if res.status_code == 200 or res.status_code == 201:
                            created_count += 1
                        else:
                            error_count += 1
                            print(f"  [ERROR] Al crear {articulo}: {res.text[:100]}")

            except Exception as e:
                error_count += 1
                print(f"  [EXCEPTION] {articulo}: {e}")

    print(f"\n{'='*50}")
    print(f"RESUMEN DE IMPORTACIÓN {'(SIMULACIÓN)' if dry_run else ''}:")
    print(f"  [+] Nuevos Creados: {created_count}")
    print(f"  [*] Actualizados:   {updated_count}")
    print(f"  [>] Omitidos:       {skipped_count}")
    print(f"  [!] Errores:        {error_count}")
    print(f"{'='*50}")
    if not force_update and not dry_run:
        print("NOTA: Los productos existentes fueron omitidos por seguridad.")
        print("Usa '--force-update' si deseas actualizar productos existentes.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Importador de Catálogo Seguro - Alvarez Placas")
    parser.add_argument("--force-update", action="store_true", help="Actualiza productos si ya existen (por defecto los ignora)")
    parser.add_argument("--dry-run", action="store_true", help="Simula la carga sin realizar cambios reales")
    parser.add_argument("--sheet", type=str, help="Importa solo una hoja específica del Excel")
    
    args = parser.parse_args()

    token = get_token()
    if token:
        import_data(token, force_update=args.force_update, dry_run=args.dry_run, specific_sheet=args.sheet)
    else:
        print("Error: No se pudo obtener el token de acceso.")
