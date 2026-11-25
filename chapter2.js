(()=>{'use strict';
function hitStyle(s){const base=`left:${s.x}%;top:${s.y}%;width:${s.w}%;height:${s.h}%`;return Array.isArray(s.poly)&&s.poly.length>=3?base+`;clip-path:polygon(${s.poly.map(p=>`${p[0]}% ${p[1]}%`).join(',')})`:base}

const $=id=>document.getElementById(id), D=window.SEALED_CHAPTER2;
if(!D){document.body.textContent='CHAPTER 02 데이터를 불러올 수 없습니다.';return}
const KEY='sealed_archive_ch02_v1', NUMS=['①','②','③','④','⑤','⑥','⑦','⑧'];
const DEFAULT=()=>({page:0,found:{},filled:{},drafts:{},activeBlank:'c1',letter:0,photo:0,records:{},sortOrder:['p1','p7','p5','p3','p2','p6','p4'],sortSolved:false,completed:false});
let st=DEFAULT();try{const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(stored&&typeof stored==='object'){
 for(const k of ['page','found','filled','drafts','activeBlank','letter','photo','records','sortOrder','sortSolved','completed'])if(stored[k]!==undefined)st[k]=stored[k];
 if(!Array.isArray(st.sortOrder)||st.sortOrder.length!==7||new Set(st.sortOrder).size!==7||st.sortOrder.some(x=>!D.photos.some(p=>p.id===x)))st.sortOrder=DEFAULT().sortOrder;
}}catch(e){}
let overlay=null,pan={x:0,y:0,scale:1},panStart=null,dragIndex=null,openedFrom=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
function esc(s){return String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))}
const norm=t=>String(t||'').normalize('NFKC').toLowerCase().replace(/[\s\u200b.,·。!?？!…\-–—“”"'‘’]/g,'');
function correct(key,text){let a=D.answers[key];if(!a)return false;const all=[a.answer,...a.aliases];const n=norm(text);return all.some(v=>{const q=norm(v);return q===n||['을','를','은','는','이','가','의','에','에서','로','으로','와','과'].some(p=>q+p===n)})}
function filledCount(){return Object.keys(D.answers).filter(k=>correct(k,st.filled[k])).length}
function recordsCount(){return D.objects.filter(o=>st.records[o.id]?.solved).length}
function checkComplete(){if(filledCount()===8&&recordsCount()===3&&st.sortSolved){st.completed=true;st.page=3;save();render();return true}return false}
function go(page){if(overlay!==null||page<0||page>3)return;st.page=page;save();render()}
function render(){for(let i=0;i<4;i++)$('c2-page-'+i).classList.toggle('active',i===st.page);
 $('c2-prev').disabled=st.page===0;$('c2-next').disabled=st.page===3;$('c2-page-number').textContent=String(st.page+1).padStart(2,'0')+' / 04';
 if(st.page===1)archive();if(st.page===2){renderSort();renderObjects()}if(st.page===3)renderFinish();}
function archive(){let html=D.photos.map((p,i)=>`<button class="c2-print" type="button" data-open-photo="${i}" style="--tilt:${[2,-3,1,-2,3,-2,1][i]}deg" aria-label="PHOTO ${String(i+1).padStart(2,'0')} 확대"><img src="${p.src}" alt="${esc(p.title)}"><span>PHOTO ${String(i+1).padStart(2,'0')}</span></button>`).join('');$('c2-photo-grid').innerHTML=html;
 $('c2-found-count').textContent='관찰한 단서 '+Object.keys(st.found).length+'개';$('c2-filled-count').textContent=`복원 ${filledCount()} / 8`;}
function showModal(html,kind){overlay=kind;openedFrom=document.activeElement;$('c2-dialog-body').innerHTML=html;$('c2-overlay').classList.add('open');$('c2-overlay').setAttribute('aria-hidden','false');$('c2-dialog').dataset.kind=kind;$('c2-close').focus()}
function close(){overlay=null;$('c2-overlay').classList.remove('open');$('c2-overlay').setAttribute('aria-hidden','true');$('c2-dialog-body').innerHTML='';if(openedFrom&&openedFrom.isConnected)openedFrom.focus();render()}
function openPhoto(n){st.photo=(n+D.photos.length)%D.photos.length;save();const p=D.photos[st.photo];pan={x:0,y:0,scale:1};const seen=p.spots.filter((_,i)=>st.found[p.id+':'+i]).length;
 const hotspots=p.spots.map((s,i)=>`<button type="button" class="c2-photo-hot" data-hotspot="${i}" data-label="${esc(s.label)}" style="${hitStyle(s)}" title="${esc(s.label)}" aria-label="${esc(s.label)} 관찰하기"></button>`).join('');
 showModal(`<div class="c2-photo-inspector"><section class="c2-photo-main"><div class="c2-inspect-header"><b>PHOTO ${String(st.photo+1).padStart(2,'0')} / 07</b><span>${esc(p.title)}</span></div><div id="c2-zoom-stage" class="c2-zoom-stage" aria-label="확대·이동할 수 있는 사진"><div id="c2-zoom-inner" class="c2-zoom-inner"><img src="${p.src}" alt="${esc(p.title)}">${hotspots}</div></div><div class="c2-photo-controls"><button type="button" data-zoom-change="-.25" aria-label="축소">−</button><label>배율 <input id="c2-zoom-range" type="range" min="1" max="4" step=".05" value="1"></label><button type="button" data-zoom-change=".25" aria-label="확대">+</button><button type="button" id="c2-zoom-reset">원래 크기</button><label><input type="checkbox" id="c2-show-spots"> 조사 영역 표시</label><button type="button" data-photo-nav="-1">← 이전</button><button type="button" data-photo-nav="1">다음 →</button></div></section>
 <aside class="c2-photo-side"><small>OBSERVATION · 관찰 기록</small><h2 id="c2-inspect-object">${esc(p.title)}</h2><div class="c2-observation" id="c2-inspect-desc" role="status">인물이나 물건에 커서를 올리고 선택하면 짧은 관찰 기록이 나타납니다. 사진을 확대해 세부 특징을 비교할 수 있습니다.</div><p id="c2-photo-count">기록한 부분 ${seen} / ${p.spots.length}</p><p>표시되지 않은 단서도 자세히 살펴보세요. 사진에서 확인한 사실만 기록합니다.</p><button class="button light small" id="c2-back-archive" type="button">기록책으로 돌아가기</button></aside></div>`,'photo');applyPan();setupPan()}
function applyPan(){const inner=$('c2-zoom-inner');if(inner)inner.style.transform=`translate(-50%,-50%) translate(${pan.x}px,${pan.y}px) scale(${pan.scale})`;const range=$('c2-zoom-range');if(range)range.value=String(pan.scale)}
function zoom(delta){pan.scale=Math.max(1,Math.min(4,Math.round((pan.scale+delta)*100)/100));if(pan.scale===1){pan.x=0;pan.y=0}applyPan()}
function setupPan(){const stage=$('c2-zoom-stage');if(!stage)return;stage.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?.2:-.2)},{passive:false});
 stage.addEventListener('pointerdown',e=>{if(e.target.closest('[data-hotspot]')||e.button!==0)return;panStart={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};stage.classList.add('panning');stage.setPointerCapture(e.pointerId)});
 stage.addEventListener('pointermove',e=>{if(!panStart)return;pan.x=panStart.px+(e.clientX-panStart.x);pan.y=panStart.py+(e.clientY-panStart.y);applyPan()});
 const end=()=>{panStart=null;stage.classList.remove('panning')};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end)}
