"use strict";
/* Custom pattern editor */
/* custom editor */
function buildEditor(){
  const g=$('#editorGrid'); g.innerHTML='';
  const set=new Set(S.editorCells.map(([r,c])=>r+'_'+c));
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){
    const b=document.createElement('button');
    b.type='button';
    const isCenter=CENTER(r,c), isOn=set.has(r+'_'+c);
    const label=`${LETTERS[c]} row ${r+1}${isCenter?', free space':''}`;
    b.setAttribute('aria-label', label+(isOn?', selected':''));
    setToggle(b, isOn);
    if(isCenter){b.classList.add('center');b.textContent='★';}
    b.addEventListener('click',()=>{
      const key=r+'_'+c;
      const idx=S.editorCells.findIndex(([rr,cc])=>rr===r&&cc===c);
      if(idx>=0)S.editorCells.splice(idx,1); else S.editorCells.push([r,c]);
      buildEditor(); save();
    });
    g.appendChild(b);
  }
}
