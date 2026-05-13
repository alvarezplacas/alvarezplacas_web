/**
 * API Endpoint: Vista Parcial de Mensajería
 * Retorna HTML puro para ser inyectado en el canvas central del Workspace SPA.
 * GET /api/vendedor/views/mensajes
 * GET /api/vendedor/views/mensajes?client=<id>  → carga chat con ese cliente
 */
import type { APIRoute } from 'astro';
import { directus, readItems } from '../../../../Backend/conexiones/directus.js';
import { CommunicationService } from '../../../../Backend/dashboard/logic/communication.js';

export const GET: APIRoute = async ({ cookies, url }) => {
    const sellerId = cookies.get('seller_session')?.value || '1';
    const selectedClientId = url.searchParams.get('client');
    let clients: any[] = [];
    let messages: any[] = [];
    let priorityStats = { alta: 0, media: 0, baja: 0 };

    try {
        priorityStats = await CommunicationService.getPriorityStats(sellerId);

        const resClients = await directus.request(readItems('clientes', {
            filter: { vendedor_id: { _eq: sellerId } },
            fields: ['id', 'name', 'nombre_empresa']
        })) as any[];

        const unreadMessages = await directus.request(readItems('mensajes', {
            filter: { destinatario_id: { _eq: sellerId }, visto: { _eq: false } },
            fields: ['remitente_id', 'prioridad']
        })) as any[];

        clients = resClients.map(c => {
            const clientUnread = unreadMessages.filter((m: any) => m.remitente_id == c.id);
            const hasHighPriority = clientUnread.some((m: any) => m.prioridad === 'alta');
            return { ...c, displayName: c.name || 'Cliente #' + c.id, unreadCount: clientUnread.length, hasHighPriority };
        });

        if (selectedClientId) {
            messages = await CommunicationService.getChat(selectedClientId, sellerId);
            const unreadIds = messages.filter((m: any) => m.destinatario_id === sellerId && !m.visto).map((m: any) => m.id);
            if (unreadIds.length > 0) await CommunicationService.markAsSeen(unreadIds);
        }
    } catch (e: any) {
        console.error('Error cargando mensajería:', e.message);
    }

    const selectedClient = clients.find(c => c.id == selectedClientId);

    const html = `
<div class="view-panel msg-layout" id="view-mensajes">
  <aside class="msg-sidebar">
    <div class="msg-priority-bar">
      <p class="msg-section-label">Urgencia</p>
      <div class="priority-pills">
        <div class="priority-pill alta"><span class="pill-label">Alta</span><span class="pill-val">${priorityStats.alta}</span></div>
        <div class="priority-pill media"><span class="pill-label">Med</span><span class="pill-val">${priorityStats.media}</span></div>
        <div class="priority-pill baja"><span class="pill-label">Baja</span><span class="pill-val">${priorityStats.baja}</span></div>
      </div>
    </div>
    <p class="msg-section-label msg-section-label--pad">Conversaciones</p>
    <div class="msg-client-list">
      ${clients.length === 0 ? '<p class="no-clients">Sin clientes asignados</p>' : clients.map(c => `
      <a href="javascript:void(0)" class="msg-client-item ${selectedClientId == c.id ? 'active' : ''}" data-client-id="${c.id}">
        <div class="msg-avatar ${c.hasHighPriority ? 'pulsing' : ''}">${c.displayName.charAt(0)}</div>
        <div class="msg-client-info">
          <p class="msg-client-name">${c.displayName}</p>
          <p class="msg-client-sub">ID #${c.id}</p>
        </div>
        ${c.unreadCount > 0 ? `<span class="unread-badge ${c.hasHighPriority ? 'urgent' : ''}">${c.unreadCount}</span>` : ''}
      </a>`).join('')}
    </div>
  </aside>

  <main class="msg-main">
    ${!selectedClientId ? `
    <div class="msg-empty">
      <i class="fas fa-comments msg-empty-icon"></i>
      <h4>Selecciona un cliente</h4>
      <p>Elige una conversación de la lista para comenzar a chatear.</p>
    </div>` : `
    <div class="msg-chat-header">
      <span>Chateando con <strong>${selectedClient?.displayName || 'Cliente'}</strong></span>
    </div>
    <div class="msg-chat-body" id="chat-messages">
      ${messages.length === 0 ? '<div class="no-messages"><i class="fas fa-comment-slash"></i><p>Sin mensajes aún. ¡Inicia la conversación!</p></div>' :
        messages.map(m => {
            const isSeller = m.remitente_id == sellerId;
            const hora = new Date(m.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `<div class="msg-bubble-wrap ${isSeller ? 'right' : 'left'}">
              <div class="msg-bubble ${isSeller ? 'bubble-seller' : 'bubble-client'}">
                <p>${m.mensaje}</p>
                <span class="msg-time">${hora}</span>
              </div>
            </div>`;
        }).join('')}
    </div>
    <div class="msg-input-area">
      <input type="hidden" id="msg-to-id" value="${selectedClientId}" />
      <input type="hidden" id="msg-from-id" value="${sellerId}" />
      <input type="text" id="msg-input" placeholder="Escribe un mensaje..." autocomplete="off" class="msg-text-input" />
      <button id="msg-send-btn" class="msg-send-btn"><i class="fas fa-paper-plane"></i></button>
    </div>`}
  </main>
</div>
<style>
  .view-panel { animation: fadeIn .25s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .msg-layout { display: flex; height: calc(100vh - 120px); background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 20px; overflow: hidden; }
  .msg-sidebar { width: 240px; min-width: 240px; border-right: 1px solid #222; background: rgba(0,0,0,.2); display: flex; flex-direction: column; }
  .msg-priority-bar { padding: 14px 12px; border-bottom: 1px solid #222; }
  .msg-section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #555; margin-bottom: 8px; }
  .msg-section-label--pad { padding: 10px 12px 4px; }
  .priority-pills { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
  .priority-pill { border-radius: 8px; padding: 6px 4px; text-align: center; border: 1px solid; }
  .priority-pill.alta { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.2); }
  .priority-pill.media { background: rgba(249,115,22,.1); border-color: rgba(249,115,22,.2); }
  .priority-pill.baja { background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.2); }
  .pill-label { display: block; font-size: 8px; font-weight: 900; text-transform: uppercase; color: #666; }
  .priority-pill.alta .pill-label { color: #ef4444; }
  .priority-pill.media .pill-label { color: #f97316; }
  .priority-pill.baja .pill-label { color: #3b82f6; }
  .pill-val { display: block; font-size: 16px; font-weight: 900; color: #fff; }
  .msg-client-list { flex: 1; overflow-y: auto; padding: 8px; }
  .msg-client-list::-webkit-scrollbar { width: 3px; } .msg-client-list::-webkit-scrollbar-thumb { background: #333; }
  .no-clients { font-size: 10px; color: #444; text-align: center; padding: 20px; }
  .msg-client-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; cursor: pointer; transition: background .15s; text-decoration: none; color: #888; }
  .msg-client-item:hover { background: rgba(255,255,255,.05); }
  .msg-client-item.active { background: #e02020; color: #fff; }
  .msg-avatar { width: 34px; height: 34px; border-radius: 50%; background: #2a2a2a; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; color: #aaa; flex-shrink: 0; }
  .msg-client-item.active .msg-avatar { background: rgba(255,255,255,.2); color: #fff; }
  .msg-avatar.pulsing { background: #ef4444; color: #fff; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
  .msg-client-info { flex: 1; min-width: 0; }
  .msg-client-name { font-size: 12px; font-weight: 700; truncate: ellipsis; white-space: nowrap; overflow: hidden; }
  .msg-client-sub { font-size: 9px; opacity: .5; text-transform: uppercase; }
  .unread-badge { min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px; background: #e02020; color: #fff; font-size: 9px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
  .unread-badge.urgent { background: #fff; color: #e02020; }
  .msg-main { flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,.3); }
  .msg-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #444; text-align: center; padding: 40px; }
  .msg-empty-icon { font-size: 48px; opacity: .2; margin-bottom: 16px; }
  .msg-empty h4 { font-size: 14px; font-weight: 700; color: #555; }
  .msg-empty p { font-size: 11px; color: #444; margin-top: 6px; }
  .msg-chat-header { padding: 14px 20px; border-bottom: 1px solid #222; background: rgba(0,0,0,.2); font-size: 12px; color: #888; }
  .msg-chat-header strong { color: #fff; }
  .msg-chat-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .msg-chat-body::-webkit-scrollbar { width: 3px; } .msg-chat-body::-webkit-scrollbar-thumb { background: #333; }
  .no-messages { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; color: #444; gap: 8px; font-size: 11px; padding: 40px; }
  .no-messages i { font-size: 24px; opacity: .3; }
  .msg-bubble-wrap { display: flex; }
  .msg-bubble-wrap.right { justify-content: flex-end; }
  .msg-bubble-wrap.left { justify-content: flex-start; }
  .msg-bubble { max-width: 70%; padding: 10px 14px; border-radius: 16px; font-size: 12px; line-height: 1.5; }
  .bubble-seller { background: #3b82f6; color: #fff; border-top-right-radius: 4px; }
  .bubble-client { background: #2a2a2a; color: #ddd; border: 1px solid #333; border-top-left-radius: 4px; }
  .msg-time { display: block; font-size: 9px; opacity: .5; text-align: right; margin-top: 4px; text-transform: uppercase; font-weight: 700; }
  .msg-input-area { padding: 14px 16px; border-top: 1px solid #222; background: rgba(0,0,0,.3); display: flex; gap: 10px; align-items: center; }
  .msg-text-input { flex: 1; background: rgba(0,0,0,.4); border: 1px solid #333; border-radius: 12px; padding: 10px 16px; color: #fff; font-size: 13px; outline: none; transition: border-color .2s; }
  .msg-text-input:focus { border-color: #3b82f6; }
  .msg-send-btn { width: 40px; height: 40px; border-radius: 12px; background: #3b82f6; border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all .2s; flex-shrink: 0; }
  .msg-send-btn:hover { background: #2563eb; transform: scale(1.05); }
  .msg-send-btn:active { transform: scale(.95); }
</style>
<script>
(function() {
  // Scroll chat to bottom
  const chatBody = document.getElementById('chat-messages');
  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;

  // Send message
  const sendBtn = document.getElementById('msg-send-btn');
  const msgInput = document.getElementById('msg-input');
  if (sendBtn && msgInput) {
    sendBtn.addEventListener('click', sendMsg);
    msgInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } });
  }
  
  async function sendMsg() {
    const content = msgInput.value.trim();
    if (!content) return;
    const toId = document.getElementById('msg-to-id')?.value;
    const fromId = document.getElementById('msg-from-id')?.value;
    if (!toId || !fromId) return;

    const icon = sendBtn.querySelector('i');
    if (icon) icon.className = 'fas fa-spinner fa-spin';
    sendBtn.disabled = true;
    msgInput.disabled = true;

    try {
      const res = await fetch('/api/mensajes/send', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ fromId, toId, mensaje: content })
      });
      if (res.ok) {
        msgInput.value = '';
        // Reload this view
        if (window.workspaceLoadView) window.workspaceLoadView('mensajes?client=' + toId);
      }
    } catch(e) { console.error(e); }
    finally {
      if (icon) icon.className = 'fas fa-paper-plane';
      sendBtn.disabled = false; msgInput.disabled = false; msgInput.focus();
    }
  }

  // Client list navigation: load chat for selected client
  document.querySelectorAll('.msg-client-item[data-client-id]').forEach(item => {
    item.addEventListener('click', () => {
      const cid = item.getAttribute('data-client-id');
      if (window.workspaceLoadView) window.workspaceLoadView('mensajes?client=' + cid);
    });
  });
})();
</script>`;

    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
};

export const POST: APIRoute = async ({ request, cookies }) => {
    // Reexport send message for backward compat
    return new Response(JSON.stringify({ error: 'Use /api/mensajes/send' }), { status: 307 });
};
