import requests
import json
import re
import os
from pathlib import Path
from urllib.parse import urlparse

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
    # Eliminar extensiones y espacios
    text = Path(text).stem
    # Extraer el primer bloque alfanumérico significativo (ej: H3133)
    # A veces los archivos tienen nombres largos, intentamos sacar el código
    match = re.search(r"([A-Z0-9]{3,})", text.strip().upper())
    return match.group(1) if match else text.strip().upper()

def check_health():
    print(f"--- Verificando conexión con {DIRECTUS_URL} ---")
    try:
        r = requests.get(f"{DIRECTUS_URL}/server/health", timeout=5)
        health = r.json()
        print(f"Estado de Directus: {health.get('status', 'DESCONOCIDO')}")
        if health.get('status') != 'ok':
            print("AVISO: El sistema informa problemas de salud.")
        return True
    except Exception as e:
        print(f"ERROR: No se pudo conectar con Directus: {e}")
        return False

def sync_images():
    if not check_health():
        return

    headers = get_headers()
    
    print("\n--- FASE 1: Recolectando Datos ---")
    
    # 1. Obtener productos
    try:
        r_prod = requests.get(f"{DIRECTUS_URL}/items/Productos", headers=headers, params={"limit": -1, "fields": "id,sku,modelo,codigo_articulo,foto_principal"})
        r_prod.raise_for_status()
        all_products = r_prod.json()["data"]
        products_no_image = [p for p in all_products if not p.get("foto_principal")]
        print(f"Total productos: {len(all_products)}")
        print(f"Productos sin imagen: {len(products_no_image)}")
    except Exception as e:
        print(f"Error obteniendo productos: {e}")
        return

    # 2. Obtener archivos en Directus
    files = []
    page = 1
    print("Obteniendo lista de archivos de Directus...")
    while True:
        try:
            r_f = requests.get(f"{DIRECTUS_URL}/files", headers=headers, params={"limit": 100, "page": page, "fields": "id,title,filename_download"})
            r_f.raise_for_status()
            batch = r_f.json()["data"]
            if not batch: break
            files.extend(batch)
            page += 1
            if page > 50: break # Seguridad
        except Exception as e:
            print(f"Error obteniendo archivos: {e}")
            break
        
    print(f"Archivos registrados en Directus: {len(files)}")

    # Mapa de archivos Directus (ID por Codigo/SKU)
    directus_map = {}
    for f in files:
        t = clean_code(f.get("title"))
        fn = clean_code(f.get("filename_download"))
        if t: directus_map[t] = f["id"]
        if fn: directus_map[fn] = f["id"]

    # 3. Escanear disco local
    local_map = {}
    print(f"Escaneando disco local: {LOCAL_IMAGE_DIR}...")
    if not os.path.exists(LOCAL_IMAGE_DIR):
        print(f"ERROR: No existe el directorio local {LOCAL_IMAGE_DIR}")
        return

    for root, dirs, filenames in os.walk(LOCAL_IMAGE_DIR):
        for fn in filenames:
            if fn.lower().endswith(('.avif', '.jpg', '.png', '.webp')):
                code = clean_code(fn)
                if code:
                    local_map[code] = os.path.join(root, fn)

    print(f"Imágenes locales encontradas: {len(local_map)}")

    print("\n--- FASE 2: Sincronizando ---")
    
    linked_count = 0
    uploaded_count = 0
    error_count = 0

    for p in all_products:
        sku = clean_code(p.get("sku"))
        code_art = clean_code(p.get("codigo_articulo"))
        
        # Si ya tiene foto, saltar (o podríamos verificar si el link es válido)
        if p.get("foto_principal"):
            continue

        target_id = None
        
        # 1. Intentar match con archivos que ya están en Directus
        if sku and sku in directus_map: 
            target_id = directus_map[sku]
        elif code_art and code_art in directus_map: 
            target_id = directus_map[code_art]
        
        if target_id:
            # Vincular existente
            try:
                res = requests.patch(f"{DIRECTUS_URL}/items/Productos/{p['id']}", headers=headers, json={"foto_principal": target_id})
                if res.status_code == 200:
                    linked_count += 1
                else:
                    print(f"Error vinculando {sku}: {res.text}")
                    error_count += 1
            except Exception as e:
                print(f"Error de red vinculando {sku}: {e}")
                error_count += 1
            continue

        # 2. Si no está en Directus, buscar en disco local para subir
        local_path = None
        if sku and sku in local_map: local_path = local_map[sku]
        elif code_art and code_art in local_map: local_path = local_map[code_art]
        
        if local_path:
            try:
                print(f"Subiendo nueva imagen para {sku or code_art}: {os.path.basename(local_path)}")
                with open(local_path, "rb") as f:
                    files_payload = {"file": (os.path.basename(local_path), f)}
                    r_up = requests.post(f"{DIRECTUS_URL}/files", headers={"Authorization": f"Bearer {TOKEN}"}, files=files_payload)
                    
                if r_up.status_code in [200, 201]:
                    new_file_id = r_up.json()["data"]["id"]
                    # Vincular
                    requests.patch(f"{DIRECTUS_URL}/items/Productos/{p['id']}", headers=headers, json={"foto_principal": new_file_id})
                    uploaded_count += 1
                    # Registrar en mapa para evitar duplicados en esta misma ejecución
                    if sku: directus_map[sku] = new_file_id
                    if code_art: directus_map[code_art] = new_file_id
                else:
                    print(f"Error subiendo {os.path.basename(local_path)}: {r_up.status_code} - {r_up.text}")
                    error_count += 1
            except Exception as e:
                print(f"Excepción subiendo {local_path}: {e}")
                error_count += 1

    print("\n" + "="*50)
    print("RESUMEN DE PROCESO:")
    print(f"  Vinculados (ya existentes): {linked_count}")
    print(f"  Nuevos subidos y vinculados: {uploaded_count}")
    print(f"  Errores encontrados:         {error_count}")
    print("="*50)

if __name__ == "__main__":
    sync_images()
