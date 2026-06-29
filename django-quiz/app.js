(async()=>{
const QUIZ_DATA = await Promise.all(Array.from({length:8},(_,i)=>fetch(`data/chapter${i+1}.json`).then(r=>{if(!r.ok)throw new Error(`加载第${i+1}章失败`);return r.json()})));
const STORAGE_KEY = 'django_quiz_400_v1';
const state = loadState();
let mode = 'chapter';
let currentChapter = Number(state.currentChapter || 1);

function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{answers:{},graded:{},wrongIds:[],currentChapter:1}}catch(e){return{answers:{},graded:{},wrongIds:[],currentChapter:1}}}
function saveState(){state.currentChapter=currentChapter;localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function allQuestions(){return QUIZ_DATA.flatMap(c=>c.questions)}
function chapterData(ch){return QUIZ_DATA.find(c=>c.chapter===ch)}
function getViewQuestions(){if(mode==='all')return allQuestions();if(mode==='wrong'){const set=new Set(state.wrongIds||[]);return allQuestions().filter(q=>set.has(q.id))}return chapterData(currentChapter).questions}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function correctLabel(q){return q.accepted.map(k=>`${k}. ${(q.options.find(o=>o.key===k)||{}).text||''}`).join('；')}

function initNav(){
 const list=document.getElementById('chapterList'), mobile=document.getElementById('mobileChapter');
 list.innerHTML=''; mobile.innerHTML='';
 QUIZ_DATA.forEach(c=>{
  const b=document.createElement('button');b.className='chapter-btn';b.dataset.chapter=c.chapter;b.innerHTML=`Chapter ${c.chapter}<small>${esc(c.title)}</small>`;b.onclick=()=>{mode='chapter';currentChapter=c.chapter;syncModeButtons();render()};list.appendChild(b);
  const o=document.createElement('option');o.value=c.chapter;o.textContent=`Chapter ${c.chapter} · ${c.title}`;mobile.appendChild(o);
 });
 mobile.onchange=e=>{mode='chapter';currentChapter=Number(e.target.value);syncModeButtons();render()};
 document.querySelectorAll('.mode-btn').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;syncModeButtons();render()});
}
function syncModeButtons(){document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));document.querySelectorAll('.chapter-btn').forEach(b=>b.classList.toggle('active',mode==='chapter'&&Number(b.dataset.chapter)===currentChapter));document.getElementById('mobileChapter').value=currentChapter}

