(() => {
 const $ = id => document.getElementById(id);
 const day = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
 const names = ['Valeria Torres','Diego Ramírez','Camila Mendoza','Andrés Rojas','Lucía Herrera','Mateo Castro','Sofía Vargas','Gabriel Flores'];
 const calls = names.map((name,i) => ({id:i+1,name,phone:`000 000 ${String(i+1).padStart(3,'0')}`,status:i===2?'No contesta':i===3?'Contactado':'Pendiente',notes:''}));
 const sales = [{id:1,name:'Daniela Pérez',phone:'000 001 001',date:day(),status:'Activa',notes:'Registro de ejemplo'},{id:2,name:'Marcos Silva',phone:'000 001 002',date:day(),status:'Pendiente',notes:''},{id:3,name:'Elena Ríos',phone:'000 001 003',date:day(-1),status:'Caída',notes:''},{id:4,name:'Javier León',phone:'000 001 004',date:day(-2),status:'Activa',notes:''}];
 const callStates=['Pendiente','Contactado','No contesta','Volver a llamar','No interesado','Venta'];
 const saleStates=['Pendiente','Activa','Caída'];
 const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const options = (states,current) => states.map(s=>`<option${s===current?' selected':''}>${s}</option>`).join('');
 const dateLabel = value => new Date(value+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'short'});
 $('today').textContent = new Date().toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'});
 function renderCalls(){
  const query=$('call-search').value.toLowerCase(); const filter=$('call-filter').value;
  const visible=calls.filter(c=>(c.name+' '+c.phone).toLowerCase().includes(query)&&(!filter||c.status===filter));
  $('calls-count').textContent=`${visible.length} de ${calls.length} contactos · Datos de demostración`;
  $('calls-body').innerHTML=visible.map(c=>`<tr><td><strong>${escape(c.name)}</strong><small>Asignación BO-${String(c.id).padStart(3,'0')}</small></td><td>${escape(c.phone)}</td><td><select data-call="${c.id}" aria-label="Estado de llamada de ${escape(c.name)}">${options(callStates,c.status)}</select></td><td><textarea data-note="${c.id}" aria-label="Observaciones de ${escape(c.name)}" placeholder="Añadir observación">${escape(c.notes)}</textarea></td><td><button class="sell" data-sell="${c.id}" ${sales.some(s=>s.callId===c.id)?'disabled':''}>${sales.some(s=>s.callId===c.id)?'Venta registrada':'Registrar venta'}</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">No hay contactos con estos filtros.</td></tr>';
 }
 function renderSales(){
  const query=$('sale-search').value.toLowerCase();const filter=$('sale-filter').value;
  const visible=sales.filter(s=>(s.name+' '+s.phone).toLowerCase().includes(query)&&(!filter||s.status===filter));
  $('sales-count').textContent=`${visible.length} ventas`;
  $('sales-body').innerHTML=visible.map(s=>`<tr><td><strong>${escape(s.name)}</strong><small>V-${String(s.id).padStart(4,'0')}</small></td><td>${escape(s.phone)}</td><td>${dateLabel(s.date)}</td><td><select data-sale="${s.id}" aria-label="Estado de venta de ${escape(s.name)}">${options(saleStates,s.status)}</select></td><td><textarea data-sale-note="${s.id}" aria-label="Observaciones de venta de ${escape(s.name)}" placeholder="Añadir observación">${escape(s.notes)}</textarea></td></tr>`).join('')||'<tr><td colspan="5" class="empty">No hay ventas con estos filtros.</td></tr>';
 }
 function row(label,count,max){return `<div class="bar-row"><span>${label}</span><div class="track"><div class="bar" style="width:${max?count/max*100:0}%"></div></div><span>${count}</span></div>`;}
 function metrics(){
  $('active-count').textContent=sales.filter(s=>s.status==='Activa').length;
  $('fallen-count').textContent=sales.filter(s=>s.status==='Caída').length;
  $('daily-count').textContent=sales.filter(s=>s.date===day()).length;
  $('total-count').textContent=sales.length;
  $('distribution').innerHTML=saleStates.map(state=>row(state,sales.filter(s=>s.status===state).length,sales.length)).join('');
  const days=Array.from({length:7},(_,i)=>day(i-6));const counts=days.map(d=>sales.filter(s=>s.date===d).length);
  $('daily-chart').innerHTML=days.map((d,i)=>row(dateLabel(d),counts[i],Math.max(...counts,1))).join('');
 }
 function register(id){const c=calls.find(c=>c.id===id);if(sales.some(s=>s.callId===id))return;c.status='Venta';sales.unshift({id:Math.max(0,...sales.map(s=>s.id))+1,callId:id,name:c.name,phone:c.phone,date:day(),status:'Pendiente',notes:c.notes});renderCalls();renderSales();metrics();$('feedback').textContent=`Venta de ${c.name} registrada en Mis ventas.`;}
 const pages={calls:['Base de llamadas','Contactos asignados por Back Office, listos para tu gestión.'],metrics:['Mis métricas','Tus ventas activas, caídas y resultados diarios.'],sales:['Mis ventas','El historial completo de tus ventas y su estado actual.']};
 document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{const page=button.dataset.page;Object.keys(pages).forEach(p=>$(p+'-page').hidden=p!==page);document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('selected',b===button);if(b===button)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});$('page-title').textContent=pages[page][0];$('page-description').textContent=pages[page][1];$('feedback').textContent='';}));
 $('call-search').addEventListener('input',renderCalls);$('call-filter').addEventListener('change',renderCalls);
 $('sale-search').addEventListener('input',renderSales);$('sale-filter').addEventListener('change',renderSales);
 $('calls-body').addEventListener('click',e=>{const button=e.target.closest('[data-sell]');if(button)register(Number(button.dataset.sell));});
 $('calls-body').addEventListener('change',e=>{if(e.target.dataset.call){const c=calls.find(c=>c.id===Number(e.target.dataset.call));c.status=e.target.value;if(c.status==='Venta')register(c.id);renderCalls();}});
 $('calls-body').addEventListener('input',e=>{if(e.target.dataset.note)calls.find(c=>c.id===Number(e.target.dataset.note)).notes=e.target.value;});
 $('sales-body').addEventListener('change',e=>{if(e.target.dataset.sale){sales.find(s=>s.id===Number(e.target.dataset.sale)).status=e.target.value;metrics();renderSales();$('feedback').textContent='Estado de venta actualizado.';}});
 $('sales-body').addEventListener('input',e=>{if(e.target.dataset.saleNote)sales.find(s=>s.id===Number(e.target.dataset.saleNote)).notes=e.target.value;});
 renderCalls();renderSales();metrics();
})();
