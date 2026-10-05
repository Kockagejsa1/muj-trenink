/* BOOT ERROR HANDLER */
(function(){
  function showBootError(label, err){
    try{
      var a=document.getElementById('app');
      if(a){a.innerHTML='<div style=\"padding:28px;font-family:Arial;color:#111;background:#fff\"><h2 style=\"color:#1976d2\">MŮJ TRÉNINK</h2><p><b>'+label+'</b></p><pre style=\"white-space:pre-wrap;font-size:13px\">'+String(err&&err.stack||err).replace(/[&<>]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m]})+'</pre></div>';}
    }catch(_){}
  }
  window.addEventListener('error',function(e){showBootError('CHYBA JAVASCRIPTU',e.error||e.message);});
  window.addEventListener('unhandledrejection',function(e){showBootError('CHYBA JAVASCRIPTU',e.reason);});
})();

const DAYS=['PONDĚLÍ','ÚTERÝ','STŘEDA','ČTVRTEK','PÁTEK','SOBOTA','NEDĚLE'];
const KEY='mujTreninkPWA_v1';
const defaults=[
 [{name:'Leg Press',sets:3,pauseValue:2,pauseUnit:'min'},{name:'Chest Press',sets:4,pauseValue:2,pauseUnit:'min'},{name:'Stahování kladky',sets:4,pauseValue:2,pauseUnit:'min'}],
 [],
 [{name:'Veslování',sets:4,pauseValue:2,pauseUnit:'min'},{name:'Pec Deck',sets:3,pauseValue:2,pauseUnit:'min'},{name:'Zakopávání',sets:3,pauseValue:2,pauseUnit:'min'}],
 [],
 [{name:'Leg Press',sets:3,pauseValue:2,pauseUnit:'min'},{name:'Chest Press',sets:3,pauseValue:2,pauseUnit:'min'},{name:'Biceps',sets:3,pauseValue:1,pauseUnit:'min'}],[],[]
];
let state=load();
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)); if(x&&Array.isArray(x.plans)){x.plans=clone(x.plans);while(x.plans.length<7)x.plans.push([]);x.plans=x.plans.slice(0,7);for(let i=0;i<7;i++)if(!Array.isArray(x.plans[i]))x.plans[i]=[];x.history=(x.history&&typeof x.history==='object')?x.history:{};x.datePlans=(x.datePlans&&typeof x.datePlans==='object')?x.datePlans:{};x.dark=!!x.dark;x.timerEnabled=x.timerEnabled!==false;x.selectedDate=(typeof x.selectedDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.selectedDate))?x.selectedDate:todayISO();x.copiedPlan=Array.isArray(x.copiedPlan)?x.copiedPlan:null;x.copiedDay=typeof x.copiedDay==='string'?x.copiedDay:'';return x}}catch(e){} return {plans:clone(defaults),history:{},datePlans:{},dark:false,timerEnabled:true,selectedDate:todayISO(),copiedPlan:null,copiedDay:''}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function todayISO(){return new Date().toISOString().slice(0,10)}
function dayIndex(date){let d=new Date(date+'T12:00:00').getDay();return (d+6)%7}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function clone(x){return JSON.parse(JSON.stringify(x))}
function fmtPause(x){return x.pauseValue+' '+(x.pauseUnit==='sec'?'s':'min')}
function getPlanForDate(date){
  const override=state.datePlans&&state.datePlans[date];
  if(Array.isArray(override)) return override;
  const di=dayIndex(date);
  return Array.isArray(state.plans?.[di])?state.plans[di]:[];
}
function isExerciseComplete(date,di,i){const rec=state.history[date]?.[di]?.[i];const plan=getPlanForDate(date);return !!plan[i]&&Array.isArray(rec)&&rec.length>=plan[i].sets}
function isComplete(date,di){const rec=state.history[date]?.[di];const plan=getPlanForDate(date);return plan.length>0&&plan.every((e,i)=>rec?.[i]?.length>=e.sets)}
function isStarted(date,di){const rec=state.history[date]?.[di];return !!(rec&&Object.keys(rec).length)}
function render(){document.body.classList.toggle('dark',state.dark);const di=dayIndex(state.selectedDate);const plan=getPlanForDate(state.selectedDate);let cur=Number((()=>{try{return sessionStorage.getItem('currentEx')||0}catch(e){return 0}})());if(cur>=plan.length)cur=0;try{sessionStorage.setItem('currentEx',cur)}catch(e){}const ex=plan[cur];
let h=`<div class="title">MŮJ TRÉNINK</div><div class="subtitle">VÁHA • x • VÝVOJ</div>`;
h+=`<div class="row"><div class="label">TRÉNINK</div><button class="valueBtn grow">${DAYS[di]}</button></div>`;
h+=`<div class="row"><div class="label">DATUM</div><button id="date" class="dateBtn grow" type="button">📅 ${formatDateCz(state.selectedDate)}</button></div>`;
h+=`<button class="blue full" id="start">📅 ZAHÁJIT TRÉNINK</button><div class="sectionGap"></div>`;
h+=`<div class="row"><div class="label">CVIK</div><div class="grow exerciseDropdown" id="exerciseDropdown"><button type="button" class="valueBtn full" id="exerciseDropBtn">${ex?esc(ex.name):'Žádný cvik'} ▾</button><div class="exerciseMenu hidden" id="exerciseMenu">${plan.map((e,i)=>`<button type="button" class="exerciseOption" data-ex-index="${i}"><span>${esc(e.name)}</span>${isExerciseComplete(state.selectedDate,di,i)?'<b class="greenCheck">✓</b>':''}</button>`).join('')||'<div class="exerciseEmpty">Žádný cvik</div>'}</div></div></div>`;
h+=`<div class="exercisePos">${ex?`CVIK ${cur+1} / ${plan.length}`:''}</div><div class="exerciseName">${ex?esc(ex.name):'Žádný cvik'}</div><div class="exerciseInfo">${ex?`${ex.sets} sérií • pauza ${fmtPause(ex)}`:''}</div>`;
if(ex){const rec=state.history[state.selectedDate]?.[di]?.[cur]||[];const done=rec.length>=ex.sets;let prevRec=[];Object.keys(state.history||{}).sort().reverse().some(d=>{if(d>=state.selectedDate)return false;const r=state.history[d]?.[di]?.[cur];if(r&&Array.isArray(r)&&r.length){prevRec=r;return true}return false});h+=`<div class="status ${done?'ok':'bad'}">${done?'✓ SPLNĚNO':'• NEDOKONČENO'}</div>`;h+=`<div id="sets">${Array.from({length:ex.sets},(_,i)=>{const v=rec[i]||{};const pv=prevRec[i]||{};const prevNote=(pv.weight||pv.reps)?`<div class="previousSet">Minulá: ${pv.weight?esc(pv.weight)+' kg':''}${pv.weight&&pv.reps?' × ':''}${pv.reps?esc(pv.reps)+' opak.':''}</div>`:'';return `<div class="setBox"><div class="setTitle">SÉRIE ${i+1}</div>${prevNote}<div class="setRow"><label>VÁHA (kg)<input inputmode="decimal" data-set="${i}" data-field="weight" value="${esc(v.weight??'')}"></label><label>OPAKOVÁNÍ<input inputmode="numeric" data-set="${i}" data-field="reps" value="${esc(v.reps??'')}"></label></div><button class="blue wide" data-save-set="${i}">ULOŽIT SÉRII</button></div>`}).join('')}</div>`}
h+=`<div id="timer" class="timer"><div id="timerText" class="time">00:00</div><button class="ghost" id="skip">PŘESKOČIT</button></div><div class="note"></div>`;
h+=`<div class="actions"><button class="blue" id="prev">‹ PŘEDCHOZÍ CVIK</button><button class="blue" id="next">DALŠÍ CVIK ›</button></div>`;
h+=`<div class="actions"><button class="blue" id="edit">✎ UPRAVIT PLÁN</button><button class="blue" id="history">HISTORIE / STATISTIKY</button></div>`;
h+=`<div class="actions"><button class="blue" id="backup">ZÁLOHA</button><button class="blue" id="theme">SVĚTLÝ / TMAVÝ</button></div>`;
h+=`<button class="blue wide" id="timerSetting">ČASOVAČ: ${state.timerEnabled?'ZAPNUTO':'VYPNUTO'}</button>`;
document.getElementById('app').innerHTML=h;bindMain(di,cur);}
function bindMain(di,cur){document.getElementById('date').onclick=showDatePicker;document.getElementById('start').onclick=()=>{state.selectedDate=todayISO();save();render()};const dropBtn=document.getElementById('exerciseDropBtn'),menu=document.getElementById('exerciseMenu');if(dropBtn&&menu){dropBtn.onclick=()=>menu.classList.toggle('hidden');menu.querySelectorAll('[data-ex-index]').forEach(b=>b.onclick=()=>{try{sessionStorage.setItem('currentEx',b.dataset.exIndex)}catch(e){}menu.classList.add('hidden');render()});document.addEventListener('click',function closeDrop(e){const wrap=document.getElementById('exerciseDropdown');if(wrap&&!wrap.contains(e.target)){menu.classList.add('hidden');document.removeEventListener('click',closeDrop)} });}document.getElementById('prev').onclick=()=>{if(cur>0){sessionStorage.setItem('currentEx',cur-1);render()}};document.getElementById('next').onclick=()=>{if(cur<getPlanForDate(state.selectedDate).length-1){sessionStorage.setItem('currentEx',cur+1);render()}};document.getElementById('edit').onclick=showEditor;document.getElementById('history').onclick=showHistory;document.getElementById('backup').onclick=backupMenu;document.getElementById('theme').onclick=()=>{state.dark=!state.dark;save();render()};document.getElementById('timerSetting').onclick=()=>{state.timerEnabled=!state.timerEnabled;save();if(!state.timerEnabled)stopTimer();render()};document.querySelectorAll('[data-save-set]').forEach(b=>b.onclick=()=>saveSet(di,cur,Number(b.dataset.saveSet)));}
function saveSet(di,cur,i){const box=document.querySelector(`.setBox:nth-child(${i+1})`);const w=box.querySelector('[data-field="weight"]').value.trim();const r=box.querySelector('[data-field="reps"]').value.trim();if(!w||!r){alert('Zadej váhu a opakování.');return}state.history[state.selectedDate]??={};state.history[state.selectedDate][di]??={};state.history[state.selectedDate][di][cur]??=[];state.history[state.selectedDate][di][cur][i]={weight:w,reps:r};save();render();if(state.timerEnabled&&i<getPlanForDate(state.selectedDate)[cur].sets-1)startTimer(getPlanForDate(state.selectedDate)[cur].pauseValue,getPlanForDate(state.selectedDate)[cur].pauseUnit)}
let timerId=null;
let timerEndAt=0;
let timerTotalSec=0;
let timerLastSec=null;
let audioCtx=null;
function getAudio(){try{if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch(e){return null}}
function beep(freq=900,duration=0.16,volume=0.22){try{const c=getAudio();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+duration);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration)}catch(e){}}
function timerTick(){
  if(!timerEndAt){return}
  const sec=Math.max(0,Math.ceil((timerEndAt-Date.now())/1000));
  const out=document.getElementById('timerText');
  const timer=document.getElementById('timer');
  if(!out||!timer){stopTimer();return}
  timer.style.display='flex';
  out.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
  if(sec!==timerLastSec){
    if(sec>=1&&sec<=5){beep(sec===1?1250:950,sec===1?0.28:0.14,sec===1?0.30:0.23);timerLastSec=sec;}
    else if(sec===0){beep(1500,0.55,0.34);timerLastSec=0;}
  }
  if(sec<=0){timerId=null;timerEndAt=0;setTimeout(()=>{const t=document.getElementById('timer');if(t)t.style.display='none'},700);return}
  clearTimeout(timerId);timerId=setTimeout(timerTick,250);
}
function startTimer(v,u){
  stopTimer();
  let sec=Math.max(0,Number(v||0)*(u==='sec'?1:60));
  if(sec<=0)return;
  getAudio();
  timerTotalSec=sec;timerLastSec=null;timerEndAt=Date.now()+sec*1000;
  timerTick();
}
function stopTimer(){if(timerId)clearTimeout(timerId);timerId=null;timerEndAt=0;timerTotalSec=0;timerLastSec=null;const t=document.getElementById('timer');if(t)t.style.display='none'}
document.addEventListener('click',e=>{if(e.target.id==='skip')stopTimer();else if(e.target.closest('button'))getAudio()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&timerEndAt)timerTick()});

