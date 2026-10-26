// ═══════════════════════════════════════════════════
//  ARCFORM AI — renderer/three-engine.js
//  Three.js scene, PBR materials, geometry builders
// ═══════════════════════════════════════════════════

// ── MATERIAL DEFINITIONS (global, used by analysis) ──────────────────
var MATS = {
  concrete: { name:'Concrete C30', E:30e9,  fy:30e6,  density:2500, color:0x888888 },
  steel:    { name:'Steel S275',   E:210e9, fy:275e6, density:7850, color:0x4488bb },
  timber:   { name:'Timber C24',   E:11e9,  fy:24e6,  density:500,  color:0xa0622b },
  masonry:  { name:'Masonry',      E:3.5e9, fy:5e6,   density:2000, color:0xbb7744 },
  glass:    { name:'Glass',        E:70e9,  fy:45e6,  density:2500, color:0x88ccff },
};

// ── ELEMENT MODAL DEFINITIONS (global) ───────────────────────────────
var DEFS = {
  beam:       { t:'Add Beam',       f:[['width','Span (m)','6'],['height','Depth (m)','0.4'],['depth','Width (m)','0.3'],['material','Material','s'],['x','X pos','0'],['y','Y pos','3'],['z','Z pos','0']] },
  column:     { t:'Add Column',     f:[['height','Height (m)','3'],['width','Width (m)','0.4'],['depth','Depth (m)','0.4'],['material','Material','s'],['x','X pos','0'],['y','Y pos','0'],['z','Z pos','0']] },
  wall:       { t:'Add Wall',       f:[['width','Length (m)','6'],['height','Height (m)','3'],['depth','Thickness (m)','0.22'],['material','Material','s'],['x','X pos','0'],['y','Y pos','0'],['z','Z pos','0']] },
  slab:       { t:'Add Slab',       f:[['width','Width (m)','6'],['depth','Depth (m)','6'],['height','Thickness (m)','0.18'],['material','Material','s'],['x','X pos','0'],['y','Y pos','3'],['z','Z pos','0']] },
  foundation: { t:'Add Foundation', f:[['width','Width (m)','3'],['depth','Depth (m)','3'],['height','Thickness (m)','0.6'],['material','Material','s'],['x','X pos','0'],['y','Y pos','-0.6'],['z','Z pos','0']] },
  arch:       { t:'Add Arch',       f:[['width','Span (m)','10'],['height','Rise (m)','4'],['depth','Width (m)','0.5'],['material','Material','s'],['x','X pos','0'],['y','Y pos','0'],['z','Z pos','0']] },
};

var THREE3D = (function(){
  var self = {};

  // ── Renderer ──────────────────────────────────────────────────────
  var renderer = new THREE.WebGLRenderer({ canvas: CV, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x060e14, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  self.renderer = renderer;

  // ── Scene ─────────────────────────────────────────────────────────
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060e14);
  self.scene = scene;

  // ── Camera ────────────────────────────────────────────────────────
  var camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 5000);
  camera.position.set(20, 15, 20);
  camera.lookAt(0, 0, 0);
  self.camera = camera;

  // ── Lights ────────────────────────────────────────────────────────
  var ambLight = new THREE.AmbientLight(0x223344, 0.7);
  scene.add(ambLight);

  var sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
  sunLight.position.set(30, 60, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 300;
  sunLight.shadow.camera.left = -80;
  sunLight.shadow.camera.right = 80;
  sunLight.shadow.camera.top = 80;
  sunLight.shadow.camera.bottom = -80;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  var fillLight = new THREE.DirectionalLight(0x00d4ff, 0.18);
  fillLight.position.set(-20, 10, -15);
  scene.add(fillLight);

  // ── Ground & Grid ─────────────────────────────────────────────────
  var groundGeo = new THREE.PlaneGeometry(200, 200);
  var groundMat = new THREE.MeshStandardMaterial({ color: 0x04090e, roughness: 0.95, metalness: 0.05 });
  var ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  var grid1 = new THREE.GridHelper(200, 200, 0x00d4ff, 0x00d4ff);
  grid1.material.opacity = 0.06; grid1.material.transparent = true;
  scene.add(grid1);
  var grid5 = new THREE.GridHelper(200, 40, 0x00d4ff, 0x00d4ff);
  grid5.material.opacity = 0.18; grid5.material.transparent = true;
  scene.add(grid5);
  // Extra fine grid for holographic floor feel
  var grid10 = new THREE.GridHelper(200, 200, 0x00ffcc, 0x00ffcc);
  grid10.material.opacity = 0.04; grid10.material.transparent = true;
  scene.add(grid10);

  // Axis arrows
  var axGeo = new THREE.CylinderGeometry(0.04, 0.04, 3, 8);
  [[1,0,0,0xff3333],[0,1,0,0x33ff80],[0,0,1,0x4488ff]].forEach(function(a){
    var mat = new THREE.MeshBasicMaterial({ color: a[3] });
    var mesh = new THREE.Mesh(axGeo, mat);
    mesh.position.set(a[0]*1.5, a[1]*1.5+0.02, a[2]*1.5);
    if(a[0]) mesh.rotation.z = Math.PI/2;
    if(a[2]) mesh.rotation.x = Math.PI/2;
    scene.add(mesh);
  });

  // ── Holographic particle field ──────────────────────────────────────
  var particleCount = 800;
  var particleGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(particleCount * 3);
  for(var pi = 0; pi < particleCount; pi++){
    positions[pi*3]   = (Math.random() - 0.5) * 180;
    positions[pi*3+1] = Math.random() * 80;
    positions[pi*3+2] = (Math.random() - 0.5) * 180;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var particleMat = new THREE.PointsMaterial({ color: 0x00d4ff, size: 0.12, transparent: true, opacity: 0.35 });
  var particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);
  
  // Animate particles slowly drifting upward
  self.animateParticles = function(t){
    var pos = particleGeo.attributes.position.array;
    for(var pi = 0; pi < particleCount; pi++){
      pos[pi*3+1] += 0.008;
      if(pos[pi*3+1] > 80) pos[pi*3+1] = 0;
    }
    particleGeo.attributes.position.needsUpdate = true;
    particles.rotation.y = t * 0.00008;
  };

  // ── PBR Materials ─────────────────────────────────────────────────
  var MAT3 = {
    concrete: new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.9, metalness: 0.0 }),
    steel:    new THREE.MeshStandardMaterial({ color: 0x6a9aaa, roughness: 0.25, metalness: 0.9, emissive: 0x004466, emissiveIntensity: 0.08 }),
    timber:   new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.85, metalness: 0.0 }),
    masonry:  new THREE.MeshStandardMaterial({ color: 0xb08060, roughness: 0.95, metalness: 0.0 }),
    glass:    new THREE.MeshStandardMaterial({ color: 0xa0d0ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.4 }),
  };
  var MAT_SEL = new THREE.MeshStandardMaterial({ color: 0x0a2a4a, roughness: 0.2, metalness: 0.6, emissive: 0x00d4ff, emissiveIntensity: 0.8 });
  var MAT_WIRE = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.45 });
  var MAT_LOAD = new THREE.MeshBasicMaterial({ color: 0xffb340 });

  function getMat(o) {
    if(S.selected.includes(o.id)) return MAT_SEL;
    return MAT3[o.material] || MAT3.concrete;
  }

  // ── Mesh group that holds all structural elements ──────────────────
  var structGroup = new THREE.Group();
  scene.add(structGroup);

  // Maps object id → THREE.Group
  var meshMap = {};

  // ── Helper: create a box mesh centered at a given world position ───
  function makeBox(w,h,d, mat){
    var geo = new THREE.BoxGeometry(w, h, d);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // ── Build an arch from a TubeGeometry ─────────────────────────────
  function buildArch(o, mat){
    var L = o.length || 10, rise = o.height || 4;
    var pts = [];
    var N = 30;
    for(var i=0; i<=N; i++){
      var t = i/N;
      pts.push(new THREE.Vector3(
        o.x + t*L - L/2,
        o.y + 4*rise*t*(1-t),
        o.z
      ));
    }
    var curve = new THREE.CatmullRomCurve3(pts);
    var tubeGeo = new THREE.TubeGeometry(curve, 40, 0.18, 8, false);
    var tube = new THREE.Mesh(tubeGeo, mat);
    tube.castShadow = true;
    // Translate so that o.x,o.y,o.z is the start point
    tube.position.set(L/2, 0, 0);
    return tube;
  }

  // ── Build a Pratt truss from individual member boxes ──────────────
  function buildTruss(o, mat){
    var group = new THREE.Group();
    var L = o.length || 12, H = o.height || 2.5;
    var panels = Math.min(12, Math.ceil(L/2));
    var pL = L / panels;
    var cw = 0.18, ch = 0.18; // chord cross-section

    // Top chord
    var tc = makeBox(L, ch, cw, mat);
    tc.position.set(L/2, H, 0);
    group.add(tc);

    // Bottom chord
    var bc = makeBox(L, ch, cw, mat);
    bc.position.set(L/2, ch/2, 0);
    group.add(bc);

    for(var i=0; i<=panels; i++){
      var xp = i * pL;
      // Vertical member
      var vert = makeBox(cw, H, cw, mat);
      vert.position.set(xp, H/2, 0);
      group.add(vert);

      // Diagonal (Pratt: diagonals go from bottom panel point to top next panel point)
      if(i < panels){
        var dx = pL, dy = H;
        var dLen = Math.sqrt(dx*dx + dy*dy);
        var diag = makeBox(dLen, cw*0.85, cw*0.85, mat);
        var angle = Math.atan2(dy, dx);
        diag.rotation.z = angle;
        diag.position.set(xp + pL/2, H/2, 0);
        group.add(diag);
      }
    }
    return group;
  }

  // ── Build suspension cable with vertical hangers ──────────────────
  function buildCableHangers(o, mat){
    var group = new THREE.Group();
    var span = o.length || 100;
    var cableSag = o.height || span * 0.25; // catenary sag
    var hangerCount = Math.ceil(span / 4);
    
    // Main cable as catenary TubeGeometry
    var catPts = [];
    var N = 50;
    for(var i = 0; i <= N; i++){
      var t = i/N;
      var x = t * span;
      // Catenary: y = a*cosh(x/a) - a; approximate with parabola
      var y = 4 * cableSag * t * (1 - t);
      catPts.push(new THREE.Vector3(x, cableSag - y, 0));
    }
    var cableCurve = new THREE.CatmullRomCurve3(catPts);
    var cableGeo = new THREE.TubeGeometry(cableCurve, 60, 0.08, 6, false);
    var cableMesh = new THREE.Mesh(cableGeo, mat);
    cableMesh.castShadow = true;
    group.add(cableMesh);
    
    // Vertical hangers (thin cylinders from cable to deck level)
    var deckY = 0; // relative to group position
    for(var j = 1; j < hangerCount; j++){
      var ht = j / hangerCount;
      var hx = ht * span;
      var cableY = cableSag - 4 * cableSag * ht * (1 - ht);
      var hangerLen = cableY - deckY;
      if(hangerLen < 0.5) continue;
      var hangerGeo = new THREE.CylinderGeometry(0.03, 0.03, hangerLen, 4);
      var hanger = new THREE.Mesh(hangerGeo, mat);
      hanger.position.set(hx, deckY + hangerLen / 2, 0);
      group.add(hanger);
    }
    return group;
  }

  // ── Build a steel I-beam column from 3 boxes ──────────────────────
  function buildSteelColumn(o, mat){
    var group = new THREE.Group();
    var H = o.height || 3, bw = o.width || 0.4;
    var fw = bw, ft = bw*0.15, wt = bw*0.08, wh = H - ft*2;
    // Web
    var web = makeBox(wt, wh, bw, mat);
    web.position.set(0, H/2, 0);
    group.add(web);
    // Top flange
    var tf = makeBox(fw, ft, bw, mat);
    tf.position.set(0, H - ft/2, 0);
    group.add(tf);
    // Bottom flange
    var bf = makeBox(fw, ft, bw, mat);
    bf.position.set(0, ft/2, 0);
    group.add(bf);
    return group;
  }

  // ── Build a dome as sphere cap ────────────────────────────────────
  function buildDomeCap(o, mat){
    var group = new THREE.Group();
    var r = (o.width || o.span || 20) / 2;
    var h = o.height || r * 0.6;
    // Use SphereGeometry with partial phi range for a cap
    var domeGeo = new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.acos(1 - h/r));
    var domeMesh = new THREE.Mesh(domeGeo, mat);
    domeMesh.castShadow = true;
    domeMesh.receiveShadow = true;
    group.add(domeMesh);
    // Wireframe ribs
    var ribMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.12 });
    var ribGeo = new THREE.SphereGeometry(r * 1.002, 16, 8, 0, Math.PI * 2, 0, Math.acos(1 - h/r));
    var ribMesh = new THREE.Mesh(ribGeo, ribMat);
    group.add(ribMesh);
    return group;
  }

  // ── Build masonry wall with wireframe mortar overlay ──────────────
  function buildMasonryWall(o, mat){
    var group = new THREE.Group();
    var w = o.width || 5, h = o.height || 3, d = o.depth || 0.2;
    var solidMesh = makeBox(w, h, d, mat);
    solidMesh.position.set(w/2, h/2, 0);
    group.add(solidMesh);
    // Mortar grid overlay
    var wfMat = new THREE.MeshBasicMaterial({ color: 0xd0a880, wireframe: true, transparent: true, opacity: 0.18 });
    var rows = Math.ceil(h/0.25);
    var cols = Math.ceil(w/0.5);
    var wfGeo = new THREE.BoxGeometry(w, h, d*1.02);
    var wfMesh = new THREE.Mesh(wfGeo, wfMat);
    wfMesh.position.set(w/2, h/2, 0);
    group.add(wfMesh);
    return group;
  }

  // ── Create selection wireframe overlay ────────────────────────────
  function addSelectionBox(group, w, h, d, ox, oy){
    var wfGeo = new THREE.BoxGeometry(w*1.01, h*1.01, d*1.01);
    var wfMesh = new THREE.Mesh(wfGeo, new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.6 }));
    wfMesh.position.set(ox || w/2, oy || h/2, 0);
    group.add(wfMesh);
  }

  // ── Load arrow helper ─────────────────────────────────────────────
  function addLoadArrow(group, x, y){
    var arrowGeo = new THREE.ConeGeometry(0.12, 0.4, 8);
    var arrow = new THREE.Mesh(arrowGeo, MAT_LOAD);
    arrow.position.set(x, y, 0);
    arrow.rotation.z = Math.PI; // point down
    group.add(arrow);
    var shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
    var shaft = new THREE.Mesh(shaftGeo, MAT_LOAD);
    shaft.position.set(x, y + 0.45, 0);
    group.add(shaft);
  }

  // ── Build a THREE.Group for one S.objects entry ───────────────────
  function buildMesh(o){
    var group = new THREE.Group();
    var mat = getMat(o);
    var sel = S.selected.includes(o.id);
    var w = o.width || 0.3, h = o.height || 0.5, d = o.depth || 0.3;

    if(o.type === 'arch'){
      var archMesh = buildArch(o, mat);
      group.add(archMesh);
      group.position.set(o.x, o.y, o.z);
    } else if(o.type === 'cable'){
      var cableGroup = buildCableHangers(o, mat);
      group.add(cableGroup);
      group.position.set(o.x, o.y, o.z);
    } else if(o.type === 'dome'){
      var domeMesh = buildDomeCap(o, mat);
      group.add(domeMesh);
      group.position.set(o.x, o.y, o.z);
    } else if(o.type === 'truss'){
      var trussMesh = buildTruss(o, mat);
      group.add(trussMesh);
      group.position.set(o.x, o.y, o.z);
    } else if(o.type === 'column' && o.material === 'steel'){
      var colMesh = buildSteelColumn(o, mat);
      group.add(colMesh);
      group.position.set(o.x + w/2, o.y, o.z + d/2);
      if(sel) addSelectionBox(group, w, h, d, 0, h/2);
    } else if(o.type === 'wall' && o.material === 'masonry'){
      var wallMesh = buildMasonryWall(o, mat);
      group.add(wallMesh);
      group.position.set(o.x, o.y, o.z + d/2);
      if(sel) addSelectionBox(group, w, h, d, w/2, h/2);
    } else {
      // Generic box: beam, column (concrete), wall, slab, foundation
      var bMesh = makeBox(w, h, d, mat);
      bMesh.position.set(w/2, h/2, 0);
      group.add(bMesh);
      if(sel) addSelectionBox(group, w, h, d);
      if(o.type === 'foundation'){
        bMesh.material = bMesh.material.clone ? bMesh.material.clone() : mat;
        if(bMesh.material.transparent === undefined) bMesh.material = mat.clone();
        bMesh.material.transparent = true;
        bMesh.material.opacity = 0.55;
      }
      group.position.set(o.x, o.y, o.z);
    }

    // Apply object rotation
    var rot = o.rotation || {x:0,y:0,z:0};
    group.rotation.set(rot.x||0, rot.y||0, rot.z||0);

    // Load arrows
    if(o.loads && o.loads.length){
      for(var i=0; i<o.loads.length; i++){
        addLoadArrow(group, w*(i+0.5)/o.loads.length, h + 0.6);
      }
    }

    group.userData.objId = o.id;
    return group;
  }

  // ── Full scene rebuild ─────────────────────────────────────────────
  self.rebuild = function(){
    // Remove old structural meshes
    var toRemove = [];
    structGroup.children.forEach(function(c){ toRemove.push(c); });
    toRemove.forEach(function(c){ structGroup.remove(c); });
    meshMap = {};

    // Rebuild from S.objects
    S.objects.forEach(function(o){
      var g = buildMesh(o);
      structGroup.add(g);
      meshMap[o.id] = g;
    });

    // HTML label overlay
    updateLabels();
  };

  // ── HTML labels for selected elements ─────────────────────────────
  var labelContainer = document.createElement('div');
  labelContainer.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:5;';
  document.body.appendChild(labelContainer);

  function updateLabels(){
    labelContainer.innerHTML = '';
    S.selected.forEach(function(id){
      var o = S.objects.find(function(x){ return x.id === id; });
      if(!o) return;
      var cx = o.x + (o.width||0)/2, cy = o.y + (o.height||0)/2, cz = o.z + (o.depth||0)/2;
      var v = new THREE.Vector3(cx, cy, cz);
      v.project(camera);
      var sx = (v.x * 0.5 + 0.5) * innerWidth;
      var sy = (-v.y * 0.5 + 0.5) * innerHeight;
      if(v.z > 1) return; // behind camera
      var lbl = document.createElement('div');
      lbl.textContent = o.type.toUpperCase() + ' #' + o.id;
      lbl.style.cssText = 'position:absolute;left:'+sx+'px;top:'+(sy-22)+'px;transform:translateX(-50%);font-family:Courier New,monospace;font-size:9px;color:#00d4ff;background:rgba(0,4,8,.75);padding:2px 5px;border:1px solid rgba(0,212,255,.4);border-radius:2px;letter-spacing:.08em;';
      labelContainer.appendChild(lbl);
    });
  }
  self.updateLabels = updateLabels;

  // ── Camera sync ───────────────────────────────────────────────────
  self.syncCamera = function(){
    var dist = 30 / Math.max(S.cam.zoom, 0.01);
    var rY = S.cam.rotY, rX = S.cam.rotX;
    camera.position.x = dist * Math.sin(rY) * Math.cos(rX) - S.cam.x * 0.1;
    camera.position.y = dist * Math.sin(rX) + 10;
    camera.position.z = dist * Math.cos(rY) * Math.cos(rX) - S.cam.y * 0.1;
    camera.lookAt(scene.position);
  };

  // ── Raycaster for mouse selection ─────────────────────────────────
  var raycaster = new THREE.Raycaster();
  self.pickObject = function(clientX, clientY){
    var mouse = new THREE.Vector2(
      (clientX / innerWidth) * 2 - 1,
      -(clientY / innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    var allMeshes = [];
    structGroup.traverse(function(child){
      if(child.isMesh) allMeshes.push(child);
    });
    var hits = raycaster.intersectObjects(allMeshes, false);
    if(!hits.length) return null;
    // Walk up to find the group with userData.objId
    var obj = hits[0].object;
    while(obj && obj.userData.objId === undefined) obj = obj.parent;
    return obj ? obj.userData.objId : null;
  };

  // Initial build
  self.rebuild();

  return self;
})();

