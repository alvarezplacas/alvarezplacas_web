/**
 * API Endpoint: Vista Parcial de Generador de Promociones
 * Retorna HTML puro para ser inyectado en el canvas central del Workspace SPA.
 * GET /api/vendedor/views/promo
 */
import type { APIRoute } from 'astro';
import { query } from '../../../../../Backend/conexiones/lib/db.js';

export const GET: APIRoute = async ({ cookies }) => {
    const sellerId = cookies.get('seller_session')?.value || '1';
    
    // 1. Cargar estado de promociones guardadas para el vendedor actual
    let promos = {
        promo1_imagen: '',
        promo1_titulo: '',
        promo1_precio: '',
        promo1_mensaje: '',
        promo2_imagen: '',
        promo2_titulo: '',
        promo2_precio: '',
        promo2_mensaje: ''
    };

    try {
        await query(`
            CREATE TABLE IF NOT EXISTS vendedor_perfiles (
                vendedor_id INTEGER PRIMARY KEY,
                name VARCHAR(255),
                foto_personal TEXT,
                foto_oferta TEXT,
                nombre_oferta VARCHAR(255),
                mensaje_oferta TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo1_imagen TEXT;`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo1_titulo VARCHAR(255);`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo1_precio VARCHAR(50);`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo1_mensaje TEXT;`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo2_imagen TEXT;`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo2_titulo VARCHAR(255);`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo2_precio VARCHAR(50);`);
        await query(`ALTER TABLE vendedor_perfiles ADD COLUMN IF NOT EXISTS promo2_mensaje TEXT;`);

        const res = await query('SELECT * FROM vendedor_perfiles WHERE vendedor_id = $1 LIMIT 1', [parseInt(sellerId)]);
        if (res?.rows?.[0]) {
            promos = { ...promos, ...res.rows[0] };
        }
    } catch (e: any) {
        console.error('[Promo View] Error fetching promos:', e.message);
    }

    // 2. Definición fija de los Insumos de Directus (para rendimiento instantáneo)
    const insumos = [
        {
            id: '32d77296-b3f2-4a60-b90b-28bdba0add31',
            title: 'Silicona Acética Blanca',
            filename: 'Mesa de trabajo 2catalogo_4.png',
            url: 'https://admin.alvarezplacas.com.ar/assets/32d77296-b3f2-4a60-b90b-28bdba0add31'
        },
        {
            id: 'ac7ec167-73a0-4266-bbec-a6fd1eb31caa',
            title: 'Diluyente Rasser',
            filename: 'Mesa de trabajo 2catalogo_0.png',
            url: 'https://admin.alvarezplacas.com.ar/assets/ac7ec167-73a0-4266-bbec-a6fd1eb31caa'
        },
        {
            id: 'b8ff1efc-6563-427c-a7c7-108d6aca796b',
            title: 'Thinner Standard Rasser',
            filename: 'Mesa de trabajo 2catalogo_1.png',
            url: 'https://admin.alvarezplacas.com.ar/assets/b8ff1efc-6563-427c-a7c7-108d6aca796b'
        },
        {
            id: 'c041f3e3-0034-44bd-92ff-81e96a603d03',
            title: 'Mastic Wood R-30 Masilla',
            filename: 'Mesa de trabajo 2catalogo_3.png',
            url: 'https://admin.alvarezplacas.com.ar/assets/c041f3e3-0034-44bd-92ff-81e96a603d03'
        }
    ];

    const html = `
<div class="view-panel" id="view-promo-builder">
  <!-- Cabecera -->
  <div class="view-header">
    <div>
      <h2 class="view-title">Generador de <span style="color:#f59e0b">Promociones para Clientes</span></h2>
      <p class="view-subtitle">Seleccioná un producto de stock real, definí su precio y dejale un mensaje personalizado a tus clientes.</p>
    </div>
    <div class="view-count">PROMO HUB</div>
  </div>

  <div class="promo-container">
    <!-- PANEL IZQUIERDO: INVENTARIO DE INSUMOS REALES -->
    <div class="promo-section insumos-grid-wrap">
      <h3 class="section-title"><i class="fas fa-boxes"></i> 1. Catálogo de Insumos (Directus)</h3>
      <p class="section-desc">Hacé clic en cualquier producto para agregarlo a una de tus promociones activas.</p>
      
      <div class="insumos-grid">
        ${insumos.map(item => `
          <div class="insumo-card" data-id="${item.id}" data-title="${item.title}" data-url="${item.url}">
            <div class="insumo-image-wrap">
              <img src="${item.url}" alt="${item.title}" />
            </div>
            <div class="insumo-info">
              <span class="insumo-badge">Directus Folder</span>
              <h4 class="insumo-title">${item.title}</h4>
              <div class="insumo-actions">
                <button type="button" class="btn-assign" data-target="1">
                  <i class="fas fa-plus"></i> Usar en Promo 1
                </button>
                <button type="button" class="btn-assign" data-target="2">
                  <i class="fas fa-plus"></i> Usar en Promo 2
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- PANEL DERECHO: FORMULARIO DE PROMOCIONES ACTIVAS -->
    <div class="promo-section forms-panel">
      <form id="promos-edit-form" class="promos-form">
        <h3 class="section-title"><i class="fas fa-bullhorn"></i> 2. Tus Promociones Activas</h3>
        <p class="section-desc">Definí los detalles del producto que verán tus clientes en su panel principal.</p>

        <!-- PROMO 1 -->
        <div class="promo-slot-card active" id="slot-promo-1">
          <div class="slot-header">
            <span class="slot-badge badge-promo-1">PROMO 1: DESTACADA</span>
            <button type="button" class="btn-clear-slot" data-clear="1" title="Limpiar Promo 1">
              <i class="fas fa-trash-alt"></i> Limpiar
            </button>
          </div>

          <div class="slot-body">
            <div class="slot-preview-wrap">
              <img id="promo1-img-preview" src="${promos.promo1_imagen || 'https://admin.alvarezplacas.com.ar/assets/32d77296-b3f2-4a60-b90b-28bdba0add31'}" />
              <input type="hidden" id="promo1-imagen" value="${promos.promo1_imagen || 'https://admin.alvarezplacas.com.ar/assets/32d77296-b3f2-4a60-b90b-28bdba0add31'}" />
            </div>

            <div class="slot-inputs">
              <div>
                <label class="input-label">Título del Producto</label>
                <input type="text" id="promo1-titulo" class="promo-input" value="${promos.promo1_titulo || ''}" placeholder="Ej: Silicona Acética Blanca 300ml" required />
              </div>
              <div class="grid-2-col">
                <div>
                  <label class="input-label">Precio Especial ($)</label>
                  <input type="text" id="promo1-precio" class="promo-input price-highlight" value="${promos.promo1_precio || ''}" placeholder="Ej: $4.500 o Bonificado" required />
                </div>
                <div>
                  <label class="input-label">Mensaje para tus Clientes</label>
                  <textarea id="promo1-mensaje" class="promo-input" style="height: 40px; resize: none;" placeholder="Ej: ¡Oferta exclusiva para stock inmediato!">${promos.promo1_mensaje || ''}</textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PROMO 2 -->
        <div class="promo-slot-card active" id="slot-promo-2">
          <div class="slot-header">
            <span class="slot-badge badge-promo-2">PROMO 2: DESTACADA</span>
            <button type="button" class="btn-clear-slot" data-clear="2" title="Limpiar Promo 2">
              <i class="fas fa-trash-alt"></i> Limpiar
            </button>
          </div>

          <div class="slot-body">
            <div class="slot-preview-wrap">
              <img id="promo2-img-preview" src="${promos.promo2_imagen || 'https://admin.alvarezplacas.com.ar/assets/ac7ec167-73a0-4266-bbec-a6fd1eb31caa'}" />
              <input type="hidden" id="promo2-imagen" value="${promos.promo2_imagen || 'https://admin.alvarezplacas.com.ar/assets/ac7ec167-73a0-4266-bbec-a6fd1eb31caa'}" />
            </div>

            <div class="slot-inputs">
              <div>
                <label class="input-label">Título del Producto</label>
                <input type="text" id="promo2-titulo" class="promo-input" value="${promos.promo2_titulo || ''}" placeholder="Ej: Diluyente Rasser de 1 Litro" />
              </div>
              <div class="grid-2-col">
                <div>
                  <label class="input-label">Precio Especial ($)</label>
                  <input type="text" id="promo2-precio" class="promo-input price-highlight" value="${promos.promo2_precio || ''}" placeholder="Ej: $8.900" />
                </div>
                <div>
                  <label class="input-label">Mensaje para tus Clientes</label>
                  <textarea id="promo2-mensaje" class="promo-input" style="height: 40px; resize: none;" placeholder="Ej: ¡Llevando 5 cajas el envío al taller es gratis!">${promos.promo2_mensaje || ''}</textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTÓN GUARDAR -->
        <button type="submit" id="btn-save-promos" class="btn-submit-promos">
          <i class="fas fa-save"></i> Publicar Promociones al Dashboard de Clientes
        </button>
      </form>
    </div>
  </div>
</div>

<style>
  #view-promo-builder { animation: fadeIn .25s ease; width: 100%; box-sizing: border-box; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  
  .view-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #222; padding-bottom: 15px; }
  .view-title { font-size: 24px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: -.5px; }
  .view-subtitle { font-size: 12px; color: #888; margin-top: 4px; }
  .view-count { font-size: 11px; font-weight: 900; color: #f59e0b; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); padding: 4px 12px; border-radius: 20px; white-space: nowrap; }

  .promo-container { display: grid; grid-template-columns: 1.1fr 1fr; gap: 24px; }
  
  .promo-section { background: #151515; border: 1px solid #252525; border-radius: 16px; padding: 20px; box-sizing: border-box; }
  .section-title { font-size: 14px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: .05em; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .section-desc { font-size: 11px; color: #666; margin-bottom: 20px; }

  /* Insumos Grid */
  .insumos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .insumo-card { background: #1e1e1e; border: 1px solid #333; border-radius: 12px; overflow: hidden; transition: all 0.2s ease-in-out; display: flex; flex-direction: column; }
  .insumo-card:hover { border-color: #f59e0b; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
  
  .insumo-image-wrap { width: 100%; height: 110px; background: #fff; display: flex; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box; }
  .insumo-image-wrap img { max-width: 100%; max-height: 100%; object-fit: contain; }
  
  .insumo-info { padding: 12px; display: flex; flex-direction: column; gap: 6px; flex: 1; justify-content: space-between; }
  .insumo-badge { font-size: 8px; font-weight: 900; text-transform: uppercase; color: #a3e635; background: rgba(163,230,53,0.1); width: fit-content; padding: 2px 6px; border-radius: 4px; }
  .insumo-title { font-size: 12px; font-weight: 700; color: #eee; line-height: 1.3; }
  
  .insumo-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
  .btn-assign { background: #2b2b2b; border: 1px solid #3d3d3d; color: #ccc; font-size: 9px; font-weight: 900; text-transform: uppercase; padding: 6px 4px; border-radius: 6px; cursor: pointer; transition: all 0.15s; text-align: center; }
  .btn-assign:hover { background: #f59e0b; color: #000; border-color: #f59e0b; }

  /* Forms Panel */
  .promos-form { display: flex; flex-direction: column; gap: 16px; }
  .promo-slot-card { background: #1a1a1a; border: 1px solid #2d2d2d; border-radius: 12px; padding: 14px; position: relative; }
  .promo-slot-card.active { border-color: #3b82f6; background: rgba(59,130,246,0.02); }
  #slot-promo-2.active { border-color: #10b981; background: rgba(16,185,129,0.02); }

  .slot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #282828; padding-bottom: 8px; }
  .slot-badge { font-size: 9px; font-weight: 900; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; letter-spacing: .05em; }
  .badge-promo-1 { background: rgba(59,130,246,0.15); color: #60a5fa; }
  .badge-promo-2 { background: rgba(16,185,129,0.15); color: #34d399; }
  
  .btn-clear-slot { background: transparent; border: none; color: #ef4444; font-size: 9px; font-weight: 900; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 4px; opacity: 0.7; transition: opacity 0.15s; }
  .btn-clear-slot:hover { opacity: 1; }

  .slot-body { display: flex; gap: 14px; }
  .slot-preview-wrap { width: 75px; height: 75px; background: #fff; border-radius: 8px; border: 1px solid #333; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 4px; box-sizing: border-box; }
  .slot-preview-wrap img { max-width: 100%; max-height: 100%; object-fit: contain; }

  .slot-inputs { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .grid-2-col { display: grid; grid-template-columns: 1fr 1.2fr; gap: 8px; }
  
  .input-label { display: block; font-size: 8px; font-weight: 900; text-transform: uppercase; color: #888; margin-bottom: 4px; letter-spacing: .05em; }
  .promo-input { width: 100%; border: 1px solid #2d2d2d; border-radius: 6px; padding: 6px 10px; color: #fff; font-size: 11px; outline: none; background: #222; box-sizing: border-box; }
  .promo-input:focus { border-color: #555; }
  .price-highlight { color: #f59e0b; font-weight: 900; font-family: 'JetBrains Mono', monospace; }

  .btn-submit-promos { background: #f59e0b; border: none; color: #000; font-size: 12px; font-weight: 900; text-transform: uppercase; padding: 14px; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; box-shadow: 0 4px 15px rgba(245,158,11,0.25); }
  .btn-submit-promos:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,255,255,0.15); }
</style>

<script>
(function() {
  // Manejo de asignación desde el grid de insumos
  document.querySelectorAll('.btn-assign').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSlot = btn.getAttribute('data-target');
      const card = btn.closest('.insumo-card');
      if (!card) return;

      const title = card.getAttribute('data-title');
      const url = card.getAttribute('data-url');

      if (targetSlot === '1') {
        const preview = document.getElementById('promo1-img-preview');
        const hiddenInput = document.getElementById('promo1-imagen');
        const titleInput = document.getElementById('promo1-titulo');
        
        if (preview) preview.src = url;
        if (hiddenInput) hiddenInput.value = url;
        if (titleInput) titleInput.value = title;
        
        // Efecto visual flash
        const slot = document.getElementById('slot-promo-1');
        if (slot) {
          slot.style.borderColor = '#f59e0b';
          setTimeout(() => slot.style.borderColor = '#3b82f6', 400);
        }
      } else if (targetSlot === '2') {
        const preview = document.getElementById('promo2-img-preview');
        const hiddenInput = document.getElementById('promo2-imagen');
        const titleInput = document.getElementById('promo2-titulo');
        
        if (preview) preview.src = url;
        if (hiddenInput) hiddenInput.value = url;
        if (titleInput) titleInput.value = title;
        
        // Efecto visual flash
        const slot = document.getElementById('slot-promo-2');
        if (slot) {
          slot.style.borderColor = '#f59e0b';
          setTimeout(() => slot.style.borderColor = '#10b981', 400);
        }
      }
    });
  });

  // Limpiar Slots
  document.querySelectorAll('.btn-clear-slot').forEach(btn => {
    btn.addEventListener('click', () => {
      const clearSlot = btn.getAttribute('data-clear');
      if (clearSlot === '1') {
        document.getElementById('promo1-img-preview').src = 'https://admin.alvarezplacas.com.ar/assets/32d77296-b3f2-4a60-b90b-28bdba0add31';
        document.getElementById('promo1-imagen').value = '';
        document.getElementById('promo1-titulo').value = '';
        document.getElementById('promo1-precio').value = '';
        document.getElementById('promo1-mensaje').value = '';
      } else if (clearSlot === '2') {
        document.getElementById('promo2-img-preview').src = 'https://admin.alvarezplacas.com.ar/assets/ac7ec167-73a0-4266-bbec-a6fd1eb31caa';
        document.getElementById('promo2-imagen').value = '';
        document.getElementById('promo2-titulo').value = '';
        document.getElementById('promo2-precio').value = '';
        document.getElementById('promo2-mensaje').value = '';
      }
    });
  });

  // Guardar Formulario
  const form = document.getElementById('promos-edit-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-save-promos');
    if (btnSubmit) {
      btnSubmit.setAttribute('disabled', 'true');
      btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando y Publicando...';
    }

    const payload = {
      promo1_imagen: document.getElementById('promo1-imagen')?.value,
      promo1_titulo: document.getElementById('promo1-titulo')?.value,
      promo1_precio: document.getElementById('promo1-precio')?.value,
      promo1_mensaje: document.getElementById('promo1-mensaje')?.value,
      
      promo2_imagen: document.getElementById('promo2-imagen')?.value,
      promo2_titulo: document.getElementById('promo2-titulo')?.value,
      promo2_precio: document.getElementById('promo2-precio')?.value,
      promo2_mensaje: document.getElementById('promo2-mensaje')?.value,
    };

    try {
      const res = await fetch('/api/vendedor/update-promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        alert('¡Promociones comerciales publicadas con éxito! Tus clientes asignados las verán destacadas en su dashboard.');
        // Recargar vista
        if (window.workspaceLoadView) window.workspaceLoadView('promo');
      } else {
        alert('Error al guardar promociones: ' + data.error);
      }
    } catch(err) {
      console.error(err);
      alert('Ocurrió un error al enviar la solicitud.');
    } finally {
      if (btnSubmit) {
        btnSubmit.removeAttribute('disabled');
        btnSubmit.innerHTML = '<i class="fas fa-save"></i> Publicar Promociones al Dashboard de Clientes';
      }
    }
  });
})();
</script>
`;

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
};
