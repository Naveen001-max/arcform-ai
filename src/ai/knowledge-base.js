// ═══════════════════════════════════════════════════
//  ARCFORM AI — ai/knowledge-base.js
//  Parametric structure generators
//  FOOTOVER_BRIDGE (with stairs), ICONIC_BRIDGE,
//  SUSPENSION_BRIDGE, EIFFEL, DOME, STADIUM ...
// ═══════════════════════════════════════════════════

var KB = {

  EIFFEL_TOWER: function(e){
    var h=e.height||300, base=e.span||125, sc=Math.min(h/300,base/125);
    var acts=[];
    // 4 massive base legs (A-frame shape)
    var legW=5*sc, legH=h*0.25;
    var offsets=[[0,0],[base-legW,0],[0,base-legW],[base-legW,base-legW]];
    offsets.forEach(function(o,i){
      acts.push({type:'column',x:o[0],y:0,z:o[1],width:legW,height:legH,depth:legW,material:'steel',label:'Leg '+(i+1)});
    });
    // First platform (arched girders connecting legs)
    acts.push({type:'beam',x:0,y:legH,z:base/2,width:base,height:2*sc,depth:2*sc,length:base,material:'steel',label:'First Platform'});
    acts.push({type:'beam',x:base/2,y:legH,z:0,width:2*sc,height:2*sc,depth:base,length:2*sc,material:'steel',label:'First Platform 2'});
    // Cross bracing at levels
    [0.1,0.15,0.2].forEach(function(frac,i){
      var y=h*frac, w=base*(1-frac*3);
      acts.push({type:'beam',x:(base-w)/2,y:y,z:(base-w)/2,width:w,height:sc,depth:sc,length:w,material:'steel',label:'Brace L'+(i+1)});
      acts.push({type:'beam',x:(base-w)/2,y:y,z:(base-w)/2,width:sc,height:sc,depth:w,length:sc,material:'steel',label:'Brace L'+(i+1)+'R'});
    });
    // Second floor
    var s2y=h*0.38, s2w=base*0.35;
    acts.push({type:'slab',x:(base-s2w)/2,y:s2y,z:(base-s2w)/2,width:s2w,height:1.5*sc,depth:s2w,material:'steel',label:'2nd Floor'});
    // Tapering tower (4 columns converging)
    var steps=6;
    for(var i=0;i<steps;i++){
      var frac=i/steps;
      var tw=Math.max(1.5*sc, (base*0.08)*(1-frac));
      var ty=h*(0.4+frac*0.45);
      var toff=(base-tw*1.4)/2;
      acts.push({type:'column',x:toff,y:ty,z:toff,width:tw,height:h*0.45/steps,depth:tw,material:'steel',label:'Tower Seg '+(i+1)});
    }
    // Top spire
    acts.push({type:'column',x:base/2-.5*sc,y:h*0.85,z:base/2-.5*sc,width:sc,height:h*0.15,depth:sc,material:'steel',label:'Spire'});
    // Foundation blocks
    offsets.forEach(function(o,i){
      acts.push({type:'foundation',x:o[0]-1,y:-.8,z:o[1]-1,width:legW+2,height:.8,depth:legW+2,material:'concrete',label:'Foundation '+(i+1)});
    });
    return acts;
  },

  SUSPENSION_BRIDGE: function(e){
    var span=e.span||200, h=e.height||Math.max(40,span/4), deck=e.deckH||0;
    var acts=[];
    // Abutments
    acts.push({type:'foundation',x:-8,y:-.8,z:-4,width:10,height:.8,depth:8,material:'concrete',label:'Abutment L'});
    acts.push({type:'foundation',x:span-2,y:-.8,z:-4,width:10,height:.8,depth:8,material:'concrete',label:'Abutment R'});
    // Two main towers
    [[0,0],[span,0]].forEach(function(pos,i){
      acts.push({type:'column',x:pos[0]-1.2,y:0,z:-2,width:2.4,height:h,depth:2.4,material:'concrete',label:'Tower '+(i+1)+'L'});
      acts.push({type:'column',x:pos[0]-1.2,y:0,z:1.5,width:2.4,height:h,depth:2.4,material:'concrete',label:'Tower '+(i+1)+'R'});
      // Cross beam at tower top
      acts.push({type:'beam',x:pos[0]-1.2,y:h,z:-2,width:2.4,height:1.5,depth:5.9,material:'steel',label:'Tower Cap '+(i+1)});
    });
    // Main cables with hangers
    acts.push({type:'cable',x:0,y:h,z:-1.5,length:span,height:h*0.6,material:'steel',label:'Main Cable L'});
    acts.push({type:'cable',x:0,y:h,z:1.5,length:span,height:h*0.6,material:'steel',label:'Main Cable R'});
    // Deck
    acts.push({type:'slab',x:0,y:deck,z:-3.5,width:span,height:.3,depth:7,material:'concrete',label:'Bridge Deck'});
    // Handrails
    acts.push({type:'wall',x:0,y:deck+.3,z:-3.5,width:span,height:1.2,depth:.15,material:'steel',label:'Handrail L'});
    acts.push({type:'wall',x:0,y:deck+.3,z:3.35,width:span,height:1.2,depth:.15,material:'steel',label:'Handrail R'});
    return acts;
  },

  PYRAMID: function(e){
    var base=e.span||100, h=e.height||base*0.6, steps=6;
    var acts=[];
    acts.push({type:'foundation',x:-2,y:-.6,z:-2,width:base+4,height:.6,depth:base+4,material:'concrete',label:'Foundation'});
    for(var i=0;i<steps;i++){
      var frac=i/steps,
          w=base*(1-frac),
          y=h*(frac),
          off=(base-w)/2;
      acts.push({type:'slab',x:off,y:y,z:off,width:w,height:h/steps,depth:w,material:'masonry',label:'Level '+(i+1)});
    }
    // Capstone
    acts.push({type:'column',x:base/2-.5,y:h*.95,z:base/2-.5,width:1,height:h*.05,depth:1,material:'masonry',label:'Capstone'});
    return acts;
  },

  DOME: function(e){
    var r=e.span||40, h=e.height||r*0.55;
    var acts=[];
    acts.push({type:'foundation',x:-r/2-2,y:-.6,z:-r/2-2,width:r+4,height:.6,depth:r+4,material:'concrete',label:'Ring Foundation'});
    // Drum walls
    acts.push({type:'wall',x:0,y:0,z:0,width:r,height:h*.3,depth:.35,material:'masonry',label:'Drum N'});
    acts.push({type:'wall',x:0,y:0,z:r-.35,width:r,height:h*.3,depth:.35,material:'masonry',label:'Drum S'});
    acts.push({type:'wall',x:0,y:0,z:0,width:.35,height:h*.3,depth:r,material:'masonry',label:'Drum W'});
    acts.push({type:'wall',x:r-.35,y:0,z:0,width:.35,height:h*.3,depth:r,material:'masonry',label:'Drum E'});
    // Central dome cap (sphere geometry)
    acts.push({type:'dome',x:r/2-r/2,y:h*.3,z:r/2-r/2,width:r,height:h*.7,depth:r,material:'masonry',label:'Dome Cap'});
    return acts;
  },

  CASTLE: function(e){
    var w=e.span||60, h=e.height||15;
    var acts=[];
    acts.push({type:'foundation',x:-1,y:-.6,z:-1,width:w+2,height:.6,depth:w+2,material:'masonry',label:'Foundation'});
    // 4 corner towers
    [[0,0],[w-6,0],[0,w-6],[w-6,w-6]].forEach(function(c,i){
      acts.push({type:'column',x:c[0],y:0,z:c[1],width:6,height:h+3,depth:6,material:'masonry',label:'Tower '+(i+1)});
    });
    // Curtain walls
    acts.push({type:'wall',x:0,y:0,z:0,width:w,height:h,depth:.8,material:'masonry',label:'Wall N'});
    acts.push({type:'wall',x:0,y:0,z:w-.8,width:w,height:h,depth:.8,material:'masonry',label:'Wall S'});
    acts.push({type:'wall',x:0,y:0,z:0,width:.8,height:h,depth:w,material:'masonry',label:'Wall W'});
    acts.push({type:'wall',x:w-.8,y:0,z:0,width:.8,height:h,depth:w,material:'masonry',label:'Wall E'});
    // Keep (central tower)
    acts.push({type:'column',x:w/2-4,y:0,z:w/2-4,width:8,height:h*1.6,depth:8,material:'masonry',label:'Keep'});
    // Gate arch
    acts.push({type:'arch',x:w/2-3,y:0,z:-.2,length:6,height:5,material:'masonry',label:'Gate Arch'});
    // Battlements
    for(var i=0;i<4;i++){
      acts.push({type:'column',x:i*(w/3),y:h,z:0,width:1.5,height:1.5,depth:.8,material:'masonry',label:'Battlement'});
    }
    return acts;
  },

  STADIUM: function(e){
    var r=e.span||80, h=e.height||25, segs=12;
    var acts=[];
    acts.push({type:'foundation',x:-r/2-2,y:-.6,z:-r/2-2,width:r+4,height:.6,depth:r+4,material:'concrete',label:'Ring Foundation'});
    // Seating tiers (stepped slabs around perimeter)
    for(var tier=0;tier<3;tier++){
      var tr=r*0.35+tier*10, tw=8;
      for(var i=0;i<segs;i++){
        var ang=i*(Math.PI*2/segs);
        var cx=r/2+Math.cos(ang)*tr, cz=r/2+Math.sin(ang)*tr;
        acts.push({type:'slab',x:cx-tw/2,y:tier*6,z:cz-tw/2,width:tw,height:1,depth:tw,material:'concrete',
          rotation:{x:0,y:ang,z:0},label:'Seating T'+(tier+1)+' S'+i});
      }
    }
    // Roof columns
    for(var i=0;i<8;i++){
      var ang2=i*(Math.PI*2/8);
      var cx2=r/2+Math.cos(ang2)*r*0.45, cz2=r/2+Math.sin(ang2)*r*0.45;
      acts.push({type:'column',x:cx2-.8,y:0,z:cz2-.8,width:1.6,height:h,depth:1.6,material:'steel',label:'Roof Col '+i});
    }
    // Playing field
    acts.push({type:'slab',x:r/2-30,y:.05,z:r/2-20,width:60,height:.05,depth:40,material:'masonry',label:'Playing Field'});
    return acts;
  },

  MOSQUE: function(e){
    var w=e.span||30, h=e.height||15;
    var acts=[];
    acts.push({type:'foundation',x:-1,y:-.6,z:-1,width:w+2,height:.6,depth:w+2,material:'concrete'});
    // Main hall
    acts.push({type:'slab',x:0,y:0,z:0,width:w,height:.2,depth:w,material:'masonry',label:'Floor'});
    // Perimeter columns
    for(var i=0;i<4;i++)for(var j=0;j<4;j++){
      if(i%3===0||j%3===0) acts.push({type:'column',x:i*(w/3),y:0,z:j*(w/3),width:.5,height:h*.7,depth:.5,material:'masonry',label:'Col'});
    }
    // Central dome
    acts.push({type:'arch',x:w/4,y:h*.7,z:w/4,length:w*.5,height:h*.3,material:'masonry',label:'Dome N-S'});
    acts.push({type:'arch',x:w/4,y:h*.7,z:w/4,length:w*.5,height:h*.3,material:'masonry',
      rotation:{x:0,y:1.5708,z:0},label:'Dome E-W'});
    // Two minarets
    [[0,0],[w-2,0]].forEach(function(c,i){
      acts.push({type:'column',x:c[0],y:0,z:c[1],width:2,height:h*1.6,depth:2,material:'masonry',label:'Minaret '+(i+1)});
      acts.push({type:'arch',x:c[0]-.5,y:h*1.6,z:c[1]-.5,length:3,height:2,material:'masonry',label:'Min Cap '+(i+1)});
    });
    // Arched windows (walls with arch tops)
    acts.push({type:'wall',x:0,y:0,z:0,width:w,height:h*.7,depth:.3,material:'masonry',label:'Wall N'});
    acts.push({type:'wall',x:0,y:0,z:w-.3,width:w,height:h*.7,depth:.3,material:'masonry',label:'Wall S'});
    return acts;
  },

  COLOSSEUM: function(e){
    var r=e.span||80, h=e.height||50, tiers=4;
    var acts=[], segs=16;
    acts.push({type:'foundation',x:-r/2-2,y:-.6,z:-r/2-2,width:r+4,height:.6,depth:r+4,material:'masonry'});
    for(var t=0;t<tiers;t++){
      var tr=r/2-t*3;
      for(var i=0;i<segs;i++){
        var ang=i*(Math.PI*2/segs);
        var cx=r/2+Math.cos(ang)*tr, cz=r/2+Math.sin(ang)*tr;
        acts.push({type:'column',x:cx-.6,y:t*(h/tiers),z:cz-.6,width:1.2,height:h/tiers,depth:1.2,material:'masonry',label:'Pier T'+t});
        acts.push({type:'arch',x:cx-2.5,y:t*(h/tiers),z:cz,length:5,height:h/tiers*.8,material:'masonry',
          rotation:{x:0,y:ang,z:0},label:'Arch T'+t+'S'+i});
      }
    }
    return acts;
  },

  HOUSE: function(e){
    var w=e.span||8, d=e.depth||6, h=e.height||3, fl=e.floors||1;
    var acts=[];
    acts.push({type:'foundation',x:-.5,y:-.55,z:-.5,width:w+1,height:.45,depth:d+1,material:'concrete',label:'Foundation'});
    acts.push({type:'slab',x:0,y:0,z:0,width:w,height:.15,depth:d,material:'concrete',label:'Ground Slab'});
    for(var f=0;f<fl;f++){
      var fy=f*h;
      // 4 walls
      acts.push({type:'wall',x:0,y:fy,z:0,width:w,height:h,depth:.22,material:'masonry',label:'Wall F'+(f+1)+' Front'});
      acts.push({type:'wall',x:0,y:fy,z:d-.22,width:w,height:h,depth:.22,material:'masonry',label:'Wall F'+(f+1)+' Back'});
      acts.push({type:'wall',x:0,y:fy,z:0,width:.22,height:h,depth:d,material:'masonry',label:'Wall F'+(f+1)+' L'});
      acts.push({type:'wall',x:w-.22,y:fy,z:0,width:.22,height:h,depth:d,material:'masonry',label:'Wall F'+(f+1)+' R'});
      // Corner columns
      [[0,0],[w-.3,0],[0,d-.3],[w-.3,d-.3]].forEach(function(c,i){
        acts.push({type:'column',x:c[0],y:fy,z:c[1],width:.3,height:h,depth:.3,material:'concrete',label:'Col'});
      });
      // Floor slab (not ground)
      if(f>0) acts.push({type:'slab',x:0,y:fy,z:0,width:w,height:.15,depth:d,material:'concrete',label:'Slab F'+f});
    }
    // Roof arch
    acts.push({type:'arch',x:0,y:fl*h,z:d/2,length:w,height:Math.max(1.5,w/4),material:'concrete',label:'Roof Arch'});
    acts.push({type:'slab',x:0,y:fl*h,z:0,width:w,height:.18,depth:d,material:'concrete',label:'Roof Slab'});
    return acts;
  },

  SKYSCRAPER: function(e){
    var w=e.span||20, d=e.depth||20, fl=e.floors||30, fh=e.floorH||4;
    var acts=[];
    acts.push({type:'foundation',x:-2,y:-.8,z:-2,width:w+4,height:.8,depth:d+4,material:'concrete',label:'Foundation'});
    acts.push({type:'slab',x:0,y:0,z:0,width:w,height:.2,depth:d,material:'concrete',label:'Ground Slab'});
    // Core columns (4 mega-columns)
    var cx=[[0,0],[w-1,0],[0,d-1],[w-1,d-1]];
    cx.forEach(function(c,i){
      acts.push({type:'column',x:c[0],y:0,z:c[1],width:1,height:fl*fh,depth:1,material:'steel',label:'Core Col '+(i+1)});
    });
    // Floors every 4 levels
    for(var f=1;f<=fl;f+=4){
      var fy=f*fh;
      acts.push({type:'slab',x:0,y:fy,z:0,width:w,height:.2,depth:d,material:'concrete',label:'Floor '+(f)});
      acts.push({type:'beam',x:0,y:fy,z:0,width:w,height:.4,depth:.3,material:'steel',label:'Beam F'+f});
      acts.push({type:'beam',x:0,y:fy,z:0,width:.3,height:.4,depth:d,material:'steel',label:'Beam F'+f+'T'});
    }
    // Glass facade (4 walls, thin)
    var th=.12;
    acts.push({type:'wall',x:0,y:0,z:0,width:w,height:fl*fh,depth:th,material:'glass',label:'Facade N'});
    acts.push({type:'wall',x:0,y:0,z:d-th,width:w,height:fl*fh,depth:th,material:'glass',label:'Facade S'});
    acts.push({type:'wall',x:0,y:0,z:0,width:th,height:fl*fh,depth:d,material:'glass',label:'Facade W'});
    acts.push({type:'wall',x:w-th,y:0,z:0,width:th,height:fl*fh,depth:d,material:'glass',label:'Facade E'});
    // Crown/spire
    acts.push({type:'column',x:w/2-.5,y:fl*fh,z:d/2-.5,width:1,height:fh*3,depth:1,material:'steel',label:'Spire'});
    return acts;
  },

  WAREHOUSE: function(e){
    var w=e.span||50, d=e.depth||30, h=e.height||8, bays=Math.ceil(w/10);
    var acts=[];
    acts.push({type:'foundation',x:-1,y:-.6,z:-1,width:w+2,height:.6,depth:d+2,material:'concrete'});
    acts.push({type:'slab',x:0,y:0,z:0,width:w,height:.2,depth:d,material:'concrete',label:'Floor'});
    // Portal frames every 10m
    for(var b=0;b<=bays;b++){
      var bx=b*(w/bays);
      acts.push({type:'column',x:bx,y:0,z:0,width:.4,height:h,depth:.4,material:'steel',label:'Col L B'+b});
      acts.push({type:'column',x:bx,y:0,z:d-.4,width:.4,height:h,depth:.4,material:'steel',label:'Col R B'+b});
      acts.push({type:'beam',x:bx,y:h,z:0,width:.3,height:.5,depth:d,material:'steel',label:'Rafter B'+b});
    }
    // Purlins (beams along length)
    [0,d/2,d].forEach(function(z){
      acts.push({type:'beam',x:0,y:h+.3,z:z,width:w,height:.25,depth:.25,material:'steel',label:'Purlin'});
    });
    // Cladding walls
    acts.push({type:'wall',x:0,y:0,z:0,width:w,height:h,depth:.12,material:'steel',label:'Cladding N'});
    acts.push({type:'wall',x:0,y:0,z:d-.12,width:w,height:h,depth:.12,material:'steel',label:'Cladding S'});
    acts.push({type:'wall',x:0,y:0,z:0,width:.12,height:h,depth:d,material:'steel',label:'Cladding W'});
    acts.push({type:'wall',x:w-.12,y:0,z:0,width:.12,height:h,depth:d,material:'steel',label:'Cladding E'});
    return acts;
  },

  SOCIETY: function(e){
    var totalM=e.areaSqM||Math.pow(e.span||200,2);
    var sc=Math.min(1,180/Math.sqrt(totalM)); // scale to fit 180m display
    var side=Math.sqrt(totalM)*sc;
    var pad=Math.max(3,side*0.04);
    var inner=side-pad*2;
    var blocks=e.blocks||Math.max(3,Math.round(inner/30));
    var bCols=Math.ceil(Math.sqrt(blocks));
    var bRows=Math.ceil(blocks/bCols);
    var cellW=inner/bCols, cellD=inner/bRows;
    var roadW=Math.max(4,cellW*0.18);
    var bW=cellW*0.70, bD=cellD*0.62;
    var fl=e.floors||4, fh=3;
    var acts=[];

    // Boundary wall
    acts.push({type:'wall',x:0,y:0,z:0,width:side,height:2.5,depth:.22,material:'masonry',label:'Boundary N'});
    acts.push({type:'wall',x:0,y:0,z:side-.22,width:side,height:2.5,depth:.22,material:'masonry',label:'Boundary S'});
    acts.push({type:'wall',x:0,y:0,z:0,width:.22,height:2.5,depth:side,material:'masonry',label:'Boundary W'});
    acts.push({type:'wall',x:side-.22,y:0,z:0,width:.22,height:2.5,depth:side,material:'masonry',label:'Boundary E'});

    // Main gate
    acts.push({type:'column',x:side/2-2,y:0,z:-.2,width:.5,height:4.5,depth:.5,material:'concrete',label:'Gate Post L'});
    acts.push({type:'column',x:side/2+1.5,y:0,z:-.2,width:.5,height:4.5,depth:.5,material:'concrete',label:'Gate Post R'});
    acts.push({type:'beam',x:side/2-2,y:4.5,z:-.2,width:4,height:.4,depth:.4,material:'steel',label:'Gate Beam'});

    // Roads
    for(var r=0;r<=bRows;r++){
      acts.push({type:'slab',x:pad,y:.02,z:pad+r*cellD-roadW/2,width:inner,height:.1,depth:roadW,material:'concrete',label:'Road H'+(r+1)});
    }
    for(var c=0;c<=bCols;c++){
      acts.push({type:'slab',x:pad+c*cellW-roadW/2,y:.02,z:pad,width:roadW,height:.1,depth:inner,material:'concrete',label:'Road V'+(c+1)});
    }

    // Residential blocks
    for(var rb=0;rb<bRows;rb++) for(var cb=0;cb<bCols;cb++){
      if(rb*bCols+cb>=blocks) break;
      var bx=pad+cb*cellW+roadW/2, bz=pad+rb*cellD+roadW/2;
      var bn=rb*bCols+cb+1;
      acts.push({type:'foundation',x:bx-.5,y:-.55,z:bz-.5,width:bW+1,height:.45,depth:bD+1,material:'concrete',label:'Block '+bn+' Fdn'});
      // Corner columns full height
      [[bx,bz],[bx+bW-.4,bz],[bx,bz+bD-.4],[bx+bW-.4,bz+bD-.4]].forEach(function(p){
        acts.push({type:'column',x:p[0],y:0,z:p[1],width:.4,height:fl*fh,depth:.4,material:'concrete',label:'Col B'+bn});
      });
      // One slab per floor
      for(var f=1;f<=fl;f++){
        acts.push({type:'slab',x:bx,y:f*fh,z:bz,width:bW,height:.18,depth:bD,material:'concrete',label:'Slab B'+bn+' F'+f});
      }
      // Ground floor walls
      acts.push({type:'wall',x:bx,y:0,z:bz,width:bW,height:fh,depth:.22,material:'masonry',label:'Block '+bn+' Wall'});
      acts.push({type:'wall',x:bx,y:0,z:bz+bD-.22,width:bW,height:fh,depth:.22,material:'masonry',label:'Block '+bn+' Wall B'});
    }

    // Gardens between blocks
    acts.push({type:'slab',x:pad,y:.05,z:pad,width:bW*.6,height:.1,depth:bD*.6,material:'masonry',label:'Garden 1'});
    if(bCols>1) acts.push({type:'slab',x:pad+inner-bW*.6,y:.05,z:pad,width:bW*.6,height:.1,depth:bD*.6,material:'masonry',label:'Garden 2'});

    return acts;
  },

  FOOTOVER_BRIDGE: function(e){
    var span=e.span||50, h=Math.max(4,span/10), dw=3;
    var acts=[];
    // Abutment foundations
    acts.push({type:'foundation',x:-2,y:-.6,z:-dw-1,width:5,height:.6,depth:dw+2,material:'concrete',label:'Abutment L'});
    acts.push({type:'foundation',x:span-3,y:-.6,z:-dw-1,width:5,height:.6,depth:dw+2,material:'concrete',label:'Abutment R'});
    // Approach columns
    [-dw/2,dw/2].forEach(function(zo,si){
      [0,span].forEach(function(xo,xi){
        acts.push({type:'column',x:xo,y:0,z:zo,width:.35,height:h,depth:.35,material:'steel',label:'Col '+(xi+1)+' S'+(si+1)});
      });
    });
    // Twin trusses
    acts.push({type:'truss',x:0,y:h,z:-dw/2,length:span,height:h*.5,material:'steel',label:'Truss L'});
    acts.push({type:'truss',x:0,y:h,z:dw/2,length:span,height:h*.5,material:'steel',label:'Truss R'});
    // Deck
    acts.push({type:'slab',x:0,y:h,z:-dw/2,width:span,height:.15,depth:dw,material:'concrete',label:'Deck'});
    // Handrails
    acts.push({type:'wall',x:0,y:h+.15,z:-dw/2,width:span,height:1.1,depth:.1,material:'steel',label:'Handrail L'});
    acts.push({type:'wall',x:0,y:h+.15,z:dw/2-.1,width:span,height:1.1,depth:.1,material:'steel',label:'Handrail R'});
    // ── STAIRS at LEFT END (approach staircase) ──
    var nSt=Math.round(h/0.18), stepD=0.28, stepH=0.18, stairW=dw;
    var stairLen=nSt*stepD;
    acts.push({type:'foundation',x:-stairLen-1,y:-.3,z:-dw/2,width:stairLen+1,height:.3,depth:stairW,material:'concrete',label:'Stair Fdn L'});
    for(var st=0;st<nSt;st++){
      acts.push({type:'slab',x:-stairLen+st*stepD,y:st*stepH,z:-dw/2,width:stepD,height:stepH,depth:stairW,material:'concrete',label:'Step L'+(st+1)});
    }
    // Stair handrails left
    acts.push({type:'wall',x:-stairLen,y:0,z:-dw/2-.05,width:stairLen,height:h+.15,depth:.08,material:'steel',label:'Stair Rail L-L',rotation:{x:0,y:0,z:Math.atan2(h,stairLen)}});
    acts.push({type:'wall',x:-stairLen,y:0,z:dw/2+.05,width:stairLen,height:h+.15,depth:.08,material:'steel',label:'Stair Rail L-R',rotation:{x:0,y:0,z:Math.atan2(h,stairLen)}});
    // ── STAIRS at RIGHT END ──
    acts.push({type:'foundation',x:span,y:-.3,z:-dw/2,width:stairLen+1,height:.3,depth:stairW,material:'concrete',label:'Stair Fdn R'});
    for(var st2=0;st2<nSt;st2++){
      acts.push({type:'slab',x:span+st2*stepD,y:h-(st2*stepH),z:-dw/2,width:stepD,height:stepH,depth:stairW,material:'concrete',label:'Step R'+(st2+1)});
    }
    acts.push({type:'wall',x:span,y:0,z:-dw/2-.05,width:stairLen,height:h+.15,depth:.08,material:'steel',label:'Stair Rail R-L',rotation:{x:0,y:0,z:-Math.atan2(h,stairLen)}});
    acts.push({type:'wall',x:span,y:0,z:dw/2+.05,width:stairLen,height:h+.15,depth:.08,material:'steel',label:'Stair Rail R-R',rotation:{x:0,y:0,z:-Math.atan2(h,stairLen)}});
    return acts;
  },

  ICONIC_BRIDGE: function(e){
    // Iconic cable-stayed bridge with twin diamond towers, viewpoint, and LED lighting
    var span=e.span||700, towerH=span/8, deckY=towerH*0.35, dw=e.deckW||14;
    var acts=[];
    // Abutment foundations
    acts.push({type:'foundation',x:-6,y:-.8,z:-dw/2-2,width:12,height:.8,depth:dw+4,material:'concrete',label:'Abutment L'});
    acts.push({type:'foundation',x:span-6,y:-.8,z:-dw/2-2,width:12,height:.8,depth:dw+4,material:'concrete',label:'Abutment R'});
    // Twin towers at 1/4 and 3/4 span — diamond (A-frame) shape
    [span*0.28, span*0.72].forEach(function(tx,ti){
      var tw=3, tleg=towerH*0.35;
      // Diamond legs (4 inclined columns forming X shape)
      acts.push({type:'column',x:tx-tw,y:0,z:-dw/2-1,width:tw,height:towerH,depth:tw,material:'steel',label:'Tower '+(ti+1)+' Leg1',rotation:{x:0,y:0,z:-0.12}});
      acts.push({type:'column',x:tx,y:0,z:dw/2+1-tw,width:tw,height:towerH,depth:tw,material:'steel',label:'Tower '+(ti+1)+' Leg2',rotation:{x:0,y:0,z:0.12}});
      // Tower crossbeam
      acts.push({type:'beam',x:tx-tw*1.5,y:towerH*0.6,z:-dw/2-1,width:tw*3,height:1.2,depth:dw+2+tw,material:'steel',label:'Tower '+(ti+1)+' XBeam'});
      // Tower top finial/spire
      acts.push({type:'column',x:tx-0.5,y:towerH,z:-dw/2+dw/2-0.5,width:1,height:towerH*0.15,depth:1,material:'steel',label:'Tower '+(ti+1)+' Spire'});
      // Observation deck at 70% tower height
      acts.push({type:'slab',x:tx-4,y:towerH*0.70,z:-dw/2-2,width:8,height:.25,depth:dw+4,material:'concrete',label:'Viewpoint '+(ti+1)});
      acts.push({type:'wall',x:tx-4,y:towerH*0.70+.25,z:-dw/2-2,width:8,height:1.2,depth:.15,material:'glass',label:'Viewpoint Glass '+(ti+1)+'N'});
      acts.push({type:'wall',x:tx-4,y:towerH*0.70+.25,z:dw/2+2-.15,width:8,height:1.2,depth:.15,material:'glass',label:'Viewpoint Glass '+(ti+1)+'S'});
    });
    // Main suspension cables (catenary)
    acts.push({type:'cable',x:0,y:span*0.28*0.95,z:-dw/2+1.5,length:span,height:towerH*0.82,material:'steel',label:'Main Cable N'});
    acts.push({type:'cable',x:0,y:span*0.28*0.95,z:dw/2-1.5,length:span,height:towerH*0.82,material:'steel',label:'Main Cable S'});
    // Stay cables from towers (fan pattern)
    [0.28,0.72].forEach(function(tf,ti){
      var tx=span*tf;
      var nStays=6;
      for(var si=0;si<nStays;si++){
        var stayX=tx+(si-nStays/2+0.5)*(span*0.15/nStays);
        acts.push({type:'column',x:stayX,y:deckY,z:0,width:.12,height:towerH-deckY,depth:.12,material:'steel',label:'Stay '+(ti+1)+'-'+(si+1),rotation:{x:0,y:0,z:Math.atan2(towerH-deckY,stayX-tx)}});
      }
    });
    // Bridge deck (main road slab)
    acts.push({type:'slab',x:0,y:deckY,z:-dw/2,width:span,height:.4,depth:dw,material:'concrete',label:'Main Deck'});
    // Structural edge beams
    acts.push({type:'beam',x:0,y:deckY+.4,z:-dw/2+.2,width:span,height:.6,depth:.35,material:'steel',label:'Edge Beam N'});
    acts.push({type:'beam',x:0,y:deckY+.4,z:dw/2-.55,width:span,height:.6,depth:.35,material:'steel',label:'Edge Beam S'});
    // Pedestrian railings / crash barriers
    acts.push({type:'wall',x:0,y:deckY+1,z:-dw/2,width:span,height:1.2,depth:.15,material:'glass',label:'Railing N'});
    acts.push({type:'wall',x:0,y:deckY+1,z:dw/2-.15,width:span,height:1.2,depth:.15,material:'glass',label:'Railing S'});
    // Lighting masts (every 50m)
    var nMasts=Math.floor(span/50);
    for(var mi=1;mi<nMasts;mi++){
      var mx=mi*(span/nMasts);
      acts.push({type:'column',x:mx,y:deckY+2.2,z:-dw/2-.5,width:.18,height:4.5,depth:.18,material:'steel',label:'Light Mast N'+mi});
      acts.push({type:'column',x:mx,y:deckY+2.2,z:dw/2+.3,width:.18,height:4.5,depth:.18,material:'steel',label:'Light Mast S'+mi});
    }
    // Approach ramps (gentle slope at each end)
    acts.push({type:'slab',x:-30,y:0,z:-dw/2,width:30,height:.35,depth:dw,material:'concrete',label:'Approach L',rotation:{x:0,y:0,z:Math.atan2(deckY,30)}});
    acts.push({type:'slab',x:span,y:deckY,z:-dw/2,width:30,height:.35,depth:dw,material:'concrete',label:'Approach R',rotation:{x:0,y:0,z:-Math.atan2(deckY,30)}});
    return acts;
  },

  ARCH_BRIDGE: function(e){
    var span=e.span||60, rise=e.height||span/4;
    var acts=[];
    acts.push({type:'foundation',x:-3,y:-.8,z:-4,width:6,height:.8,depth:8,material:'concrete'});
    acts.push({type:'foundation',x:span-3,y:-.8,z:-4,width:6,height:.8,depth:8,material:'concrete'});
    acts.push({type:'arch',x:0,y:0,z:0,length:span,height:rise,material:'masonry',label:'Main Arch L'});
    acts.push({type:'arch',x:0,y:0,z:5,length:span,height:rise,material:'masonry',label:'Main Arch R'});
    acts.push({type:'slab',x:0,y:0,z:-.5,width:span,height:.25,depth:6,material:'concrete',label:'Road Deck'});
    return acts;
  },

  FRAME: function(e){
    var span=e.span||6, h=e.height||4, bays=e.bays||1, fl=e.floors||1, mat=e.material||'concrete';
    var acts=[];
    for(var b=0;b<bays;b++) for(var f=0;f<fl;f++){
      var bx=b*span, fy=f*h;
      acts.push({type:'column',x:bx,y:fy,z:0,width:.45,height:h,depth:.45,material:mat,label:'Col B'+b+'F'+f});
      if(b===bays-1) acts.push({type:'column',x:bx+span,y:fy,z:0,width:.45,height:h,depth:.45,material:mat,label:'Col'});
      acts.push({type:'beam',x:bx,y:fy+h,z:0,width:span,height:Math.max(.3,span/20),depth:.35,material:mat,label:'Beam B'+b+'F'+f});
      if(fl>1) acts.push({type:'slab',x:bx,y:fy+h,z:-.5,width:span,height:.18,depth:4,material:'concrete',label:'Slab'});
    }
    if(e.hasFdn) for(var b2=0;b2<=bays;b2++) acts.push({type:'foundation',x:b2*span-.5,y:-.6,z:-.5,width:1,height:.6,depth:1,material:'concrete'});
    return acts;
  },

  GENERIC: function(e){
    // Intelligent fallback: analyse tokens and build the most plausible structure
    var span=e.span||8, h=e.height||4, mat=e.material||'concrete';
    var acts=[];
    acts.push({type:'foundation',x:-.5,y:-.6,z:-.5,width:span+1,height:.6,depth:span*.6+1,material:'concrete'});
    acts.push({type:'slab',x:0,y:0,z:0,width:span,height:.15,depth:span*.6,material:'concrete',label:'Floor'});
    [[0,0],[span-.4,0],[0,span*.6-.4],[span-.4,span*.6-.4]].forEach(function(c,i){
      acts.push({type:'column',x:c[0],y:0,z:c[1],width:.4,height:h,depth:.4,material:mat,label:'Col '+(i+1)});
    });
    acts.push({type:'beam',x:0,y:h,z:0,width:span,height:Math.max(.3,span/18),depth:.35,material:mat,label:'Beam'});
    acts.push({type:'beam',x:0,y:h,z:span*.6,width:span,height:Math.max(.3,span/18),depth:.35,material:mat,label:'Beam 2'});
    acts.push({type:'wall',x:0,y:0,z:0,width:span,height:h,depth:.22,material:'masonry',label:'Wall Front'});
    acts.push({type:'wall',x:0,y:0,z:span*.6-.22,width:span,height:h,depth:.22,material:'masonry',label:'Wall Back'});
    return acts;
  },
};