// Mini axes canvas
var AXCV=document.createElement('canvas');AXCV.width=60;AXCV.height=60;AXCV.style.cssText='position:fixed;bottom:30px;left:56px;z-index:10;pointer-events:none;opacity:.5;';document.body.appendChild(AXCV);
function drawAxes(){ var c=AXCV.getContext('2d'),L=18,ox=30,oy=40;c.clearRect(0,0,60,60); [[1,0,0,'rgba(255,70,70,.7)','X'],[0,1,0,'rgba(70,255,140,.7)','Y'],[0,0,1,'rgba(70,140,255,.7)','Z']].forEach(function(a){var p=proj(a[0]*1.5,a[1]*1.5,a[2]*1.5),o2=proj(0,0,0);var dx=p.sx-o2.sx,dy=p.sy-o2.sy,dist=Math.hypot(dx,dy)||1;var ex=ox+dx/dist*L,ey=oy+dy/dist*L;c.strokeStyle=a[3];c.lineWidth=1.5;c.beginPath();c.moveTo(ox,oy);c.lineTo(ex,ey);c.stroke();c.fillStyle=a[3];c.font='7px Courier New';c.textAlign='center';c.fillText(a[4],ex,ey-2);}); }
function drawMinimap(){ var cv=document.getElementById('mm');if(!cv||!S.objects.length)return;var c=cv.getContext('2d'),W=100,H=75;c.clearRect(0,0,W,H);var mx=Infinity,Mx=-Infinity,mz=Infinity,Mz=-Infinity;S.objects.forEach(function(o){mx=Math.min(mx,o.x);Mx=Math.max(Mx,o.x+(o.width||0));mz=Math.min(mz,o.z);Mz=Math.max(Mz,o.z+(o.depth||0));});var pad=4,sc=Math.min((W-pad*2)/Math.max(Mx-mx,.1),(H-pad*2)/Math.max(Mz-mz,.1));S.objects.forEach(function(o){var sel=S.selected.includes(o.id);c.fillStyle=sel?'rgba(0,212,255,.55)':'rgba(0,212,255,.22)';c.fillRect(pad+(o.x-mx)*sc,pad+(o.z-mz)*sc,Math.max((o.width||.2)*sc,2),Math.max((o.depth||.2)*sc,2));});c.fillStyle='rgba(0,212,255,.2)';c.font='6px Courier New';c.textAlign='center';c.fillText('MAP',W/2,H-2); }

// Legacy 2D draw stubs — kept so old code references don't throw errors
function drawGrid(){}
function drawBox(o){}
function drawArch(o){}
function drawTruss(o){}

var _renderT = 0;
function render(){
  _renderT++;
  if(typeof THREE3D.animateParticles === 'function') THREE3D.animateParticles(_renderT);
  THREE3D.syncCamera();
  THREE3D.renderer.render(THREE3D.scene, THREE3D.camera);
  THREE3D.updateLabels();
  drawAxes(); drawMinimap();
  document.getElementById('ts-el').textContent=S.objects.length;
  document.getElementById('ts-zm').textContent=S.cam.zoom.toFixed(2)+'×';
  if(S.results){var u=S.results.util,el=document.getElementById('ts-ut');el.textContent=u.toFixed(1)+'%';el.style.color=u<70?'var(--h2)':u<90?'var(--wn)':'var(--er)';}
  requestAnimationFrame(render);
}
render();

