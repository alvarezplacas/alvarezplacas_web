import pandas as pd
import requests
import json
import os
import re

BASE = "https://admin.alvarezplacas.com.ar"
TOKEN = "alvarez-api-token-v16-2026"

FILES_TO_IMPORT = [
    {"path": "web01/database/grupo_2_herrajes.csv", "rubro": "Herrajes"},
    {"path": "web01/database/grupo_4_tapacantos.csv", "rubro": "Tapacantos"},
    {"path": "web01/database/grupo_3_quimica.csv", "rubro": "Insumos"},
    {"path": "web01/database/grupo_5_herramientas.csv", "rubro": "Herramientas"}
]

def import_csvs():
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    
    print("Obteniendo Rubros y Marcas...")
    rubros_data = requests.get(f"{BASE}/items/Rubros", headers=headers).json()["data"]
    marcas_data = requests.get(f"{BASE}/items/marcas", headers=headers).json()["data"]
    
    rubros_map = {r["nombre"].strip(): r["id"] for r in rubros_data}
    marcas_map = {m["nombre"].upper().strip(): m["id"] for m in marcas_data}

    # Add Generico to marcas if not exists
    if "GENERICO" not in marcas_map:
        print("Creando marca GENERICO...")
        res = requests.post(f"{BASE}/items/marcas", headers=headers, json={"nombre": "GENERICO", "codigo": "99"})
        if res.status_code in (200, 201):
            marcas_map["GENERICO"] = res.json()["data"]["id"]

    for item in FILES_TO_IMPORT:
        path = item["path"]
        rubro_name = item["rubro"]
        rubro_id = rubros_map.get(rubro_name)
        
        if not rubro_id:
            print(f"SKIPPING: Rubro '{rubro_name}' no encontrado.")
            continue
            
        if not os.path.exists(path):
            print(f"SKIPPING: Archivo '{path}' no existe.")
            continue

        print(f"\n--- Procesando {rubro_name} ({path}) ---")
        
        # Read CSV, skip lines starting with ##, use ; as delimiter
        df = pd.read_csv(path, sep=';', comment='#')
        df.columns = [str(c).strip().lower() for c in df.columns]

        success = 0
        for _, row in df.iterrows():
            # Determine Marca from description or code if possible, or use GENERICO
            # For now, we'll try to find common brands in the description
            desc = str(row.get('descripcion', '')).upper()
            marca_id = marcas_map.get("GENERICO")
            for m_name, m_id in marcas_map.items():
                if m_name in desc and m_name != "GENERICO":
                    marca_id = m_id
                    break
            
            payload = {
                "rubro": rubro_id,
                "marca": marca_id,
                "modelo": str(row.get('nombre', '')).strip(),
                "codigo_articulo": str(row.get('codigo', '')).strip(),
                "descripcion": str(row.get('descripcion', '')).strip(),
                "unidad_medida": str(row.get('unidad', 'Unidad')).strip().capitalize(),
                "activo": True
            }

            # Field specific mappings
            if 'espesor_mm' in row:
                try:
                    payload["espesor"] = float(row['espesor_mm'])
                except: pass
            
            if 'color' in row:
                payload["color_real"] = str(row['color']).strip()
                
            if 'material' in row:
                payload["soporte"] = str(row['material']).strip()

            try:
                res = requests.post(f"{BASE}/items/Productos", headers=headers, json=payload)
                if res.status_code in (200, 201):
                    success += 1
                else:
                    print(f"  Error: {res.status_code} - {res.text[:100]}")
            except Exception as e:
                print(f"  Exception: {e}")

        print(f"DONE: Cargados {success} productos en {rubro_name}.")

if __name__ == "__main__":
    import_csvs()