function inspectSpot(i){let p=D.photos[st.photo],s=p.spots[i];if(!s)return;st.found[p.id+':'+i]=true;save();$('c2-inspect-object').textContent=s.label;$('c2-inspect-desc').textContent=s.observation;$('c2-photo-count').textContent=`기록한 부분 ${p.spots.filter((_,j)=>st.found[p.id+':'+j]).length} / ${p.spots.length}`;document.querySelectorAll('.c2-photo-hot').forEach(el=>el.classList.toggle('selected',Number(el.dataset.hotspot)===i))}
function blankInText(p){return esc(p).replace(/\{(c\d)\}/g,(_,id)=>{let i=Number(id[1])-1;return `<button type="button" data-blank="${id}" class="c2-blank ${correct(id,st.filled[id])?'solved':''} ${id===st.activeBlank?'active':''}" aria-label="빈칸 ${NUMS[i]} 선택">${esc(st.filled[id]||NUMS[i])}</button>`})}
function openLetter(i,msg='',kind=''){st.letter=i;const l=D.letters[i];if(!st.activeBlank||Number(st.activeBlank[1])<=2 !== (i===0))st.activeBlank=i===0?'c1':'c3';save();
 const paragraphs=l.paragraphs.map(x=>`<p>${blankInText(x)}</p>`).join('');const b=st.activeBlank;
 showModal(`<article class="c2-letter-sheet" id="c2-letter-sheet"><header><div><h2>${i===0?'첫 번째 편지':'두 번째 편지'}</h2><small>작성자: ${esc(l.writer)}<br>수신자: ${esc(l.recipient)}<br>작성일: ${esc(l.date)}</small></div><button type="button" class="button small light" data-switch-letter="${1-i}">다른 편지 보기 ↗</button></header><div class="letter-copy"><p>${esc(l.greeting)}</p>${paragraphs}<p class="signature">${esc(l.sign)}</p></div><div class="c2-answer-panel"><label id="c2-answer-label">복원할 자리 ${NUMS[Number(b[1])-1]} · 단어 또는 표현 입력</label><input id="c2-answer-input" aria-labelledby="c2-answer-label" autocomplete="off" maxlength="100" value="${esc(st.drafts[b]||'')}" ${correct(b,st.filled[b])?'disabled':''}><button type="button" class="button small" id="c2-answer-submit" ${correct(b,st.filled[b])?'disabled':''}>복원 확인</button><span class="c2-letter-msg ${kind}" id="c2-answer-note" role="status">${esc(msg||'빈칸을 고른 뒤 사진과 대조하여 입력하세요.')}</span></div><div class="c2-letter-bottom"><button class="button light small" type="button" id="c2-letter-close">← 사진으로 돌아가기</button><span>복원 ${filledCount()} / 8</span></div></article>`,'letter');
 if(kind){$('c2-answer-input')?.focus()}}