function showEditor(){
  const di=dayIndex(state.selectedDate);
  const date=state.selectedDate;
  const day=DAYS[di];
  const root=document.getElementById('modalRoot');
  root.innerHTML=`<div class="modalBack" id="editChoice"><div class="modal lightEditor"><div class="modalHead">UPRAVIT PLÁN</div><div class="dialog"><p><b>${day}</b> – ${formatDateCz(date)}</p><p>Vyber, co chceš upravit:</p></div><div class="modalButtons" style="flex-direction:column"><button class="blue wide" id="editBase">UPRAVIT CELÝ PLÁN – ${day}</button><button class="blue wide" id="editDate">UPRAVIT POUZE ${formatDateCz(date)}</button><button class="ghost wide" id="cancelEditChoice">ZRUŠIT</button></div></div></div>`;
  document.getElementById('cancelEditChoice').onclick=()=>root.innerHTML='';
  document.getElementById('editBase').onclick=()=>openEditor(di,clone(state.plans[di]||[]),date,'base');
  document.getElementById('editDate').onclick=()=>openEditor(di,clone(getPlanForDate(date)),date,'date');
}
function openEditor(di,working,date,mode){
  const root=document.getElementById('modalRoot');
  const hasOverride=Array.isArray(state.datePlans&&state.datePlans[date]);
  const title=mode==='base'?`UPRAVIT ZÁKLADNÍ PLÁN – ${DAYS[di]}`:`UPRAVIT POUZE ${formatDateCz(date)}`;
  root.innerHTML=`<div class="modalBack"><div class="modal lightEditor"><div class="modalHead">${esc(title)}</div><div class="dialog"><p>${mode==='base'?'Tato změna se projeví u všech '+DAYS[di]+' bez vlastní úpravy data.':'Tato změna platí pouze pro '+formatDateCz(date)+'.'}</p></div><div id="editorList" class="modalScroll"></div><div class="modalButtons"><button class="blue" id="copyPlan">KOPÍROVAT PLÁN</button><button class="blue" id="pastePlan">VLOŽIT PLÁN</button></div><div class="modalScroll" style="overflow:visible"><button class="blue wide" id="addExercise">+ PŘIDAT CVIK</button></div><div class="editorBottom"><button class="blue" id="backEdit">ZPĚT</button><button class="blue" id="saveEdit">ULOŽIT ZMĚNY</button></div>${mode==='date'&&hasOverride?'<div class="modalScroll" style="overflow:visible"><button class="ghost wide" id="resetDatePlan">↩ POUŽÍT ZÁKLADNÍ PLÁN PRO TENTO DEN</button></div>':''}</div></div>`;
  const list=document.getElementById('editorList');
  function rebuild(){list.innerHTML=working.map((e,i)=>`<div class="editorCard" data-i="${i}"><div class="cvik">CVIK ${i+1}</div><input class="editorInput name" value="${esc(e.name)}"><div class="editorGrid"><div class="editorLabel">SÉRIE</div><input class="editorInput sets" inputmode="numeric" value="${e.sets}"></div><div class="pauseGrid"><div class="editorLabel">PAUZA</div><input class="editorInput pause" inputmode="numeric" value="${e.pauseValue}"><div class="unitBox"><div class="unitLabel">ČAS</div><select class="unitSelect"><option value="min" ${e.pauseUnit==='min'?'selected':''}>minuty</option><option value="sec" ${e.pauseUnit==='sec'?'selected':''}>sekundy</option></select></div></div><div class="editorBtns"><button class="blue up">↑</button><button class="blue down">↓</button><button class="blue del">SMAZAT</button></div></div>`).join('');list.querySelectorAll('.editorCard').forEach(card=>{const i=+card.dataset.i;card.querySelector('.up').onclick=()=>{syncEditor();if(i>0){[working[i-1],working[i]]=[working[i],working[i-1]];rebuild()}};card.querySelector('.down').onclick=()=>{syncEditor();if(i<working.length-1){[working[i+1],working[i]]=[working[i],working[i+1]];rebuild()}};card.querySelector('.del').onclick=()=>{syncEditor();working.splice(i,1);rebuild()}})}
  rebuild();
  function syncEditor(){document.querySelectorAll('.editorCard').forEach(card=>{const i=+card.dataset.i;working[i].name=clean(card.querySelector('.name').value);working[i].sets=Math.max(1,Math.min(10,parseInt(card.querySelector('.sets').value)||1));working[i].pauseValue=Math.max(0,parseInt(card.querySelector('.pause').value)||0);working[i].pauseUnit=card.querySelector('.unitSelect').value})}
  function close(){root.innerHTML=''}
  document.getElementById('backEdit').onclick=close;
  document.getElementById('saveEdit').onclick=()=>{syncEditor();if(mode==='base'){state.plans[di]=clone(working)}else{state.datePlans??={};state.datePlans[date]=clone(working)}save();close();render()};
  if(document.getElementById('resetDatePlan'))document.getElementById('resetDatePlan').onclick=()=>{if(confirm('Zrušit úpravu pouze pro '+formatDateCz(date)+' a použít základní plán?')){delete state.datePlans[date];save();close();render()}};
  document.getElementById('copyPlan').onclick=()=>{syncEditor();state.copiedPlan=clone(working);state.copiedDay=mode==='base'?DAYS[di]:formatDateCz(date);save();alert('Plán zkopírován.')};
  document.getElementById('pastePlan').onclick=()=>{if(!state.copiedPlan){alert('Nejdříve zkopíruj některý plán.');return}if(confirm('Nahradit tento plán zkopírovaným plánem?')){working=clone(state.copiedPlan);rebuild()}};
  document.getElementById('addExercise').onclick=()=>addExerciseDialog(working,rebuild)
}
function clean(s){return String(s).replace(/[;|\n]/g,' ').trim()}
function addExerciseDialog(working,rebuild){const r=document.getElementById('modalRoot');r.insertAdjacentHTML('beforeend',`<div class="modalBack" id="addModal"><div class="modal" style="max-width:520px"><div class="modalHead">PŘIDAT CVIK</div><div class="dialog"><label>NÁZEV CVIKU</label><input id="newName" autocomplete="off" inputmode="text" lang="cs"><label>SÉRIE</label><input id="newSets" inputmode="numeric" value="3"><label>PAUZA</label><div class="pauseGrid"><div></div><input id="newPause" inputmode="numeric" value="2"><select id="newUnit"><option value="min">minuty</option><option value="sec">sekundy</option></select></div></div><div class="modalButtons"><button class="ghost" id="cancelAdd">ZRUŠIT</button><button class="blue" id="confirmAdd">PŘIDAT</button></div></div></div>`);document.getElementById('cancelAdd').onclick=()=>document.getElementById('addModal').remove();document.getElementById('confirmAdd').onclick=()=>{const name=clean(document.getElementById('newName').value);if(!name){alert('Zadej název cviku.');return}working.push({name,sets:Math.max(1,Math.min(10,parseInt(document.getElementById('newSets').value)||3)),pauseValue:Math.max(0,parseInt(document.getElementById('newPause').value)||0),pauseUnit:document.getElementById('newUnit').value});document.getElementById('addModal').remove();rebuild()};document.getElementById('newName').focus()}

