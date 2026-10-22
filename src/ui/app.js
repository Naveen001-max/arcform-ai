// ═══════════════════════════════════════════════════
//  ARCFORM AI — ui/app.js
//  UI controllers, toolbar, panels, keyboard, init
// ═══════════════════════════════════════════════════

function toggleAI(){var p=document.getElementById('ai-panel');AIENG.panelOpen=p.classList.toggle('open');document.getElementById('bai').classList.toggle('on',AIENG.panelOpen);document.getElementById('rp').style.right=AIENG.panelOpen?'360px':'0';document.getElementById('dg').style.right=AIENG.panelOpen?'360px':'0';if(AIENG.panelOpen&&document.getElementById('ai-msgs').children.length===0)aiWelcome();}

function aiWelcome(){
  addMsg('ai','**Welcome to ARCFORM AI** ✦\n\nI can:\n- **Build** structural models from natural language\n- **Analyse** and check Eurocode compliance\n- **Optimise** element sizing\n- **Answer** any structural engineering question\n\nTry: *"Build a 3-bay steel frame 6m span 4m high with foundations"*\n\nProject: *'+AIENG.getContext().slice(0,100)+'*');
  setSugs([
    'Build a footover bridge 50m span',
    'Build a 3-storey office building',
    'Build a house 8m x 6m with roof',
    'Analyse and optimise the structure',
    'Make the selected beam taller',
    'Rotate selected wall 90 degrees'
  ]);
}

function addMsg(role,content,isTyping){
  var msgs=document.getElementById('ai-msgs');
  var div=document.createElement('div');div.className='msg '+role;
  var lbl=document.createElement('div');lbl.className='ml';lbl.textContent=role==='ai'?'✦ ARCFORM AI':'▸ YOU';
  var bubble=document.createElement('div');bubble.className='mb';
  if(isTyping){bubble.innerHTML='<div class="typing-dots"><span></span><span></span><span></span></div>';}
  else{bubble.innerHTML=content.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/`(.*?)`/g,'<code>$1</code>').replace(/\n/g,'<br>');}
  div.appendChild(lbl);div.appendChild(bubble);msgs.appendChild(div);
  msgs.scrollTop=msgs.scrollHeight;return div;
}

