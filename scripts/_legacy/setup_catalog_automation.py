import requests
import json

# Configuración
DIRECTUS_URL = "https://admin.alvarezplacas.com.ar"
EMAIL = "admin@alvarezplacas.com.ar"
PASSWORD = "JavierMix2026!"

def get_token():
    print(f"Authenticating in {DIRECTUS_URL}...")
    r = requests.post(f"{DIRECTUS_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    r.raise_for_status()
    return r.json()["data"]["access_token"]

def create_field(token, collection, field_data):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"Creating field '{field_data['field']}' in '{collection}'...")
    try:
        r = requests.post(f"{DIRECTUS_URL}/fields/{collection}", headers=headers, json=field_data)
        if r.status_code == 200 or r.status_code == 201:
            print(f"OK: Field '{field_data['field']}' created.")
        else:
            print(f"INFO: Field might exist or error: {r.text}")
    except Exception as e:
        print(f"ERROR creating field {field_data['field']}: {e}")

def setup_schema(token):
    # 1. Agregar Relación Rubro a Productos
    # Rubro es una relación M2O a la colección 'Rubros' (con mayúscula inicial según el browser subagent)
    rubro_relation = {
        "field": "rubro",
        "type": "integer",
        "meta": {
            "interface": "select-dropdown-m2o",
            "special": ["m2o"]
        },
        "schema": {
            "foreign_key_column": "rubro",
            "foreign_key_table": "Rubros"
        }
    }
    create_field(token, "Productos", rubro_relation)

    # 2. Agregar otros campos a Productos
    fields = [
        {"field": "modelo", "type": "string", "meta": {"interface": "input"}},
        {"field": "espesor", "type": "decimal", "meta": {"interface": "input"}},
        {"field": "soporte", "type": "string", "meta": {"interface": "input"}},
        {
            "field": "color_real",
            "type": "string",
            "meta": {
                "interface": "select-dropdown",
                "options": {
                    "choices": [
                        {"text": "Blanco", "value": "Blanco"},
                        {"text": "Negro", "value": "Negro"},
                        {"text": "Gris", "value": "Gris"},
                        {"text": "Marrón", "value": "Marrón"},
                        {"text": "Rojo", "value": "Rojo"},
                        {"text": "Azul", "value": "Azul"},
                        {"text": "Verde", "value": "Verde"},
                        {"text": "Beige", "value": "Beige"}
                    ]
                }
            }
        },
        {
            "field": "unidad_medida",
            "type": "string",
            "meta": {
                "interface": "select-dropdown",
                "options": {
                    "choices": [
                        {"text": "Placa", "value": "Placa"},
                        {"text": "Unidad", "value": "Unidad"},
                        {"text": "Tira", "value": "Tira"},
                        {"text": "Litro", "value": "Litro"},
                        {"text": "Kilo", "value": "Kilo"},
                        {"text": "Par", "value": "Par"}
                    ]
                }
            }
        },
        {"field": "descripcion", "type": "string", "meta": {"interface": "input", "width": "full"}}
    ]
    for f in fields:
        create_field(token, "Productos", f)

if __name__ == "__main__":
    try:
        token = get_token()
        setup_schema(token)
        print("\nSchema setup finished.")
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