function render(){
 syncModeButtons();const questions=getViewQuestions();const container=document.getElementById('quizContainer');container.innerHTML='';
 const c=chapterData(currentChapter);const heroTitle=document.getElementById('heroTitle'),heroSub=document.getElementById('heroSubtitle');
 if(mode==='chapter'){heroTitle.textContent=`Chapter ${currentChapter} · ${c.title}`;heroSub.textContent='本章共 50 题，完成后点击“交卷并查看对错”。'}
 else if(mode==='all'){heroTitle.textContent='全部章节 · 400 题';heroSub.textContent='可一次完成全部题目，也可先按章节练习。'}
 else{heroTitle.textContent='错题本';heroSub.textContent=questions.length?'收录已交卷时答错或未作答的题目。':'暂时没有错题，继续保持。'}
 document.getElementById('prevBtn').style.display=mode==='chapter'?'inline-block':'none';document.getElementById('nextBtn').style.display=mode==='chapter'?'inline-block':'none';
 document.getElementById('prevBtn').disabled=currentChapter===1;document.getElementById('nextBtn').disabled=currentChapter===8;
 document.getElementById('submitBtn').disabled=questions.length===0;document.getElementById('viewCounter').textContent=`当前显示 ${questions.length} 题`;
 document.getElementById('resultBanner').classList.remove('show');
 if(!questions.length){container.innerHTML='<div class="empty">当前没有题目。完成章节交卷后，答错和未作答的题会进入错题本。</div>';updateProgress();return}
 let lastGroup='';
 questions.forEach(q=>{
  const group=mode==='all'?`Chapter ${q.chapter} · ${chapterData(q.chapter).title} / ${q.section}`:q.section;
  if(group!==lastGroup){const h=document.createElement('div');h.className='section-heading';h.innerHTML=`<h3>${esc(group)}</h3><span>${questions.filter(x=>(mode==='all'?`Chapter ${x.chapter} · ${chapterData(x.chapter).title} / ${x.section}`:x.section)===group).length} 题</span>`;container.appendChild(h);lastGroup=group}
  container.appendChild(renderQuestion(q));
 });
 updateProgress();window.scrollTo({top:0,behavior:'smooth'});
}
function renderQuestion(q){
 const card=document.createElement('article');card.className='question-card';card.id=q.id;card.dataset.qid=q.id;
 const selected=state.answers[q.id]||'';const graded=!!state.graded[q.id];
 const displayNum=mode==='all'||mode==='wrong'?`C${q.chapter}-${q.number}`:q.number;
 card.innerHTML=`<div class="q-head"><span class="q-num">${displayNum}</span><strong>${esc(q.section)}</strong><span class="q-status"></span></div><div class="qtext">${esc(q.question)}</div><div class="options"></div><div class="explanation"><div class="answer-line">正确答案：${esc(correctLabel(q))}</div>${q.note?`<div class="note">核对说明：${esc(q.note)}</div>`:''}</div>`;
 const opts=card.querySelector('.options');
 q.options.forEach(o=>{const label=document.createElement('label');label.className='option'+(selected===o.key?' selected':'');label.dataset.key=o.key;label.innerHTML=`<input type="radio" name="${q.id}" value="${o.key}" ${selected===o.key?'checked':''} ${graded?'disabled':''}><span class="option-key">${o.key}</span><span class="option-text">${esc(o.text)}</span>`;label.querySelector('input').onchange=()=>{state.answers[q.id]=o.key;delete state.graded[q.id];saveState();card.querySelectorAll('.option').forEach(x=>x.classList.toggle('selected',x.dataset.key===o.key));card.classList.remove('graded','correct-card','wrong-card','unanswered-card');card.querySelector('.q-status').textContent='';updateProgress()};opts.appendChild(label)});
 if(graded)applyGradeStyles(card,q);return card;
}
function applyGradeStyles(card,q){
 const selected=state.answers[q.id]||'';const correct=q.accepted.includes(selected);card.classList.add('graded');
 const status=card.querySelector('.q-status');
 if(!selected){card.classList.add('unanswered-card');status.textContent='未作答';status.className='q-status warn'}
 else if(correct){card.classList.add('correct-card');status.textContent='回答正确';status.className='q-status good'}
 else{card.classList.add('wrong-card');status.textContent='回答错误';status.className='q-status bad'}
 card.querySelectorAll('.option').forEach(el=>{const k=el.dataset.key;el.classList.toggle('correct-option',q.accepted.includes(k));el.classList.toggle('wrong-option',!!selected&&selected===k&&!q.accepted.includes(k));const inp=el.querySelector('input');inp.disabled=true});
}
function updateProgress(){const qs=getViewQuestions();const answered=qs.filter(q=>state.answers[q.id]).length;const pct=qs.length?Math.round(answered/qs.length*100):0;document.getElementById('progressText').textContent=`已作答 ${answered} / ${qs.length}`;document.getElementById('progressPercent').textContent=`${pct}%`;document.getElementById('progressBar').style.width=`${pct}%`}
function submitView(){
 const qs=getViewQuestions();if(!qs.length)return;const unanswered=qs.filter(q=>!state.answers[q.id]).length;if(unanswered&&!confirm(`还有 ${unanswered} 道题未作答，仍然交卷吗？`))return;
 let correct=0,wrong=0,blank=0;const wrongSet=new Set(state.wrongIds||[]);
 qs.forEach(q=>{state.graded[q.id]=true;const a=state.answers[q.id];if(!a){blank++;wrongSet.add(q.id)}else if(q.accepted.includes(a)){correct++;wrongSet.delete(q.id)}else{wrong++;wrongSet.add(q.id)}});state.wrongIds=[...wrongSet];saveState();
 qs.forEach(q=>{const card=document.getElementById(q.id);if(card)applyGradeStyles(card,q)});
 const total=qs.length,pct=Math.round(correct/total*100);const banner=document.getElementById('resultBanner');banner.innerHTML=`<div class="score-line"><span class="score-big">${correct} / ${total}</span><strong>得分率 ${pct}%</strong></div><div class="stat-pills"><span class="pill good">正确 ${correct}</span><span class="pill bad">错误 ${wrong}</span><span class="pill warn">未作答 ${blank}</span></div>`;banner.classList.add('show');banner.scrollIntoView({behavior:'smooth',block:'center'});
}
function resetView(){const qs=getViewQuestions();if(!qs.length)return;if(!confirm(`确定清空当前显示的 ${qs.length} 道题答案和判定结果吗？`))return;const ids=new Set(qs.map(q=>q.id));qs.forEach(q=>{delete state.answers[q.id];delete state.graded[q.id]});if(mode!=='wrong')state.wrongIds=(state.wrongIds||[]).filter(id=>!ids.has(id));saveState();render()}

document.getElementById('submitBtn').onclick=submitView;document.getElementById('resetBtn').onclick=resetView;document.getElementById('prevBtn').onclick=()=>{if(currentChapter>1){currentChapter--;render()}};document.getElementById('nextBtn').onclick=()=>{if(currentChapter<8){currentChapter++;render()}};
initNav();render();

})();