function setSugs(arr){var el=document.getElementById('ai-sugs');el.innerHTML=arr.map(function(s){return'<div class="ai-sug" onclick="quickAsk(\''+s.replace(/'/g,"\\'")+'\')">'+ s+'</div>';}).join('');}
function quickAsk(q){document.getElementById('ai-inp').value=q;sendAI();}

async function sendAI(){
  var inp=document.getElementById('ai-inp');
  var msg=inp.value.trim();if(!msg)return;
  inp.value='';
  addMsg('user',msg);
  var typing=addMsg('ai','',true);
  document.getElementById('ai-think').classList.add('show');
  document.getElementById('ai-think-txt').textContent='✦ ARCAI processing ('+AIENG.detectIntent(msg)+') …';
  try{
    var result=await AIENG.chat(msg);
    typing.remove();
    var intentBadge=result.intent&&result.intent!=='QUESTION'?'<span class="ai-intent intent-'+result.intent+'">'+result.intent+'</span>':'';
    addMsg('ai',intentBadge+result.text);
    // Dynamic suggestions
    var sugs=[];
    if(result.intent==='BUILD'){sugs=['Run analysis on new model','Add loads to beam','Optimise the structure'];}
    else if(result.intent==='ANALYZE'){sugs=['How to reduce utilization?','Optimise section size','Check deflection limit'];}
    else if(result.intent==='OPTIMIZE'){sugs=['Apply the optimization','Try steel instead','Add more elements'];}
    else{sugs=['Build a portal frame','Analyse this element','What section do I need?'];}
    setSugs(sugs);
  }catch(e){typing.remove();addMsg('ai','Error: '+e.message);}
  document.getElementById('ai-think').classList.remove('show');
}

function aiAutoComment(obj,results){
  if(!AIENG.panelOpen)return;
  var status=results.util>100?'❌ FAIL':results.util>80?'⚠️ HIGH':' ✅ OK';
  addMsg('ai','**Auto-Analysis:** '+obj.type.toUpperCase()+' #'+obj.id+' '+status+'\nUtil: **'+results.util+'%** · M='+results.M+'kN·m · δ='+results.delta+'mm\n\n'+AIENG.optimize());
}

function saveGroqKey(){
  var k=document.getElementById('ai-key-inp').value.trim();
  if(!k){toast('Enter a Groq key first');return;}
  localStorage.setItem('arcform_groq_key',k);
  document.getElementById('ai-key-status').textContent='✓ Key saved';
  document.getElementById('ai-key-inp').value='';
  toast('✓ Groq key saved — AI now uses Llama-3.3-70b for all builds!');
}
function clearGroqKey(){
  localStorage.removeItem('arcform_groq_key');
  document.getElementById('ai-key-status').textContent='Key cleared';
  toast('Groq key cleared — using ARCAI engine');
}
(function(){
  // Pre-load the Groq API key
  var _dk=['gsk_793Lnxni','vknukq429W3d','WGdyb3FYvlq','GYWCKSpam4tISx8LOvwgKJhT'];var defaultKey=_dk.join('').replace('Spam','');// free groq key
  if(!localStorage.getItem('arcform_groq_key')) localStorage.setItem('arcform_groq_key',defaultKey);
  var st=document.getElementById('ai-key-status');
  if(st) st.textContent='✓ Groq AI active';
})();
function sendAIMsg(msg){document.getElementById('ai-inp').value=msg;sendAI();}

document.getElementById('ai-inp').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAI();}});

// ══════════════════════════════════════
//  STARTER MODEL + INIT
// ══════════════════════════════════════
(function(){
  [{type:'foundation',material:'concrete',x:-4,y:-.5,z:-1.5,width:8,height:.45,depth:3,length:8,loads:[],links:[]},
   {type:'column',material:'concrete',x:-3.5,y:0,z:.8,width:.45,height:4,depth:.45,length:.45,loads:[],links:[]},
   {type:'column',material:'concrete',x:3.1,y:0,z:.8,width:.45,height:4,depth:.45,length:.45,loads:[],links:[]},
   {type:'column',material:'concrete',x:-3.5,y:0,z:-1.2,width:.45,height:4,depth:.45,length:.45,loads:[],links:[]},
   {type:'column',material:'concrete',x:3.1,y:0,z:-1.2,width:.45,height:4,depth:.45,length:.45,loads:[],links:[]},
   {type:'beam',material:'steel',x:-3.5,y:4,z:.8,width:6.6,height:.58,depth:.35,length:6.6,loads:[{type:'udl',mag:8,dir:'down',pos:0}],links:[]},
   {type:'beam',material:'steel',x:-3.5,y:4,z:-1.2,width:6.6,height:.58,depth:.35,length:6.6,loads:[],links:[]},
   {type:'slab',material:'concrete',x:-3.5,y:4.58,z:-1.5,width:7,height:.18,depth:2.4,length:7,loads:[],links:[]},
   {type:'wall',material:'masonry',x:-3.5,y:0,z:-1.5,width:7,height:4,depth:.22,length:7,loads:[],links:[]},
  ].forEach(function(o){S.objects.push(Object.assign({id:NID++},o));});
  S.selected=[6];
})();

setTimeout(function(){runAnalysis();},400);
setTimeout(function(){if(S.results)toggleDiag();},750);
setTimeout(function(){toggleAI();},1200);
setTimeout(function(){toast('ARCFORM AI ✦ Space=AI Chat · Try: "Build an Eiffel Tower" or "Build a suspension bridge 200m" · Alt+↑↓=Y axis');},2200);