// ── NEURAL INTENT NETWORK ─────────────────────────────────────────────
// Lightweight TF.js MLP: tokenised sentence → structure class
// Vocabulary index → 50-dim bag-of-words → 128 → 64 → nClasses
var NET = {
  model:null, classes:Object.keys(KB), ready:false,
  vocabIdx:{},

  buildVocabIdx:function(){
    var all=Object.values(VOCAB).reduce(function(a,b){return a.concat(b);},Object.keys(VOCAB));
    var unique=[...new Set(all)];
    unique.forEach(function(w,i){NET.vocabIdx[w]=i;});
  },

  encode:function(text){
    var m=text.toLowerCase().replace(/[^a-z0-9\s]/g,' ');
    var words=m.split(/\s+/).filter(Boolean);
    var vec=new Float32Array(Object.keys(NET.vocabIdx).length);
    words.forEach(function(w){
      if(NET.vocabIdx[w]!==undefined) vec[NET.vocabIdx[w]]+=1;
      // Check VOCAB clusters
      Object.keys(VOCAB).forEach(function(key){
        if(key===w||VOCAB[key].includes(w)){
          if(NET.vocabIdx[key]!==undefined) vec[NET.vocabIdx[key]]+=0.5;
        }
      });
    });
    return vec;
  },

  build:async function(){
    NET.buildVocabIdx();
    var n=Object.keys(NET.vocabIdx).length;
    var nC=NET.classes.length;
    NET.model=tf.sequential({layers:[
      tf.layers.dense({inputShape:[n],units:128,activation:'relu'}),
      tf.layers.dropout({rate:0.3}),
      tf.layers.dense({units:64,activation:'relu'}),
      tf.layers.dropout({rate:0.2}),
      tf.layers.dense({units:32,activation:'relu'}),
      tf.layers.dense({units:nC,activation:'softmax'}),
    ]});
    NET.model.compile({optimizer:tf.train.adam(0.001),loss:'categoricalCrossentropy',metrics:['accuracy']});
    // Try loading saved weights
    try{
      var saved=localStorage.getItem('arcai_weights');
      if(saved){
        var w=JSON.parse(saved);
        NET.model.setWeights(w.map(function(d){return tf.tensor(d.data,d.shape);}));
        console.log('[ARCAI] Loaded trained weights');
      }
    }catch(ex){console.log('[ARCAI] No saved weights, using random init');}
    NET.ready=true;
  },

  predict:async function(text){
    if(!NET.ready)await NET.build();
    var vec=NET.encode(text);
    var t=tf.tensor2d([vec]);
    var pred=NET.model.predict(t);
    var probs=await pred.data();
    t.dispose();pred.dispose();
    var maxIdx=probs.indexOf(Math.max(...probs));
    return{classId:maxIdx,className:NET.classes[maxIdx],confidence:probs[maxIdx],probs:Array.from(probs)};
  },

  // Generate synthetic training data from vocabulary
  generateTrainData:function(){
    var xs=[], ys=[];
    NET.classes.forEach(function(cls,ci){
      // Positive examples from VOCAB
      var words=VOCAB[cls.toLowerCase()]||VOCAB[cls.toLowerCase().replace('_','')||''];
      if(!words) words=['building','structure'];
      // Generate 20 synthetic sentences per class
      var templates=[
        cls.toLowerCase().replace(/_/g,' '),
        'build a '+cls.toLowerCase().replace(/_/g,' '),
        'design a '+cls.toLowerCase().replace(/_/g,' '),
        'create a '+(words[0]||'structure'),
        'i want a '+(words[0]||'building'),
        'show me a '+(words[1]||words[0]||'structure'),
        'construct '+(words[0]||'')+(words[1]?' '+words[1]:''),
        'make a '+(words[2]||words[0]||'building'),
        (words[0]||'build')+' '+(words[1]||'structure'),
        cls.toLowerCase().replace(/_/g,' ')+' design',
      ];
      templates.forEach(function(t){
        xs.push(NET.encode(t));
        var y=new Float32Array(NET.classes.length);y[ci]=1;ys.push(y);
      });
    });
    return{xs:tf.tensor2d(xs),ys:tf.tensor2d(ys)};
  },

  train:async function(epochs,onProgress){
    if(!NET.ready)await NET.build();
    var d=NET.generateTrainData();
    var hist=await NET.model.fit(d.xs,d.ys,{
      epochs:epochs||30,
      batchSize:16,
      validationSplit:0.15,
      callbacks:{onEpochEnd:function(ep,logs){
        if(onProgress)onProgress(ep,logs.loss,logs.acc);
      }}
    });
    d.xs.dispose();d.ys.dispose();
    // Save weights
    try{
      var w=NET.model.getWeights().map(function(t){
        var data=Array.from(t.dataSync());
        var shape=t.shape;t.dispose();
        return{data:data,shape:shape};
      });
      localStorage.setItem('arcai_weights',JSON.stringify(w));
    }catch(ex){}
    return hist;
  },
};