// ══════════════════════════════════════
//  LAYER 3: ENGINEERING — analysis.js
// ══════════════════════════════════════
function runAnalysis(){
  if(!S.objects.length){toast('Add elements first');return;}
  var o=S.selected.length?S.objects.find(function(x){return x.id===S.selected[0];}):S.objects.find(function(x){return x.type==='beam';})||S.objects[0];
  if(!o)return;
  var mat=MATS[o.material]||MATS.concrete,b=S.sec.b,h=S.sec.h,E=mat.E;
  var I=b*Math.pow(h,3)/12,Wel=I/(h/2),L=o.length||o.width||6;
  var wd=S.loads.gG*S.loads.G*1000+S.loads.gQ*S.loads.Q*1000,ws=(S.loads.G+S.loads.Q)*1000;
  var M=wd*L*L/8,V=wd*L/2,delta=5*ws*Math.pow(L,4)/(384*E*I)*1000;
  var sig=M/Wel/1e6,tau=1.5*V/(b*h)/1e6,util=(sig/(mat.fy/1e6))*100;
  S.results={M:+(M/1e3).toFixed(2),V:+(V/1e3).toFixed(2),RA:+(V/1e3).toFixed(2),RB:+(V/1e3).toFixed(2),delta:+delta.toFixed(2),sig:+sig.toFixed(2),tau:+tau.toFixed(2),util:+util.toFixed(1),dLim:+(L/250*1000).toFixed(2),mat:mat,b:b,h:h,L:L,wd:wd/1e3};
  showRP(o);document.getElementById('rp').classList.add('open');
  if(S.diagOpen)setTimeout(drawDiags,40);
  CX.save();CX.globalAlpha=.1;CX.fillStyle='rgba(0,212,255,1)';CX.fillRect(0,0,CV.width,CV.height);CX.restore();
  toast('Analysis: '+util.toFixed(1)+'% util · δ='+S.results.delta+'mm · '+(util>100?'FAIL':util>80?'WARN':'OK'));
  // Ensure ARCAI ready
  if(window.ARCAI && !ARCAI.ready) ARCAI.init().then(function(){ console.log('[ARCAI] ready'); }).catch(function(){});

setTimeout(function(){aiAutoComment(o,S.results);},300);
}
function showRP(o){
  var r=S.results,mat=MATS[o.material]||MATS.concrete,uc=r.util<70?'ok':r.util<90?'wn2':'er';
  document.getElementById('rpt').textContent=o.type.toUpperCase()+' #'+o.id;
  var rot=o.rotation||{x:0,y:0,z:0};
  document.getElementById('rpb').innerHTML='<div class="rs">Geometry</div>'+
    '<div class="rr"><span class="rl">Span/W</span><span class="rv">'+(o.length||o.width||0).toFixed(2)+'m</span></div>'+
    '<div class="rr"><span class="rl">Height</span><span class="rv">'+(o.height||0).toFixed(2)+'m</span></div>'+
    '<div class="rr"><span class="rl">Depth</span><span class="rv">'+(o.depth||0).toFixed(2)+'m</span></div>'+
    '<div class="rr"><span class="rl">Pos X,Y,Z</span><span class="rv">'+o.x.toFixed(1)+','+o.y.toFixed(1)+','+o.z.toFixed(1)+'</span></div>'+
    '<div class="rr"><span class="rl">Rot Y°</span><span class="rv">'+(rot.y*180/Math.PI).toFixed(0)+'°</span></div>'+
    '<div class="rr"><span class="rl">Rot X°</span><span class="rv">'+(rot.x*180/Math.PI).toFixed(0)+'°</span></div>'+
    '<div class="rr"><span class="rl">Material</span><span class="rv" style="background:rgba('+(mat.r)+','+(mat.g)+','+(mat.b)+',.18);border:1px solid rgba('+(mat.r)+','+(mat.g)+','+(mat.b)+',.4);border-radius:3px;padding:1px 6px;color:rgb('+(mat.r*2<255?mat.r*2:255)+','+(mat.g*2<255?mat.g*2:255)+','+(mat.b*2<255?mat.b*2:255)+')">'+mat.name+'</span></div>'+
    '<div class="rr"><span class="rl">Section b×h</span><span class="rv">'+(S.sec.b*100).toFixed(0)+'×'+(S.sec.h*100).toFixed(0)+'cm</span></div>'+
    '<div class="rs">Quick Edit</div>'+
    '<div style="display:flex;gap:4px;flex-wrap:wrap;padding:4px 0;">'+
      '<div onclick="moveSel(0,0.5,0,0.5)" style="padding:3px 7px;border:1px solid rgba(0,255,204,.2);border-radius:3px;font-size:7.5px;color:var(--h2);cursor:pointer;">↑Y</div>'+
      '<div onclick="moveSel(0,-0.5,0,0.5)" style="padding:3px 7px;border:1px solid rgba(0,255,204,.2);border-radius:3px;font-size:7.5px;color:var(--h2);cursor:pointer;">↓Y</div>'+
      '<div onclick="rotateSel(&quot;y&quot;,45)" style="padding:3px 7px;border:1px solid rgba(0,212,255,.2);border-radius:3px;font-size:7.5px;color:var(--h);cursor:pointer;">↻45°</div>'+
      '<div onclick="rotateSel(&quot;y&quot;,90)" style="padding:3px 7px;border:1px solid rgba(0,212,255,.2);border-radius:3px;font-size:7.5px;color:var(--h);cursor:pointer;">↻90°</div>'+
      '<div onclick="rotateSel(&quot;x&quot;,15)" style="padding:3px 7px;border:1px solid rgba(0,212,255,.2);border-radius:3px;font-size:7.5px;color:var(--h);cursor:pointer;">Tilt+</div>'+
      '<div onclick="resetRotation()" style="padding:3px 7px;border:1px solid rgba(255,51,85,.18);border-radius:3px;font-size:7.5px;color:var(--er);cursor:pointer;">Reset R</div>'+
    '</div>'+
    '<div class="rs">Results</div>'+
    '<div class="rr"><span class="rl">M_max</span><span class="rv">'+r.M+' kN·m</span></div><div class="rr"><span class="rl">V_max</span><span class="rv">'+r.V+' kN</span></div><div class="rr"><span class="rl">δ_max</span><span class="rv">'+r.delta+' mm</span></div><div class="rr"><span class="rl">Util.</span><span class="rv" style="color:'+(r.util<70?'var(--h2)':r.util<90?'var(--wn)':'var(--er)')+'">'+r.util+'%</span></div><div class="ub"><div class="uf" style="width:'+Math.min(100,r.util)+'%;background:'+(r.util<70?'var(--h2)':r.util<90?'var(--wn)':'var(--er)')+'"></div></div><div class="rs">Checks</div><div class="'+uc+' rw">'+(r.util>100?'✗ OVERSTRESSED':r.util>80?'⚠ HIGH '+r.util+'%':'✓ BENDING OK')+'</div><div class="'+(r.delta>r.dLim?'wn2':'ok')+' rw">'+(r.delta>r.dLim?'⚠ δ='+r.delta+'mm > L/250='+r.dLim+'mm':'✓ DEFLECTION OK')+'</div><div class="inf rw">ℹ EN1990: '+S.loads.gG+'G+'+S.loads.gQ+'Q · SS beam</div>';
}
function toggleDiag(){S.diagOpen=!S.diagOpen;document.getElementById('dg').classList.toggle('open',S.diagOpen);document.getElementById('bdiag').classList.toggle('on',S.diagOpen);if(S.diagOpen&&S.results)setTimeout(drawDiags,50);}
function pc(id){var cv=document.getElementById(id);if(!cv)return null;var p=cv.parentElement;cv.width=p.clientWidth-20;cv.height=p.clientHeight-22;var c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);return{c:c,W:cv.width,H:cv.height};}
function drawDiags(){var r=S.results;if(!r)return;var w=r.wd,L=r.L;var bmd=pc('bmd');if(bmd){var c=bmd.c,W=bmd.W,H=bmd.H,pd=12,sy=H-pd,sc=(H-2*pd)/Math.max(r.M,.1);c.strokeStyle='rgba(0,212,255,.1)';c.lineWidth=.5;c.beginPath();c.moveTo(pd,sy);c.lineTo(W-pd,sy);c.stroke();c.beginPath();c.moveTo(pd,sy);for(var i=0;i<=40;i++){var t=i/40,M=w*L*t*L*(1-t)/2;c.lineTo(pd+t*(W-2*pd),sy-M*sc);}c.lineTo(W-pd,sy);c.closePath();c.fillStyle='rgba(0,212,255,.07)';c.fill();c.strokeStyle='rgba(0,212,255,.6)';c.lineWidth=1.4;c.stroke();c.fillStyle='rgba(0,212,255,.65)';c.font='8px Courier New';c.textAlign='center';c.fillText(r.M+'kN·m',W/2,pd+5);}var sfd=pc('sfd');if(sfd){var c=sfd.c,W=sfd.W,H=sfd.H,pd=12,sy=H/2,sc=(H/2-pd)/Math.max(r.V,.1);c.strokeStyle='rgba(0,212,255,.08)';c.lineWidth=.5;c.beginPath();c.moveTo(pd,sy);c.lineTo(W-pd,sy);c.stroke();c.beginPath();c.moveTo(pd,sy-r.V*sc);for(var i=0;i<=40;i++){var t=i/40,V=r.RA-w*L*t;c.lineTo(pd+t*(W-2*pd),sy-V*sc);}c.strokeStyle='rgba(0,255,204,.6)';c.lineWidth=1.4;c.stroke();c.fillStyle='rgba(0,255,204,.65)';c.font='8px Courier New';c.textAlign='center';c.fillText('±'+r.V+'kN',W/2,pd+5);}var dfd=pc('dfd');if(dfd){var c=dfd.c,W=dfd.W,H=dfd.H,pd=12,sy=H/2,sc=(H/2-pd)/Math.max(r.delta,.001);c.strokeStyle='rgba(0,212,255,.07)';c.lineWidth=.5;c.setLineDash([3,3]);c.beginPath();c.moveTo(pd,sy);c.lineTo(W-pd,sy);c.stroke();c.setLineDash([]);c.beginPath();c.moveTo(pd,sy);for(var i=0;i<=40;i++){var t=i/40,dv=r.delta*4*t*(1-t);c.lineTo(pd+t*(W-2*pd),sy+dv*sc);}c.strokeStyle='rgba(255,107,53,.7)';c.lineWidth=1.8;c.stroke();c.fillStyle='rgba(255,107,53,.65)';c.font='8px Courier New';c.textAlign='center';c.fillText('δ='+r.delta+'mm',W/2,pd+5);}}

// ══════════════════════════════════════
//  LAYER 3: SECTION/LOADS
// ══════════════════════════════════════
function toggleSec(){var el=document.getElementById('seced');el.classList.toggle('open');document.getElementById('bsec').classList.toggle('on',el.classList.contains('open'));uSecDisp();}
function uSec(p,v){S.sec[p]=+v;document.getElementById('sv'+p).textContent=(+v*100).toFixed(0)+'cm';uSecDisp();S.results=null;}
function uLoad(p,v){S.loads[p]=+v;document.getElementById('sv'+p).textContent=(+v).toFixed(1)+'kN/m';S.results=null;}
function uSecDisp(){var b=S.sec.b,h=S.sec.h,I=b*Math.pow(h,3)/12,Wl=I/(h/2);document.getElementById('siI').textContent=(I*1e4).toFixed(3)+'e-4';document.getElementById('siW').textContent=(Wl*1e3).toFixed(3)+'e-3';}
uSecDisp();
function toggleLbar(){var el=document.getElementById('lbar');el.classList.toggle('open');document.getElementById('bload').classList.toggle('on',el.classList.contains('open'));}
function applyUDL(){var o=S.objects.find(function(x){return x.id===S.selected[0];});if(!o){toast('Select element');return;}o.loads.push({type:'udl',mag:+document.getElementById('lu').value,dir:'down',pos:0});S.results=null;toast('UDL applied');}
function applyPt(){var o=S.objects.find(function(x){return x.id===S.selected[0];});if(!o){toast('Select element');return;}o.loads.push({type:'pt',mag:+document.getElementById('lp').value,pos:+document.getElementById('lpos').value,dir:'down'});S.results=null;toast('Point load applied');}
function clrLoads(){var o=S.objects.find(function(x){return x.id===S.selected[0];});if(o){o.loads=[];S.results=null;toast('Loads cleared');}}

