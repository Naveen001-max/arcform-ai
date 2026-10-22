// ════════════════════════════════════════════
//  ARCFORM AI — core/utils.js
// ════════════════════════════════════════════

//  LAYER 1: DATA — core/state.js
// ══════════════════════════════════════

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

