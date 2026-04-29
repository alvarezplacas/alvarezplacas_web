import requests
import json

# Configuración
DIRECTUS_URL = "https://admin.alvarezplacas.com.ar"
DIRECTUS_TOKEN = "alvarez-api-token-v16-2026"

# MeiliSearch config (Asumiendo ejecución desde el VPS o acceso vía IP)
MEILI_URL = "http://localhost:7700" # Cambiar por IP si es remoto
MEILI_MASTER_KEY = "AlvarezMeili2026!"
INDEX_NAME = "productos"

def sync():
    headers_directus = {"Authorization": f"Bearer {DIRECTUS_TOKEN}"}
    headers_meili = {"Authorization": f"Bearer {MEILI_MASTER_KEY}", "Content-Type": "application/json"}

    print("--- Sincronización Directus -> MeiliSearch ---")
    
    # 1. Obtener productos de Directus
    print(f"Obteniendo productos de {DIRECTUS_URL}...")
    url = f"{DIRECTUS_URL}/items/Productos?limit=-1&fields=id,nombre,sku,modelo,espesor,soporte,marca.nombre,rubro.nombre,color_real,textura,linea"
    r = requests.get(url, headers=headers_directus)
    r.raise_for_status()
    products = r.json()["data"]
    
    print(f"Se encontraron {len(products)} productos.")

    # 2. Formatear para MeiliSearch
    documents = []
    for p in products:
        documents.append({
            "id": p["id"],
            "nombre": p["nombre"],
            "sku": p["sku"],
            "modelo": p["modelo"],
            "marca": p["marca"]["nombre"] if p.get("marca") else "Genérica",
            "rubro": p["rubro"]["nombre"] if p.get("rubro") else "Varios",
            "color": p.get("color_real"),
            "espesor": f"{p['espesor']}mm" if p.get("espesor") else None,
            "textura": p.get("textura"),
            "linea": p.get("linea")
        })

    # 3. Enviar a MeiliSearch
    print(f"Enviando a MeiliSearch ({INDEX_NAME})...")
    
    # Crear/Actualizar índice y configuraciones
    requests.post(f"{MEILI_URL}/indexes", headers=headers_meili, json={"uid": INDEX_NAME, "primaryKey": "id"})
    
    # Configurar atributos buscables y filtrables
    settings = {
        "searchableAttributes": ["nombre", "sku", "modelo", "marca", "rubro"],
        "filterableAttributes": ["marca", "rubro", "color", "espesor"],
        "rankingRules": [
            "words",
            "typo",
            "proximity",
            "attribute",
            "sort",
            "exactness"
        ]
    }
    requests.patch(f"{MEILI_URL}/indexes/{INDEX_NAME}/settings", headers=headers_meili, json=settings)

    # Cargar documentos
    r = requests.post(f"{MEILI_URL}/indexes/{INDEX_NAME}/documents", headers=headers_meili, json=documents)
    if r.status_code in [200, 201, 202]:
        print(f"✅ Sincronización iniciada exitosamente. Task ID: {r.json().get('taskUid')}")
    else:
        print(f"❌ Error al sincronizar: {r.text}")

if __name__ == "__main__":
    sync()
