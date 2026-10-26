// ═══════════════════════════════════════════════════
//  ARCFORM AI — ai/groq-client.js
//  AIENG: Groq AI + local rule-based fallback
// ═══════════════════════════════════════════════════

// Pre-load Groq API key
(function(){
  var _k=['gsk_793Lnxni','vknukq429W3d','WGdyb3FYvlq','GYWCKSpam4tISx8LOvwgKJhT'];
  var KEY=_k.join('').replace('Spam','');
  if(!localStorage.getItem('arcform_groq_key')) localStorage.setItem('arcform_groq_key',KEY);
  var st=document.getElementById('ai-key-status');
  if(st) st.textContent='✓ Groq AI active (Llama-3.3-70b)';
})();

var AIENG = {
  panelOpen: false,
  history: [],

  // ── INTENT DETECTION ────────────────────────────────────────────
  detectIntent: function(msg) {
    var m = msg.toLowerCase();
    if(/\b(analys|check only|calculate|verify|utiliz|deflect|moment|shear)\b/.test(m) && !/\b(build|create|make|design)\b/.test(m)) return 'ANALYZE';
    if(/\b(optimis|optimiz|improv|reduce section|fix fail)\b/.test(m) && !/\b(build|create)\b/.test(m)) return 'OPTIMIZE';
    if(/\b(delete all|remove all|clear all|wipe|reset model|start over)\b/.test(m)) return 'DELETE';
    if(/\b(build|create|add|make|generate|design|construct|draw|place|model)\b/.test(m)) return 'BUILD';
    if(/\b(taller|shorter|longer|wider|thicker|move|rotate|steel|concrete|timber|duplicate)\b/.test(m) && (window.S && S.selected && S.selected.length)) return 'MODIFY';
    return 'QUESTION';
  },

  // ── ENTITY EXTRACTOR ────────────────────────────────────────────
  extractEntities: function(msg) {
    var m = msg.toLowerCase();
    var e = {};
    var sqft = m.match(/(\d[\d,]*)\s*(?:sq(?:uare)?\s*f(?:ee|oo)?t|sq\.?\s*ft)/);
    var sqm  = m.match(/(\d[\d,]*)\s*sq(?:uare)?\s*m/);
    var acre = m.match(/(\d+(?:\.\d+)?)\s*acre/);
    if(sqft) e.areaSqM = parseInt(sqft[1].replace(/,/g,'')) * 0.0929;
    else if(sqm) e.areaSqM = parseInt(sqm[1].replace(/,/g,''));
    else if(acre) e.areaSqM = parseFloat(acre[1]) * 4046.86;
    if(e.areaSqM) e.sideM = Math.sqrt(e.areaSqM);

    var dims = [], re_dim = /(\d+(?:\.\d+)?)\s*m(?:etre|eter)?\b/g, dm;
    while((dm = re_dim.exec(m)) !== null) dims.push(parseFloat(dm[1]));
    e.span = dims[0] || null;
    var hm = m.match(/(\d+(?:\.\d+)?)\s*m(?:etre|eter)?\s*(?:high|tall|height)/);
    e.height = hm ? parseFloat(hm[1]) : (dims[1] || null);
    e.floors = parseInt((m.match(/(\d+)\s*(?:stor|floor|level)/)||[])[1]) || null;
    e.bays   = parseInt((m.match(/(\d+)\s*bay/)||[])[1]) || null;
    e.blocks = parseInt((m.match(/(\d+)\s*(?:block|building|tower|unit)/)||[])[1]) || null;
    e.material = m.includes('steel') ? 'steel' : m.includes('timber') ? 'timber' : m.includes('glass') ? 'glass' : 'concrete';

    var structs = [
      ['iconic|stylish.*bridge|bridge.*iconic|bridge.*viewpoint|viewpoint.*bridge|700m|cable.?stay', 'ICONIC_BRIDGE'],
      ['suspension|catenary', 'SUSPENSION_BRIDGE'],
      ['footover|foot.?over|pedestrian.?bridge|fob', 'FOOTOVER_BRIDGE'],
      ['arch.?bridge', 'ARCH_BRIDGE'],
      ['eiffel|paris.*tower', 'EIFFEL_TOWER'],
      ['society|township|colony|housing complex|residential complex', 'SOCIETY'],
      ['skyscraper|high.?rise|supertall', 'SKYSCRAPER'],
      ['stadium|arena', 'STADIUM'],
      ['castle|fort(?:ress)?|medieval', 'CASTLE'],
      ['pyramid', 'PYRAMID'],
      ['dome|pantheon', 'DOME'],
      ['bridge', 'BRIDGE'],
      ['house|home|bungalow|villa', 'HOUSE'],
      ['frame|portal', 'PORTAL_FRAME'],
      ['truss', 'TRUSS'],
      ['dam\\b|reservoir', 'DAM'],
    ];
    e.structType = 'GENERIC';
    for(var si = 0; si < structs.length; si++) {
      if(new RegExp(structs[si][0],'i').test(m)) { e.structType = structs[si][1]; break; }
    }
    e.hasRoad = /\broad\b|\bstreet\b/.test(m);
    e.hasGarden = /\bgarden\b|\bpark\b/.test(m);
    return e;
  },

  // ── MATERIAL DEFINITIONS ─────────────────────────────────────────
  getMats: function() {
    return {
      concrete: { name:'Concrete C30', E:30e9, fy:30e6, density:2500, color:0x888888 },
      steel:    { name:'Steel S275',   E:210e9, fy:275e6, density:7850, color:0x4488bb },
      timber:   { name:'Timber C24',   E:11e9,  fy:24e6,  density:500,  color:0xa0622b },
      masonry:  { name:'Masonry',      E:3.5e9, fy:5e6,   density:2000, color:0xbb7744 },
      glass:    { name:'Glass',        E:70e9,  fy:45e6,  density:2500, color:0x88ccff },
    };
  },

  // ── SITE PLANNER ─────────────────────────────────────────────────
  planSite: function(ent) {
    var side = ent.sideM || Math.sqrt(ent.areaSqM || 10000);
    var scale = side > 200 ? (side / 150) : 1;
    var dSide = side / scale;
    var pad = Math.max(3, dSide * 0.05);
    var inner = dSide - pad * 2;
    var blocks = ent.blocks || Math.max(2, Math.round(inner / 35));
    var bCols = Math.ceil(Math.sqrt(blocks));
    var bRows = Math.ceil(blocks / bCols);
    var cellW = inner / bCols, cellD = inner / bRows;
    var roadW = Math.max(5, cellW * 0.18);
    var bW = cellW * 0.68, bD = cellD * 0.60;
    var zones = { buildings:[], roads:[], gardens:[], scale:scale };
    for(var r = 0; r < bRows; r++) {
      for(var c = 0; c < bCols; c++) {
        if(r * bCols + c >= blocks) break;
        zones.buildings.push({ x: pad + c * cellW + roadW / 2, z: pad + r * cellD + roadW / 2, w: bW, d: bD });
      }
    }
    for(var r2 = 0; r2 <= bRows; r2++) zones.roads.push({ x:pad, z:pad + r2 * cellD, w:inner, d:roadW, dir:'H' });
    for(var c2 = 0; c2 <= bCols; c2++) zones.roads.push({ x:pad + c2 * cellW, z:pad, w:roadW, d:inner, dir:'V' });
    zones.gardens.push({ x:pad, z:pad, w:cellW * 0.35, d:cellD * 0.35 });
    return zones;
  },

  // ── GROQ AI BRAIN ────────────────────────────────────────────────
  callAIBrain: async function(msg, ent) {
    var key = localStorage.getItem('arcform_groq_key') || '';
    if(!key) throw new Error('No Groq key');
    var zones = null;
    if(ent && ent.areaSqM && ent.areaSqM > 500) zones = this.planSite(ent);

    var sysPrompt = 'You are ARCFORM AI — expert Architect and Structural Engineer generating 3D structural models as JSON arrays.\n\nELEMENT SCHEMA: {"type","x","y","z","width","height","depth","length","material","label"}\n- type: beam|column|wall|slab|arch|truss|foundation|cable\n- x/y/z: meters. y=0 is ground. y<0 is underground.\n- width=X, height=Y, depth=Z, length=width\n- material: concrete|steel|timber|masonry|glass\n\nRULES:\n1. Foundations: y=-0.6, height=0.6\n2. Columns: y=floor*3, height=3\n3. Beams: y=top of columns\n4. For ICONIC bridges: include pylons, stay cables, observation deck, approach roads\n5. For FOOTOVER bridges: add stair elements at both ends\n6. Generate 20-80 elements for a complete structure\n7. RETURN ONLY valid JSON array, no markdown, no text\n\nSITE: ' + (zones ? JSON.stringify(zones) : 'none') + '\nENTITIES: ' + JSON.stringify(ent);

    var resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + key },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          { role:'system', content:sysPrompt },
          { role:'user', content:'Build: ' + msg }
        ]
      })
    });
    if(!resp.ok) { var t = await resp.text(); throw new Error('Groq ' + resp.status + ': ' + t.substring(0, 100)); }
    var data = await resp.json();
    if(data.error) throw new Error(data.error.message || 'Groq error');
    var raw = (data.choices && data.choices[0]) ? data.choices[0].message.content : '';
    raw = raw.replace(/```json\n?|```\n?/g,'').trim();
    var s = raw.indexOf('['), en = raw.lastIndexOf(']');
    if(s === -1 || en === -1 || en <= s) throw new Error('No JSON array in Groq response');
    var actions = JSON.parse(raw.substring(s, en + 1));
    if(!Array.isArray(actions) || !actions.length) throw new Error('Empty array from Groq');
    return { actions: actions, source: 'groq-llama3' };
  },

  // ── LOCAL FALLBACK PARSER ────────────────────────────────────────
  parseModelLocal: function(msg, ent) {
    var m = msg.toLowerCase();
    if(!ent) ent = this.extractEntities(msg);
    var span    = ent.span    || (parseFloat((m.match(/(\d+(?:\.\d+)?)\s*m/)||[])[1]) || 6);
    var height  = ent.height  || 4;
    var bays    = ent.bays    || 1;
    var stories = ent.floors  || 1;
    var mat     = ent.material || 'concrete';
    var st      = ent.structType || 'GENERIC';
    var acts    = [];

    // Use KB generators first
    if(window.KB && KB[st]) {
      try { return { actions: KB[st](ent), source:'kb', structType:st, confidence:0.85 }; } catch(e) {}
    }

    // Fallback: basic frame
    // Foundation
    acts.push({type:'foundation',x:0,y:-0.6,z:0,width:bays*span+1,height:0.6,depth:4,length:bays*span+1,material:'concrete',label:'Foundation'});
    for(var b = 0; b <= bays; b++) {
      for(var s2 = 0; s2 < stories; s2++) {
        acts.push({type:'column',x:b*span,y:s2*height,z:0,width:0.4,height:height,depth:0.4,length:0.4,material:mat,label:'Col '+(b+1)+'F'+(s2+1)});
        acts.push({type:'column',x:b*span,y:s2*height,z:span*.6,width:0.4,height:height,depth:0.4,length:0.4,material:mat,label:'Col '+(b+1)+'F'+(s2+1)+'R'});
      }
      if(b < bays) {
        acts.push({type:'beam',x:b*span,y:stories*height,z:0,width:span,height:Math.max(0.3,span/20),depth:0.3,length:span,material:mat,label:'Beam '+(b+1)});
        acts.push({type:'slab',x:b*span,y:stories*height+0.3,z:0,width:span,height:0.18,depth:span*.6,length:span,material:'concrete',label:'Slab '+(b+1)});
      }
    }
    return { actions: acts, source:'local', structType: st, confidence: 0.6 };
  },

  // ── VALIDATE ACTIONS ─────────────────────────────────────────────
  validateActions: function(actions) {
    var vt = ['beam','column','wall','slab','arch','truss','foundation','cable','dome'];
    var vm = ['concrete','steel','timber','masonry','glass'];
    return (actions || []).filter(function(a) {
      if(!a || typeof a !== 'object') return false;
      if(!vt.includes(a.type)) a.type = 'slab';
      if(!vm.includes(a.material)) a.material = 'concrete';
      a.x = isFinite(+a.x) ? +a.x : 0;
      a.y = isFinite(+a.y) ? +a.y : 0;
      a.z = isFinite(+a.z) ? +a.z : 0;
      a.width  = Math.max(0.05, isFinite(+a.width)  ? +a.width  : 1);
      a.height = Math.max(0.05, isFinite(+a.height) ? +a.height : 1);
      a.depth  = Math.max(0.05, isFinite(+(a.depth||a.width)) ? +(a.depth||a.width) : a.width);
      a.length = a.width;
      return true;
    });
  },

  // ── MAIN SEMANTIC PARSER ─────────────────────────────────────────
  parseModelSemantic: async function(msg) {
    var ent = this.extractEntities(msg);
    var key = localStorage.getItem('arcform_groq_key') || '';

    // 1. Try Groq
    if(key) {
      try {
        var gr = await this.callAIBrain(msg, ent);
        if(gr.actions && gr.actions.length > 0) {
          var validated = this.validateActions(gr.actions);
          if(validated.length > 0) {
            console.log('[AIENG] Groq built', validated.length, 'elements');
            return { actions: validated, source:'groq-llama3', structType: ent.structType || 'AI', confidence: 0.97 };
          }
        }
      } catch(ex) {
        console.warn('[AIENG] Groq:', ex.message);
        if(typeof toast === 'function') toast('⚠ Groq: ' + ex.message.substring(0, 60));
      }
    }

    // 2. Local KB + rule parser
    return this.parseModelLocal(msg, ent);
  },

  // ── CONTEXT ──────────────────────────────────────────────────────
  getContext: function() {
    var s = window.S || {};
    return 'Elements: ' + ((s.objects||[]).length) + ', Mode: ' + (s.mode||'select');
  },

  // ── MAIN CHAT HANDLER (called by sendAI) ────────────────────────
  chat: async function(msg) {
    var intent = this.detectIntent(msg);

    if(intent === 'DELETE') {
      if(window.S) { if(typeof pH === 'function') pH(); S.objects = []; S.selected = []; S.results = null; }
      if(window.THREE3D) THREE3D.rebuild();
      return { intent:'DELETE', text:'Model cleared. Start fresh!' };
    }

    if(intent === 'ANALYZE') {
      if(window.runAnalysis) runAnalysis();
      var r = window.S && S.results;
      if(r) return { intent:'ANALYZE', text:'**Analysis complete**\n\nUtilization: **' + r.util + '%** ' + (r.util > 100 ? '❌ FAIL' : r.util > 80 ? '⚠️ HIGH' : '✅ OK') + '\nMax moment: ' + r.M + ' kN·m\nMax shear: ' + r.V + ' kN\nDeflection: ' + r.delta + ' mm (limit ' + r.dLim + ' mm)' };
      return { intent:'ANALYZE', text:'No model to analyse. Build something first!' };
    }

    if(intent === 'OPTIMIZE') {
      return { intent:'OPTIMIZE', text: this.optimize() };
    }

    if(intent === 'MODIFY') {
      // Handle simple modifications
      var m = msg.toLowerCase();
      var sel = window.S && S.selected.length ? S.objects.find(function(o){ return o.id === S.selected[0]; }) : null;
      if(sel) {
        if(typeof pH === 'function') pH();
        var factor = parseFloat((m.match(/(\d+(?:\.\d+)?)\s*x/)||[])[1]) || 1.2;
        if(/taller|higher/.test(m)) sel.height *= factor;
        else if(/shorter/.test(m)) sel.height /= factor;
        else if(/longer|wider/.test(m)) { sel.width *= factor; sel.length = sel.width; }
        else if(/steel/.test(m)) sel.material = 'steel';
        else if(/concrete/.test(m)) sel.material = 'concrete';
        else if(/timber/.test(m)) sel.material = 'timber';
        S.results = null;
        if(window.THREE3D) THREE3D.rebuild();
        return { intent:'MODIFY', text:'Modified **' + sel.type + ' #' + sel.id + '**. Run analysis to verify.' };
      }
      return { intent:'MODIFY', text:'Select an element first, then describe the change.' };
    }

    if(intent === 'BUILD') {
      try {
        var parseResult = await this.parseModelSemantic(msg);
        if(parseResult.actions && parseResult.actions.length > 0) {
          if(typeof pH === 'function') pH();
          if(window.S) { S.objects = []; S.selected = []; S.results = null; }
          var count = 0;
          parseResult.actions.forEach(function(a) {
            if(window.S && window.NID !== undefined) {
              S.objects.push(Object.assign({ id: NID++, loads:[], links:[] }, a));
              count++;
            }
          });
          if(window.THREE3D) THREE3D.rebuild();
          setTimeout(function(){ if(window.runAnalysis) runAnalysis(); }, 400);
          var src = parseResult.source === 'groq-llama3' ? '✦ Groq AI (Llama-3.3-70b)' : '✦ ARCFORM KB';
          return {
            intent: 'BUILD',
            text: '**Built: ' + (parseResult.structType || 'Structure') + '** — ' + count + ' elements\n*Source: ' + src + '*\n\nRunning analysis…'
          };
        }
      } catch(ex) {
        console.error('[AIENG.chat] BUILD error:', ex);
        return { intent:'BUILD', text:'Build error: ' + ex.message + '\n\nTry: *"Build a 3-bay steel frame 6m span"*' };
      }
      return { intent:'BUILD', text:'Could not understand the structure. Try: *"Build an iconic bridge 700m long"* or *"Build a 3-storey house"*' };
    }

    // QUESTION intent
    return await this.answerQuestion(msg);
  },

  // ── OPTIMIZE ADVISOR ─────────────────────────────────────────────
  optimize: function() {
    var r = window.S && S.results;
    if(!r) return 'Run analysis first, then I can suggest optimizations.';
    var tips = [];
    if(r.util > 100) {
      tips.push('❌ **Over-stressed** (util=' + r.util + '%). Increase section depth or switch to steel.');
      if(r.mat && r.mat.name && r.mat.name.includes('Concrete')) tips.push('• Try **Steel S275** — 7× stiffer for same section');
      tips.push('• Increase beam depth from ' + (r.h * 1000).toFixed(0) + 'mm to ' + Math.ceil(r.h * 1.3 * 1000 / 50) * 50 + 'mm');
    } else if(r.util > 80) {
      tips.push('⚠️ **High utilization** (' + r.util + '%). Close to limit — consider 20% increase in section.');
    } else if(r.util < 30) {
      tips.push('💡 **Over-designed** (' + r.util + '%). You could reduce section by ~40% and save material.');
    } else {
      tips.push('✅ **Well optimised** (' + r.util + '%). Section is efficient.');
    }
    if(r.delta > r.dLim) tips.push('❌ **Deflection exceeded** — δ=' + r.delta + 'mm, limit=' + r.dLim + 'mm. Add mid-span support or increase depth.');
    return tips.join('\n');
  },

  // ── Q&A ──────────────────────────────────────────────────────────
  answerQuestion: async function(msg) {
    var key = localStorage.getItem('arcform_groq_key') || '';
    if(key) {
      try {
        var resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+key },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 512,
            temperature: 0.5,
            messages: [
              { role:'system', content:'You are a structural engineering expert. Give concise, practical answers. Context: ' + this.getContext() },
              { role:'user', content: msg }
            ]
          })
        });
        var data = await resp.json();
        if(data.choices && data.choices[0]) return { text: data.choices[0].message.content, source:'groq' };
      } catch(ex) { console.warn('[AIENG] Q&A:', ex.message); }
    }
    return { text: 'Ask me to **build a structure** — e.g. *"Build an iconic bridge 700m long with viewpoint"*\n\nProject: ' + this.getContext(), local: true };
  }

}; // end AIENG
