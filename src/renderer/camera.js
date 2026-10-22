// ════════════════════════════════════════════
//  ARCFORM AI — renderer/camera.js
//  Smooth orbit + pan + zoom with proper inertia
//  No jitter, no auto-zoom-out, pinch-to-zoom
// ════════════════════════════════════════════

var CameraController = (function() {
  var _state = null; // reference to S.cam set during init

  var MIN_ZOOM = 0.05, MAX_ZOOM = 15;
  var ORBIT_SENS = 0.0038;   // per pixel — reduced from buggy 0.0065
  var ZOOM_LERP  = 0.14;     // smooth zoom fraction per frame
  var DECAY      = 0.88;     // inertia decay per frame

  var targetZoom = 1.0;
  var isDragging = false;
  var drag = { x:0,y:0, rotX:0,rotY:0, panX:0,panY:0, btn:0 };
  var last = { x:0,y:0,t:0 };
  var vel  = { rotX:0,rotY:0,panX:0,panY:0 };
  var inertia = false;
  var canvas = null;

  // Pinch state for touch
  var pinch = { active:false, dist:0, zoom:1 };

  function clamp(v,a,b){ return v<a?a:v>b?b:v; }

  function onDown(e){
    isDragging = true;
    inertia = false;
    vel.rotX = vel.rotY = vel.panX = vel.panY = 0;
    drag = {
      x: e.clientX, y: e.clientY,
      rotX: _state.rotX, rotY: _state.rotY,
      panX:  _state.x,   panY:  _state.y,
      btn: e.button
    };
    last = { x: e.clientX, y: e.clientY, t: performance.now() };
    e.preventDefault && e.preventDefault();
  }

  function onMove(e){
    if(!isDragging) return;
    var dx = e.clientX - drag.x;
    var dy = e.clientY - drag.y;
    var ddx = e.clientX - last.x;
    var ddy = e.clientY - last.y;
    var dt  = Math.max(4, performance.now() - last.t);
    last = { x: e.clientX, y: e.clientY, t: performance.now() };

    if(drag.btn === 2 || e.shiftKey || e.ctrlKey){
      // Pan
      _state.x = drag.panX + dx;
      _state.y = drag.panY + dy;
      vel.panX = ddx * 0.75;
      vel.panY = ddy * 0.75;
    } else {
      // Orbit
      _state.rotY = drag.rotY + dx * ORBIT_SENS;
      _state.rotX = clamp(drag.rotX + dy * ORBIT_SENS * 0.75, -Math.PI*0.48, Math.PI*0.48);
      // Velocity scaled by speed (pixels/ms * frame_ms)
      vel.rotY = (ddx / dt) * 14 * ORBIT_SENS;
      vel.rotX = (ddy / dt) * 14 * ORBIT_SENS * 0.75;
    }
  }

  function onUp(e){
    if(isDragging && (Math.abs(vel.rotY)>0.0002 || Math.abs(vel.rotX)>0.0002 ||
       Math.abs(vel.panX)>0.3 || Math.abs(vel.panY)>0.3)){
      inertia = true;
    }
    isDragging = false;
  }

  function onWheel(e){
    e.preventDefault();
    // Always zoom toward current view center (no cursor-offset shift — avoids snap-out bug)
    var factor = e.deltaY > 0 ? 0.88 : 1.14;
    targetZoom = clamp(targetZoom * factor, MIN_ZOOM, MAX_ZOOM);
    // Prevent getting stuck: if current zoom is way outside, nudge it back in range
    if(_state.zoom < MIN_ZOOM) _state.zoom = MIN_ZOOM * 1.05;
    if(_state.zoom > MAX_ZOOM) _state.zoom = MAX_ZOOM * 0.95;
  }

  var _pinchStartDist = 0, _pinchStartZoom = 1;

  function onTouchStart(e){
    if(e.touches.length === 1){
      onDown({ clientX:e.touches[0].clientX, clientY:e.touches[0].clientY,
               button:0, preventDefault: function(){ e.preventDefault(); } });
    } else if(e.touches.length === 2){
      isDragging = false;
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      _pinchStartDist  = Math.hypot(dx,dy);
      _pinchStartZoom  = targetZoom;
    }
    e.preventDefault();
  }

  function onTouchMove(e){
    e.preventDefault();
    if(e.touches.length === 1){
      onMove({ clientX:e.touches[0].clientX, clientY:e.touches[0].clientY,
               shiftKey:false, ctrlKey:false });
    } else if(e.touches.length === 2 && _pinchStartDist > 0){
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.hypot(dx,dy);
      targetZoom = clamp(_pinchStartZoom * (dist / _pinchStartDist), MIN_ZOOM, MAX_ZOOM);
    }
  }

  function onTouchEnd(e){ onUp({}); }

  // Called every render frame — apply inertia + smooth zoom
  function update(){
    // Smooth zoom (never snaps, resolves "stuck zoom" bug)
    var dz = targetZoom - _state.zoom;
    if(Math.abs(dz) > 0.0005){
      _state.zoom += dz * ZOOM_LERP;
    } else {
      _state.zoom = targetZoom;
    }

    // Inertia
    if(inertia && !isDragging){
      vel.rotY  *= DECAY;  vel.rotX  *= DECAY;
      vel.panX  *= DECAY;  vel.panY  *= DECAY;
      _state.rotY += vel.rotY;
      _state.rotX  = clamp(_state.rotX + vel.rotX, -Math.PI*0.48, Math.PI*0.48);
      _state.x    += vel.panX;
      _state.y    += vel.panY;
      if(Math.abs(vel.rotY)<0.00005 && Math.abs(vel.rotX)<0.00005 &&
         Math.abs(vel.panX)<0.05    && Math.abs(vel.panY)<0.05) inertia = false;
    }

    // Update zoom display
    var zm = document.getElementById('ts-zm');
    if(zm) zm.textContent = _state.zoom.toFixed(2) + '×';
  }

  function init(canvasEl, camState){
    canvas  = canvasEl;
    _state  = camState;   // reference to S.cam
    targetZoom = _state.zoom;

    canvas.addEventListener('mousedown',   onDown,       false);
    window.addEventListener('mousemove',   onMove,       false);
    window.addEventListener('mouseup',     onUp,         false);
    canvas.addEventListener('wheel',       onWheel,      { passive:false });
    canvas.addEventListener('touchstart',  onTouchStart, { passive:false });
    canvas.addEventListener('touchmove',   onTouchMove,  { passive:false });
    canvas.addEventListener('touchend',    onTouchEnd,   false);
    canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });
  }

  function reset(){
    _state.rotX = 0.40;  _state.rotY = 0.48;
    _state.x    = 0;     _state.y    = 0;
    targetZoom  = 1.0;   _state.zoom = 1.0;
    vel.rotX = vel.rotY = vel.panX = vel.panY = 0;
    inertia = false;
  }

  function setZoom(z){ targetZoom = clamp(z, MIN_ZOOM, MAX_ZOOM); }

  return { init, update, reset, setZoom };
})();
