import requests
import json
import os
import re
import shutil

BASE = "https://admin.alvarezplacas.com.ar"
TOKEN = "alvarez-api-token-v16-2026"
IMAGE_ROOT = r"d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\web01\public\images\catalog\Placas"
PROCESSED_ROOT = r"d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\web01\public\images\catalog\Processed"

def generate_commercial_name(prod, rubros_map, marcas_map):
    rubro = rubros_map.get(prod['rubro'])
    marca = marcas_map.get(prod['marca'])
    
    if not rubro or not marca: return None

    parts = ["Placa" if rubro['letra'] == 'M' else rubro['nombre'], marca['nombre']]
    if prod.get('linea'): parts.append(str(prod['linea']))
    if prod.get('codigo_articulo'): parts.append(str(prod['codigo_articulo']))
    if prod.get('textura'): parts.append(str(prod['textura']))
    if prod.get('modelo'): parts.append(str(prod['modelo']))
    
    full_so_far = " ".join(parts).lower()

    if prod.get('espesor'):
        e_str = f"{float(prod['espesor']):g}mm"
        if e_str.lower() not in full_so_far: parts.append(e_str)

    if prod.get('soporte'):
        s_str = str(prod['soporte'])
        if s_str.lower() not in full_so_far: parts.append(s_str)

    if prod.get('color_real'):
        c_str = str(prod['color_real'])
        if c_str.lower() not in full_so_far and c_str.lower() != (prod.get('modelo') or '').lower():
            parts.append(c_str)

    name = " ".join(parts)
    return re.sub(r'\s+', ' ', name).strip()

def backfill():
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    
    print("Fetching Rubros and Marcas...")
    rubros = requests.get(f"{BASE}/items/Rubros", headers=headers).json()["data"]
    marcas = requests.get(f"{BASE}/items/marcas", headers=headers).json()["data"]
    rubros_map = {r['id']: r for r in rubros}
    marcas_map = {m['id']: m for m in marcas}
    
    # 1. Backfill nombres in batches
    print("\n[1/2] Correcting 'Nombre' column...")
    page = 1
    total_updated = 0
    while True:
        limit = 100
        offset = (page - 1) * limit
        r = requests.get(f"{BASE}/items/Productos?limit={limit}&offset={offset}&fields=*", headers=headers)
        prods = r.json()["data"]
        if not prods: break
        
        print(f"  Processing page {page} ({len(prods)} products)...")
        for p in prods:
            new_name = generate_commercial_name(p, rubros_map, marcas_map)
            if new_name and (not p.get('nombre') or p.get('nombre') != new_name):
                requests.patch(f"{BASE}/items/Productos/{p['id']}", headers=headers, json={
                    "nombre": new_name,
                    "descripcion": new_name
                })
                total_updated += 1
        
        page += 1
    
    print(f"DONE: {total_updated} names corrected.")

    # 2. Rename Images
    print("\n[2/2] Renaming images by SKU...")
    if not os.path.exists(PROCESSED_ROOT): os.makedirs(PROCESSED_ROOT)

    # Map modelo to SKU
    prods = requests.get(f"{BASE}/items/Productos?limit=-1&fields=modelo,sku", headers=headers).json()["data"]
    modelo_to_sku = {p['modelo'].lower().strip(): p['sku'] for p in prods if p.get('modelo') and p.get('sku')}

    image_count = 0
    renamed_count = 0
    for root, dirs, files in os.walk(IMAGE_ROOT):
        for f in files:
            if f.lower().endswith(('.avif', '.jpg', '.png', '.webp')):
                image_count += 1
                basename = os.path.splitext(f)[0].lower().strip()
                
                found_sku = None
                # Priority 1: Exact match
                if basename in modelo_to_sku:
                    found_sku = modelo_to_sku[basename]
                else:
                    # Priority 2: Fuzzy match (contains)
                    for mod, sku in modelo_to_sku.items():
                        if mod in basename or basename in mod:
                            found_sku = sku
                            break
                
                if found_sku:
                    ext = os.path.splitext(f)[1].lower()
                    new_name = f"{found_sku}{ext}"
                    dst = os.path.join(PROCESSED_ROOT, new_name)
                    shutil.copy2(os.path.join(root, f), dst)
                    renamed_count += 1

    print(f"DONE: {renamed_count}/{image_count} images processed.")

if __name__ == "__main__":
    backfill()
