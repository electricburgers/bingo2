"use strict";
/* Confirm modal + toast */
let modalOk=null, modalCancelFn=null;
function confirmModal(title,text,onOk,opts){
  opts=opts||{};
  $('#modalTitle').textContent=title; $('#modalText').textContent=text;
  $('#modalExtra').innerHTML=opts.extra||'';
  $('#modalOk').textContent=opts.okText||'Confirm';
  $('#modalCancel').textContent=opts.cancelText||'Cancel';
  modalOk=onOk; modalCancelFn=opts.onCancel||null;
  openDialog($('#modal'));
  // Prefer the first input in the extra section, once it's rendered
  setTimeout(()=>{ const inp=$('#modalExtra input'); if(inp) inp.focus(); }, 60);
}
function closeModal(){ closeDialog($('#modal')); $('#modalExtra').innerHTML=''; modalOk=null; modalCancelFn=null; }
let toastT=null;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2600); }