// ══════════════════════════════════════
//  LAYER 3: OBJECT OPERATIONS
// ══════════════════════════════════════
function desel(){S.selected=[];document.getElementById('rp').classList.remove('open');}
function selAll(){S.selected=S.objects.map(function(o){return o.id;});}
function delSel(){if(!S.selected.length){toast('Select something');return;}pH();S.objects=S.objects.filter(function(o){return!S.selected.includes(o.id);});S.selected=[];S.results=null;if(typeof THREE3D!=='undefined')THREE3D.rebuild();document.getElementById('rp').classList.remove('open');toast('Deleted');}
function dupSel(){if(!S.selected.length){toast('Select something');return;}pH();var ids=[];S.selected.forEach(function(id){var o=S.objects.find(function(x){return x.id===id;});if(!o)return;var c=Object.assign({},JSON.parse(JSON.stringify(o)),{id:NID++,x:o.x+(S.snap||.5)*2,links:[]});S.objects.push(c);ids.push(c.id);});S.selected=ids;if(typeof THREE3D!=='undefined')THREE3D.rebuild();toast('Duplicated '+ids.length);}
function linkEls(){if(S.selected.length<2){toast('Select 2+ to link');return;}pH();var ids=[...S.selected];ids.forEach(function(id){var o=S.objects.find(function(x){return x.id===id;});if(!o)return;if(!o.links)o.links=[];ids.forEach(function(id2){if(id2!==id&&!o.links.includes(id2))o.links.push(id2);});});toast('Elements linked ✓');}

// ── MOVE SELECTED (supports up/down/left/right/forward/back) ──────
function moveSel(dx,dy,dz,customStep){
  if(!S.selected.length){toast('Select an element first');return;}
  var step=customStep!==undefined?customStep:(S.snap||0.5);
  pH();
  S.objects.forEach(function(o){
    if(S.selected.includes(o.id)){
      o.x=parseFloat((o.x+dx*step).toFixed(4));
      o.y=parseFloat((o.y+dy*step).toFixed(4));
      o.z=parseFloat((o.z+dz*step).toFixed(4));
    }
  });
  S.results=null;
  THREE3D.rebuild();
  // Show position feedback
  var sel=S.objects.find(function(o){return o.id===S.selected[0];});
  if(sel)toast('Pos: X='+sel.x.toFixed(2)+' Y='+sel.y.toFixed(2)+' Z='+sel.z.toFixed(2)+'m');
}

function rotateSel(axis,deg){
  if(!S.selected.length){toast('Select an element first');return;}
  pH();
  var rad=deg*Math.PI/180;
  S.objects.forEach(function(o){
    if(!S.selected.includes(o.id))return;
    if(!o.rotation)o.rotation={x:0,y:0,z:0};
    o.rotation[axis]=((o.rotation[axis]||0)+rad+Math.PI*2)%(Math.PI*2);
  });
  S.results=null;
  THREE3D.rebuild();
  toast('Rotated '+deg+'° on '+axis.toUpperCase()+' axis');
}

function resetRotation(){
  if(!S.selected.length){toast('Select element first');return;}
  pH();
  S.objects.forEach(function(o){if(S.selected.includes(o.id))o.rotation={x:0,y:0,z:0};});
  THREE3D.rebuild();
  toast('Rotation reset');
}

function scaleSel(axis,factor){
  if(!S.selected.length){toast('Select an element first');return;}
  pH();
  S.objects.forEach(function(o){
    if(!S.selected.includes(o.id))return;
    var dimMap={x:'width',y:'height',z:'depth'};
    var dim=dimMap[axis];
    if(o[dim]!==undefined){o[dim]=Math.max(0.05,parseFloat((o[dim]*factor).toFixed(3)));}
    if(axis==='x'&&o.length!==undefined)o.length=Math.max(0.05,parseFloat((o.length*factor).toFixed(3)));
  });
  S.results=null;
  THREE3D.rebuild();
  toast('Scaled ×'+factor+' on '+axis.toUpperCase());
}
function toggleMoveCtl(){var el=document.getElementById('movectl');el.classList.toggle('open');}

function setSnap(v){S.snap=v;document.querySelectorAll('.snb').forEach(function(b){b.classList.remove('on');});var el=document.getElementById('sn'+String(v).replace('.',''));if(el)el.classList.add('on');toast('Snap: '+(v||'off'));}

// ══════════════════════════════════════
//  LAYER 3: CAMERA
// ══════════════════════════════════════
var VP={'3d':{rotX:-.38,rotY:.48},'top':{rotX:-Math.PI/2+.01,rotY:0},'front':{rotX:0,rotY:0},'side':{rotX:0,rotY:Math.PI/2}};
function setView(v){var p=VP[v];if(!p)return;document.querySelectorAll('.lb[id^="v"]').forEach(function(b){b.classList.remove('on');});var el=document.getElementById('v'+v);if(el)el.classList.add('on');var sx=S.cam.rotX,sy=S.cam.rotY,t0=performance.now();(function a(){var t=Math.min(1,(performance.now()-t0)/350);var e=t<.5?2*t*t:1-(2-2*t)*(2-2*t)/2;S.cam.rotX=sx+(p.rotX-sx)*e;S.cam.rotY=sy+(p.rotY-sy)*e;if(t<1)requestAnimationFrame(a);})();}
function panBy(dx,dy){S.cam.x+=dx;S.cam.y+=dy;}
function resetView(){var sx=S.cam.x,sy=S.cam.y,sz=S.cam.zoom,srx=S.cam.rotX,sry=S.cam.rotY,t0=performance.now();(function a(){var t=Math.min(1,(performance.now()-t0)/380);var e=t<.5?2*t*t:1-(2-2*t)*(2-2*t)/2;S.cam.x=sx*(1-e);S.cam.y=sy*(1-e);S.cam.zoom=sz+(1-sz)*e;S.cam.rotX=srx+(-.38-srx)*e;S.cam.rotY=sry+(.48-sry)*e;if(t<1)requestAnimationFrame(a);})();}
function frameAll(){if(!S.objects.length)return;var sX=S.cam.x,sY=S.cam.y,sZ=S.cam.zoom;S.cam.x=0;S.cam.y=0;S.cam.zoom=1;var mnX=Infinity,mxX=-Infinity,mnY=Infinity,mxY=-Infinity;S.objects.forEach(function(o){[[o.x,o.y,o.z],[o.x+(o.width||0),o.y+(o.height||0),o.z+(o.depth||0)]].forEach(function(v){var p=proj(v[0],v[1],v[2]);mnX=Math.min(mnX,p.sx);mxX=Math.max(mxX,p.sx);mnY=Math.min(mnY,p.sy);mxY=Math.max(mxY,p.sy);});});S.cam.x=sX;S.cam.y=sY;S.cam.zoom=sZ;var mg=80,nZ=Math.max(.1,Math.min(6,Math.min((innerWidth-mg*2)/(mxX-mnX||1),(innerHeight-mg*2)/(mxY-mnY||1))));var tX=innerWidth/2-(mnX+mxX)/2*nZ,tY=innerHeight/2-(mnY+mxY)/2*nZ;var t0=performance.now();(function a(){var t=Math.min(1,(performance.now()-t0)/400);var e=t<.5?2*t*t:1-(2-2*t)*(2-2*t)/2;S.cam.x=sX+(tX-sX)*e;S.cam.y=sY+(tY-sY)*e;S.cam.zoom=sZ+(nZ-sZ)*e;if(t<1)requestAnimationFrame(a);})();}

// ══════════════════════════════════════
//  LAYER 3: MOUSE/TOUCH CONTROLS
// ══════════════════════════════════════
var MD={on:false,sx:0,sy:0,rx:0,ry:0,cx:0,cy:0,btn:0,moved:false};

CV.addEventListener('contextmenu',function(e){e.preventDefault();openRad(e.clientX,e.clientY);});
var TT=null,TTd=0,TTcx=0,TTcy=0;
CV.addEventListener('touchstart',function(e){if(e.touches.length===1)TT={x:e.touches[0].clientX,y:e.touches[0].clientY,rx:S.cam.rotX,ry:S.cam.rotY,cx:S.cam.x,cy:S.cam.y};if(e.touches.length===2){TTd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);TTcx=(e.touches[0].clientX+e.touches[1].clientX)/2;TTcy=(e.touches[0].clientY+e.touches[1].clientY)/2;}e.preventDefault();},{passive:false});
CV.addEventListener('touchmove',function(e){if(e.touches.length===1&&TT){var dx=e.touches[0].clientX-TT.x,dy=e.touches[0].clientY-TT.y;S.cam.rotY=TT.ry+dx*.007;S.cam.rotX=Math.max(-1.4,Math.min(1.4,TT.rx+dy*.005));}if(e.touches.length===2){var d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),mcx=(e.touches[0].clientX+e.touches[1].clientX)/2,mcy=(e.touches[0].clientY+e.touches[1].clientY)/2;var oldZ=S.cam.zoom,nZ=Math.max(.04,Math.min(18,oldZ*(d/TTd)));S.cam.x+=mcx-TTcx;S.cam.y+=mcy-TTcy;S.cam.zoom=nZ;TTd=d;TTcx=mcx;TTcy=mcy;}e.preventDefault();},{passive:false});

// ══════════════════════════════════════
//  LAYER 3: MODAL
// ══════════════════════════════════════
var DEFS={beam:{t:'ADD BEAM',f:[['length','SPAN(m)',6],['width','b(m)',.3],['height','h(m)',.6],['x','X',0],['y','Y',0],['z','Z',0],['material','MATERIAL','s']]},column:{t:'ADD COLUMN',f:[['height','H(m)',3],['width','b(m)',.4],['depth','d(m)',.4],['x','X',0],['y','Y',0],['z','Z',0],['material','MATERIAL','s']]},wall:{t:'ADD WALL',f:[['length','L(m)',5],['height','H(m)',3],['width','t(m)',.2],['x','X',0],['y','Y',0],['z','Z',0],['material','MATERIAL','s']]},slab:{t:'ADD SLAB',f:[['length','Lx(m)',6],['width','Ly(m)',4],['height','t(m)',.18],['x','X',-3],['y','Y',3],['z','Z',0],['material','MATERIAL','s']]},frame:{t:'ADD FRAME',f:[['length','BAY(m)',6],['height','H(m)',4],['width','b(m)',.3],['depth','h(m)',.5],['x','X',0],['y','Y',0],['z','Z',0],['material','MATERIAL','s']]},arch:{t:'ADD ARCH',f:[['length','SPAN(m)',20],['height','RISE(m)',5],['x','X',-10],['y','Y',0],['z','Z',0],['material','MATERIAL','s']]},truss:{t:'ADD TRUSS',f:[['length','SPAN(m)',12],['height','H(m)',2.5],['x','X',-6],['y','Y',0],['z','Z',0],['material','MATERIAL','s']]}};
function openModal(type){S.mtype=type;var def=DEFS[type];if(!def)return;document.getElementById('mdt').textContent=def.t;var cont=document.getElementById('mdg');cont.innerHTML='';def.f.forEach(function(f){var div=document.createElement('div');div.className='mdf';div.innerHTML='<div class="mdl">'+f[1]+'</div>';if(f[2]==='s'){var sel=document.createElement('select');sel.id='mf-'+f[0];sel.className='mdi';Object.entries(MATS).forEach(function(m){var op=document.createElement('option');op.value=m[0];op.textContent=m[1].name;sel.appendChild(op);});div.appendChild(sel);}else{var inp=document.createElement('input');inp.type='number';inp.id='mf-'+f[0];inp.className='mdi';inp.value=f[2];inp.step='.1';div.appendChild(inp);}cont.appendChild(div);});document.getElementById('modal').classList.add('open');}
function closeModal(){document.getElementById('modal').classList.remove('open');}
function fv(id){var e=document.getElementById('mf-'+id);return e?parseFloat(e.value)||0:0;}
function fs(id){var e=document.getElementById('mf-'+id);return e?e.value:'concrete';}
function confirmAdd(){var type=S.mtype,def=DEFS[type];if(!def)return;if(type==='frame'){var L=fv('length'),H=fv('height'),bw=fv('width')||.3,bh=fv('depth')||.5,mat=fs('material'),ox=fv('x'),oy=fv('y'),oz=fv('z');pH();[{type:'column',x:ox,y:oy,z:oz,width:bw,height:H,depth:bw,length:bw},{type:'column',x:ox+L-bw,y:oy,z:oz,width:bw,height:H,depth:bw,length:bw},{type:'beam',x:ox,y:oy+H,z:oz,width:L,height:bh,depth:bw,length:L}].forEach(function(o){S.objects.push(Object.assign({id:NID++,material:mat,loads:[],links:[]},o));});closeModal();S.results=null;toast('Frame added');return;}var o={id:NID++,type:type,material:'concrete',loads:[],links:[]};def.f.forEach(function(f){var e=document.getElementById('mf-'+f[0]);if(!e)return;o[f[0]]=f[2]==='s'?e.value:parseFloat(e.value)||0;});if(!o.x)o.x=0;if(!o.y)o.y=0;if(!o.z)o.z=0;if(!o.width)o.width=o.depth||.3;if(!o.depth)o.depth=o.width;if(!o.height)o.height=.5;if(!o.length)o.length=o.width;pH();S.objects.push(o);S.selected=[o.id];closeModal();S.results=null;if(typeof THREE3D!=='undefined')THREE3D.rebuild();toast(type+' added');}