// ── ENTITY EXTRACTOR ─────────────────────────────────────────────────
function extractEntities(msg){
  var m=msg.toLowerCase();
  var e={};
  var sqft=m.match(/(\d[\d,]*)\s*(?:sq(?:uare)?\s*f(?:ee|oo)?t|sq\.?\s*ft)/);
  var sqm =m.match(/(\d[\d,]*)\s*sq(?:uare)?\s*m/);
  var acre=m.match(/(\d+(?:\.\d+)?)\s*acre/);
  if(sqft) e.areaSqM=parseInt(sqft[1].replace(/,/g,''))*0.0929;
  else if(sqm) e.areaSqM=parseInt(sqm[1].replace(/,/g,''));
  else if(acre) e.areaSqM=parseFloat(acre[1])*4046.86;
  if(e.areaSqM) e.sideM=Math.sqrt(e.areaSqM);
  var re_dim=/(\d+(?:\.\d+)?)\s*m(?:etre|eter)?\b/g,dm,dims=[];
  while((dm=re_dim.exec(m))!==null)dims.push(parseFloat(dm[1]));
  e.span=dims[0]||null;
  var hm=m.match(/(\d+(?:\.\d+)?)\s*m\s*(?:high|tall|height)/);
  e.height=hm?parseFloat(hm[1]):(dims[1]||null);
  e.depth=dims[2]||null;
  e.floors=parseInt((m.match(/(\d+)\s*(?:stor|floor|level)/)||[])[1])||null;
  e.bays=parseInt((m.match(/(\d+)\s*bay/)||[])[1])||null;
  e.blocks=parseInt((m.match(/(\d+)\s*(?:block|building|tower|unit)/)||[])[1])||null;
  e.material=m.includes('steel')?'steel':m.includes('timber')?'timber':m.includes('glass')?'glass':'concrete';
  e.hasFdn=/foundation|footing/.test(m);
  e.hasRoad=/\broad\b/.test(m);
  e.hasGarden=/garden|park|green/.test(m);
  return e;
}

