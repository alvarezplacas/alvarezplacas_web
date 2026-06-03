/**
 * API Endpoint: Vista Parcial de Pedidos
 * Retorna HTML puro para ser inyectado en el canvas central del Workspace SPA.
 * GET /api/vendedor/views/pedidos
 */
import type { APIRoute } from 'astro';
import { directus, readItems, readItem } from '@conexiones/directus.js';

export const GET: APIRoute = async ({ cookies }) => {
    const sellerId = cookies.get('seller_session')?.value || '1';
    let pedidos: any[] = [];
    let isJefe = false;
    let vendedores: any[] = [];

    try {
        const sellerObj = await directus.request(readItem('vendedores', sellerId)) as any;
        if (sellerObj) {
            const sellerRole = sellerObj.role || '';
            isJefe = sellerRole === 'admin' || sellerRole === '75e0f734-0913-4a3c-ae0b-4f5135710b97';
        }
        
        // Cargar todos los vendedores si es Jefe de Ventas / Admin
        if (isJefe) {
            vendedores = await directus.request(readItems('vendedores', {
                filter: { status: { _eq: 'active' } },
                fields: ['id', 'name']
            })) as any[];
        }
    } catch (e: any) {
        console.error('Error cargando datos del vendedor o vendedores:', e.message);
    }

    const filter = isJefe ? {} : { vendedor_id: { _eq: sellerId } };

    try {
        pedidos = await directus.request(readItems('pedidos', {
            filter,
            sort: ['-fecha_pedido'],
            limit: 50,
            fields: [
                'id', 
                'status', 
                'total_m2', 
                'total', 
                'fecha_pedido', 
                'datos_optimizacion', 
                { cliente_id: ['id', 'name', 'email', 'phone', 'address', 'nombre_empresa'] },
                { vendedor_id: ['id', 'name'] }
            ]
        })) as any[];
    } catch (e: any) {
        console.error('Error cargando pedidos:', e.message);
    }

    const statusConfig: Record<string, { label: string; color: string }> = {
        presupuesto:   { label: 'Presupuesto',    color: '#6366f1' },
        en_produccion: { label: 'En Producción',   color: '#f59e0b' },
        en_corte:      { label: 'En Corte',        color: '#3b82f6' },
        terminado:     { label: 'Listo',           color: '#22c55e' },
        en_reparto:    { label: 'En Reparto',      color: '#a855f7' },
        entregado:     { label: 'Entregado',       color: '#10b981' },
    };

    const statusOptions = Object.entries(statusConfig).map(([val, cfg]) =>
        `<option value="${val}">${cfg.label}</option>`
    ).join('');

    const html = `
<div class="view-panel" id="view-pedidos">
  <div class="view-header">
    <div>
      <h2 class="view-title">Gestión de <span class="text-accent-blue">Pedidos</span></h2>
      <p class="view-subtitle">Seguimiento en tiempo real de las órdenes de tus clientes.</p>
    </div>
    <div class="view-count">${pedidos.length} pedidos</div>
  </div>

  ${pedidos.length === 0 ? `
  <div class="empty-state">
    <i class="fas fa-clipboard-list empty-icon"></i>
    <p class="empty-title">Sin pedidos registrados</p>
    <p class="empty-sub">Los pedidos de tus clientes aparecerán aquí cuando sean creados.</p>
  </div>` : `
  <div class="pedidos-table-wrap">
    <table class="pedidos-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Fecha</th>
          <th>Total</th>
          ${isJefe ? '<th>Vendedor</th>' : ''}
          <th>Estado</th>
          <th style="text-align: right; padding-right: 24px;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${pedidos.map(p => {
            const sc = statusConfig[p.status] || { label: p.status, color: '#666' };
            const cliente = p.cliente_id?.nombre_empresa || p.cliente_id?.name || 'Cliente Particular';
            const fecha = p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString('es-AR') : '—';
            
            // Extraer la fecha solicitada de entrega desde el JSON de optimización
            const reqDate = p.datos_optimizacion?.fecha_entrega_requerida
                ? new Date(p.datos_optimizacion.fecha_entrega_requerida).toLocaleDateString('es-AR')
                : 'A CONFIRMAR';
            
            const vendedorName = p.vendedor_id?.name || '❌ Sin Asignar';
            
            let vendedorSelectHtml = vendedorName;
            if (isJefe && vendedores.length > 0) {
              const currentVendedorId = p.vendedor_id?.id || '';
              const client_id_val = p.cliente_id?.id || '';
              const clientPhone = p.cliente_id?.phone || '';
              
              const vOptions = vendedores.map(v => 
                `<option value="${v.id}" ${currentVendedorId === v.id ? 'selected' : ''}>${v.name}</option>`
              ).join('');
              
              vendedorSelectHtml = `
              <div style="display: inline-flex; align-items: center; gap: 6px;">
                <select class="vendedor-select" data-id="${p.id}" data-cliente-id="${client_id_val}" data-phone="${clientPhone}" data-cliente-name="${cliente}" style="background: rgba(0, 0, 0, 0.3); border: 1px solid #333; color: #fff; font-size: 11px; font-weight: 700; border-radius: 6px; padding: 4px 8px; outline: none; cursor: pointer; transition: all 0.15s; width: 130px;">
                  <option value="">❌ Sin Asignar</option>
                  ${vOptions}
                </select>
                <a href="#" class="btn-wa-vendedor tooltip-trigger" data-tooltip="Avisar por WhatsApp al cliente" data-id="${p.id}" style="color: #22c55e; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 6px; font-size: 12px; transition: all 0.15s; vertical-align: middle; text-decoration: none;" target="_blank">
                  <i class="fab fa-whatsapp"></i>
                </a>
              </div>`;
            }
            
            const opts = Object.entries(statusConfig).map(([val, cfg]) =>
                `<option value="${val}" ${p.status === val ? 'selected' : ''}>${cfg.label}</option>`
            ).join('');
            return `
        <tr class="pedido-row">
          <td><span class="pedido-id">#${p.id}</span></td>
          <td>
            <p class="pedido-cliente">${cliente}</p>
            <p class="pedido-sub" style="display:flex; align-items:center; gap:8px;">
              <span>Interno #${p.id}</span>
              ${p.status === 'en_produccion' && p.cliente_id?.phone ? `
              <a href="tel:${p.cliente_id.phone}" class="tooltip-trigger" data-tooltip="📞 LLAMAR YA PARA COORDINAR PAGO" style="display: inline-flex; align-items: center; gap: 4px; background: #eab308; color: #000; border: 1px solid #eab308; font-size: 8px; font-weight: 900; border-radius: 4px; padding: 2px 6px; text-transform: uppercase; text-decoration: none; animation: blinker 1.5s linear infinite; font-family: sans-serif;">
                <i class="fas fa-phone-alt" style="font-size:7px;"></i> LLAMAR AL CLIENTE
              </a>
              ` : ''}
            </p>
          </td>
          <td class="pedido-date">
            ${fecha}
            <span style="display:block; font-size:9px; color:#ff2800; font-weight:900; margin-top:3px; text-transform:uppercase; white-space:nowrap;">Entrega: ${reqDate}</span>
          </td>
          <td class="pedido-total">${p.total_m2 || 0} m²</td>
          ${isJefe ? `<td class="pedido-vendedor">${vendedorSelectHtml}</td>` : ''}
          <td>
            <select class="status-select" data-id="${p.id}" style="--sc: ${sc.color}">
              ${opts}
            </select>
          </td>
          <td style="text-align: right; padding-right: 20px;">
            <button class="btn-details tooltip-trigger" 
                    data-tooltip="Ver Detalles y Plano" 
                    data-id="${p.id}" 
                    style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); color: #3b82f6; cursor: pointer; padding: 6px 12px; font-size: 10px; font-weight: 900; border-radius: 8px; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="fas fa-eye"></i> Detalles
            </button>
          </td>
        </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`}