// ══════════════════════════════════════
//  LAYER 3: RADIAL MENU
// ══════════════════════════════════════
var RI=[{i:'━',l:'BEAM',a:function(){openModal('beam');}},{i:'┃',l:'COL',a:function(){openModal('column');}},{i:'▬',l:'WALL',a:function(){openModal('wall');}},{i:'⌂',l:'FRAME',a:function(){openModal('frame');}},{i:'▪',l:'SLAB',a:function(){openModal('slab');}},{i:'∩',l:'ARCH',a:function(){openModal('arch');}},{i:'▶',l:'ANALYZE',a:function(){runAnalysis();}},{i:'✕',l:'DELETE',a:function(){delSel();}},{i:'✦',l:'ASK AI',a:function(){toggleAI();setTimeout(function(){document.getElementById('ai-inp').focus();},300);}},{i:'↺',l:'UNDO',a:function(){undoState();}},{i:'⤢',l:'DUP',a:function(){dupSel();}},{i:'⊞',l:'FIT',a:function(){frameAll();}}];
var RO=false,RX=0,RY2=0,RH=-1;
function openRad(x,y){if(RO)return;RO=true;RX=x;RY2=y;RH=-1;var N=RI.length,R1=46,R2=105,RS=122;var svg='<svg width="'+(RS*2)+'" height="'+(RS*2)+'" viewBox="'+(-RS)+' '+(-RS)+' '+(RS*2)+' '+(RS*2)+'" style="overflow:visible;pointer-events:all"><circle r="'+(R2+4)+'" fill="rgba(0,4,8,.97)" stroke="rgba(0,212,255,.18)" stroke-width="1"/>';RI.forEach(function(item,i){var sA=(i/N)*2*Math.PI-Math.PI/2,eA=((i+1)/N)*2*Math.PI-Math.PI/2,mA=(sA+eA)/2,g=.04;var path='M'+Math.cos(sA+g)*R1+' '+Math.sin(sA+g)*R1+' L'+Math.cos(sA+g)*R2+' '+Math.sin(sA+g)*R2+' A'+R2+' '+R2+' 0 '+(eA-sA>Math.PI?1:0)+' 1 '+Math.cos(eA-g)*R2+' '+Math.sin(eA-g)*R2+' L'+Math.cos(eA-g)*R1+' '+Math.sin(eA-g)*R1+' A'+R1+' '+R1+' 0 '+(eA-sA>Math.PI?1:0)+' 0 '+Math.cos(sA+g)*R1+' '+Math.sin(sA+g)*R1+'Z';var lx=Math.cos(mA)*(R1+R2)/2,ly=Math.sin(mA)*(R1+R2)/2;svg+='<g onclick="radSel('+i+')" style="cursor:pointer"><path d="'+path+'" id="rp'+i+'" fill="rgba(0,212,255,.04)" stroke="rgba(0,212,255,.14)" stroke-width=".6"/><text x="'+lx+'" y="'+(ly-7)+'" text-anchor="middle" dominant-baseline="central" font-size="12" fill="rgba(0,212,255,.6)">'+item.i+'</text><text x="'+lx+'" y="'+(ly+8)+'" text-anchor="middle" font-family="Courier New" font-size="7" fill="rgba(0,212,255,.4)" letter-spacing="1">'+item.l+'</text></g>';});svg+='<circle r="'+(R1-2)+'" fill="rgba(0,4,8,.96)" stroke="rgba(0,212,255,.28)" stroke-width="1.2"/><text y="3" text-anchor="middle" font-family="Courier New" font-size="7" fill="rgba(0,212,255,.4)" letter-spacing="2">MENU</text></svg>';var el=document.getElementById('rad');el.innerHTML=svg;el.style.left=x+'px';el.style.top=y+'px';el.classList.add('open');}
function closeRad(){RO=false;document.getElementById('rad').classList.remove('open');RH=-1;}
function radSel(i){if(RI[i])RI[i].a();closeRad();}
function radHov(cx,cy){if(!RO)return;var dx=cx-RX,dy=cy-RY2,dist=Math.hypot(dx,dy);if(dist<42||dist>108){if(RH>=0){var el=document.getElementById('rp'+RH);if(el)el.setAttribute('fill','rgba(0,212,255,.04)');RH=-1;}return;}var ang=Math.atan2(dy,dx)+Math.PI/2;if(ang<0)ang+=2*Math.PI;var sl=Math.floor(ang/(2*Math.PI/RI.length))%RI.length;if(sl!==RH){if(RH>=0){var el2=document.getElementById('rp'+RH);if(el2)el2.setAttribute('fill','rgba(0,212,255,.04)');}RH=sl;var el3=document.getElementById('rp'+sl);if(el3)el3.setAttribute('fill','rgba(0,212,255,.22)');}}
document.addEventListener('click',function(e){if(!e.target.closest('#rad')&&RO)closeRad();if(!e.target.closest('#ctx'))document.getElementById('ctx').classList.remove('open');});

// Context menu
CV.addEventListener('contextmenu',function(e){e.preventDefault();var best=null,bd=55;S.objects.forEach(function(o){var p=proj(o.x+(o.width||0)/2,o.y+(o.height||0)/2,o.z+(o.depth||0)/2);var d=Math.hypot(p.sx-e.clientX,p.sy-e.clientY);if(d<bd){bd=d;best=o;}});if(best&&!S.selected.includes(best.id))S.selected=[best.id];var m=document.getElementById('ctx');m.style.left=Math.min(e.clientX,innerWidth-165)+'px';m.style.top=Math.min(e.clientY,innerHeight-200)+'px';m.classList.add('open');});
function ctxDo(a){document.getElementById('ctx').classList.remove('open');var acts={all:selAll,desel:desel,dup:dupSel,analyze:runAnalysis,del:delSel,ai:function(){if(S.selected.length){var o=S.objects.find(function(x){return x.id===S.selected[0];});if(o){toggleAI();setTimeout(function(){sendAIMsg('Optimise '+o.type+' #'+o.id+' — current utilization '+( S.results?S.results.util+'%':'unknown'));},400);}}}};if(acts[a])acts[a]();}

// ══════════════════════════════════════
//  LAYER 3: TOAST
// ══════════════════════════════════════
var _tt;function toast(m){var el=document.getElementById('toast');el.textContent=m;el.classList.add('show');clearTimeout(_tt);_tt=setTimeout(function(){el.classList.remove('show');},2600);}

// ══════════════════════════════════════
//  LAYER 3: KEYBOARD HELP
// ══════════════════════════════════════
function toggleHelp(){var el=document.getElementById('help-overlay');el.style.display=el.style.display==='none'?'block':'none';}

// ══════════════════════════════════════
//  LAYER 3: KEYBOARD
// ══════════════════════════════════════
document.addEventListener('keydown',function(e){
  if(e.key==='?'&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();toggleHelp();return;}
  if(e.key===' '&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();toggleAI();return;}
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
  var k=e.key.toLowerCase();
  if(k==='b')openModal('beam');if(k==='c')openModal('column');if(k==='w')openModal('wall');if(k==='l')openModal('slab');if(k==='g')openModal('frame');if(k==='a')openModal('arch');if(k==='t')openModal('truss');
  if(k==='enter'){e.preventDefault();runAnalysis();}if(k==='d')toggleDiag();if(k==='e')toggleSec();if(k==='p')toggleLbar();if(k==='f'){e.preventDefault();frameAll();}if(k==='r')resetView();
  if(k==='delete'||k==='backspace')delSel();if(k==='escape'){closeModal();closeRad();desel();}
  if(k==='z'&&(e.ctrlKey||e.metaKey)){e.preventDefault();undoState();}if(k==='a'&&(e.ctrlKey||e.metaKey)){e.preventDefault();selAll();}if(k==='s'&&(e.ctrlKey||e.metaKey)){e.preventDefault();saveProject();}
  if(k==='tab'){e.preventDefault();if(S.objects.length){var idx=S.objects.findIndex(function(o){return o.id===S.selected[0];});S.selected=[S.objects[(idx+1)%S.objects.length].id];}}
  if((k==='d')&&e.shiftKey)dupSel();if(k==='k')linkEls();
  if(e.key==='+')S.cam.zoom=Math.min(18,S.cam.zoom*1.15);if(e.key==='-')S.cam.zoom=Math.max(.04,S.cam.zoom/1.15);
  // Arrow keys: NO selection = pan camera; WITH selection = move element
  if(!S.selected.length&&!e.ctrlKey){
    var ps=40;
    if(e.key==='ArrowLeft')S.cam.x+=ps;if(e.key==='ArrowRight')S.cam.x-=ps;
    if(e.key==='ArrowUp')S.cam.y+=ps;if(e.key==='ArrowDown')S.cam.y-=ps;
  }
  if(S.selected.length&&!e.ctrlKey){
    // Arrow = horizontal (X/Z), Alt+Arrow = vertical (Y), Shift = fine control
    var s=e.shiftKey?.1:S.snap||.5;
    if(e.key==='ArrowLeft'&&!e.altKey){e.preventDefault();moveSel(-1,0,0,s);}
    if(e.key==='ArrowRight'&&!e.altKey){e.preventDefault();moveSel(1,0,0,s);}
    if(e.key==='ArrowUp'&&e.altKey){e.preventDefault();moveSel(0,1,0,s);}    // Y UP
    if(e.key==='ArrowDown'&&e.altKey){e.preventDefault();moveSel(0,-1,0,s);} // Y DOWN
    if(e.key==='ArrowUp'&&!e.altKey){e.preventDefault();moveSel(0,0,-1,s);}  // Z forward
    if(e.key==='ArrowDown'&&!e.altKey){e.preventDefault();moveSel(0,0,1,s);} // Z back
    // Rotation: R+arrow keys
    if(e.key===',' )rotateSel('y',-15);  // , = rotate Y left
    if(e.key==='.' )rotateSel('y', 15);  // . = rotate Y right
    if(e.key==='[' )rotateSel('x',-15);  // [ = tilt back
    if(e.key===']' )rotateSel('x', 15);  // ] = tilt forward
    // Scale: +/- on selected
    if(e.key==='='&&e.shiftKey)scaleSel('x',1.1);
    if(e.key==='-'&&e.shiftKey)scaleSel('x',.9);
  }
});

// ══════════════════════════════════════
//  LAYER 4: ML — Gesture Recognition
//  ml/gesture-model.js (inlined)
// ══════════════════════════════════════
var GESTURE_LABELS = ['idle','point','pinch','palm','two','fist','shaka','ok','peace'];
var GESTURE_ICONS  = {idle:'✋',point:'☝️',pinch:'🤏',palm:'🖐️',two:'✌️',fist:'✊',shaka:'🤙',ok:'👌',peace:'🤞'};
var GESTURE_DESC   = {idle:'Make a gesture',point:'Point finger → aim/dwell UI',pinch:'Pinch → select/drag',palm:'Open palm → pan camera',two:'Two fingers → orbit 360°',fist:'Fist → hold for menu',shaka:'Shaka → zoom in/out',ok:'OK sign → delete selected',peace:'Peace → duplicate'};

