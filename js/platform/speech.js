"use strict";
/* Speak calls aloud */
/* ---------- Speak calls aloud (SpeechSynthesis) ---------- */
function speakCall(letter,num,calloutText){
  if(!S.settings.speakCalls || !('speechSynthesis' in window)) return;
  try{
    speechSynthesis.cancel(); // don't let calls queue up during fast auto-play
    const text=calloutText ? `${letter} ${num}. ${calloutText}` : `${letter} ${num}`;
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }catch(e){}
}