function chooseBlank(id){if(!D.answers[id])return;const sheet=$('c2-letter-sheet'),pos=sheet?.scrollTop||0;st.activeBlank=id;save();openLetter(st.letter);$('c2-letter-sheet').scrollTop=pos;$('c2-answer-input')?.focus()}
function restore(){const key=st.activeBlank,entry=$('c2-answer-input');if(!entry)return;const value=entry.value.trim();st.drafts[key]=value;save();if(!value){$('c2-answer-note').textContent='단어나 표현을 입력해 주세요.';return}
 if(correct(key,value)){st.filled[key]=D.answers[key].answer;st.drafts[key]='';save();const pos=$('c2-letter-sheet')?.scrollTop||0;let next=Object.keys(D.answers).find(k=>k[0]===key[0]&&!correct(k,st.filled[k]));if(next)st.activeBlank=next;
 openLetter(st.letter,'해당 글씨가 복원되었습니다.','ok');$('c2-letter-sheet').scrollTop=pos;if(checkComplete())close();}
 else{const m=$('c2-answer-note');m.className='c2-letter-msg no';m.textContent='문맥과 사진을 다시 확인해 보세요. 정답은 공개되지 않습니다.'}}
function imageObjectSeen(o){return o.seen.some(key=>st.found[key])}
function renderObjects(){let html=D.objects.map((o,i)=>{const rec=st.records[o.id]||{},seen=imageObjectSeen(o);const opt=(v)=>`<option value="${v}" ${rec.owner===v?'selected':''}>${v||'선택'}</option>`;
 const holder=(v)=>`<option value="${v}" ${rec.holder===v?'selected':''}>${v||'선택'}</option>`;
 return `<div class="c2-object-card ${rec.solved?'is-solved':''}" data-object="${o.id}">${seen?`<img class="c2-object-img" src="${o.src}" style="object-position:${o.crop}" alt="${esc(o.title)}">`:'<div class="c2-object-locked">관찰 후<br>사진 등록</div>'}<div><h3>${esc(o.title)}</h3><p>${seen?esc(o.note):'관련 사진을 조사하면 이미지가 나타납니다.'}</p>${o.id==='bagB'&&st.found['p3:0']?`<p class="c2-contents-list">가방 내부 관찰: ${[st.found['p3:2']?'작은 책':null,st.found['p3:3']?'접힌 스카프':null,st.found['p3:1']?'장갑':null].filter(Boolean).join(', ')||'관찰하지 않음'}</p>`:''}<div class="c2-object-fields"><label>소유자<select data-field="owner" data-object-id="${o.id}" ${rec.solved?'disabled':''}>${['','아서','낯선 여성','불명'].map(opt).join('')}</select></label><label>당시 소지자<select data-field="holder" data-object-id="${o.id}" ${rec.solved?'disabled':''}>${['','아서','낯선 여성','불명'].map(holder).join('')}</select></label><button class="button small c2-object-check" type="button" data-object-check="${o.id}" ${rec.solved?'disabled':''}>${rec.solved?'기록 완료':'기록 확인'}</button></div></div></div>`}).join('');$('c2-object-list').innerHTML=html;}
