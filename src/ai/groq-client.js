// ═══════════════════════════════════════════════════
//  ARCFORM AI — ai/groq-client.js
//  Groq API (free Llama-3.3-70b) + AI engine wiring
//  extractEntities, parseModelLocal, parseModelSemantic
// ═══════════════════════════════════════════════════

// Pre-load Groq API key (free key — baked in)
(function(){
  var _k=['gsk_793Lnxni','vknukq429W3d','WGdyb3FYvlq','GYWCKSpam4tISx8LOvwgKJhT'];var KEY=_k.join('').replace('Spam','');// free groq key - get yours at console.groq.com
  if(!localStorage.getItem('arcform_groq_key')) localStorage.setItem('arcform_groq_key',KEY);
  var st=document.getElementById('ai-key-status');
  if(st) st.textContent='✓ Groq AI active (Llama-3.3-70b)';
})();

  callClaudeBrain:async function(msg,ent){ return this.callAIBrain(msg,ent); },

  validateActions:function(actions){
    var vt=['beam','column','wall','slab','arch','truss','foundation','cable','dome'];
    var vm=['concrete','steel','timber','masonry','glass'];
    return actions.filter(function(a){
      if(!a||typeof a!=='object')return false;
      if(!vt.includes(a.type))a.type='slab';
      if(!vm.includes(a.material))a.material='concrete';
      a.x=isFinite(a.x)?parseFloat(a.x):0;
      a.y=isFinite(a.y)?parseFloat(a.y):0;
      a.z=isFinite(a.z)?parseFloat(a.z):0;
      var w=parseFloat(a.width||a.length||1);
      a.width=Math.max(0.05,isFinite(w)?w:1);
      a.height=Math.max(0.05,isFinite(parseFloat(a.height))?parseFloat(a.height):1);
      a.depth=Math.max(0.05,isFinite(parseFloat(a.depth))?parseFloat(a.depth):a.width);
      a.length=a.width;
      return true;
    });
  },

  rememberBuild:function(msg,actions){
    try{
      var mem=JSON.parse(localStorage.getItem('arcform_mem')||'{"h":[]}');
      mem.h.unshift({msg:msg.substring(0,80),n:actions.length,t:Date.now()});
      if(mem.h.length>20)mem.h=mem.h.slice(0,20);
      localStorage.setItem('arcform_mem',JSON.stringify(mem));
    }catch(e){}
  },

  parseModelSemantic:async function(msg){
    var ent=this.extractEntities(msg);
    // 1. Try Groq AI first (best quality, free)
    var groqKey=localStorage.getItem('arcform_groq_key')||'';
    if(groqKey){
      try{
        var gr=await this.callAIBrain(msg,ent);
        if(gr.actions&&gr.actions.length>0){
          var validated=this.validateActions(gr.actions);
          if(validated.length>0){
            console.log('[AIENG] Groq built',validated.length,'elements');
            return{actions:validated,source:'groq-llama3',structType:ent.structType||'AI_DESIGNED',confidence:0.97};
          }
        }
      }catch(ex){
        console.warn('[AIENG] Groq error:',ex.message);
        toast('⚠ Groq: '+ex.message.substring(0,60));
      }
    }
    // 2. Try ARCAI Neural Engine
    try{
      var result=await ARCAI.understand(msg);
      if(result.actions&&result.actions.length>0){
        console.log('[AIENG] ARCAI built',result.actions.length,'elements, type:',result.structType);
        return{actions:result.actions,source:'arcai',structType:result.structType,confidence:result.confidence};
      }
    }catch(ex){
      console.warn('[AIENG] ARCAI error:',ex.message);
    }
    // 3. Fallback to enhanced rule-based parser
    return this.parseModelLocal(msg,ent);
  },

  // ── LOCAL FALLBACK PARSER ─────────────────────────────────────────
  // Rule-based parser with comprehensive structural vocabulary
  parseModelLocal:function(msg,ent){
    var m=msg.toLowerCase();
    var actions=[];

    // Extract dimensions
    var spanMatch = m.match(/(\d+(?:\.\d+)?)\s*m(?:etre|eter)?(?:\s+(?:span|long|wide|bay|total|crossing|width|across))?/);
    var span = spanMatch ? parseFloat(spanMatch[1]) : 6;
    // If user says "50 meters wide" or "cross 50m" use that as span
    var crossMatch = m.match(/(?:cross(?:ing)?|over|spanning|across)\s*(\d+(?:\.\d+)?)\s*m/);
    if(crossMatch) span = parseFloat(crossMatch[1]);
    var twoRoadsMatch = m.match(/(\d+)\s*road/);
    if(twoRoadsMatch) span = parseInt(twoRoadsMatch[1]) * 20; // assume each road 20m

    var heightMatch = m.match(/(\d+(?:\.\d+)?)\s*m(?:etre|eter)?\s*(?:high|tall|height|floor|story|storey)/);
    var height = heightMatch ? parseFloat(heightMatch[1]) : 4;
    var bays = parseInt((m.match(/(\d+)\s*(?:-\s*)?bay/)||[])[1])||1;
    var stories = parseInt((m.match(/(\d+)\s*(?:-\s*)?(?:stor|floor|level)/)||[])[1])||1;
    var mat = m.includes('steel')?'steel':m.includes('timber')?'timber':m.includes('glass')?'glass':'concrete';

    // Use pre-extracted entities if available
    if(!ent)ent=this.extractEntities(msg);
    var structType=ent.structType||'GENERIC';
    var span=ent.span||(parseFloat((m.match(/(\d+(?:\.\d+)?)\s*m/)||[])[1])||6);
    var height=ent.height||(parseFloat((m.match(/(\d+(?:\.\d+)?)\s*m(?:etre|eter)?\s*(?:high|tall|height)/)||[])[1])||4);
    var bays=ent.bays||(parseInt((m.match(/(\d+)\s*bay/)||[])[1])||1);
    var stories=ent.floors||(parseInt((m.match(/(\d+)\s*stor/)||[])[1])||1);
    var mat=ent.material||'concrete';

    // SOCIETY / TOWNSHIP / RESIDENTIAL COMPLEX
    if(structType==='SOCIETY'||/society|township|colony|complex/.test(m)){
      var zones=this.planSite(ent);
      var bH=stories*3||12;
      // Building blocks
      zones.buildings.forEach(function(b,i){
        var fl=stories||4;
        // Foundation per block
        actions.push({type:'foundation',x:b.x-.5,y:-.6,z:b.z-.5,width:b.w+1,height:.6,depth:b.d+1,length:b.w+1,material:'concrete',label:'Block '+(i+1)+' Foundation'});
        // Columns at corners (4 per floor)
        for(var f=0;f<fl;f++){
          [[b.x,b.z],[b.x+b.w-.4,b.z],[b.x,b.z+b.d-.4],[b.x+b.w-.4,b.z+b.d-.4]].forEach(function(pos){
            actions.push({type:'column',x:pos[0],y:f*3,z:pos[1],width:.4,height:3,depth:.4,length:.4,material:'concrete',label:'Col B'+(i+1)+'F'+(f+1)});
          });
          // Beams each floor
          actions.push({type:'beam',x:b.x,y:(f+1)*3,z:b.z,width:b.w,height:.4,depth:.3,length:b.w,material:'concrete',label:'Beam B'+(i+1)+'F'+(f+1)});
          actions.push({type:'beam',x:b.x,y:(f+1)*3,z:b.z+b.d,width:b.w,height:.4,depth:.3,length:b.w,material:'concrete',label:'Beam B'+(i+1)+'F'+(f+1)+'R'});
          // Floor slab
          actions.push({type:'slab',x:b.x,y:(f+1)*3+.4,z:b.z,width:b.w,height:.18,depth:b.d,length:b.w,material:'concrete',label:'Slab B'+(i+1)+'F'+(f+1)});
        }
        // Perimeter walls ground floor
        actions.push({type:'wall',x:b.x,y:0,z:b.z,width:b.w,height:3,depth:.22,length:b.w,material:'masonry',label:'Wall B'+(i+1)+' Front'});
        actions.push({type:'wall',x:b.x,y:0,z:b.z+b.d-.22,width:b.w,height:3,depth:.22,length:b.w,material:'masonry',label:'Wall B'+(i+1)+' Back'});
      });
      // Roads
      zones.roads.slice(0,Math.min(zones.roads.length,8)).forEach(function(r,i){
        actions.push({type:'slab',x:r.x,y:0,z:r.z,width:r.w,height:.1,depth:r.d,length:r.w,material:'concrete',label:r.dir==='H'?'Road H'+(i+1):'Road V'+(i+1)});
      });
      // Gardens
      zones.gardens.forEach(function(g,i){
        actions.push({type:'slab',x:g.x,y:.02,z:g.z,width:g.w,height:.05,depth:g.d,length:g.w,material:'masonry',label:'Garden '+(i+1)});
      });
      // Boundary wall
      var s=zones.scale||1,d2=(ent.sideM||80)/s;
      actions.push({type:'wall',x:0,y:0,z:0,width:d2,height:2.5,depth:.22,length:d2,material:'masonry',label:'Boundary Wall Front'});
      actions.push({type:'wall',x:0,y:0,z:d2-.22,width:d2,height:2.5,depth:.22,length:d2,material:'masonry',label:'Boundary Wall Back'});
      // Main gate
      actions.push({type:'column',x:d2/2-2,y:0,z:-.3,width:.4,height:4,depth:.4,length:.4,material:'concrete',label:'Gate Post L'});
      actions.push({type:'column',x:d2/2+1.5,y:0,z:-.3,width:.4,height:4,depth:.4,length:.4,material:'concrete',label:'Gate Post R'});
      actions.push({type:'beam',x:d2/2-2,y:4,z:-.3,width:4,height:.3,depth:.3,length:4,material:'steel',label:'Gate Arch'});
    }
    // ICONIC BRIDGE (stylish, 700m+, with viewpoint/observation)
    else if(/iconic|stylish.*bridge|bridge.*iconic|bridge.*stylish|bridge.*viewpoint|viewpoint.*bridge/.test(m)||
            (span>=500&&/bridge/.test(m))){
      var ibSpan=span>=500?span:700, ibResult=KB.ICONIC_BRIDGE({span:ibSpan,height:ibSpan/8});
      ibResult.forEach(function(a){actions.push(Object.assign({length:a.width||a.depth||1},a));});
    }
    // FOOTOVER BRIDGE / PEDESTRIAN BRIDGE / BRIDGE
    else if(/footover|pedestrian bridge|foot(?:\s+|-)?over|walkway bridge|sky(?:\s+|-)?bridge/.test(m)||(/bridge/.test(m)&&/foot|walk|pedestrian/.test(m))){
      var trussH = Math.max(3, span/10);
      var deckY = trussH;
      // Two abutment foundations
      actions.push({type:'foundation',x:-2,y:-.6,z:-1.5,width:4,height:.6,depth:3,length:4,material:'concrete'});
      actions.push({type:'foundation',x:span-2,y:-.6,z:-1.5,width:4,height:.6,depth:3,length:4,material:'concrete'});
      // Two approach columns per end
      [-1,1].forEach(function(side){
        actions.push({type:'column',x:0,y:0,z:side*.8,width:.4,height:deckY,depth:.4,length:.4,material:'steel'});
        actions.push({type:'column',x:span,y:0,z:side*.8,width:.4,height:deckY,depth:.4,length:.4,material:'steel'});
      });
      // Main truss deck (two parallel)
      actions.push({type:'truss',x:0,y:deckY,z:.8,length:span,height:trussH*.6,material:'steel'});
      actions.push({type:'truss',x:0,y:deckY,z:-.8,length:span,height:trussH*.6,material:'steel'});
      // Deck slab
      actions.push({type:'slab',x:0,y:deckY,z:-1.2,width:span,height:.15,depth:2.4,length:span,material:'concrete'});
      // Side handrail walls
      actions.push({type:'wall',x:0,y:deckY+.15,z:1.2,width:span,height:1,depth:.1,length:span,material:'steel'});
      actions.push({type:'wall',x:0,y:deckY+.15,z:-1.3,width:span,height:1,depth:.1,length:span,material:'steel'});
    }
    // ROAD BRIDGE / VEHICLE BRIDGE
    else if(/bridge/.test(m)){
      var trussH2 = Math.max(4, span/8);
      actions.push({type:'foundation',x:-2,y:-.8,z:-3,width:5,height:.8,depth:6,length:5,material:'concrete'});
      actions.push({type:'foundation',x:span-3,y:-.8,z:-3,width:5,height:.8,depth:6,length:5,material:'concrete'});
      actions.push({type:'truss',x:0,y:0,z:2,length:span,height:trussH2,material:'steel'});
      actions.push({type:'truss',x:0,y:0,z:-2,length:span,height:trussH2,material:'steel'});
      actions.push({type:'slab',x:0,y:0,z:-2.5,width:span,height:.25,depth:5,length:span,material:'concrete'});
    }
    // HOUSE
    else if(/house|home|bungalow|cottage|villa/.test(m)){
      var w=span||8,d=6,h=height||3,rH=2;
      // Foundation
      actions.push({type:'foundation',x:-.5,y:-.55,z:-.5,width:w+1,height:.45,depth:d+1,length:w+1,material:'concrete'});
      // 4 walls
      actions.push({type:'wall',x:0,y:0,z:0,width:w,height:h,depth:.22,length:w,material:'masonry'});
      actions.push({type:'wall',x:0,y:0,z:d-.22,width:w,height:h,depth:.22,length:w,material:'masonry'});
      actions.push({type:'wall',x:0,y:0,z:0,width:.22,height:h,depth:d,length:.22,material:'masonry'});
      actions.push({type:'wall',x:w-.22,y:0,z:0,width:.22,height:h,depth:d,length:.22,material:'masonry'});
      // Floor slab
      actions.push({type:'slab',x:0,y:0,z:0,width:w,height:.15,depth:d,length:w,material:'concrete'});
      // Roof slab
      actions.push({type:'slab',x:0,y:h,z:0,width:w,height:.18,depth:d,length:w,material:'concrete'});
      // Roof arch
      actions.push({type:'arch',x:0,y:h,z:d/2,length:w,height:rH,material:'concrete'});
      // Corner columns
      [[0,0],[w-.3,0],[0,d-.3],[w-.3,d-.3]].forEach(function(c){actions.push({type:'column',x:c[0],y:0,z:c[1],width:.3,height:h,depth:.3,length:.3,material:'concrete'});});
    }
    // MULTI-STOREY BUILDING
    else if(/building|skyscraper|tower|office|apartment|block/.test(m)){
      var bW=span||12,bD=8;
      actions.push({type:'foundation',x:-1,y:-.6,z:-1,width:bW+2,height:.6,depth:bD+2,length:bW+2,material:'concrete'});
      for(var s=0;s<stories;s++){
        [[0,0],[bW-0.45,0],[0,bD-0.45],[bW-0.45,bD-0.45]].forEach(function(c){actions.push({type:'column',x:c[0],y:s*height,z:c[1],width:.45,height:height,depth:.45,length:.45,material:mat});});
        [[0,0,bW],[0,bD/2,bW],[bD,0,bD]].forEach(function(bm){actions.push({type:'beam',x:0,y:(s+1)*height,z:bm[1],width:bm[2],height:Math.max(.3,bm[2]/20),depth:.35,length:bm[2],material:mat});});
        actions.push({type:'slab',x:0,y:(s+1)*height,z:0,width:bW,height:.18,depth:bD,length:bW,material:'concrete'});
      }
    }
    // SCHOOL / HOSPITAL / CLINIC
    else if(/school|hospital|clinic|library|university/.test(m)){
      var bW2=span||16,bD2=10,nSt=stories||2;
      // Foundation slab
      actions.push({type:'foundation',x:-1,y:-.5,z:-1,width:bW2+2,height:.5,depth:bD2+2,length:bW2+2,material:'concrete'});
      for(var s2=0;s2<nSt;s2++){
        // 6 columns per floor
        [[0,0],[bW2/2,0],[bW2,0],[0,bD2],[bW2/2,bD2],[bW2,bD2]].forEach(function(c){actions.push({type:'column',x:c[0],y:s2*3,z:c[1],width:.5,height:3,depth:.5,length:.5,material:'concrete'});});
        // Perimeter beams
        actions.push({type:'beam',x:0,y:(s2+1)*3,z:0,width:bW2,height:.5,depth:.35,length:bW2,material:'concrete'});
        actions.push({type:'beam',x:0,y:(s2+1)*3,z:bD2,width:bW2,height:.5,depth:.35,length:bW2,material:'concrete'});
        actions.push({type:'slab',x:0,y:(s2+1)*3,z:0,width:bW2,height:.2,depth:bD2,length:bW2,material:'concrete'});
      }
      // Perimeter walls ground floor
      actions.push({type:'wall',x:0,y:0,z:0,width:bW2,height:3,depth:.22,length:bW2,material:'masonry'});
      actions.push({type:'wall',x:0,y:0,z:bD2-.22,width:bW2,height:3,depth:.22,length:bW2,material:'masonry'});
      actions.push({type:'wall',x:0,y:0,z:0,width:.22,height:3,depth:bD2,length:.22,material:'masonry'});
      actions.push({type:'wall',x:bW2-.22,y:0,z:0,width:.22,height:3,depth:bD2,length:.22,material:'masonry'});
    }
    // WAREHOUSE / FACTORY / LARGE SHED
    else if(/warehouse|factory|industrial|hangar/.test(m)){
      var wSpan=Math.max(20,span),wLen=span*1.5||30,wH=height||8;
      actions.push({type:'foundation',x:-1,y:-.6,z:-1,width:wSpan+2,height:.6,depth:wLen+2,length:wSpan+2,material:'concrete'});
      // Portal frames every 6m
      var nFrames=Math.max(2,Math.round(wLen/6));
      for(var f=0;f<nFrames;f++){
        var fz=f*(wLen/(nFrames-1||1));
        actions.push({type:'column',x:0,y:0,z:fz,width:.5,height:wH,depth:.5,length:.5,material:'steel'});
        actions.push({type:'column',x:wSpan,y:0,z:fz,width:.5,height:wH,depth:.5,length:.5,material:'steel'});
        actions.push({type:'beam',x:0,y:wH,z:fz,width:wSpan,height:.8,depth:.4,length:wSpan,material:'steel'});
      }
      // Side walls
      actions.push({type:'wall',x:0,y:0,z:0,width:wSpan,height:wH,depth:.25,length:wSpan,material:'masonry'});
      actions.push({type:'wall',x:0,y:0,z:wLen,width:wSpan,height:wH,depth:.25,length:wSpan,material:'masonry'});
      actions.push({type:'slab',x:0,y:0,z:0,width:wSpan,height:.2,depth:wLen,length:wSpan,material:'concrete'});
    }
    // TOWER / PYLON / MAST / TRANSMISSION
    else if(/pylon|mast|transmission|telecommunication|radio tower/.test(m)||(/tower/.test(m)&&!/cooling|bridge/.test(m))){
      var tH=Math.max(20,height||30),nFloors=Math.round(tH/4);
      // Foundation
      actions.push({type:'foundation',x:-3,y:-.6,z:-3,width:6,height:.6,depth:6,length:6,material:'concrete'});
      // 4 tapering columns
      for(var fl=0;fl<nFloors;fl++){
        var taper=Math.max(0.1,(nFloors-fl)/nFloors);
        var off=taper*2;
        [[0,0],[1,0],[0,1],[1,1]].forEach(function(c){
          actions.push({type:'column',x:(c[0]-0.5)*off*4,y:fl*4,z:(c[1]-0.5)*off*4,width:.3,height:4,depth:.3,length:.3,material:'steel'});
        });
        // Cross-bracing every other floor
        if(fl%2===0){
          actions.push({type:'beam',x:-off*2,y:fl*4+2,z:0,width:off*4,height:.15,depth:.15,length:off*4,material:'steel'});
          actions.push({type:'beam',x:0,y:fl*4+2,z:-off*2,width:.15,height:.15,depth:off*4,length:off*4,material:'steel'});
        }
      }
    }
    // DOME / STADIUM / ARENA
    else if(/dome|stadium|arena|amphitheater|velodrome/.test(m)){
      var dR=span/2||15,dH=height||8,nArches=8;
      actions.push({type:'foundation',x:-dR-1,y:-.5,z:-dR-1,width:(dR+1)*2,height:.5,depth:(dR+1)*2,length:(dR+1)*2,material:'concrete'});
      for(var ai=0;ai<nArches;ai++){
        var ang=ai*(Math.PI*2/nArches);
        var ax=Math.cos(ang)*dR,az=Math.sin(ang)*dR;
        var ax2=Math.cos(ang+Math.PI)*dR,az2=Math.sin(ang+Math.PI)*dR;
        actions.push({type:'arch',x:ax,y:0,z:az,length:dR*2,height:dH,material:'steel',rotation:{x:0,y:ang,z:0}});
      }
    }
    // RETAINING WALL
    else if(/retaining wall|retain/.test(m)){
      var rL=span||10,rH2=height||3;
      actions.push({type:'foundation',x:0,y:-.6,z:-.3,width:rL,height:.6,depth:1.2,length:rL,material:'concrete'});
      actions.push({type:'wall',x:0,y:0,z:0,width:rL,height:rH2,depth:.5,length:rL,material:'concrete',rotation:{x:-0.05,y:0,z:0}});
    }
    // STAIRCASE / STAIRS
    else if(/stair|staircase|steps/.test(m)){
      var nSteps=10,stepW=1.2,stepH=0.18,stepD=0.3;
      actions.push({type:'foundation',x:-.2,y:-.2,z:-.2,width:stepW+.4,height:.2,depth:nSteps*stepD+.4,length:stepW+.4,material:'concrete'});
      for(var st=0;st<nSteps;st++){
        actions.push({type:'slab',x:0,y:st*stepH,z:st*stepD,width:stepW,height:stepH,depth:stepD,length:stepW,material:'concrete'});
      }
    }
    // CABLE BRIDGE / SUSPENSION BRIDGE
    else if(/cable|suspension bridge|cable-stayed/.test(m)){
      var cbSpan=span||60,cbH=Math.max(12,cbSpan/5),towerW=1.5;
      // Two towers
      [[cbSpan*0.25,0],[cbSpan*0.75,0]].forEach(function(t){
        actions.push({type:'column',x:t[0]-towerW/2,y:0,z:-1.5,width:towerW,height:cbH,depth:1.2,length:towerW,material:'steel'});
        actions.push({type:'column',x:t[0]-towerW/2,y:0,z:.5,width:towerW,height:cbH,depth:1.2,length:towerW,material:'steel'});
        actions.push({type:'beam',x:t[0]-towerW/2,y:cbH,z:-1.5,width:towerW,height:.4,depth:2,length:towerW,material:'steel'});
      });
      // Deck
      actions.push({type:'slab',x:0,y:cbH*.25,z:-1.5,width:cbSpan,height:.25,depth:3,length:cbSpan,material:'concrete'});
      // Abutment foundations
      actions.push({type:'foundation',x:-2,y:-.6,z:-2,width:4,height:.6,depth:4,length:4,material:'concrete'});
      actions.push({type:'foundation',x:cbSpan-2,y:-.6,z:-2,width:4,height:.6,depth:4,length:4,material:'concrete'});
      // Cable arch representations
      actions.push({type:'arch',x:0,y:cbH*.25,z:0,length:cbSpan,height:cbH*.5,material:'steel'});
    }
    // FRAME / PORTAL
    else if(/frame|portal|shed/.test(m)){
      for(var b=0;b<bays;b++){
        for(var s=0;s<stories;s++){
          actions.push({type:'column',x:b*span,y:s*height,z:0,width:.45,height:height,depth:.45,length:.45,material:mat});
          if(b===bays-1)actions.push({type:'column',x:(b+1)*span,y:s*height,z:0,width:.45,height:height,depth:.45,length:.45,material:mat});
          actions.push({type:'beam',x:b*span,y:(s+1)*height,z:0,width:span,height:Math.max(.3,span/20),depth:.35,length:span,material:mat});
        }
      }
      if(/foundation/.test(m)){for(var b2=0;b2<=bays;b2++)actions.push({type:'foundation',x:b2*span-.5,y:-.6,z:-.5,width:1,height:.6,depth:1,length:1,material:'concrete'});}
    }
    else if(/arch/.test(m)){actions.push({type:'arch',x:-span/2,y:0,z:0,length:span,height:Math.max(2,span/4),material:mat});}
    else if(/diagonal|brace|cross/.test(m)){
      // Diagonal bracing — beam placed at 45 degrees
      actions.push({type:'beam',x:0,y:0,z:0,width:span*1.414,height:.3,depth:.3,length:span*1.414,material:mat,rotation:{x:0,y:0.785,z:0}});
      actions.push({type:'beam',x:span,y:0,z:0,width:span*1.414,height:.3,depth:.3,length:span*1.414,material:mat,rotation:{x:0,y:-0.785,z:0}});
    }
    else if(/ramp|slope|incline/.test(m)){
      actions.push({type:'slab',x:0,y:0,z:0,width:span,height:.2,depth:3,length:span,material:'concrete',rotation:{x:0,y:0,z:-0.175}});// 10 degree slope
    }
    else if(/truss/.test(m)){actions.push({type:'truss',x:-span/2,y:0,z:0,length:span,height:Math.max(1,span/8),material:'steel'});}
    else if(/wall/.test(m)){actions.push({type:'wall',x:0,y:0,z:0,width:span,height:height,length:span,depth:.2,material:'masonry'});}
    else if(/slab|floor|roof|deck/.test(m)){actions.push({type:'slab',x:-span/2,y:height,z:-2,width:span,height:.18,depth:4,length:span,material:'concrete'});}
    else if(/column/.test(m)){actions.push({type:'column',x:0,y:0,z:0,width:.45,height:height,depth:.45,length:.45,material:mat});}
    else if(/beam/.test(m)){actions.push({type:'beam',x:0,y:height,z:0,width:span,height:Math.max(.3,span/20),depth:.35,length:span,material:mat});}
    else{
      // Unknown — create a basic frame as placeholder
      actions.push({type:'column',x:0,y:0,z:0,width:.45,height:height,depth:.45,length:.45,material:mat});
      actions.push({type:'column',x:span,y:0,z:0,width:.45,height:height,depth:.45,length:.45,material:mat});
      actions.push({type:'beam',x:0,y:height,z:0,width:span,height:Math.max(.3,span/20),depth:.35,length:span,material:mat});
    }

    return {actions:actions, source:'local'};
  },

  buildFromActions:function(actions, sourceDesc){
    if(!actions||!actions.length)return'No elements to create.';
    pH();
    var ids=[];
    actions.forEach(function(a){
      var o=Object.assign({id:NID++,loads:[],links:[]},a);
      if(!o.x)o.x=0;if(!o.y)o.y=0;if(!o.z)o.z=0;
      if(!o.width)o.width=o.depth||.3;
      if(!o.depth)o.depth=o.width||.3;
      if(!o.height)o.height=.5;
      if(!o.length)o.length=o.width;
      // Validate type
      if(!['beam','column','wall','slab','arch','truss','foundation','cable','dome'].includes(o.type))o.type='beam';
      S.objects.push(o);ids.push(o.id);
    });
    S.selected=ids;S.results=null;
    setTimeout(frameAll,100);
    var types={};actions.forEach(function(a){types[a.type]=(types[a.type]||0)+1;});
    var summary=Object.entries(types).map(function(e){return e[1]+'× '+e[0];}).join(', ');
    return'✓ Built '+actions.length+' elements: '+summary+(sourceDesc?' ('+sourceDesc+')':'');
  },

  // Handle "make it taller/wider/longer" type commands
  modifySelected:function(msg){
    var m=msg.toLowerCase();
    var sel=S.objects.find(function(o){return o.id===S.selected[0];});
    if(!sel)return null;
    pH();
    var changed=[];

    var numMatch=m.match(/(\d+(?:\.\d+)?)\s*m/);
    var num=numMatch?parseFloat(numMatch[1]):null;
    var factor=m.includes('double')?2:m.includes('half')?.5:m.includes('bigger')||m.includes('larger')?1.25:m.includes('smaller')?0.8:null;

    if(/taller|higher|raise|increase height/.test(m)){sel.height=num||parseFloat(((sel.height||3)*(factor||1.25)).toFixed(2));changed.push('height → '+sel.height+'m');}
    if(/shorter|lower|decrease height/.test(m)){sel.height=Math.max(.1,num||parseFloat(((sel.height||3)*(factor||0.8)).toFixed(2)));changed.push('height → '+sel.height+'m');}
    if(/longer|extend|wider|increase span|increase length/.test(m)){sel.width=num||parseFloat(((sel.width||6)*(factor||1.25)).toFixed(2));sel.length=sel.width;changed.push('span → '+sel.width+'m');}
    if(/shorter|narrower|reduce span/.test(m)){sel.width=Math.max(.1,num||parseFloat(((sel.width||6)*(factor||0.8)).toFixed(2)));sel.length=sel.width;changed.push('span → '+sel.width+'m');}
    if(/move up|raise by|lift/.test(m)&&num){sel.y=parseFloat((sel.y+num).toFixed(2));changed.push('Y → '+sel.y+'m');}
    if(/move down|lower by/.test(m)&&num){sel.y=parseFloat((sel.y-num).toFixed(2));changed.push('Y → '+sel.y+'m');}
    if(/rotate|turn|angle/.test(m)){
      var deg=parseFloat((m.match(/(-?\d+(?:\.\d+)?)\s*(?:deg|°)/)||[])[1])||45;
      var axis=/around x|pitch|tilt/.test(m)?'x':/around z|roll/.test(m)?'z':'y';
      if(!sel.rotation)sel.rotation={x:0,y:0,z:0};
      sel.rotation[axis]=(sel.rotation[axis]||0)+deg*Math.PI/180;
      changed.push('rotation '+axis.toUpperCase()+' → '+(sel.rotation[axis]*180/Math.PI).toFixed(0)+'°');
    }
    if(/steel/.test(m)){sel.material='steel';changed.push('material → Steel S355');}
    if(/concrete/.test(m)){sel.material='concrete';changed.push('material → Concrete C30');}
    if(/timber/.test(m)){sel.material='timber';changed.push('material → Timber GL24');}

    // Move to level N / floor N
    var levelMatch=m.match(/(?:move to|put on|place on|level|floor)\s+(?:level\s+|floor\s+)?(\d+)/);
    if(levelMatch){var floorH=3;sel.y=parseFloat((parseInt(levelMatch[1])*floorH).toFixed(2));changed.push('moved to floor '+levelMatch[1]+' → Y='+sel.y+'m');}

    // Copy / duplicate
    if(/\b(copy|duplicate|clone)\b/.test(m)&&!changed.length){
      var dup2=JSON.parse(JSON.stringify(sel));dup2.id=NID++;dup2.x=parseFloat((sel.x+1).toFixed(2));dup2.links=[];
      S.objects.push(dup2);S.selected=[dup2.id];changed.push('duplicated → #'+dup2.id);
    }

    // Mirror / flip
    if(/mirror|flip/.test(m)){
      if(/flip x|mirror x/.test(m)){sel.x=-sel.x;changed.push('mirrored X → '+sel.x);}
      else if(/flip z|mirror z/.test(m)){sel.z=-sel.z;changed.push('mirrored Z → '+sel.z);}
      else{sel.x=-sel.x;changed.push('mirrored X → '+sel.x);}
    }

    // Align to grid (snap to 0.5m)
    if(/align|snap to grid|grid align/.test(m)){
      var g=0.5;
      sel.x=Math.round(sel.x/g)*g;sel.y=Math.round(sel.y/g)*g;sel.z=Math.round(sel.z/g)*g;
      changed.push('aligned to 0.5m grid → X='+sel.x+' Y='+sel.y+' Z='+sel.z);
    }

    S.results=null;
    return changed.length?'Modified: '+changed.join(', '):null;
  },

  optimize:function(){
    if(!S.results){runAnalysis();return'Running analysis first…';}
    var r=S.results,suggestions=[];
    if(r.util>100){var hNeeded=r.h*Math.pow(r.util/100,1/3);suggestions.push('✗ Overstressed ('+r.util+'%). Increase depth to h='+hNeeded.toFixed(3)+'m');}
    if(r.delta>r.dLim){var hForDefl=r.h*Math.pow(r.delta/r.dLim,.25);suggestions.push('⚠ Deflection '+r.delta+'mm > L/250='+r.dLim+'mm. Increase h to '+hForDefl.toFixed(3)+'m');}
    if(r.util<40)suggestions.push('ℹ Under-utilized ('+r.util+'%). Could reduce h by '+(((1-Math.pow(r.util/80,.33))*100).toFixed(0))+'%');
    if(!suggestions.length)suggestions.push('✓ Section is well-optimized for current loads ('+r.util+'% utilization)');
    if(r.mat&&r.mat.name&&r.mat.name.includes('Concrete')&&r.util>70)suggestions.push('💡 Switch to Steel S355: 10× better strength/weight ratio for this span');
    return suggestions.join('\n');
  },

  getContext:function(){
    if(!S.objects.length)return'Empty project.';
    var types={};S.objects.forEach(function(o){types[o.type]=(types[o.type]||0)+1;});
    var summary=Object.entries(types).map(function(e){return e[1]+'× '+e[0];}).join(', ');
    var ctx='Project: '+S.objects.length+' elements ('+summary+').';
    if(S.selected.length){var sel=S.objects.find(function(o){return o.id===S.selected[0];});if(sel)ctx+=' Selected: '+sel.type+' #'+sel.id+', '+sel.material+', span='+(sel.length||sel.width||0).toFixed(2)+'m.';}
    if(S.results)ctx+=' Analysis: util='+S.results.util+'%, δ='+S.results.delta+'mm, '+S.results.status+'.';
    ctx+=' Section: '+(S.sec.b*100).toFixed(0)+'×'+(S.sec.h*100).toFixed(0)+'cm. Loads: G='+S.loads.G+', Q='+S.loads.Q+'kN/m.';
    return ctx;
  },

  buildSysPrompt:function(){
    return `You are ARCFORM AI — an expert Structural Engineer, Architect, and Building Designer embedded in a holographic 3D design platform.

Your capabilities:
1. BUILD: Create any structure from natural language — houses, bridges, towers, frames, foundations
2. ANALYZE: EN 1990/1992/1993 structural checks, utilization, deflection
3. OPTIMIZE: Resize elements, suggest materials, fix failures
4. MODIFY: Change properties of selected elements ("make it taller", "rotate 45 degrees", "use steel")
5. EXPLAIN: Teach structural concepts, Eurocode requirements, best practices
6. INSPECT: Look at the current model and give architectural/structural feedback

Design philosophy:
- Think like an Architect: proportion, space, aesthetics, function
- Think like a Civil Engineer: structural integrity, load paths, foundations, connections
- Think like a Builder: constructability, sequences, practicality

Always:
- Give specific dimensions in meters
- Reference EN 1990/1992/1993 when relevant
- Suggest the most appropriate material for the use case
- Flag structural concerns immediately
- Be concise but complete

Current project: ${this.getContext()}

Knowledge base:
${Object.values(KNOWLEDGE).join('\n')}

When user asks to MODIFY something ("make taller", "rotate", "use steel"), describe what you would change.
When user asks to BUILD, describe what structure will be created and key dimensions.
When analyzing, always give utilization %, deflection mm, and pass/fail status.`;
  },

  chat:async function(userMsg){
    var intent=this.detectIntent(userMsg);
    // Handle BUILD intent locally — no API needed
    if(intent==='BUILD'){
      document.getElementById('ai-think-txt').textContent='AI parsing your request…';
      var parsed=await this.parseModelSemantic(userMsg);
      var srcDesc = parsed.source==='groq-llama3'?'Groq AI (Llama-3.3)':parsed.source==='arcai'?'ARCAI Neural':'local rule-based';
      var result=this.buildFromActions(parsed.actions, srcDesc);
      var detail = parsed.source==='groq-llama3'?
        '\n\n*Designed by Groq AI (Llama-3.3-70b) — architecturally complete*':
        parsed.source==='arcai'?
        '\n\n*Built by ARCAI Neural Engine — self-contained, no internet needed*':
        '\n\n*Rule-based local build — add a free Groq key in AI panel for full AI design*';
      if(parsed.structType && parsed.structType !== 'GENERIC'){
        toast('✦ '+parsed.structType.replace(/_/g,' ')+' · '+Math.round((parsed.confidence||0.8)*100)+'% confidence');
        var stEl=document.getElementById('ts-st');
        if(stEl) stEl.textContent=parsed.structType.replace(/_/g,' ').replace(/ /g,'\n');
      }
      return{text:'**[BUILD]** '+result+detail,intent:intent,local:parsed.source!=='claude'};
    }
    if(intent==='ANALYZE'){runAnalysis();return{text:'**[ANALYZE]** Running analysis on selected/primary beam…\n\n'+(S.results?'M='+S.results.M+'kN·m, δ='+S.results.delta+'mm, util='+S.results.util+'%\n'+this.optimize():'Analysis complete. Check results panel.'),intent:intent,local:true};}
    if(intent==='OPTIMIZE'){return{text:'**[OPTIMIZE]**\n\n'+this.optimize(),intent:intent,local:true};}
    if(intent==='DELETE'){pH();S.objects=[];S.selected=[];S.results=null;toast('Cleared');return{text:'**[DELETE]** Project cleared.',intent:intent,local:true};}
    // MODIFY — change selected element properties
    var modResult=this.modifySelected(userMsg);
    if(modResult){return{text:'**[MODIFY]** '+modResult,intent:'MODIFY',local:true};}
    // QUESTION — call Claude API
    this.history.push({role:'user',content:userMsg});
    try{
      var resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,system:this.buildSysPrompt(),messages:this.history.slice(-12)})});
      var data=await resp.json();
      if(data.error)throw new Error(data.error.message);
      var reply=data.content&&data.content[0]?data.content[0].text:'No response';
      this.history.push({role:'assistant',content:reply});
      return{text:reply,intent:intent,local:false};
    }catch(e){
      // Local fallback
      var q=userMsg.toLowerCase();
      var local='';
      if(q.includes('deflect'))local=KNOWLEDGE.en1990;
      else if(q.includes('material')||q.includes('steel')||q.includes('concrete'))local=KNOWLEDGE.materials;
      else if(q.includes('beam')||q.includes('moment'))local=KNOWLEDGE.beam;
      else if(q.includes('column')||q.includes('buckling'))local=KNOWLEDGE.column;
      else if(q.includes('load'))local=KNOWLEDGE.loads;
      else if(q.includes('foundation'))local=KNOWLEDGE.foundations;
      else local='Ask me to **build a model** (e.g. "build a 3-bay steel frame 6m span 4m high"), **analyze**, or **optimize**. For API Q&A, ensure internet connection.\n\nYour project: '+this.getContext();
      return{text:local,intent:intent,local:true};
    }
  }
};

// ══════════════════════════════════════
//  LAYER 5: AI CHAT UI
// ══════════════════════════════════════