/**
 * API Endpoint: Vista Parcial de Clientes
 * Retorna HTML puro para ser inyectado en el canvas central del Workspace SPA.
 * GET /api/vendedor/views/clientes
 */
import type { APIRoute } from 'astro';
import { directus, readItems } from '@conexiones/directus.js';

export const GET: APIRoute = async ({ cookies }) => {
    const sellerId = cookies.get('seller_session')?.value || '1';
    let clientes: any[] = [];

    try {
        clientes = await directus.request(readItems('clientes', {
            filter: { vendedor_id: { _eq: sellerId } },
            sort: ['nombre_empresa'],
            fields: ['id', 'name', 'nombre_empresa', 'debt_amount', 'fin_status', 'email', 'phone', 'cuit_dni']
        })) as any[];
    } catch (e: any) {
        console.error('Error cargando clientes:', e.message);
    }

    const getStatusClass = (s: string) => s === 'clean' ? 'bg-green-500/10 text-green-500 border-green-500/20' : s === 'blocked' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    const getStatusLabel = (s: string) => s === 'clean' ? 'Al Día' : s === 'blocked' ? 'Bloqueado' : 'Vencido';

    const html = `
<div class="view-panel" id="view-clientes">
  <div class="view-header">
    <div>
      <h2 class="view-title">Gestión de <span class="text-accent">Cartera</span></h2>
      <p class="view-subtitle">Actualiza saldos y estados financieros de tus clientes asignados.</p>
    </div>
    <div class="view-count">${clientes.length} clientes</div>
  </div>

  ${clientes.length === 0 ? `
  <div class="empty-state">
    <i class="fas fa-users empty-icon"></i>
    <p class="empty-title">Sin clientes asignados</p>
    <p class="empty-sub">Contacta al administrador para que te asigne una cartera de clientes.</p>
  </div>` : `
  <div class="clients-grid">
    ${clientes.map(c => `
    <div class="client-card">
      <div class="client-card-header">
        <div class="client-avatar">${(c.nombre_empresa || c.name || '?').charAt(0).toUpperCase()}</div>
        <span class="status-badge ${getStatusClass(c.fin_status)}">${getStatusLabel(c.fin_status)}</span>
      </div>
      <h3 class="client-name">${c.nombre_empresa || 'Sin Empresa'}</h3>
      <div class="client-meta-list" style="display:flex; flex-direction:column; gap:6px; margin-top:6px; margin-bottom:12px;">
        <span class="client-meta-item" style="font-size: 11px; color: #888; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-user" style="width: 14px; text-align: center; color: #555;"></i> ${c.name || 'Sin nombre'}
        </span>
        <span class="client-meta-item" style="font-size: 11px; color: #888; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-envelope" style="width: 14px; text-align: center; color: #555;"></i> ${c.email || 'Sin email'}
        </span>
        <span class="client-meta-item" style="font-size: 11px; color: #888; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-id-card" style="width: 14px; text-align: center; color: #555;"></i> ${c.cuit_dni || 'CUIT/CUIL no registrado'}
        </span>
        <span class="client-meta-item" style="font-size: 11px; color: #888; display: flex; align-items: center; gap: 8px;">
          <i class="fab fa-whatsapp" style="width: 14px; text-align: center; color: #22c55e;"></i> ${c.phone || 'No registrado'}
        </span>
      </div>
      <div class="client-debt-section">
        <div class="debt-info">
          <p class="debt-label">Deuda Pendiente</p>
          <p class="debt-amount">$ ${Number(c.debt_amount || 0).toLocaleString('es-AR')}</p>
        </div>
        <div class="debt-input-row">
          <input type="number" placeholder="Nuevo Saldo..." class="debt-input" data-id="${c.id}" />
          <button class="debt-save-btn update-debt-btn" data-id="${c.id}" title="Actualizar saldo">
            <i class="fas fa-check"></i>
          </button>
        </div>
        <div class="status-btns-row">
          <button class="status-btn status-clean update-status-btn" data-id="${c.id}" data-status="clean">Al Día</button>
          <button class="status-btn status-overdue update-status-btn" data-id="${c.id}" data-status="overdue">Vencido</button>
          <button class="status-btn status-blocked update-status-btn" data-id="${c.id}" data-status="blocked">Bloqueado</button>
        </div>
      </div>
    </div>`).join('')}
  </div>`}
</div>
<style>
  .view-panel { animation: fadeIn .25s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .view-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
  .view-title { font-size: 22px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: -.5px; }
  .view-subtitle { font-size: 12px; color: #666; margin-top: 4px; }
  .view-count { font-size: 11px; font-weight: 700; color: #555; background: #222; border: 1px solid #333; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
  .text-accent { color: #22c55e; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: #444; }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: .3; }
  .empty-title { font-size: 14px; font-weight: 700; color: #555; }
  .empty-sub { font-size: 11px; color: #444; margin-top: 4px; text-align: center; max-width: 280px; }
  .clients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
  .client-card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 12px; transition: border-color .2s; }
  .client-card:hover { border-color: #3a3a3a; }
  .client-card-header { display: flex; justify-content: space-between; align-items: center; }
  .client-avatar { width: 40px; height: 40px; border-radius: 12px; background: #2a2a2a; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: #22c55e; }
  .status-badge { font-size: 9px; font-weight: 900; text-transform: uppercase; padding: 3px 8px; border-radius: 20px; border: 1px solid; letter-spacing: .05em; }
  .client-name { font-size: 14px; font-weight: 800; color: #fff; }
  .client-meta { font-size: 10px; color: #555; }
  .client-debt-section { border-top: 1px solid #2a2a2a; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
  .debt-label { font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: #555; font-weight: 700; }
  .debt-amount { font-size: 20px; font-weight: 900; color: #fff; }
  .debt-info { margin-bottom: 4px; }
  .debt-input-row { display: flex; gap: 6px; }
  .debt-input { flex: 1; background: #111; border: 1px solid #333; border-radius: 8px; padding: 6px 10px; color: #fff; font-size: 12px; outline: none; transition: border-color .2s; }
  .debt-input:focus { border-color: #22c55e; }
  .debt-save-btn { width: 32px; height: 32px; border-radius: 8px; background: #2a2a2a; border: none; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; font-size: 11px; }
  .debt-save-btn:hover { background: #22c55e; color: #000; }
  .status-btns-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
  .status-btn { border: none; border-radius: 6px; padding: 5px 2px; font-size: 9px; font-weight: 900; text-transform: uppercase; cursor: pointer; transition: all .2s; }
  .status-clean { background: rgba(34,197,94,.1); color: #22c55e; }
  .status-clean:hover { background: #22c55e; color: #000; }
  .status-overdue { background: rgba(245,158,11,.1); color: #f59e0b; }
  .status-overdue:hover { background: #f59e0b; color: #000; }
  .status-blocked { background: rgba(239,68,68,.1); color: #ef4444; }
  .status-blocked:hover { background: #ef4444; color: #000; }
</style>
<script>
  (function() {
    document.querySelectorAll('.update-debt-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const input = document.querySelector('.debt-input[data-id="' + id + '"]');
        const amount = input ? input.value : '';
        if (!amount) return;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        try {
          const res = await fetch('/api/admin/update-financial-status', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ clientId: id, debtAmount: Number(amount) })
          });
          if (res.ok) { btn.innerHTML = '<i class="fas fa-check" style="color:#22c55e"></i>'; input.value = ''; setTimeout(() => { btn.innerHTML = '<i class="fas fa-check"></i>'; }, 2000); }
        } catch(e) { console.error(e); btn.innerHTML = '<i class="fas fa-check"></i>'; }
      });
    });
    document.querySelectorAll('.update-status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const status = btn.getAttribute('data-status');
        btn.style.opacity = '0.5';
        try {
          await fetch('/api/admin/update-financial-status', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ clientId: id, finStatus: status })
          });
          btn.style.opacity = '1'; btn.style.outline = '2px solid currentColor';
          setTimeout(() => { btn.style.outline = ''; }, 1500);
        } catch(e) { console.error(e); btn.style.opacity = '1'; }
      });
    });
  })();
</script>`;

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
};