function setObject(id,field,value){if(!st.records[id])st.records[id]={};st.records[id][field]=value;st.records[id].solved=false;save()}
function checkObject(id){const item=D.objects.find(o=>o.id===id),rec=st.records[id]||{};const note=$('c2-objects-note');if(!item)return;
 if(!imageObjectSeen(item)){note.textContent='해당 사물을 먼저 사진에서 조사해 주세요.';return}
 if(rec.owner===item.owner&&rec.holder===item.holder){rec.solved=true;st.records[id]=rec;save();renderObjects();note.textContent='기록 한 건을 확인했습니다.';checkComplete();}else{note.textContent='소유자 또는 당시 소지자를 다시 확인해 주세요.'}}
function renderSort(){const ordered=st.sortOrder.map((id,i)=>{let p=D.photos.find(x=>x.id===id),n=D.photos.indexOf(p)+1;return `<div class="c2-sort-tile" draggable="true" data-sort-index="${i}" aria-label="${i+1}번째 사진 PHOTO ${String(n).padStart(2,'0')}"><img src="${p.src}" alt="${esc(p.title)}"><div class="c2-sort-info"><span>PHOTO ${String(n).padStart(2,'0')}</span><div class="c2-sort-controls"><button type="button" aria-label="앞으로 이동" data-shift="-1" data-index="${i}" ${i===0?'disabled':''}>←</button><button type="button" aria-label="뒤로 이동" data-shift="1" data-index="${i}" ${i===6?'disabled':''}>→</button><button type="button" aria-label="사진 확대" data-sort-photo="${n-1}">⌕</button></div></div></div>`}).join('');$('c2-sort-list').innerHTML=ordered;
 $('c2-sort-note').textContent=st.sortSolved?'사진 순서 확인 완료.':'사진을 이동한 뒤 순서를 확인하세요.';}
