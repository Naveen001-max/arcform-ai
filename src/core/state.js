// ═══════════════════════════════════════════════════
//  ARCFORM AI — core/state.js
//  Global app state, history, save/load
// ═══════════════════════════════════════════════════

//  LAYER 1: DATA — core/state.js
// ══════════════════════════════════════
var S = {
  objects:[], selected:[], history:[], redo:[],
  cam:{ x:0, y:0, rotX:-0.38, rotY:0.48, zoom:1 },
  sec:{ b:0.35, h:0.65 },
  loads:{ G:5, Q:3, gG:1.35, gQ:1.5 },
  results:null, diagOpen:false, snap:0.5, mtype:null,
};
var NID = 1;
function pH(){ S.history.push(JSON.stringify(S.objects)); S.redo=[]; if(S.history.length>100)S.history.shift(); }
function undoState(){ if(!S.history.length){toast('Nothing to undo');return;} S.redo.push(JSON.stringify(S.objects)); S.objects=JSON.parse(S.history.pop()); S.selected=[]; S.results=null; if(typeof THREE3D!=='undefined')THREE3D.rebuild(); toast('Undo'); }
function saveProject(){ localStorage.setItem('af_v2',JSON.stringify({objects:S.objects,sec:S.sec,loads:S.loads,cam:S.cam})); toast('Saved ✓'); }
function loadProject(){ var d=localStorage.getItem('af_v2'); if(!d){toast('No save');return;} pH(); var p=JSON.parse(d); S.objects=p.objects||[]; S.sec=p.sec||S.sec; S.loads=p.loads||S.loads; if(p.cam)Object.assign(S.cam,p.cam); NID=(S.objects.reduce(function(m,o){return Math.max(m,o.id||0);},0))+1; S.selected=[]; S.results=null; if(typeof THREE3D!=='undefined')THREE3D.rebuild(); toast('Loaded'); }
function snapV(v){ return S.snap ? Math.round(v/S.snap)*S.snap : v; }

// ══════════════════════════════════════
//  LAYER 2: RENDER — render/projection.js
// ══════════════════════════════════════
var CV = document.getElementById('c3d');
var CH = document.getElementById('chand'), HX = CH.getContext('2d');
function rsz(){
  CH.width=innerWidth; CH.height=innerHeight;
  if(THREE3D && THREE3D.renderer){
    THREE3D.renderer.setSize(innerWidth,innerHeight);
    THREE3D.camera.aspect=innerWidth/innerHeight;
    THREE3D.camera.updateProjectionMatrix();
  }
}
window.addEventListener('resize',rsz);
CH.width=innerWidth; CH.height=innerHeight;

// Legacy proj() — kept for frameAll, drawAxes, drawMinimap and any other code that calls it
function proj(wx,wy,wz){
  var cam=S.cam, rY=cam.rotY, rX=cam.rotX, zm=cam.zoom, cx=cam.x, cy=cam.y;
  var cY=Math.cos(rY),sY=Math.sin(rY),cX=Math.cos(rX),sX=Math.sin(rX);
  var rx=wx*cY+wz*sY, rz=-wx*sY+wz*cY;
  var px=rx, py=wy*cX-rz*sX, pz=wy*sX+rz*cX;
  var sc=80*zm;
  return { sx:innerWidth/2+cx+px*sc, sy:innerHeight/2+cy-50-py*sc, depth:pz };
}

// ══════════════════════════════════════
//  LAYER 2: RENDER — render/three.js
// ══════════════════════════════════════
function utilRGB(u){ if(u<0)return{r:42,g:90,b:115}; if(u<50)return{r:0,g:175,b:130}; if(u<80)return{r:220,g:170,b:0}; if(u<100)return{r:220,g:90,b:0}; return{r:220,g:40,b:60}; }
function fc(m,br,a){ a=a===undefined?.9:a; return 'rgba('+~~(m.r*br)+','+~~(m.g*br)+','+~~(m.b*br)+','+a+')'; }
