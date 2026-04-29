import requests
import json

BASE = "https://admin.alvarezplacas.com.ar"
TOKEN = "alvarez-api-token-v16-2026"

def update_flow():
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    
    # Find flow
    r = requests.get(f"{BASE}/flows", headers=headers)
    flows = r.json()["data"]
    flow_id = None
    for f in flows:
        if "SKU" in f.get("name", "").upper():
            flow_id = f["id"]
            break
    
    if not flow_id:
        print("Flow not found")
        return

    # Find operation
    r = requests.get(f"{BASE}/operations?filter[flow][_eq]={flow_id}", headers=headers)
    ops = r.json()["data"]
    op_id = None
    for op in ops:
        if op["key"] == "generador_maestro":
            op_id = op["id"]
            break
    
    if not op_id:
        print("Operation not found")
        return

    script_code = r"""
module.exports = async function(data, { services, getSchema }) {
    const { ItemsService } = services;
    const schema = await getSchema();

    const rubrosService  = new ItemsService('Rubros',    { schema });
    const marcasService  = new ItemsService('marcas',    { schema }); // Changed to lowercase 'marcas' as per schema check
    const prodService    = new ItemsService('Productos', { schema });

    const rubroId = data.payload.rubro;
    const marcaId = data.payload.marca;
    if (!rubroId || !marcaId) return;

    const [rubro, marca] = await Promise.all([
        rubrosService.readOne(rubroId),
        marcasService.readOne(marcaId)
    ]);

    if (!rubro || !marca) return;

    // Contar productos existentes del mismo rubro+marca para el SKU
    const todos = await prodService.readByQuery({
        filter: {
            rubro: { _eq: rubroId },
            marca: { _eq: marcaId }
        },
        fields: ['id'],
        limit: -1
    });

    const correlativo = (todos.length).toString().padStart(4, '0');
    const sku = rubro.letra + '-' + (marca.codigo || '00') + '-' + correlativo;

    // Descripcion comercial segun rubro
    var modelo  = data.payload.modelo  || '';
    var espesor = data.payload.espesor ? (data.payload.espesor + 'mm') : '';
    var soporte = data.payload.soporte || '';
    var color   = data.payload.color_real || '';
    var descripcion = '';

    if (rubro.letra === 'M') {
        descripcion = ('Placa ' + marca.nombre + ' ' + modelo + ' ' + color + ' ' + espesor + ' ' + soporte).replace(/\s+/g,' ').trim();
    } else if (rubro.letra === 'H') {
        descripcion = ('Herraje ' + marca.nombre + ' ' + modelo).replace(/\s+/g,' ').trim();
    } else if (rubro.letra === 'T') {
        descripcion = ('Tapacanto ' + marca.nombre + ' ' + modelo).replace(/\s+/g,' ').trim();
    } else {
        descripcion = (rubro.nombre + ' ' + marca.nombre + ' ' + modelo).replace(/\s+/g,' ').trim();
    }

    // Actualizar el producto: poblamos NOMBRE y DESCRIPCION
    // 'nombre' es lo que aparece en la vista de lista de Directus
    await prodService.updateOne(data.key, { 
        sku: sku, 
        nombre: descripcion,
        descripcion: descripcion 
    });
};
"""
    r = requests.patch(f"{BASE}/operations/{op_id}", headers=headers, json={"options": {"code": script_code.strip()}})
    if r.status_code == 200:
        print("✅ Flow updated successfully with 'nombre' field.")
    else:
        print(f"❌ Error updating flow: {r.status_code} - {r.text}")

if __name__ == "__main__":
    update_flow()