var GML = {
  model: null,
  tf: null,
  trainingData: [],
  sampleCounts: {},
  isTraining: false,
  accuracy: 0,
  MIN_SAMPLES: 15,
  collectingLabel: null,
  collectTimeout: null,

  init: async function() {
    if(typeof tf === 'undefined'){ console.log('[GML] TF.js not loaded'); return; }
    this.tf = tf;
    GESTURE_LABELS.forEach(function(l){ GML.sampleCounts[l]=0; });
    // Load saved training data
    try { var saved=localStorage.getItem('af-gest-data'); if(saved){ this.trainingData=JSON.parse(saved); GESTURE_LABELS.forEach(function(l){ GML.sampleCounts[l]=GML.trainingData.filter(function(d){return d.label===l;}).length; }); } } catch(e){}
    // Build or load model
    try { this.model=await tf.loadLayersModel('localstorage://af-gest-model'); console.log('[GML] Model loaded from storage'); }
    catch(e){ this.model=this._build(); console.log('[GML] New model built'); }
    this.updateUI();
  },

  _build: function() {
    var m=this.tf.sequential({layers:[
      this.tf.layers.dense({inputShape:[63],units:128,activation:'relu'}),
      this.tf.layers.dropout({rate:.3}),
      this.tf.layers.dense({units:64,activation:'relu'}),
      this.tf.layers.dropout({rate:.2}),
      this.tf.layers.dense({units:32,activation:'relu'}),
      this.tf.layers.dense({units:GESTURE_LABELS.length,activation:'softmax'}),
    ]});
    m.compile({optimizer:this.tf.train.adam(.001),loss:'categoricalCrossentropy',metrics:['accuracy']});
    return m;
  },

  features: function(lm) {
    if(!lm||lm.length<21)return null;
    var wrist=lm[0];
    var handSize=Math.hypot(lm[9].x-wrist.x,lm[9].y-wrist.y,(lm[9].z||0)-(wrist.z||0))||1;
    var f=[];
    for(var i=0;i<lm.length;i++){f.push((lm[i].x-wrist.x)/handSize);f.push((lm[i].y-wrist.y)/handSize);f.push(((lm[i].z||0)-(wrist.z||0))/handSize);}
    return f;
  },

  predict: function(lm) {
    var hasEnough=GESTURE_LABELS.every(function(l){return (GML.sampleCounts[l]||0)>=GML.MIN_SAMPLES;});
    if(!hasEnough||!this.model||!this.tf){ return {label:this._rules(lm),confidence:.7,fallback:true}; }
    var f=this.features(lm); if(!f)return{label:'idle',confidence:0};
    var t=this.tf.tensor2d([f]);
    var pred=this.model.predict(t);
    var probs=Array.from(pred.dataSync());
    t.dispose();pred.dispose();
    var maxI=probs.indexOf(Math.max.apply(null,probs));
    return{label:GESTURE_LABELS[maxI],confidence:probs[maxI],probs:probs,fallback:false};
  },

  _rules: function(lm) {
    var ext=function(t,p){return lm[t].y<lm[p].y-.02;};
    var idx=ext(8,6),mid=ext(12,10),ring=ext(16,14),pky=ext(20,18);
    var tOut=lm[4].x<lm[3].x-.022;
    var pd=Math.hypot(lm[4].x-lm[8].x,lm[4].y-lm[8].y,(lm[4].z||0)-(lm[8].z||0));
    if(pd<.058)return'pinch';
    if(!idx&&!mid&&!ring&&!pky)return'fist';
    if(idx&&mid&&ring&&pky&&!tOut)return'palm';
    if(!idx&&!mid&&!ring&&pky&&tOut)return'shaka';
    if(!idx&&mid&&ring&&!pky&&tOut)return'ok';
    if(idx&&mid&&!ring&&!pky)return'two';
    if(idx&&mid&&ring&&!pky&&!tOut)return'peace';
    if(idx&&!mid&&!ring&&!pky)return'point';
    return'idle';
  },

  collect: function(lm,label) {
    var f=this.features(lm); if(!f)return;
    this.trainingData.push({features:f,label:label,ts:Date.now()});
    this.sampleCounts[label]=(this.sampleCounts[label]||0)+1;
    if(this.trainingData.length%10===0)this._save();
    this.updateUI();
    return this.sampleCounts[label];
  },

  _save: function(){ try{localStorage.setItem('af-gest-data',JSON.stringify(this.trainingData.slice(-3000)));}catch(e){} },

  train: async function(onProg) {
    if(!this.tf||this.trainingData.length<50){toast('Need more samples to train');return;}
    this.isTraining=true;
    document.getElementById('ml-train-btn').textContent='⟳ TRAINING…';
    var xs=[],ys=[];
    this.trainingData.forEach(function(d){
      xs.push(d.features);
      var oh=new Array(GESTURE_LABELS.length).fill(0);
      var idx2=GESTURE_LABELS.indexOf(d.label);
      if(idx2>=0)oh[idx2]=1;
      ys.push(oh);
    });
    var xT=this.tf.tensor2d(xs),yT=this.tf.tensor2d(ys);
    var self=this;
    await this.model.fit(xT,yT,{epochs:50,batchSize:32,validationSplit:.2,shuffle:true,callbacks:{onEpochEnd:function(ep,logs){self.accuracy=logs.val_acc||logs.acc||0;document.getElementById('ml-prog').style.width=((ep+1)/50*100)+'%';document.getElementById('ml-acc').textContent=(self.accuracy*100).toFixed(1)+'%';document.getElementById('ts-ml').textContent=(self.accuracy*100).toFixed(0)+'%';if(onProg)onProg(ep,logs);}}});
    xT.dispose();yT.dispose();
    try{await this.model.save('localstorage://af-gest-model');}catch(e){}
    this._save();
    this.isTraining=false;
    document.getElementById('ml-train-btn').textContent='✓ TRAINED · RETRAIN';
    document.getElementById('ml-mode').textContent='ML Model';
    toast('✓ ML model trained — '+this.trainingData.length+' samples, '+(this.accuracy*100).toFixed(1)+'% accuracy');
    this.updateUI();
  },

  startCollect: function(label) {
    if(!HM){toast('Enable hands first');return;}
    this.collectingLabel=label;
    var overlay=document.getElementById('collect-overlay');
    overlay.classList.add('active');
    document.getElementById('cl-gest').textContent=GESTURE_ICONS[label]||'✋';
    document.getElementById('cl-inst').textContent='SHOW: '+label.toUpperCase()+' GESTURE';
    document.getElementById('cl-count').textContent=(this.sampleCounts[label]||0)+' / '+this.MIN_SAMPLES+' samples';
    clearTimeout(this.collectTimeout);
    this.collectTimeout=setTimeout(function(){GML.stopCollect();},8000);
    toast('Showing '+label+' gesture — hold it for 8 seconds');
  },

  stopCollect: function() {
    this.collectingLabel=null;
    document.getElementById('collect-overlay').classList.remove('active');
    clearTimeout(this.collectTimeout);
    this.updateUI();
  },

  updateUI: function() {
    var total=this.trainingData.length;
    document.getElementById('ml-total').textContent=total;
    var hasEnough=GESTURE_LABELS.every(function(l){return (GML.sampleCounts[l]||0)>=GML.MIN_SAMPLES;});
    document.getElementById('ml-mode').textContent=hasEnough?'ML Model (active)':'Rule-based (need more samples)';
    // Update gesture grid
    var grid=document.getElementById('gest-grid');
    if(!grid)return;
    grid.innerHTML=GESTURE_LABELS.map(function(l){
      var cnt=GML.sampleCounts[l]||0;
      var pct=Math.min(100,(cnt/GML.MIN_SAMPLES)*100);
      var ready=cnt>=GML.MIN_SAMPLES;
      return '<div class="gest-card'+(ready?' ready':'')+(GML.collectingLabel===l?' collecting':'')+'" onclick="GML.startCollect(\''+l+'\')" title="Click to collect '+l+' samples">'+
        '<div><div class="gc-name">'+GESTURE_ICONS[l]+' '+l+'</div><div class="gc-bar"><div class="gc-fill" style="width:'+pct+'%"></div></div></div>'+
        '<div class="gc-count">'+cnt+(ready?' ✓':'')+'</div></div>';
    }).join('');
    if(this.accuracy>0){document.getElementById('ml-acc').textContent=(this.accuracy*100).toFixed(1)+'%';document.getElementById('ts-ml').textContent=(this.accuracy*100).toFixed(0)+'%';}
  },

  clearData: function() {
    if(!confirm('Clear all gesture training data?'))return;
    this.trainingData=[];GESTURE_LABELS.forEach(function(l){GML.sampleCounts[l]=0;});
    this._save();try{localStorage.removeItem('af-gest-model');}catch(e){}
    this.model=this._build();this.accuracy=0;
    document.getElementById('ml-acc').textContent='—';
    document.getElementById('ml-prog').style.width='0%';
    this.updateUI();toast('Training data cleared');
  }
};

function toggleML(){var p=document.getElementById('ml-panel');p.classList.toggle('open');document.getElementById('bml').classList.toggle('on',p.classList.contains('open'));}
function trainGestureModel(){GML.train();}
function clearGestureData(){GML.clearData();}

// Init ML after TF.js loads
if(typeof tf!=='undefined'){GML.init();}else{var tfCheck=setInterval(function(){if(typeof tf!=='undefined'){clearInterval(tfCheck);GML.init();}},200);}

// ══════════════════════════════════════
//  LAYER 4: HAND TRACKING ENGINE
//  hand/tracker.js (inlined)
//  
//  KEY IMPROVEMENTS:
//  1. Separate cooldowns per gesture action
//  2. Palm pan NEVER resets camera — they are now exclusive
//  3. Camera reset moved to dedicated TWO-HAND gesture only
//  4. Smooth velocity-based pan with proper inertia decay
//  5. Two-finger orbit: separate X and Y axes, no mixing
//  6. All state machines are independent
// ══════════════════════════════════════

var HM=null,HC=null;

// Smooth position — exponential moving average
var HPOS={
  x:.5,y:.5,vx:0,vy:0,
  update:function(rx,ry){
    var dx=rx-this.x,dy=ry-this.y;
    var speed=Math.hypot(dx,dy);
    var a=Math.min(.38,.16+speed*1.2); // adaptive alpha
    this.vx=dx*a; this.vy=dy*a;
    this.x+=this.vx; this.y+=this.vy;
  },
  sx:function(){return this.x*innerWidth;},
  sy:function(){return this.y*innerHeight;},
};

// Per-gesture debounced state machines (independent, not shared)
function makeGSM(holdMs){
  return{cur:'idle',cand:'idle',candT:0,curT:0,holdMs:holdMs||80,
    update:function(raw){var now=performance.now();if(raw!==this.cand){this.cand=raw;this.candT=now;}if(raw!==this.cur&&now-this.candT>=this.holdMs){this.cur=raw;this.curT=now;return true;}return false;},
    held:function(){return performance.now()-this.curT;}};
}
var GSM_MAIN = makeGSM(80);   // Main gesture state — 80ms debounce
var GSM_ORBIT = makeGSM(0);   // Orbit (two fingers) — immediate, no debounce
var GSM_PAN = makeGSM(0);     // Pan (palm) — immediate

// Camera velocity state (separate from gesture state)
var CAM_VEL={
  panX:0,panY:0,         // Pan inertia
  orbitX:0,orbitY:0,     // Orbit inertia
  orbitTracking:false,
  lastWristAngle:null,   // For wrist-roll orbit
  lastFingerY:null,      // For vertical orbit
};

// Drag state (only for pinch+move)
var DRAG={active:false,objId:null,startSX:0,startSY:0,objStartX:0,objStartZ:0};

// Shaka zoom — thumb to pinky distance ratio
var SHAKA_PREV_DIST=null;

// OK/peace debounce
var LAST_DELETE=0,LAST_DUP=0;

