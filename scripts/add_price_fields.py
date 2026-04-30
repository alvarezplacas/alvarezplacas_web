import requests
import json

DIRECTUS_URL = "https://admin.alvarezplacas.com.ar"
TOKEN = "alvarez-api-token-v16-2026"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def create_field(field_name, field_type="float", hidden=False):
    payload = {
        "field": field_name,
        "type": field_type,
        "meta": {
            "collection": "Productos",
            "field": field_name,
            "hidden": hidden,
            "interface": "input",
            "options": {
                "placeholder": "0.00"
            },
            "display": "formatted-value",
            "display_options": {
                "format": True,
                "prefix": "$ "
            }
        },
        "schema": {
            "name": field_name,
            "table": "Productos",
            "data_type": "double precision",
            "is_nullable": True
        }
    }
    
    try:
        response = requests.post(f"{DIRECTUS_URL}/fields/Productos", headers=HEADERS, json=payload)
        if response.status_code == 200:
            print(f"✅ Campo '{field_name}' creado con éxito.")
        elif response.status_code == 409:
            print(f"⚠️ El campo '{field_name}' ya existe.")
        else:
            print(f"❌ Error al crear '{field_name}': {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Iniciando inyección de campos de precios en Directus...")
    create_field("precio_L0", hidden=True) # L0 is for supplier cost, hidden from general view usually
    create_field("precio_L1")
    create_field("precio_L2")
    print("Proceso finalizado.")