// ── VALIDATE ACTIONS ─────────────────────────────────────────────────
function validate(actions){
  var vt=['beam','column','wall','slab','arch','truss','foundation'];
  var vm=['concrete','steel','timber','masonry','glass'];
  return (actions||[]).filter(function(a){
    if(!a||typeof a!=='object')return false;
    if(!vt.includes(a.type))a.type='slab';
    if(!vm.includes(a.material))a.material='concrete';
    a.x=isFinite(+a.x)?+a.x:0;a.y=isFinite(+a.y)?+a.y:0;a.z=isFinite(+a.z)?+a.z:0;
    a.width=Math.max(.05,isFinite(+a.width)?+a.width:1);
    a.height=Math.max(.05,isFinite(+a.height)?+a.height:1);
    a.depth=Math.max(.05,isFinite(+(a.depth||a.width))?+(a.depth||a.width):a.width);
    a.length=a.width;
    return true;
  });
}

// ── PUBLIC API ────────────────────────────────────────────────────────
return{
  ready:false,
  trainingStatus:'untrained',

  init:async function(){
    try{
      await NET.build();
      this.ready=true;
      this.trainingStatus='loaded';
      console.log('[ARCAI] Neural network ready. Classes:',NET.classes.length);
    }catch(ex){
      console.warn('[ARCAI] Init error:',ex);
    }
  },

  // Main entry: parse any natural language → element array
  understand:async function(msg){
    var ent=extractEntities(msg);
    if(!this.ready)await this.init();

    // Neural classification
    var pred=await NET.predict(msg);
    console.log('[ARCAI] Predicted:',pred.className,'confidence:',
      (pred.confidence*100).toFixed(0)+'%');

    // Find best generator — try neural prediction first,
    // then keyword override for high-confidence known names
    var genKey=pred.className;

    // Keyword overrides for very specific names (Eiffel, Colosseum etc.)
    var overrides=[
      [/iconic|stylish.*bridge|designer.*bridge|landmark.*bridge|700.*m.*bridge|bridge.*700.*m/,'ICONIC_BRIDGE'],
      [/eiffel/,'EIFFEL_TOWER'],
      [/colosseum|coliseum/,'COLOSSEUM'],
      [/pyramid/,'PYRAMID'],
      [/castle|fort(?:ress)?/,'CASTLE'],
      [/mosque/,'MOSQUE'],
      [/stadium|arena/,'STADIUM'],
      [/society|township|colony|complex/,'SOCIETY'],
      [/suspension bridge|cable.stayed/,'SUSPENSION_BRIDGE'],
      [/footover|pedestrian bridge|foot over/,'FOOTOVER_BRIDGE'],
      [/arch bridge/,'ARCH_BRIDGE'],
      [/skyscraper|high.?rise|supertall/,'SKYSCRAPER'],
      [/warehouse|factory|hangar|industrial/,'WAREHOUSE'],
      [/dome/,'DOME'],
      [/\bhouse\b|bungalow|villa|cottage/,'HOUSE'],
      [/frame|portal/,'FRAME'],
    ];
    var m=msg.toLowerCase();
    for(var i=0;i<overrides.length;i++){
      if(overrides[i][0].test(m)){genKey=overrides[i][1];break;}
    }

    var gen=KB[genKey]||KB.GENERIC;
    var actions=gen(ent);
    var valid=validate(actions);
    return{actions:valid,structType:genKey,confidence:pred.confidence,entities:ent};
  },

  train:async function(epochs,onProgress){
    if(!this.ready)await this.init();
    this.trainingStatus='training';
    var hist=await NET.train(epochs||30,onProgress);
    this.trainingStatus='trained';
    return hist;
  },

  getStatus:function(){
    return{
      ready:this.ready,
      status:this.trainingStatus,
      classes:NET.classes.length,
      vocabSize:Object.keys(NET.vocabIdx).length,
    };
  },
};
})();