// Dwell (POINT gesture → UI tap)
var DWELL={el:null,startT:0,MS:900};
function checkDwell(cx,cy){
  var hit=null;
  document.querySelectorAll('.lb,.tpill,.lbb,.snb,.nb,.mc-btn').forEach(function(btn){var r=btn.getBoundingClientRect();if(cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom)hit=btn;});
  if(hit){
    if(hit!==DWELL.el){DWELL.el=hit;DWELL.startT=performance.now();}
    var frac=Math.min(1,(performance.now()-DWELL.startT)/DWELL.MS);
    var r=hit.getBoundingClientRect(),bx=r.left+r.width/2,by=r.top+r.height/2;
    HX.beginPath();HX.arc(bx,by,16,-Math.PI/2,-Math.PI/2+frac*Math.PI*2);
    HX.strokeStyle='rgba(0,255,204,'+(0.4+frac*0.5)+')';HX.lineWidth=2.5;HX.stroke();
    hit.style.outline='1px solid rgba(0,255,204,'+(frac*0.7)+')';
    if(frac>=1){hit.style.outline='';hit.click();DWELL.el=null;DWELL.startT=0;toast('✓ Activated');}
  }else{if(DWELL.el){DWELL.el.style.outline='';DWELL.el=null;DWELL.startT=0;}}
}

// Trail
var TRAIL=[],TRAIL_MAX=18;

// Skeleton connections
var SKEL=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
function drawSkel(lm,gest){
  var W2=innerWidth,H2=innerHeight,m=function(x){return 1-x;};
  HX.strokeStyle=gest==='pinch'?'rgba(0,255,204,.28)':'rgba(0,212,255,.18)';HX.lineWidth=1.1;
  SKEL.forEach(function(s){HX.beginPath();HX.moveTo(m(lm[s[0]].x)*W2,lm[s[0]].y*H2);HX.lineTo(m(lm[s[1]].x)*W2,lm[s[1]].y*H2);HX.stroke();});
  var TIPS=[4,8,12,16,20];
  lm.forEach(function(p,i){HX.beginPath();HX.arc(m(p.x)*W2,p.y*H2,TIPS.includes(i)?4.5:i===0?5:2.2,0,Math.PI*2);HX.fillStyle=i===8?(gest==='pinch'?'rgba(0,255,204,.9)':'rgba(0,212,255,.8)'):i===4&&gest==='pinch'?'rgba(0,255,204,.7)':'rgba(0,212,255,.28)';HX.fill();});
}

async function toggleHands(){
  if(HM){
    try{HC&&HC.stop&&HC.stop();}catch(e){}
    try{HM.close&&HM.close();}catch(e){}
    HM=null;HC=null;
    try{var vid=document.getElementById('vid');vid.srcObject&&vid.srcObject.getTracks().forEach(function(t){t.stop();});vid.srcObject=null;}catch(e){}
    document.getElementById('hpill').classList.remove('on');document.getElementById('hptxt').textContent='Enable Hands';
    document.getElementById('cur').style.display='none';document.getElementById('cur-lbl').style.display='none';
    HX.clearRect(0,0,CH.width,CH.height);document.getElementById('ghud').classList.remove('show');
    toast('Hand tracking off');return;
  }
  var txt=document.getElementById('hptxt'); txt.textContent='Requesting camera…';
  var stream;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'}});}
  catch(e){txt.textContent='Enable Hands';toast('❌ '+(e.name==='NotAllowedError'?'Camera denied':e.name==='NotFoundError'?'No camera':'Camera error: '+e.message));return;}
  var vid=document.getElementById('vid');vid.srcObject=stream;
  await vid.play().catch(function(){});
  txt.textContent='Loading MediaPipe…';
  async function loadSc(src){return new Promise(function(res,rej){if(document.querySelector('script[src="'+src+'"]')&&window.Hands){res();return;}var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error(src));};document.head.appendChild(s);});}
  var V='0.4.1646424915',CV2='0.3.1640029074';
  var loaded=false;
  for(var cdn of[['https://cdn.jsdelivr.net/npm/@mediapipe/hands@'+V+'/hands.js','https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@'+CV2+'/camera_utils.js'],['https://unpkg.com/@mediapipe/hands@'+V+'/hands.js','https://unpkg.com/@mediapipe/camera_utils@'+CV2+'/camera_utils.js']]){try{await loadSc(cdn[0]);await loadSc(cdn[1]);if(typeof Hands!=='undefined'&&typeof Camera!=='undefined'){loaded=true;break;}}catch(e){}}
  if(!loaded){txt.textContent='Enable Hands';toast('❌ MediaPipe CDN failed — check internet');stream.getTracks().forEach(function(t){t.stop();});return;}
  txt.textContent='Initializing…';
  try{
    HM=new Hands({locateFile:function(f){return'https://cdn.jsdelivr.net/npm/@mediapipe/hands@'+V+'/'+f;}});
    HM.setOptions({maxNumHands:2,modelComplexity:1,minDetectionConfidence:.72,minTrackingConfidence:.65});
    HM.onResults(onHandResults);
    await HM.initialize();
  }catch(e){HM=null;txt.textContent='Enable Hands';toast('❌ Init failed: '+e.message);stream.getTracks().forEach(function(t){t.stop();});return;}
  HC=new Camera(vid,{onFrame:async function(){if(HM)try{await HM.send({image:vid});}catch(e){}},width:640,height:480});
  HC.start();
  document.getElementById('hpill').classList.add('on');
  document.getElementById('cur').style.display='block';document.getElementById('cur-lbl').style.display='block';
  txt.textContent='✋ Hands ON';
  toast('✅ Hand tracking active — Try gestures or use ML panel to train custom gestures');
}