function formatDateCz(iso){const p=iso.split('-').map(Number);return p.length===3?`${p[2]}. ${p[1]}. ${p[0]}`:iso}
let pickerMonth=null;
function datePickerHtml(monthOverride){
  const base=state.selectedDate;
  let ym=monthOverride||pickerMonth||base.slice(0,7);
  if(!/^\d{4}-\d{2}$/.test(ym))ym=base.slice(0,7);
  pickerMonth=ym;
  const [y,mn]=ym.split('-').map(Number),m=mn-1;
  const first=new Date(y,m,1).getDay(),offset=(first+6)%7;
  const monthNames=['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
  let out=`<div class="modalBack" id="datePickerModal"><div class="modal datePicker"><div class="modalHead">VYBERTE DATUM</div><div class="pickerSelected">${formatDateCz(base)}</div><div class="pickerNav"><button type="button" class="ghost" id="pickPrev">‹</button><div>${monthNames[m]} ${y}</div><button type="button" class="ghost" id="pickNext">›</button></div>`;
  out+='<div class="calendar pickerCalendar">'+['Po','Út','St','Čt','Pá','So','Ne'].map(x=>`<div class="calHead">${x}</div>`).join('');
  for(let i=0;i<offset;i++)out+='<div></div>';
  const days=new Date(y,m+1,0).getDate();
  for(let n=1;n<=days;n++){
    const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`;
    const di=dayIndex(iso);let c='calDay';
    if(iso===todayISO())c+=' today';
    if(iso===base)c+=' selectedDate';
    if(isComplete(iso,di))c+=' done';else if(isStarted(iso,di))c+=' started';
    out+=`<button type="button" class="${c}" data-pick-date="${iso}">${n}${isComplete(iso,di)?' ✓':isStarted(iso,di)?' •':''}</button>`;
  }
  out+='</div><div class="editorBottom"><button type="button" class="ghost" id="cancelDate">ZRUŠIT</button><button type="button" class="blue" id="todayDate">DNES</button></div></div></div>';
  return out;
}
function showDatePicker(monthOverride){
  const r=document.getElementById('modalRoot');
  if(monthOverride) pickerMonth=monthOverride;
  else if(!pickerMonth) pickerMonth=state.selectedDate.slice(0,7);
  r.innerHTML=datePickerHtml(pickerMonth);
  const modal=document.getElementById('datePickerModal');
  document.getElementById('cancelDate').onclick=()=>{pickerMonth=null;r.innerHTML=''};
  document.getElementById('todayDate').onclick=()=>{state.selectedDate=todayISO();pickerMonth=null;save();r.innerHTML='';render()};
  document.getElementById('pickPrev').onclick=()=>{
    let [y,m]=pickerMonth.split('-').map(Number); m--; if(m<1){m=12;y--}
    pickerMonth=`${y}-${String(m).padStart(2,'0')}`;
    showDatePicker(pickerMonth);
  };
  document.getElementById('pickNext').onclick=()=>{
    let [y,m]=pickerMonth.split('-').map(Number); m++; if(m>12){m=1;y++}
    pickerMonth=`${y}-${String(m).padStart(2,'0')}`;
    showDatePicker(pickerMonth);
  };
  modal.querySelectorAll('[data-pick-date]').forEach(b=>b.onclick=()=>{state.selectedDate=b.dataset.pickDate;pickerMonth=null;save();r.innerHTML='';render()});
}
function showHistory(){try{const cm=sessionStorage.getItem('calendarMonth');if(!/^\d{4}-\d{2}$/.test(cm||''))sessionStorage.setItem('calendarMonth',state.selectedDate.slice(0,7))}catch(e){}const r=document.getElementById('modalRoot');let dates=Object.keys(state.history).sort().reverse();let html=`<div class="modalBack"><div class="modal"><div class="modalHead">HISTORIE / STATISTIKY</div><div class="modalScroll">${dates.length?dates.map(d=>{const out=[];for(let di=0;di<7;di++){const rec=state.history[d]?.[di];if(!rec)continue;const plan=getPlanForDate(d);Object.keys(rec).forEach(i=>{const e=plan[i];if(e)out.push(`<div class="historyItem"><b>${DAYS[di]} – ${esc(e.name)}</b><br>${(Array.isArray(rec[i])?rec[i]:[]).map((s,k)=>s?`Série ${k+1}: ${esc(s.weight??'')} kg × ${esc(s.reps??'')}`:'').filter(Boolean).join(' • ')||'Bez zadaných hodnot'}</div>`)});}return `<div class="historyDay"><div class="historyTitle">${d}</div>${out.join('')||'Bez záznamu'}</div>`}).join(''):'<p>Historie je zatím prázdná.</p>'}<hr><h3>KALENDÁŘ</h3>${calendarHtml()}<h3>STATISTIKY</h3>${statsHtml()}</div><div class="editorBottom"><button class="blue" id="closeHistory">ZAVŘÍT</button><button class="blue" id="deleteHistory">SMAZAT HISTORII</button></div></div></div>`;r.innerHTML=html;document.getElementById('closeHistory').onclick=()=>r.innerHTML='';document.getElementById('deleteHistory').onclick=()=>{if(confirm('Smazat celou historii?')){state.history={};save();showHistory()}};r.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{state.selectedDate=b.dataset.date;try{sessionStorage.setItem('calendarMonth',b.dataset.date.slice(0,7))}catch(e){}save();r.innerHTML='';render()});r.querySelector('[data-cal-prev]')?.addEventListener('click',()=>{let ym=sessionStorage.getItem('calendarMonth')||state.selectedDate.slice(0,7);let [y,m]=ym.split('-').map(Number);m--;if(m<1){m=12;y--}sessionStorage.setItem('calendarMonth',`${y}-${String(m).padStart(2,'0')}`);showHistory()});r.querySelector('[data-cal-next]')?.addEventListener('click',()=>{let ym=sessionStorage.getItem('calendarMonth')||state.selectedDate.slice(0,7);let [y,m]=ym.split('-').map(Number);m++;if(m>12){m=1;y++}sessionStorage.setItem('calendarMonth',`${y}-${String(m).padStart(2,'0')}`);showHistory()});}
function calendarHtml(){
  let ym='';
  try{ym=sessionStorage.getItem('calendarMonth')||''}catch(e){}
  if(!/^\d{4}-\d{2}$/.test(ym))ym=state.selectedDate.slice(0,7);
  let parts=ym.split('-'),y=Number(parts[0]),m=Number(parts[1])-1;
  const first=new Date(y,m,1).getDay(),offset=(first+6)%7;
  const monthNames=['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
  let out='<div style="display:grid;grid-template-columns:1fr 2fr 1fr;gap:6px;align-items:center;margin:8px 0"><button class="ghost" data-cal-prev>‹</button><div style="text-align:center;font-weight:800">'+monthNames[m]+' '+y+'</div><button class="ghost" data-cal-next>›</button></div>';
  out+='<div class="calendar">'+['Po','Út','St','Čt','Pá','So','Ne'].map(x=>`<div class="calHead">${x}</div>`).join('');
  const days=new Date(y,m+1,0).getDate();
  for(let i=0;i<offset;i++)out+='<div></div>';
  for(let n=1;n<=days;n++){
    const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(n).padStart(2,'0')}`;
    const di=dayIndex(iso);
    let c='calDay';
    if(iso===todayISO())c+=' today';
    if(isComplete(iso,di))c+=' done';else if(isStarted(iso,di))c+=' started';
    out+=`<button class="${c}" data-date="${iso}">${n}${isComplete(iso,di)?' ✓':isStarted(iso,di)?' •':''}</button>`;
  }
  return out+'</div>';
}
function statsHtml(){var totals={};Object.keys(state.history||{}).forEach(function(d){for(var di=0;di<7;di++){var rec=state.history[d]&&state.history[d][di];var plan=getPlanForDate(d);if(!rec)continue;Object.keys(rec).forEach(function(i){var e=plan[i];if(!e)return;var key=e.name;var x=totals[key];if(!x){x={sessions:0,maxW:0,maxR:0};totals[key]=x;}x.sessions++;(Array.isArray(rec[i])?rec[i]:[]).forEach(function(s){if(!s)return;var w=parseFloat(String(s.weight??'').replace(',','.'))||0;var r=parseInt(s.reps,10)||0;if(w>x.maxW)x.maxW=w;if(r>x.maxR)x.maxR=r;});});}});return Object.keys(totals).map(function(n){var x=totals[n];return '<div class="statCard"><b>'+esc(n)+'</b><div>Tréninky: '+x.sessions+'</div><div>Max. váha: '+x.maxW+' kg</div><div>Max. opakování: '+x.maxR+'</div></div>';}).join('')||'<p>Zatím nejsou statistická data.</p>'; }
function backupMenu(){const r=document.getElementById('modalRoot');r.innerHTML=`<div class="modalBack"><div class="modal"><div class="modalHead">ZÁLOHA</div><div class="dialog"><p>Záloha je pouze v tomto zařízení. Export vytvoří soubor JSON, který můžeš později importovat.</p></div><div class="modalButtons"><button class="blue" id="export">EXPORT</button><button class="blue" id="import">IMPORT</button></div><div class="editorBottom"><button class="blue" id="closeB">ZAVŘÍT</button></div></div></div>`;document.getElementById('closeB').onclick=()=>r.innerHTML='';document.getElementById('export').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='muj-trenink-zaloha.json';a.click();URL.revokeObjectURL(a.href)};document.getElementById('import').onclick=()=>{const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.onchange=async()=>{try{const x=JSON.parse(await inp.files[0].text());if(!x.plans||!x.history)throw Error();state=x;save();r.innerHTML='';render();alert('Záloha obnovena.')}catch(e){alert('Neplatná záloha.')}};inp.click()}}
window.addEventListener('error',e=>{const a=document.getElementById('app');if(a&&!a.innerHTML.trim())a.innerHTML='<div style="padding:28px;font-family:Arial;color:#111"><h2>MŮJ TRÉNINK</h2><p>Aplikaci se nepodařilo spustit.</p><p style="font-size:13px">Zkus stránku obnovit.</p></div>'});try{render()}catch(e){const a=document.getElementById('app');a.innerHTML='<div style="padding:28px;font-family:Arial;color:#111"><h2>MŮJ TRÉNINK</h2><p>Chyba při spuštění aplikace.</p><p style="font-size:13px">'+String(e).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))+'</p></div>';console.error(e)}if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