var AIENG={
  panelOpen:false,
  history:[],  // {role,content}[] for API

  // ── INTENT DETECTION ─────────────────────────────────────────────
  // Sends BUILD commands through Claude API for proper semantic understanding.
  // Local fallback parser handles when API unavailable.

  // ═══════════════════════════════════════════════════════════════════
  // ARCFORM AI ENGINE v3 — Spatial Architectural Intelligence
  // ═══════════════════════════════════════════════════════════════════

  detectIntent:function(msg){
    var m=msg.toLowerCase();
    if(/\b(analys|check only|calculate|verify|utiliz|deflect|moment|shear force)\b/.test(m)&&!/\b(build|create|make|design)\b/.test(m))return'ANALYZE';
    if(/\b(optimis|optimiz|improv|reduce section|fix fail|overstr)\b/.test(m)&&!/\b(build|create)\b/.test(m))return'OPTIMIZE';
    if(/\b(delete all|remove all|clear all|wipe|reset model|start over|start fresh)\b/.test(m))return'DELETE';
    if(/\b(build|create|add|make|generate|design|construct|draw|place|put|i want|give me|show me|model)\b/.test(m))return'BUILD';
    if(/\b(taller|shorter|longer|wider|thicker|move|rotate|turn|flip|mirror|steel|concrete|timber|duplicate|copy)\b/.test(m)&&S.selected.length)return'MODIFY';
    return'QUESTION';
  },

  extractEntities:function(msg){
    var m=msg.toLowerCase();
    var e={};
    var sqft=m.match(/(\d[\d,]*)\s*(?:sq(?:uare)?\s*f(?:ee|oo)?t|sq\.?\s*ft)/);
    var sqm =m.match(/(\d[\d,]*)\s*sq(?:uare)?\s*m(?:etre|eter)?/);
    var acre=m.match(/(\d+(?:\.\d+)?)\s*acre/);
    if(sqft) e.areaSqM=parseInt(sqft[1].replace(/,/g,''))*0.0929;
    else if(sqm) e.areaSqM=parseInt(sqm[1].replace(/,/g,''));
    else if(acre) e.areaSqM=parseFloat(acre[1])*4046.86;
    if(e.areaSqM) e.sideM=Math.sqrt(e.areaSqM);
    var dims=[];
    var re_dim=/(\d+(?:\.\d+)?)\s*m(?:etre|eter)?\b/g,dm;
    while((dm=re_dim.exec(m))!==null)dims.push(parseFloat(dm[1]));
    e.span=dims[0]||null;
    var hm=m.match(/(\d+(?:\.\d+)?)\s*m(?:etre|eter)?\s*(?:high|tall|height)/);
    e.height=hm?parseFloat(hm[1]):(dims[1]||null);
    e.floors=parseInt((m.match(/(\d+)\s*(?:stor|floor|level)/)||[])[1])||null;
    e.bays=parseInt((m.match(/(\d+)\s*bay/)||[])[1])||null;
    e.blocks=parseInt((m.match(/(\d+)\s*(?:block|building|tower|unit)/)||[])[1])||null;
    e.material=m.includes('steel')?'steel':m.includes('timber')?'timber':m.includes('glass')?'glass':'concrete';
    var structs=[
      ['society|township|residential complex|housing|colony','SOCIETY'],
      ['footover|foot over|pedestrian bridge|walkway bridge','FOOTOVER_BRIDGE'],
      ['iconic bridge|stylish bridge|landmark bridge|cable-stayed bridge','ICONIC_BRIDGE'],
      ['suspension bridge|cable bridge|cable-stayed','SUSPENSION_BRIDGE'],
      ['road bridge|vehicle bridge|highway bridge','ROAD_BRIDGE'],
      ['bridge','BRIDGE'],
      ['skyscraper|high.?rise|tower block','HIGHRISE'],
      ['apartment|flat','APARTMENT'],
      ['office building|commercial building|business park','OFFICE'],
      ['school|college|university|campus','SCHOOL'],
      ['hospital|clinic','HOSPITAL'],
      ['warehouse|factory|industrial|hangar','WAREHOUSE'],
      ['dome|stadium|arena','DOME'],
      ['tower|pylon|mast','TOWER'],
      ['retaining wall','RETAINING_WALL'],
      ['stair|steps','STAIRS'],
      ['ramp|slope','RAMP'],
      ['frame|portal','FRAME'],
      ['arch','ARCH'],
      ['truss','TRUSS'],
      ['house|home|bungalow|villa|cottage','HOUSE'],
      ['building','BUILDING'],
    ];
    e.structType='GENERIC';
    for(var si=0;si<structs.length;si++){
      if(new RegExp(structs[si][0]).test(m)){e.structType=structs[si][1];break;}
    }
    e.hasRoad=/\broad\b|\bstreet\b|\bpath\b|\bdriveway\b/.test(m);
    e.hasGarden=/\bgarden\b|\bpark\b|\bgreen\b|\bplaza\b/.test(m);
    e.hasWall=/\bboundary wall\b|\bperimeter\b|\bcompound wall\b/.test(m);
    e.hasGate=/\bgate\b|\bentrance\b/.test(m);
    return e;
  },

  planSite:function(ent){
    var side=ent.sideM||Math.sqrt(ent.areaSqM||10000);
    // Scale to max 200m display
    var scale=side>200?(side/150):1;
    var dSide=side/scale;
    var pad=Math.max(3,dSide*0.05);
    var inner=dSide-pad*2;
    var blocks=ent.blocks||Math.max(2,Math.round(inner/35));
    var bCols=Math.ceil(Math.sqrt(blocks));
    var bRows=Math.ceil(blocks/bCols);
    var cellW=inner/bCols,cellD=inner/bRows;
    var roadW=Math.max(5,cellW*0.18);
    var bW=cellW*0.68,bD=cellD*0.60;
    var zones={buildings:[],roads:[],gardens:[],scale:scale};
    for(var r=0;r<bRows;r++){
      for(var c=0;c<bCols;c++){
        if(r*bCols+c>=blocks)break;
        zones.buildings.push({x:pad+c*cellW+roadW/2,z:pad+r*cellD+roadW/2,w:bW,d:bD});
      }
    }
    for(var r2=0;r2<=bRows;r2++) zones.roads.push({x:pad,z:pad+r2*cellD,w:inner,d:roadW,dir:'H'});
    for(var c2=0;c2<=bCols;c2++) zones.roads.push({x:pad+c2*cellW,z:pad,w:roadW,d:inner,dir:'V'});
    zones.gardens.push({x:pad,z:pad,w:cellW*0.35,d:cellD*0.35});
    if(bCols>1) zones.gardens.push({x:pad+inner-cellW*0.35,z:pad,w:cellW*0.35,d:cellD*0.35});
    return zones;
  },

  // ── FREE AI BRAIN: Groq API (llama-3.3-70b, free tier) ─────────────
  // Falls back to enhanced ARCAI if no key set
  callAIBrain:async function(msg,ent){
    var key=localStorage.getItem('arcform_groq_key')||'';
    var zones=null;
    if(ent.areaSqM&&ent.areaSqM>500) zones=this.planSite(ent);
    var sysPrompt='You are ARCFORM AI — an expert Architect and Structural Engineer that generates precise 3D structural models as JSON.\n\nELEMENT SCHEMA (each element is an object):\n{"type","x","y","z","width","height","depth","length","material","label","rotation"}\n- type: beam|column|wall|slab|arch|truss|foundation|cable\n- x/y/z: position in meters. y=0 is ground level. y<0 is underground.\n- width=X-extent, height=Y-extent, depth=Z-extent, length=width\n- material: concrete|steel|timber|masonry|glass\n- label: short name like "Column A1", "Main Cable"\n- rotation: optional {x,y,z} in radians\n\nDESIGN RULES:\n1. Foundations: y=-0.6, height=0.6, type=foundation\n2. Columns start at y=0 (or floor slab top), height=3m per floor\n3. Beams: y = top of columns, height = span/20 minimum 0.3m\n4. Floor slabs: y = beam_y + beam_height, height=0.18\n5. Walls: height=floor_height, depth=0.22 (interior) or 0.35 (structural)\n6. Roads: type=slab, y=0.02, height=0.1, material=concrete\n7. Bridges over roads need approach stairs at both ends\n8. Suspension bridges: use type=cable for main cables\n9. For iconic/stylish bridges add: observation deck, towers with decorative fins, lighting columns\n10. Scale all coordinates to fit within 200x200m display\n11. Generate 15-80 architecturally complete elements\n12. RETURN ONLY a valid JSON array — no text, no markdown, no explanation\n\nSITE INFO: '+(zones?JSON.stringify(zones):'none')+'\nENTITIES: '+JSON.stringify(ent);

    if(!key) throw new Error('No Groq key — set one in the AI panel for enhanced AI builds');

    var resp=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body:JSON.stringify({
        model:'llama-3.3-70b-versatile',
        max_tokens:4096,
        temperature:0.2,
        messages:[
          {role:'system',content:sysPrompt},
          {role:'user',content:'Build this structure: '+msg}
        ]
      })
    });
    if(!resp.ok){var errTxt=await resp.text();throw new Error('Groq '+resp.status+': '+errTxt.substring(0,120));}
    var data=await resp.json();
    if(data.error)throw new Error(data.error.message||'Groq error');
    var raw=(data.choices&&data.choices[0])?data.choices[0].message.content:'';
    // Extract JSON array (handle markdown fences)
    raw=raw.replace(/```json\n?|```\n?/g,'').trim();
    var s=raw.indexOf('['),en=raw.lastIndexOf(']');
    if(s===-1||en===-1||en<=s)throw new Error('No JSON array in response');
    var actions=JSON.parse(raw.substring(s,en+1));
    if(!Array.isArray(actions)||!actions.length)throw new Error('Empty array');
    return{actions:actions,source:'groq-llama3'};
  },
