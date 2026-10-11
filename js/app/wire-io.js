"use strict";
/* Export / save / load / report buttons */
function wireIO(){
  $('#reportBtn').onclick=generateNightReport;
  $('#saveJsonBtn').onclick=saveJSON;
  $('#exportBtn').onclick=exportData;
  $('#loadJsonBtn').onclick=()=>$('#fileInput').click();
  $('#fileInput').onchange=e=>{ if(e.target.files[0])loadJSON(e.target.files[0]); e.target.value=''; };
}
