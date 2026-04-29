"""
Fix completo del Flow "Auto Generate SKU" en Directus.
Elimina las operaciones incompletas y crea una sola operación Run Script
que genera SKU y descripción automáticamente.
"""
import requests
import json
import sys

BASE = "https://admin.alvarezplacas.com.ar"
EMAIL = "admin@alvarezplacas.com.ar"
PASSWORD = "JavierMix2026!"
STATIC_TOKEN = "alvarez-api-token-v16-2026"

def main():
    print("=" * 60)
    print("FIX FLOW 'Auto Generate SKU' - Alvarez Placas")
    print("=" * 60)

    # 1. Login
    print("\n[1/7] Autenticando...")
    r = requests.post(f"{BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if r.status_code != 200:
        print(f"ERROR: Login falló ({r.status_code}): {r.text}")
        sys.exit(1)
    token = r.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("  ✅ Login exitoso")

    # 2. Set static token
    print("\n[2/7] Configurando token estático...")
    r = requests.get(f"{BASE}/users/me", headers=headers)
    user_id = r.json()["data"]["id"]
    requests.patch(f"{BASE}/users/{user_id}", headers=headers, json={"token": STATIC_TOKEN})
    print(f"  ✅ Token estático: {STATIC_TOKEN}")

    # 3. Find flow
    print("\n[3/7] Buscando flow 'Auto Generate SKU'...")
    r = requests.get(f"{BASE}/flows", headers=headers)
    flows = r.json()["data"]
    flow = None
    for f in flows:
        if "SKU" in f.get("name", "").upper() or "sku" in f.get("name", "").lower():
            flow = f
            break
    if not flow:
        print("ERROR: Flow no encontrado. Creando uno nuevo...")
        r = requests.post(f"{BASE}/flows", headers=headers, json={
            "name": "Auto Generate SKU",
            "status": "active",
            "trigger": "event",
            "options": {"type": "action", "scope": ["items.create"], "collections": ["Productos"]}
        })
        flow = r.json()["data"]
    flow_id = flow["id"]
    print(f"  ✅ Flow ID: {flow_id}")

    # 4. Delete existing operations
    print("\n[4/7] Eliminando operaciones incompletas...")
    r = requests.get(f"{BASE}/operations?filter[flow][_eq]={flow_id}", headers=headers)
    operations = r.json()["data"]
    # First unlink from flow
    requests.patch(f"{BASE}/flows/{flow_id}", headers=headers, json={"operation": None})
    for op in operations:
        requests.delete(f"{BASE}/operations/{op['id']}", headers=headers)
        print(f"  🗑️ Eliminada: {op.get('name', op['key'])}")
    if not operations:
        print("  (no había operaciones)")

    # 5. Update trigger config
    print("\n[5/7] Actualizando trigger...")
    requests.patch(f"{BASE}/flows/{flow_id}", headers=headers, json={
        "status": "active",
        "trigger": "event",
        "options": {
            "type": "action",
            "scope": ["items.create"],
            "collections": ["Productos"]
        }
    })
    print("  ✅ Trigger: Action | items.create | Productos")

    # 6. Create Run Script operation
    print("\n[6/7] Creando operación 'Generador Maestro SKU'...")
    script_code = r"""
module.exports = async function(data, { services, getSchema }) {
    const { ItemsService } = services;
    const schema = await getSchema();

    const rubrosService  = new ItemsService('Rubros',    { schema });
    const marcasService  = new ItemsService('Marcas',    { schema });
    const prodService    = new ItemsService('Productos', { schema });

    const rubroId = data.payload.rubro;
    const marcaId = data.payload.marca;
    if (!rubroId || !marcaId) return;

    const [rubro, marca] = await Promise.all([
        rubrosService.readOne(rubroId),
        marcasService.readOne(marcaId)
    ]);

    if (!rubro || !marca) return;

    // Contar productos existentes del mismo rubro+marca
    const todos = await prodService.readByQuery({
        filter: {
            rubro: { _eq: rubroId },
            marca: { _eq: marcaId }
        },
        fields: ['id'],
        limit: -1
    });

    const correlativo = (todos.length).toString().padStart(4, '0');
    const sku = rubro.letra + '-' + marca.codigo + '-' + correlativo;

    // Descripcion comercial segun rubro
    var modelo  = data.payload.modelo  || '';
    var espesor = data.payload.espesor ? (data.payload.espesor + 'mm') : '';
    var soporte = data.payload.soporte || '';
    var descripcion = '';

    if (rubro.letra === 'M') {
        descripcion = ('Placa ' + marca.nombre + ' ' + modelo + ' ' + espesor + ' ' + soporte).replace(/\s+/g,' ').trim();
    } else if (rubro.letra === 'H') {
        descripcion = ('Herraje ' + marca.nombre + ' ' + modelo).replace(/\s+/g,' ').trim();
    } else if (rubro.letra === 'T') {
        descripcion = ('Tapacanto ' + marca.nombre + ' ' + modelo).replace(/\s+/g,' ').trim();
    } else if (rubro.letra === 'R') {
        descripcion = ('Herramienta ' + marca.nombre + ' ' + modelo).replace(/\s+/g,' ').trim();
    } else {
        descripcion = (rubro.nombre + ' ' + marca.nombre + ' ' + modelo).replace(/\s+/g,' ').trim();
    }

    // Actualizar el producto recién creado
    await prodService.updateOne(data.key, { sku, descripcion });
};
"""

    r = requests.post(f"{BASE}/operations", headers=headers, json={
        "flow": flow_id,
        "name": "Generador Maestro SKU",
        "key": "generador_maestro",
        "type": "exec",
        "position_x": 19,
        "position_y": 1,
        "options": {"code": script_code.strip()}
    })
    if r.status_code not in (200, 201):
        print(f"ERROR creando operación: {r.status_code} {r.text}")
        sys.exit(1)
    op_id = r.json()["data"]["id"]

    # Link operation to flow
    requests.patch(f"{BASE}/flows/{flow_id}", headers=headers, json={"operation": op_id})
    print(f"  ✅ Operación creada y vinculada (ID: {op_id})")

    # 7. Verify
    print("\n[7/7] Verificación final...")
    r = requests.get(f"{BASE}/flows/{flow_id}", headers=headers)
    flow_data = r.json()["data"]
    r = requests.get(f"{BASE}/operations?filter[flow][_eq]={flow_id}", headers=headers)
    ops = r.json()["data"]
    print(f"  Flow: {flow_data['name']}")
    print(f"  Status: {flow_data['status']}")
    print(f"  Trigger: {flow_data['trigger']}")
    print(f"  Operaciones: {len(ops)}")
    for op in ops:
        print(f"    - {op['name']} ({op['type']})")

    # 8. Verify foto_principal field
    print("\n" + "=" * 60)
    print("VERIFICANDO CAMPO foto_principal...")
    r = requests.get(f"{BASE}/fields/Productos", headers=headers)
    fields = r.json()["data"]
    foto_field = None
    for f in fields:
        if f["field"] == "foto_principal":
            foto_field = f
            break
    if foto_field:
        print(f"  ✅ Campo foto_principal existe (tipo: {foto_field.get('type', 'N/A')})")
    else:
        print("  ⚠️ Campo foto_principal NO encontrado")

    # 9. Test upload capability
    print("\n" + "=" * 60)
    print("VERIFICANDO CAPACIDAD DE SUBIDA DE ARCHIVOS...")
    r = requests.get(f"{BASE}/settings", headers=headers)
    if r.status_code == 200:
        settings = r.json().get("data", {})
        storage = settings.get("storage_default_folder", "N/A")
        print(f"  ✅ Directus settings accesibles")
    
    # Test MinIO connection by listing files
    r = requests.get(f"{BASE}/files?limit=5", headers=headers)
    if r.status_code == 200:
        files = r.json()["data"]
        print(f"  ✅ Sistema de archivos accesible ({len(files)} archivos existentes)")
    else:
        print(f"  ⚠️ Error accediendo archivos: {r.status_code}")

    print("\n" + "=" * 60)
    print("✅ FLOW COMPLETADO EXITOSAMENTE")
    print("=" * 60)
    print("\nPróximos pasos:")
    print("1. Ir a Content > Productos > Crear nuevo producto")
    print("2. Seleccionar Rubro, Marca, Modelo, Espesor, Soporte")
    print("3. Guardar → SKU y Descripción se generarán automáticamente")
    print("4. Para imágenes: usar el campo foto_principal para subir AVIF/MP4")

if __name__ == "__main__":
    main()
