"use strict";
/* PWA: apple-touch-icon, service worker, install prompt */
/* iOS ignores manifest.json icons for "Add to Home Screen" — it only reads a
   real <link rel="apple-touch-icon"> image, and is picky about SVG there.
   Draw the same logo to a canvas and hand iOS an actual PNG, generated at
   runtime so the repo doesn't need a binary icon asset. */
function addAppleTouchIcon(){
  try{
    const size=180;
    const canvas=document.createElement('canvas');
    canvas.width=size; canvas.height=size;
    const ctx=canvas.getContext('2d');
    const grad=ctx.createRadialGradient(size*.34,size*.30,4,size*.5,size*.5,size*.5);
    grad.addColorStop(0,'#ffffff'); grad.addColorStop(.15,'#52a6f0'); grad.addColorStop(1,'#ff595e');
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.arc(size/2,size/2,size/2-4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#15171c';
    ctx.font='900 '+Math.round(size*.42)+'px Arial, sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('B', size/2, size/2+size*.05);
    const link=document.createElement('link');
    link.rel='apple-touch-icon'; link.href=canvas.toDataURL('image/png');
    document.head.appendChild(link);
  }catch(e){}
}

function registerPWA(){
  addAppleTouchIcon();
  // manifest.json is a real static file (see <link rel="manifest"> in <head>) so
  // Chrome/Android can evaluate install criteria reliably across reloads.
  // The service worker precaches the whole app shell on first load so the console
  // keeps working with no signal after that (see sw.js).
  const secure = location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1';
  if('serviceWorker' in navigator && secure){
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(()=>{/* no sw.js reachable — app still works online */});
    // A new worker takes over immediately (skipWaiting + clients.claim); tell the host
    // so they can reload between games rather than us yanking the page mid-call.
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      if(hadController) toast('Updated to the latest version — reload when convenient.');
    });
  }
  wireInstallPrompt();
}

/* Chrome/Edge/Android fire beforeinstallprompt instead of showing their own
   install UI reliably — capture it and expose our own "Install" button so
   hosts notice they can put this on a home screen before they lose signal. */
let _deferredInstallPrompt=null;
function wireInstallPrompt(){
  const btn=$('#installBtn');
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  if(isStandalone()) return;
  addEventListener('beforeinstallprompt', e=>{
    e.preventDefault();
    _deferredInstallPrompt=e;
    btn.classList.remove('hide');
  });
  btn.onclick=async ()=>{
    if(!_deferredInstallPrompt) return;
    btn.classList.add('hide');
    _deferredInstallPrompt.prompt();
    await _deferredInstallPrompt.userChoice.catch(()=>{});
    _deferredInstallPrompt=null;
  };
  addEventListener('appinstalled', ()=>btn.classList.add('hide'));
}