function changeSort(from,to,drag=false){if(from<0||to<0||from>=7||to>=7||from===to)return;if(drag){let [x]=st.sortOrder.splice(from,1);st.sortOrder.splice(to,0,x)}else{[st.sortOrder[from],st.sortOrder[to]]=[st.sortOrder[to],st.sortOrder[from]]}st.sortSolved=false;save();renderSort()}
function checkSort(){const match=st.sortOrder.every((id,i)=>id===D.correctOrder[i]);$('c2-sort-note').textContent=match?'사진을 시간순으로 정리했습니다.':'아직 맞지 않는 순서가 있습니다. 사진과 편지를 다시 비교해 보세요.';if(match){st.sortSolved=true;save();checkComplete()}}
function renderFinish(){const done=st.completed;const box=$('c2-finish-text');box.innerHTML=done?'<p>두 여행 가방은 열차 안에서 서로 뒤바뀐 것으로 확인되었다.</p><p>아서와 낯선 여성은 다음 날 역에서 각자의 가방을 되찾았다.</p><p>여성의 이름과 이후 행적은 기록되어 있지 않다.</p><p><strong>기록 복원이 완료되었습니다.</strong></p>':`<p>편지 복원 ${filledCount()} / 8</p><p>사물 기록 ${recordsCount()} / 3</p><p>사진 순서 ${st.sortSolved?'확인 완료':'미확인'}</p><p>세 기록을 모두 정리하면 다음 장이 열립니다.</p>`;
 const controls=document.getElementById('c2-finish-controls');
 if(controls){
  const existing=controls.querySelector('#c2-ch3-link');
  if(done&&!existing){const sealed=controls.querySelector('.c2-next-sealed');if(sealed)sealed.remove();const a=document.createElement('a');a.id='c2-ch3-link';a.className='button';a.href='chapter3.html';a.textContent='CHAPTER 03 — 떠날 준비 펼치기 →';controls.appendChild(a)}
 }
}
$('c2-enter').addEventListener('click',()=>go(1));$('c2-go-workbook').addEventListener('click',()=>go(2));$('c2-prev').addEventListener('click',()=>go(st.page-1));$('c2-next').addEventListener('click',()=>go(st.page+1));$('c2-return-archive').addEventListener('click',()=>go(1));
$('c2-restart').addEventListener('click',()=>{if(!confirm('챕터 2의 복원 기록만 초기화할까요? 챕터 1의 기록은 유지됩니다.'))return;try{localStorage.removeItem(KEY)}catch(e){}st=DEFAULT();go(0)});
$('c2-close').addEventListener('click',close);$('c2-overlay').addEventListener('click',e=>{if(e.target===$('c2-overlay'))close()});
$('c2-photo-grid').addEventListener('click',e=>{const t=e.target.closest('[data-open-photo]');if(t)openPhoto(Number(t.dataset.openPhoto))});
$('c2-page-1').addEventListener('click',e=>{const t=e.target.closest('[data-c2-letter]');if(t)openLetter(Number(t.dataset.c2Letter))});
$('c2-check-order').addEventListener('click',checkSort);
$('c2-sort-list').addEventListener('click',e=>{let shift=e.target.closest('[data-shift]');if(shift){changeSort(Number(shift.dataset.index),Number(shift.dataset.index)+Number(shift.dataset.shift));return}let photo=e.target.closest('[data-sort-photo]');if(photo)openPhoto(Number(photo.dataset.sortPhoto))});
$('c2-sort-list').addEventListener('dragstart',e=>{let item=e.target.closest('.c2-sort-tile');if(!item)return;dragIndex=Number(item.dataset.sortIndex);item.classList.add('dragged');if(e.dataTransfer)e.dataTransfer.setData('text/plain',String(dragIndex))});
$('c2-sort-list').addEventListener('dragover',e=>{if(e.target.closest('.c2-sort-tile')){e.preventDefault();e.dataTransfer.dropEffect='move'}});
$('c2-sort-list').addEventListener('drop',e=>{let item=e.target.closest('.c2-sort-tile');if(item&&dragIndex!==null){e.preventDefault();changeSort(dragIndex,Number(item.dataset.sortIndex),true)}dragIndex=null});
$('c2-sort-list').addEventListener('dragend',()=>{dragIndex=null;document.querySelectorAll('.c2-sort-tile').forEach(e=>e.classList.remove('dragged'))});
$('c2-object-list').addEventListener('change',e=>{let el=e.target.closest('[data-field]');if(el)setObject(el.dataset.objectId,el.dataset.field,el.value)});
$('c2-object-list').addEventListener('click',e=>{let t=e.target.closest('[data-object-check]');if(t)checkObject(t.dataset.objectCheck)});
$('c2-dialog-body').addEventListener('click',e=>{
 let spot=e.target.closest('[data-hotspot]');if(spot){inspectSpot(Number(spot.dataset.hotspot));return}
 let pn=e.target.closest('[data-photo-nav]');if(pn){openPhoto(st.photo+Number(pn.dataset.photoNav));return}
 let zm=e.target.closest('[data-zoom-change]');if(zm){zoom(Number(zm.dataset.zoomChange));return}
 if(e.target.id==='c2-zoom-reset'){pan={x:0,y:0,scale:1};applyPan();return}
 if(e.target.id==='c2-back-archive'||e.target.id==='c2-letter-close'){close();return}
 let b=e.target.closest('[data-blank]');if(b){chooseBlank(b.dataset.blank);return}
 let l=e.target.closest('[data-switch-letter]');if(l){openLetter(Number(l.dataset.switchLetter));return}
 if(e.target.id==='c2-answer-submit'){restore();return}
});
$('c2-dialog-body').addEventListener('change',e=>{if(e.target.id==='c2-show-spots')$('c2-zoom-stage').classList.toggle('show-spots',e.target.checked);if(e.target.id==='c2-zoom-range'){pan.scale=Number(e.target.value);if(pan.scale===1){pan.x=0;pan.y=0}applyPan()}});
$('c2-dialog-body').addEventListener('input',e=>{if(e.target.id==='c2-zoom-range'){pan.scale=Number(e.target.value);applyPan()}if(e.target.id==='c2-answer-input'){st.drafts[st.activeBlank]=e.target.value;save()}});
$('c2-dialog-body').addEventListener('keydown',e=>{if(e.target.id==='c2-answer-input'&&e.key==='Enter'){e.preventDefault();restore()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay!==null){close();return}if(overlay!==null||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(e.key==='ArrowLeft')go(st.page-1);if(e.key==='ArrowRight')go(st.page+1)});
render();
window.SEALED_CH02_TEST={correct,calc:()=>({letters:filledCount(),objects:recordsCount(),sort:st.sortSolved,completed:st.completed}),getOrder:()=>[...st.sortOrder]};
})();