function onHandResults(res){
  HX.clearRect(0,0,CH.width,CH.height);
  var lms=res.multiHandLandmarks||[];

  // Apply inertia even when no hand present
  if(!lms.length){
    // Pan inertia coast
    CAM_VEL.panX*=.88;CAM_VEL.panY*=.88;
    if(Math.abs(CAM_VEL.panX)>.15||Math.abs(CAM_VEL.panY)>.15){S.cam.x+=CAM_VEL.panX;S.cam.y+=CAM_VEL.panY;}
    // Orbit inertia coast
    CAM_VEL.orbitX*=.92;CAM_VEL.orbitY*=.92;
    if(Math.abs(CAM_VEL.orbitX)>.001||Math.abs(CAM_VEL.orbitY)>.001){
      S.cam.rotY+=CAM_VEL.orbitY;
      S.cam.rotX=Math.max(-Math.PI*.48,Math.min(Math.PI*.48,S.cam.rotX+CAM_VEL.orbitX));
    }
    if(DRAG.active){DRAG.active=false;pH();toast('Element placed ✓');}
    CAM_VEL.lastWristAngle=null;SHAKA_PREV_DIST=null;
    document.getElementById('ghud').classList.remove('show');
    return;
  }

  var PLM=lms[0];

  // ── ML GESTURE CLASSIFICATION ─────────────────────────
  var prediction=GML.predict(PLM);
  var rawGest=prediction.label;

  // If in collection mode, collect this frame
  if(GML.collectingLabel){
    var n=GML.collect(PLM,GML.collectingLabel);
    document.getElementById('cl-count').textContent=n+' / '+GML.MIN_SAMPLES+' samples';
    if(n>=GML.MIN_SAMPLES)GML.stopCollect();
  }

  // Debounce for main gesture (prevents flicker)
  var gestChanged=GSM_MAIN.update(rawGest);
  var gest=GSM_MAIN.cur;

  // Smooth cursor from index fingertip (mirrored for front-facing camera)
  HPOS.update(1-PLM[8].x,PLM[8].y);
  var cx=HPOS.sx(),cy=HPOS.sy();

  // Draw skeleton + trail
  drawSkel(PLM,gest);
  TRAIL.push({x:cx,y:cy,t:performance.now()});if(TRAIL.length>TRAIL_MAX)TRAIL.shift();
  var now=performance.now();
  for(var i=1;i<TRAIL.length;i++){var p0=TRAIL[i-1],p1=TRAIL[i];var age=(now-p1.t)/400,a=Math.max(0,.5-age)*(i/TRAIL.length);HX.beginPath();HX.moveTo(p0.x,p0.y);HX.lineTo(p1.x,p1.y);HX.strokeStyle='rgba(0,212,255,'+a+')';HX.lineWidth=i/TRAIL.length*2.2;HX.stroke();}
  if(lms.length>=2)drawSkel(lms[1],'idle');

  // Update cursor
  var cur=document.getElementById('cur');cur.style.left=cx+'px';cur.style.top=cy+'px';
  cur.className=gest==='pinch'?(DRAG.active?'drag':'pinch'):gest==='palm'?'palm':gest==='two'?'two':gest==='fist'?'fist':gest==='point'?'point':'';
  var cl=document.getElementById('cur-lbl');cl.style.left=cx+'px';cl.style.top=cy+'px';
  cl.textContent={idle:'',point:'AIM',pinch:DRAG.active?'DRAG':'SELECT',palm:'PAN',two:'ORBIT',fist:GSM_MAIN.held()>700?'MENU':'ALL',shaka:'ZOOM',ok:'DELETE',peace:'DUPLICATE'}[gest]||'';

  // Update gesture HUD
  document.getElementById('gi').textContent=GESTURE_ICONS[gest]||'✋';
  document.getElementById('gn').textContent=(gest||'idle').toUpperCase();
  document.getElementById('gd').textContent=GESTURE_DESC[gest]||'';
  document.getElementById('gc').textContent=(prediction.confidence*100).toFixed(0)+'% · '+lms.length+'H';
  var mlBadge=document.getElementById('gml');if(mlBadge)mlBadge.style.display=prediction.fallback?'none':'inline-block';
  document.getElementById('ghud').classList.add('show');

  // Radial menu hover
  if(RO)radHov(cx,cy);

  // ════════════════════════════════════════════════
  //  GESTURE ACTION DISPATCH
  //  Each gesture = ONE action, no overlap, no conflict
  //  Actions are checked in priority order
  // ════════════════════════════════════════════════

  // ─── POINT: hover highlight + dwell tap UI ───────────────
  if(gest==='point'){
    // Highlight nearest object
    var best=null,bd=85;
    S.objects.forEach(function(o){var p=proj(o.x+(o.width||0)/2,o.y+(o.height||0)/2,o.z+(o.depth||0)/2);var d=Math.hypot(p.sx-cx,p.sy-cy);if(d<bd){bd=d;best=o;}});
    if(best){var p=proj(best.x+(best.width||0)/2,best.y+(best.height||0)/2,best.z+(best.depth||0)/2);HX.beginPath();HX.arc(p.sx,p.sy,22*S.cam.zoom,0,Math.PI*2);HX.strokeStyle='rgba(0,255,204,.4)';HX.lineWidth=1;HX.stroke();HX.fillStyle='rgba(0,255,204,.6)';HX.font='8px Courier New';HX.textAlign='center';HX.fillText(best.type.toUpperCase()+'#'+best.id+' Y='+best.y.toFixed(1)+'m',p.sx,p.sy-26*S.cam.zoom);}
    checkDwell(cx,cy);
    // Stop all camera motion while pointing
    CAM_VEL.lastWristAngle=null;
    return;
  }else{if(DWELL.el){DWELL.el.style.outline='';DWELL.el=null;DWELL.startT=0;}}

  // ─── PINCH: select on tap, drag on hold+move ────────────
  if(gest==='pinch'){
    if(gestChanged&&!RO){
      // Select nearest object
      var best2=null,bd2=78;
      S.objects.forEach(function(o){var p=proj(o.x+(o.width||0)/2,o.y+(o.height||0)/2,o.z+(o.depth||0)/2);var d=Math.hypot(p.sx-cx,p.sy-cy);if(d<bd2){bd2=d;best2=o;}});
      if(best2){S.selected=[best2.id];if(S.results)showRP(best2);toast(best2.type.toUpperCase()+'#'+best2.id+' selected');DRAG.objId=best2.id;DRAG.startSX=cx;DRAG.startSY=cy;var oo=S.objects.find(function(x){return x.id===best2.id;});DRAG.objStartX=oo?oo.x:0;DRAG.objStartZ=oo?oo.z:0;}
      else{desel();DRAG.objId=null;}
    }
    if(gestChanged&&RO){if(RH>=0)radSel(RH);else closeRad();}
    // Start drag after 120ms hold + 12px movement
    if(!DRAG.active&&DRAG.objId&&S.selected.includes(DRAG.objId)&&GSM_MAIN.held()>120&&Math.hypot(cx-DRAG.startSX,cy-DRAG.startSY)>12)DRAG.active=true;
    if(DRAG.active){
      var dobj=S.objects.find(function(x){return x.id===DRAG.objId;});
      if(dobj){
        var dx2=(cx-DRAG.startSX)/(80*S.cam.zoom),dz2=(cy-DRAG.startSY)/(80*S.cam.zoom);
        var cY=Math.cos(S.cam.rotY),sY2=Math.sin(S.cam.rotY);
        dobj.x=snapV(DRAG.objStartX+dx2*cY);
        dobj.z=snapV(DRAG.objStartZ-dz2*.6);
        S.results=null;
      }
    }
    // Stop camera while pinching
    CAM_VEL.lastWristAngle=null;
    return;
  }else{
    if(DRAG.active){DRAG.active=false;pH();toast('Element placed ✓');}
    DRAG.objId=null;
  }

  // ─── TWO FINGERS: smooth orbit ONLY ─────────────────────
  //  Wrist roll → Y rotation (horizontal)
  //  Index finger Y velocity → X rotation (vertical tilt)
  //  NO camera reset here — that's moved to two-hand gesture
  if(gest==='two'){
    var wa=Math.atan2(PLM[9].y-PLM[0].y,PLM[9].x-PLM[0].x);
    if(CAM_VEL.lastWristAngle!==null){
      var dA=wa-CAM_VEL.lastWristAngle;
      // Wrap to [-π, π]
      if(dA>Math.PI)dA-=2*Math.PI;if(dA<-Math.PI)dA+=2*Math.PI;
      // Smooth: blend into velocity
      CAM_VEL.orbitY=CAM_VEL.orbitY*.6+dA*1.0*.4;
      // Vertical from finger position change (HPOS.vy scaled)
      CAM_VEL.orbitX=CAM_VEL.orbitX*.6+HPOS.vy*1.6*.4;
    }
    CAM_VEL.lastWristAngle=wa;
    // Apply smoothed orbit
    S.cam.rotY+=CAM_VEL.orbitY;
    S.cam.rotX=Math.max(-Math.PI*.48,Math.min(Math.PI*.48,S.cam.rotX+CAM_VEL.orbitX));
    // Stop pan while orbiting
    CAM_VEL.panX=0;CAM_VEL.panY=0;
    return;
  }else{
    // Orbit inertia coast when not orbiting
    CAM_VEL.orbitY*=.88;CAM_VEL.orbitX*=.88;
    S.cam.rotY+=CAM_VEL.orbitY;
    S.cam.rotX=Math.max(-Math.PI*.48,Math.min(Math.PI*.48,S.cam.rotX+CAM_VEL.orbitX));
    if(gest!=='two')CAM_VEL.lastWristAngle=null;
  }

  // ─── PALM: pan ONLY — completely separate from camera reset ─
  //  Delta from previous wrist position → pan camera
  //  Camera reset = DEDICATED TWO-HAND gesture (both palms)
  if(gest==='palm'){
    var wx=1-PLM[0].x,wy=PLM[0].y;
    if(CAM_VEL._prevPX!==undefined&&CAM_VEL._prevPX!==null){
      var pdx=(wx-CAM_VEL._prevPX)*innerWidth*1.5;
      var pdy=(wy-CAM_VEL._prevPY)*innerHeight*1.5;
      // Smooth velocity blend
      CAM_VEL.panX=CAM_VEL.panX*.42+pdx*.58;
      CAM_VEL.panY=CAM_VEL.panY*.42+pdy*.58;
      S.cam.x+=CAM_VEL.panX;
      S.cam.y+=CAM_VEL.panY;
    }
    CAM_VEL._prevPX=wx;CAM_VEL._prevPY=wy;
    // Stop orbit while panning
    CAM_VEL.orbitX=0;CAM_VEL.orbitY=0;CAM_VEL.lastWristAngle=null;
    return;
  }else{
    // Pan inertia coast
    CAM_VEL.panX*=.88;CAM_VEL.panY*=.88;
    if(Math.abs(CAM_VEL.panX)>.2||Math.abs(CAM_VEL.panY)>.2){S.cam.x+=CAM_VEL.panX;S.cam.y+=CAM_VEL.panY;}
    else{CAM_VEL.panX=0;CAM_VEL.panY=0;}
    CAM_VEL._prevPX=null;CAM_VEL._prevPY=null;
  }

  // ─── SHAKA: zoom in/out by spread ────────────────────────
  //  Thumb tip to pinky tip distance change → zoom
  //  Spread = zoom in, close = zoom out
  if(gest==='shaka'){
    var tTip=PLM[4],pTip=PLM[20];
    var dist=Math.hypot((tTip.x-pTip.x)*innerWidth,(tTip.y-pTip.y)*innerHeight);
    if(SHAKA_PREV_DIST!==null){
      var ratio=Math.max(.92,Math.min(1.08,dist/SHAKA_PREV_DIST));
      var oldZ=S.cam.zoom,nZ=Math.max(.04,Math.min(18,oldZ*ratio));
      var vcx=innerWidth/2+S.cam.x,vcy=innerHeight/2+S.cam.y-50;
      S.cam.x+=(cx-vcx)*(1-nZ/oldZ);S.cam.y+=(cy-vcy)*(1-nZ/oldZ);
      S.cam.zoom=nZ;
      // Visual
      HX.beginPath();HX.moveTo((1-tTip.x)*innerWidth,tTip.y*innerHeight);HX.lineTo((1-pTip.x)*innerWidth,pTip.y*innerHeight);
      HX.strokeStyle='rgba(0,255,204,.5)';HX.lineWidth=2;HX.setLineDash([4,3]);HX.stroke();HX.setLineDash([]);
      HX.fillStyle='rgba(0,255,204,.65)';HX.font='8px Courier New';HX.textAlign='center';
      HX.fillText(ratio>1.01?'+ ZOOM IN':ratio<.99?'- ZOOM OUT':'ZOOM',(1-(tTip.x+pTip.x)/2)*innerWidth,(tTip.y+pTip.y)/2*innerHeight-12);
    }
    SHAKA_PREV_DIST=dist;
    return;
  }else SHAKA_PREV_DIST=null;

  // ─── FIST: quick = select all, hold = radial menu ────────
  if(gest==='fist'){
    if(gestChanged)FIST_T=now;
    if(GSM_MAIN.held()>800&&!RO)openRad(cx,cy);
    return;
  }else{if(typeof FIST_T!=='undefined'&&FIST_T&&now-FIST_T<380)selAll();FIST_T=0;}

  // ─── OK: delete selected ─────────────────────────────────
  if(gest==='ok'){
    if(gestChanged&&now-LAST_DELETE>800){delSel();LAST_DELETE=now;}
    return;
  }

  // ─── PEACE: duplicate selected ───────────────────────────
  if(gest==='peace'){
    if(gestChanged&&now-LAST_DUP>800){dupSel();LAST_DUP=now;}
    return;
  }

  // ─── TWO-HAND GESTURES ───────────────────────────────────
  if(lms.length>=2){
    var SLM=lms[1];
    drawSkel(SLM,'idle');

    var g0=GML.predict(PLM).label,g1=GML.predict(SLM).label;

    // BOTH PALMS → Camera reset (replaces the old palm-hold reset)
    if(g0==='palm'&&g1==='palm'){
      // Show reset countdown
      if(!TWO_PALM_T)TWO_PALM_T=now;
      var elapsed=now-TWO_PALM_T;
      var frac=Math.min(1,elapsed/1200);
      var mcx2=(1-PLM[0].x+1-SLM[0].x)/2*innerWidth,mcy2=(PLM[0].y+SLM[0].y)/2*innerHeight;
      HX.beginPath();HX.arc(mcx2,mcy2,30*frac,-Math.PI/2,-Math.PI/2+frac*Math.PI*2);
      HX.strokeStyle='rgba(0,212,255,'+(frac*.6)+')';HX.lineWidth=2;HX.stroke();
      HX.fillStyle='rgba(0,212,255,.5)';HX.font='9px Courier New';HX.textAlign='center';
      HX.fillText(frac<1?'RESET '+(((1-frac)*1.2).toFixed(1))+'s':'RESETTING…',mcx2,mcy2-40);
      if(elapsed>=1200){resetView();TWO_PALM_T=null;toast('Camera reset');}
    }else TWO_PALM_T=null;

    // TWO-HAND SPREAD/PINCH → Zoom
    var wx1=(1-PLM[0].x)*innerWidth,wy1=PLM[0].y*innerHeight;
    var wx2=(1-SLM[0].x)*innerWidth,wy2=SLM[0].y*innerHeight;
    var twoHandDist=Math.hypot(wx1-wx2,wy1-wy2);
    if(typeof PREV_TWO_DIST!=='undefined'&&PREV_TWO_DIST>20){
      var r2=Math.max(.9,Math.min(1.1,twoHandDist/PREV_TWO_DIST));
      var mwx=(wx1+wx2)/2,mwy=(wy1+wy2)/2;
      var oldZ2=S.cam.zoom,nZ2=Math.max(.04,Math.min(18,oldZ2*r2));
      var vcx2=innerWidth/2+S.cam.x,vcy2=innerHeight/2+S.cam.y-50;
      S.cam.x+=(mwx-vcx2)*(1-nZ2/oldZ2);S.cam.y+=(mwy-vcy2)*(1-nZ2/oldZ2);
      S.cam.zoom=nZ2;
    }
    PREV_TWO_DIST=twoHandDist;
    // Visualize
    HX.beginPath();HX.moveTo(wx1,wy1);HX.lineTo(wx2,wy2);HX.strokeStyle='rgba(0,212,255,.18)';HX.lineWidth=1.2;HX.setLineDash([4,5]);HX.stroke();HX.setLineDash([]);
  }else{PREV_TWO_DIST=0;TWO_PALM_T=null;}
}
var FIST_T=0,TWO_PALM_T=null,PREV_TWO_DIST=0;

// ══════════════════════════════════════
//  LAYER 5: AI ENGINE
//  ai/engine.js (inlined)
// ══════════════════════════════════════

var KNOWLEDGE={
  en1990:'EN 1990: ULS=1.35G+1.50Q. Deflection limit L/250. M=wL²/8, V=wL/2, δ=5wL⁴/384EI.',
  materials:'Concrete C30: E=33GPa, fck=30MPa. Steel S355: E=210GPa, fy=355MPa. Timber GL24: E=11.5GPa. Masonry: E=6GPa.',
  beam:'Beam depth: h≈span/20 steel, span/15 concrete. Wel=M×γM0/fy. Check σ=M/Wel≤fy, δ≤L/250, τ=1.5V/A.',
  column:'Column: λ=Lcr/i, χ from EN1993. Interaction: N/Nc+M/Mc≤1.0.',
  loads:'Office Q=3kN/m². Residential Q=2kN/m². Industrial Q=7.5kN/m². Dead: slab≈4.5kN/m²+1.5 finishes.',
  foundations:'Pad footing: A=N/q. q: rock=600kPa, gravel=200kPa, clay=75kPa. Depth≥500mm.',
};

// ARCAI Neural Engine
// ═══════════════════════════════════════════════════════════════════════
// ARCFORM NEURAL AI — Fully self-contained, no API, runs in-browser
// ═══════════════════════════════════════════════════════════════════════
//
// Architecture:
//   NLP Pipeline   → tokenise → embed → classify intent + entities
//   Structure KB   → 200+ named structures with parametric generators
//   Spatial Engine → constraint-based 3D layout solver
//   TF.js Network  → intent classifier (trainable, localStorage)
//   Generative     → procedural geometry for any classified type
//
// Zero external dependencies beyond TF.js (already loaded for gestures)
// ═══════════════════════════════════════════════════════════════════════
