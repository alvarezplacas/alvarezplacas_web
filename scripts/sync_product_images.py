import requests
import json
import re
import os
from pathlib import Path

# =====================================================================
# SYNC & UPLOAD PRODUCT IMAGES - Alvarez Placas v16
# 1. Busca coincidencias en Directus (por SKU, Código o Modelo)
# 2. Si no hay en Directus, busca en disco local y sube a MinIO/Directus
# =====================================================================

DIRECTUS_URL = "https://admin.alvarezplacas.com.ar"
TOKEN = "alvarez-api-token-v16-2026"
LOCAL_IMAGE_DIR = r"d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\web01\public\images\catalog\Placas"

def get_headers():
    return {"Authorization": f"Bearer {TOKEN}"}

def clean_code(text):
    if not text: return ""
    # Extraer el primer bloque alfanumérico (ej: H3133)
    match = re.match(r"([A-Z0-9]+)", text.strip().upper())
    return match.group(1) if match else text.strip().upper()

def sync_images():
    headers = get_headers()
    
    print("--- FASE 1: Recolectando Datos ---")
    
    # 1. Obtener productos sin imagen
    params_prod = {
        "filter[foto_principal][_null]": "true",
        "fields": "id,sku,modelo,codigo_articulo",
        "limit": 1000
    }
    r_prod = requests.get(f"{DIRECTUS_URL}/items/Productos", headers=headers, params=params_prod)
    r_prod.raise_for_status()
    products = r_prod.json()["data"]
    print(f"Productos sin imagen: {len(products)}")

    # 2. Obtener archivos en Directus
    files = []
    page = 1
    while True:
        r_f = requests.get(f"{DIRECTUS_URL}/files", headers=headers, params={"limit": 100, "page": page, "fields": "id,title,filename_download"})
        r_f.raise_for_status()
        batch = r_f.json()["data"]
        if not batch: break
        files.extend(batch)
        page += 1
        if page > 10: break
        
    print(f"Archivos en Directus: {len(files)}")

    # Mapa de archivos Directus (ID por Codigo/SKU)
    directus_map = {}
    for f in files:
        t = clean_code(f.get("title"))
        fn = clean_code(f.get("filename_download"))
        if t: directus_map[t] = f["id"]
        if fn: directus_map[fn] = f["id"]

    # 3. Escanear disco local
    local_map = {}
    print(f"Escaneando disco: {LOCAL_IMAGE_DIR}...")
    for root, dirs, filenames in os.walk(LOCAL_IMAGE_DIR):
        for fn in filenames:
            if fn.lower().endswith(('.avif', '.jpg', '.png', '.webp')):
                code = clean_code(fn)
                if code:
                    local_map[code] = os.path.join(root, fn)

    print(f"Archivos locales encontrados: {len(local_map)}")

    print("\n--- FASE 2: Sincronizando ---")
    
    linked_count = 0
    uploaded_count = 0
    error_count = 0

    for p in products:
        sku = (p.get("sku") or "").strip().upper()
        code_art = (p.get("codigo_articulo") or "").strip().upper()
        
        target_id = None
        
        # Intentar match en Directus primero
        if sku in directus_map: target_id = directus_map[sku]
        elif code_art in directus_map: target_id = directus_map[code_art]
        
        if target_id:
            # Vincular existente
            requests.patch(f"{DIRECTUS_URL}/items/Productos/{p['id']}", headers=headers, json={"foto_principal": target_id})
            linked_count += 1
            continue

        # Si no está en Directus, buscar en disco local para subir
        local_path = local_map.get(sku) or local_map.get(code_art)
        
        if local_path:
            try:
                # Subir archivo a Directus
                with open(local_path, "rb") as f:
                    files_payload = {"file": (os.path.basename(local_path), f)}
                    # Nota: El upload usa multipart/form-data, no JSON
                    r_up = requests.post(f"{DIRECTUS_URL}/files", headers={"Authorization": f"Bearer {TOKEN}"}, files=files_payload)
                    
                if r_up.status_code in [200, 201]:
                    new_file_id = r_up.json()["data"]["id"]
                    # Vincular
                    requests.patch(f"{DIRECTUS_URL}/items/Productos/{p['id']}", headers=headers, json={"foto_principal": new_file_id})
                    uploaded_count += 1
                    # Añadir a directus_map para no resubir
                    directus_map[sku] = new_file_id
                    if code_art: directus_map[code_art] = new_file_id
                else:
                    error_count += 1
            except Exception as e:
                print(f"Error subiendo {local_path}: {e}")
                error_count += 1

    print("\n" + "="*50)
    print("RESUMEN DE PROCESO:")
    print(f"  Vinculados (ya estaban): {linked_count}")
    print(f"  Subidos y vinculados:    {uploaded_count}")
    print(f"  Errores:                 {error_count}")
    print("="*50)

if __name__ == "__main__":
    sync_images()
