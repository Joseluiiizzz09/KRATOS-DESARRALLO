document.addEventListener('click', function (event) {
  var open = event.target.closest('[data-open]');
  if (open) document.getElementById(open.dataset.open).showModal();
  var close = event.target.closest('[data-close]');
  if (close) close.closest('dialog').close();
});
var all = document.getElementById('select-all');
if (all) all.addEventListener('change', function () {
  document.querySelectorAll('input[form="bulk-assign"]').forEach(function (input) { input.checked = all.checked; });
});
var bulk = document.getElementById('bulk-assign');
if (bulk) bulk.addEventListener('submit', function (event) {
  if (!document.querySelector('input[form="bulk-assign"]:checked')) { event.preventDefault(); all.setCustomValidity('Selecciona al menos un contacto.'); all.reportValidity(); }
});
if (all) document.addEventListener('change', function () { all.setCustomValidity(''); });
document.querySelectorAll('select[name="trackingStatus"]').forEach(function (select) {
  function update() { select.form.elements.reason.required = ['caida', 'rechazo', 'rechazo_campo', 'rechazo_mesa'].includes(select.value); }
  select.addEventListener('change', update); update();
});