</div>

<!-- DETAILS MODAL -->
<div class="detail-modal" id="detail-modal">
  <div class="detail-content">
    <div class="detail-header">
      <span class="detail-title">Detalles del Pedido <span id="m-order-id" style="color:#ef4444;">#...</span></span>
      <button class="detail-close" id="btn-close-modal">&times;</button>
    </div>
    <div class="detail-body">
      <!-- Client Card -->
      <div class="info-grid">
        <div class="info-item">
          <span class="info-lbl">Cliente</span>
          <span class="info-val" id="m-client-name">...</span>
        </div>
        <div class="info-item">
          <span class="info-lbl">Email</span>
          <span class="info-val" id="m-client-email">...</span>
        </div>
        <div class="info-item">
          <span class="info-lbl">Teléfono / WhatsApp</span>
          <span class="info-val" style="display:flex; align-items:center; gap:6px;">
            <span id="m-client-phone">...</span>
            <a href="#" id="m-btn-wa-client" target="_blank" style="color:#22c55e; display:none; align-items:center; justify-content:center; text-decoration:none;" title="Enviar WhatsApp">
              <i class="fab fa-whatsapp" style="font-size: 14px;"></i>
            </a>
          </span>
        </div>
        <div class="info-item">
          <span class="info-lbl">Dirección</span>
          <span class="info-val" id="m-client-address">...</span>
        </div>
      </div>
      
      <!-- CARGA DE COTIZACIÓN OFICIAL -->
      <div id="m-quote-section" style="background: rgba(255, 40, 0, 0.03); border: 1.5px dashed rgba(255, 40, 0, 0.15); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 15px;">
        <span style="font-size: 10px; font-weight: 900; color: #ff2800; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-file-invoice-dollar"></i> Cargar Cotización Comercial
        </span>
        
        <!-- Estado Actual de Cotización -->
        <div id="m-quote-current-val" style="font-size: 11px; font-weight: 800; color: #22c55e; display: none; align-items: center; gap: 6px;">
          <i class="fas fa-check-circle"></i> Cotización Activa: <span id="m-quote-price-label" style="font-size:13px; font-weight:900;">$0</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 15px; align-items: flex-end;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 9px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Importe Pesos ($)</label>
            <input type="number" id="m-quote-total" style="background: #000; border: 1px solid #333; color: #fff; padding: 10px 14px; font-size: 13px; font-weight: 800; border-radius: 8px; outline: none; width: 100%;" placeholder="Monto total...">
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 9px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Notas de la Cotización</label>
            <input type="text" id="m-quote-comments" style="background: #000; border: 1px solid #333; color: #fff; padding: 10px 14px; font-size: 11px; font-weight: 700; border-radius: 8px; outline: none; width: 100%;" placeholder="Detalles de placas y herrajes Greenway/Bronzen...">
          </div>
        </div>
        <button id="m-btn-submit-quote" style="background: #ff2800; color: #fff; border: none; font-weight: 900; font-size: 11px; text-transform: uppercase; padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: all 0.2s; align-self: flex-end; display: flex; align-items: center; gap: 6px;">
          <i class="fas fa-paper-plane"></i> Enviar Cotización
        </button>
      </div>
      
      <!-- Material & Piece List -->
      <div class="pieces-section">
        <span class="pieces-title">Materiales y Medidas del Cliente</span>
        <div id="m-projects-container" style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
          <!-- Rendered dynamically -->
        </div>
      </div>
      
      <!-- Actions -->
      <div style="display:flex; justify-content: flex-end; gap: 12px; margin-top: 10px; border-top: 1px solid #2a2a2a; padding-top: 20px;">
        <button class="btn-cancel" id="btn-cancel-modal" style="background:#222; border:1px solid #333; color:#aaa; padding:10px 20px; border-radius:10px; font-size:11px; font-weight:700; text-transform:uppercase; cursor:pointer; transition: all 0.2s;">Cerrar</button>
        <a href="#" target="_blank" class="btn-plano" id="m-btn-plano">
          <i class="fas fa-file-pdf"></i> Ver Plano de Corte
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  .view-panel { animation: fadeIn .25s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .view-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
  .view-title { font-size: 22px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: -.5px; }
  .view-subtitle { font-size: 12px; color: #666; margin-top: 4px; }
  .view-count { font-size: 11px; font-weight: 700; color: #555; background: #222; border: 1px solid #333; padding: 4px 10px; border-radius: 20px; }
  .text-accent-blue { color: #3b82f6; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: #444; }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: .3; }
  .empty-title { font-size: 14px; font-weight: 700; color: #555; }
  .empty-sub { font-size: 11px; color: #444; margin-top: 4px; text-align: center; max-width: 280px; }
  .pedidos-table-wrap { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; overflow: hidden; }
  .pedidos-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .pedidos-table thead tr { background: rgba(0,0,0,.4); }
  .pedidos-table th { padding: 14px 20px; text-align: left; color: #555; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
  .pedidos-table th:last-child { text-align: right; }
  .pedido-row { border-top: 1px solid #222; transition: background .15s; }
  .pedido-row:hover { background: rgba(255,255,255,.03); }
  .pedidos-table td { padding: 12px 20px; }
  .pedido-id { font-family: monospace; color: #3b82f6; font-weight: 700; font-size: 11px; }
  .pedido-cliente { color: #fff; font-weight: 700; font-size: 12px; }
  .pedido-sub { font-size: 9px; color: #444; text-transform: uppercase; margin-top: 2px; }
  .pedido-date { color: #555; font-size: 11px; }
  .pedido-total { color: #fff; font-weight: 900; font-size: 13px; }
  .status-select { background: #111; border: 1px solid #333; border-radius: 8px; padding: 5px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--sc, #666); outline: none; cursor: pointer; transition: border-color .2s; width: 100%; }
  .status-select:focus { border-color: var(--sc, #3b82f6); }
  .btn-details:hover { background: #3b82f6 !important; color: #fff !important; transform: scale(1.03); }

  /* Details Modal Styles */
  .detail-modal {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
  .detail-modal.show { display: flex; }
  
  .detail-content {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 20px;
    width: 100%;
    max-width: 650px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    display: flex;
    flex-direction: column;
    animation: scaleUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes scaleUpModal { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  
  .detail-header {
    padding: 18px 24px;
    border-bottom: 1px solid #2a2a2a;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0,0,0,0.2);
  }
  .detail-title { font-size: 15px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
  .detail-close { background: none; border: none; color: #888; font-size: 24px; cursor: pointer; transition: color .15s; }
  .detail-close:hover { color: #fff; }
  
  .detail-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
  
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: rgba(0,0,0,0.25); border: 1px solid #252525; padding: 16px; border-radius: 12px; }
  .info-item { display: flex; flex-direction: column; gap: 4px; }
  .info-lbl { font-size: 9px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-val { font-size: 12px; font-weight: 700; color: #fff; }
  
  .pieces-section { display: flex; flex-direction: column; gap: 10px; }
  .pieces-title { font-size: 10px; font-weight: 900; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; }
  .project-block { background: rgba(255,255,255,0.015); border: 1px solid #252525; border-radius: 12px; padding: 14px; margin-bottom: 12px; }
  .project-header { font-size: 11px; font-weight: 800; color: #fff; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  
  .pieces-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .pieces-table th { color: #555; font-weight: 800; padding: 6px 8px; border-bottom: 1px solid #222; text-align: left; text-transform: uppercase; font-size: 9px; }
  .pieces-table td { padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.02); color: #ccc; }
  .pieces-table tr:hover td { color: #fff; background: rgba(255,255,255,0.02); }
  
  .btn-plano {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #e02020;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    box-shadow: 0 5px 15px rgba(224,32,32,0.2);
  }
  .btn-plano:hover { background: #ff2800; transform: translateY(-1px); box-shadow: 0 7px 20px rgba(224,32,32,0.3); }
  .btn-cancel:hover { background: #333 !important; color:#fff !important; }
</style>

<script>
  (function() {
    // Array de pedidos inyectado de forma segura
    const ORDERS_DB = ${JSON.stringify(pedidos)};
    // Vendedores inyectados para el generador de enlaces de WhatsApp
    const VENDEDORES_DB = ${JSON.stringify(vendedores)};

    function updateWhatsAppLink(selectEl) {
      const parent = selectEl.parentElement;
      if (!parent) return;
      const btnWa = parent.querySelector('.btn-wa-vendedor');
      if (!btnWa) return;
      
      const phone = selectEl.getAttribute('data-phone') || '';
      const clienteName = selectEl.getAttribute('data-cliente-name') || '';
      const vendedorId = selectEl.value;
      
      if (!phone || !vendedorId) {
        btnWa.style.display = 'none';
        return;
      }
      
      btnWa.style.display = 'inline-flex';
      
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = '549' + cleanPhone;
      } else if (cleanPhone.startsWith('15') && cleanPhone.length === 11) {
        cleanPhone = '549' + cleanPhone.substring(2);
      } else if (!cleanPhone.startsWith('54')) {
        cleanPhone = '549' + cleanPhone;
      }
      
      const v = VENDEDORES_DB.find(x => x.id.toString() === vendedorId.toString());
      const vName = v ? v.name : 'tu asesor';
      
      let msg = "Hola " + clienteName + ", te contacto de Alvarez Placas. Quería avisarte que a partir de ahora " + vName + " es tu asesor asignado para gestionar tus pedidos y consultas. ¡Estamos a tu disposición!";
      
      if (vName.toLowerCase().includes('facundo')) {
        msg = "Hola " + clienteName + ", soy Facundo de Alvarez Placas. Quería avisarte que a partir de ahora voy a ser tu asesor personal para gestionar tus pedidos y consultas. Cualquier presupuesto o duda que tengas, me podés escribir directamente por acá. ¡Un saludo!";
      }
      
      btnWa.href = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(msg);
    }

    // Inicializar enlaces de WhatsApp al cargar la página
    document.querySelectorAll('.vendedor-select').forEach(sel => {
      updateWhatsAppLink(sel);
    });

    // Eventos para Cambio de Estado
    document.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const target = e.target;
        const pedidoId = target.getAttribute('data-id');
        const status = target.value;
        target.style.opacity = '0.5';
        try {
          const res = await fetch('/api/admin/update-order-status', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ pedidoId, status })
          });
          if (res.ok) {
            target.style.opacity = '1';
            target.style.outline = '2px solid currentColor';
            setTimeout(() => { target.style.outline = ''; }, 1500);
          }
        } catch(e) { console.error(e); target.style.opacity = '1'; }
      });
    });

    // Eventos para Cambio de Vendedor (Solo administradores / Jefe de Ventas)
    document.querySelectorAll('.vendedor-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const target = e.target;
        const pedidoId = target.getAttribute('data-id');
        const clienteId = target.getAttribute('data-cliente-id');
        const vendedorId = target.value;
        target.style.opacity = '0.5';
        try {
          const res = await fetch('/api/admin/update-order-seller', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ pedidoId, clienteId, vendedorId })
          });
          if (res.ok) {
            target.style.opacity = '1';
            target.style.outline = '2px solid #3b82f6';
            updateWhatsAppLink(target);
            setTimeout(() => { target.style.outline = ''; }, 1500);
          }
        } catch(e) { console.error(e); target.style.opacity = '1'; }
      });
    });

    // Eventos para el Modal de Detalles
    document.querySelectorAll('.btn-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = parseInt(btn.getAttribute('data-id'));
        const order = ORDERS_DB.find(o => o.id === orderId);
        if (!order) return;
        
        // Cargar Datos del Cliente
        const c = order.cliente_id || {};
        document.getElementById('m-client-name').textContent = c.name || 'Cliente Particular';
        document.getElementById('m-client-email').textContent = c.email || 'No especificado';
        
        const phone = c.phone || '';
        document.getElementById('m-client-phone').textContent = phone || 'No especificado';
        
        const btnWaClient = document.getElementById('m-btn-wa-client');
        if (phone && btnWaClient) {
          let cleanPhone = phone.replace(/\D/g, '');
          if (cleanPhone.length === 10) {
            cleanPhone = '549' + cleanPhone;
          } else if (cleanPhone.startsWith('15') && cleanPhone.length === 11) {
            cleanPhone = '549' + cleanPhone.substring(2);
          } else if (!cleanPhone.startsWith('54')) {
            cleanPhone = '549' + cleanPhone;
          }
          btnWaClient.href = 'https://wa.me/' + cleanPhone;
          btnWaClient.style.display = 'inline-flex';
        } else if (btnWaClient) {
          btnWaClient.style.display = 'none';
        }
        
        document.getElementById('m-client-address').textContent = c.address || 'No especificada';
        document.getElementById('m-order-id').textContent = '#' + order.id;
        
        // Cargar Cotización Existente si la posee
        const quoteTotal = order.total ? parseFloat(order.total) : 0;
        const totalInput = document.getElementById('m-quote-total');
        const commentsInput = document.getElementById('m-quote-comments');
        const currentValEl = document.getElementById('m-quote-current-val');
        const priceLabel = document.getElementById('m-quote-price-label');
        const submitBtn = document.getElementById('m-btn-submit-quote');

        if (totalInput && commentsInput && currentValEl && priceLabel && submitBtn) {
            totalInput.value = quoteTotal > 0 ? quoteTotal : '';
            commentsInput.value = order.resumen_visible && !order.resumen_visible.includes('El detalle está') ? order.resumen_visible : '';
            
            if (quoteTotal > 0) {
                priceLabel.textContent = '$' + quoteTotal.toLocaleString('es-AR');
                currentValEl.style.display = 'flex';
            } else {
                currentValEl.style.display = 'none';
            }

            // Guardar ID en data-id del botón para saber cuál cotizar
            submitBtn.setAttribute('data-id', order.id);

            // Si el pedido ya no es un presupuesto (es decir, ya fue aprobado o entregado), ocultar/desactivar controles
            const quoteSection = document.getElementById('m-quote-section');
            if (order.status !== 'presupuesto') {
                submitBtn.style.display = 'none';
                totalInput.disabled = true;
                commentsInput.disabled = true;
                if (quoteSection) {
                    quoteSection.style.background = 'rgba(255,255,255,0.01)';
                    quoteSection.style.borderColor = '#222';
                    quoteSection.style.borderStyle = 'solid';
                }
            } else {
                submitBtn.style.display = 'flex';
                totalInput.disabled = false;
                commentsInput.disabled = false;
                if (quoteSection) {
                    quoteSection.style.background = 'rgba(255, 40, 0, 0.03)';
                    quoteSection.style.borderColor = 'rgba(255, 40, 0, 0.15)';
                    quoteSection.style.borderStyle = 'dashed';
                }
            }
        }
        
        // Renderizar Detalle de Materiales y Piezas
        const container = document.getElementById('m-projects-container');
        container.innerHTML = '';
        
        const opt = order.datos_optimizacion || {};
        const projects = opt.projects || [];
        
        if (projects.length === 0) {
          container.innerHTML = '<p style="font-size:12px; color:#555; font-style:italic; padding: 10px 0;">No hay piezas detalladas cargadas en este pedido.</p>';
        } else {
          projects.forEach(proj => {
            const pieces = proj.pieces || [];
            let piecesHtml = "";
            pieces.forEach(p => {
              piecesHtml += "<tr><td><strong style='color: #3b82f6;'>" + p.q + "</strong></td><td><strong>" + p.l + " mm</strong></td><td><strong>" + p.h + " mm</strong></td><td style='color:#aaa;'>" + (p.label || '—') + "</td></tr>";
            });
            
            // Construir texto plano compatible con Lepton
            const leptonLines = pieces.map(p => p.q + "\\t" + p.l + "\\t" + p.h + "\\t" + (p.label || '')).join("\\n");
            
            // Reconstruir el contenido de un archivo de texto compatible con el Asistente de Importacion de Lepton
            let importTxt = "";
            pieces.forEach(p => {
              const matName = ((proj.brand || '') + ' ' + (proj.design || '')).trim() || 'Melamina';
              const canRotateVal = p.canRotate === false ? 0 : 1;
              // Formato de 6 campos: Cantidad;Largo;Alto;NombrePieza;Material;Girar
              importTxt += p.q + ";" + p.l + ";" + p.h + ";" + (p.label || '') + ";" + matName + ";" + canRotateVal + "\\n";
            });

            container.innerHTML += '<div class="project-block">' +
              '<div class="project-header" style="display:flex; align-items:center; justify-content:space-between; width:100%;">' +
                '<span style="display:inline-flex; align-items:center;">' +
                  '<i class="fas fa-layer-group" style="color:#3b82f6; margin-right:6px;"></i> ' + (proj.brand || 'MATERIAL') + ' - ' + (proj.design || 'DISEÑO') +
                '</span>' +
                '<div style="display:inline-flex; gap:6px;">' +
                  '<button class="btn-copy-lepton" data-text="' + encodeURIComponent(leptonLines) + '" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); color: #22c55e; cursor: pointer; padding: 4px 8px; font-size: 10px; font-weight: 800; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; text-transform: uppercase; transition: all 0.15s;">' +
                    '<i class="fas fa-copy"></i> Copiar Lepton' +
                  '</button>' +
                  '<button class="btn-download-txt" data-filename="' + encodeURIComponent((proj.brand + '_' + proj.design).replace(/\s+/g, '_') + '_' + order.id + '.txt') + '" data-text="' + encodeURIComponent(importTxt) + '" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); color: #3b82f6; cursor: pointer; padding: 4px 8px; font-size: 10px; font-weight: 800; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; text-transform: uppercase; transition: all 0.15s;">' +
                    '<i class="fas fa-file-import"></i> Importar Lepton .TXT' +
                  '</button>' +
                '</div>' +
              '</div>' +
              '<table class="pieces-table">' +
                '<thead>' +
                  '<tr>' +
                    '<th style="width: 50px;">Cant</th>' +
                    '<th>Largo (L)</th>' +
                    '<th>Alto (H)</th>' +
                    '<th>Nombre Pieza</th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody>' +
                  piecesHtml +
                '</tbody>' +
              '</table>' +
            '</div>';
          });
        }
        
        // Mostrar / Ocultar Botón del Plano
        const btnPlano = document.getElementById('m-btn-plano');
        if (order.datos_optimizacion) {
          btnPlano.href = '/cliente/pedido/' + order.id + '/print';
          btnPlano.style.display = 'inline-flex';
        } else {
          btnPlano.style.display = 'none';
        }
        
        document.getElementById('detail-modal').classList.add('show');
      });
    });

    // Evento de Copiar Material Individual
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-copy-lepton');
      if (btn) {
        e.stopPropagation();
        const text = decodeURIComponent(btn.getAttribute('data-text'));
        try {
          await navigator.clipboard.writeText(text);
          const origText = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
          btn.style.background = '#22c55e';
          btn.style.color = '#fff';
          setTimeout(() => {
            btn.innerHTML = origText;
            btn.style.background = 'rgba(34, 197, 94, 0.1)';
            btn.style.color = '#22c55e';
          }, 1500);
        } catch (err) {
          console.error(err);
          alert('Error al copiar. Copia el texto manualmente.');
        }
      }
    });

    // Evento de Descargar Archivo Importar Lepton .TXT
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-download-txt');
      if (btn) {
        e.stopPropagation();
        const text = decodeURIComponent(btn.getAttribute('data-text'));
        const filename = decodeURIComponent(btn.getAttribute('data-filename'));
        
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> ¡Descargado!';
        btn.style.background = '#3b82f6';
        btn.style.color = '#fff';
        setTimeout(() => {
          btn.innerHTML = origText;
          btn.style.background = 'rgba(59, 130, 246, 0.1)';
          btn.style.color = '#3b82f6';
        }, 1500);
      }
    });

    // Evento para Enviar Cotización Oficial
    document.getElementById('m-btn-submit-quote')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const pedidoId = btn.getAttribute('data-id');
        const total = document.getElementById('m-quote-total').value;
        const comentarios = document.getElementById('m-quote-comments').value;

        if (!pedidoId || !total) {
            alert('⚠️ Por favor ingresa el monto total de la cotización.');
            return;
        }

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            const res = await fetch('/api/vendedor/send-quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pedidoId, total, comentarios })
            });

            if (res.ok) {
                alert('✅ ¡Cotización cargada y enviada al cliente con éxito por WhatsApp!');
                location.reload();
            } else {
                const err = await res.json();
                alert('❌ Error: ' + (err.error || 'No se pudo procesar la cotización.'));
            }
        } catch(e) {
            console.error(e);
            alert('❌ Error de conexión al procesar la cotización.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    const closeModal = () => {
      document.getElementById('detail-modal').classList.remove('show');
    };
    
    document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);
    document.getElementById('detail-modal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('detail-modal')) closeModal();
    });
  })();
</script>`;

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
};
