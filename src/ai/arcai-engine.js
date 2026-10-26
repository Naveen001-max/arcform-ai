// ═══════════════════════════════════════════════════
//  ARCFORM AI — ai/arcai-engine.js
//  Lightweight intent classifier (no TF.js required)
// ═══════════════════════════════════════════════════

var ARCAI = (function(){
  var _ready = false;
  var _status = 'untrained';

  // Structure type vocabulary
  var TYPES = [
    'HOUSE','SKYSCRAPER','BRIDGE','SUSPENSION_BRIDGE','CABLE_BRIDGE',
    'FOOTOVER_BRIDGE','ICONIC_BRIDGE','ARCH_BRIDGE','EIFFEL_TOWER',
    'DOME','STADIUM','CASTLE','PYRAMID','FRAME','PORTAL_FRAME',
    'SOCIETY','TRUSS','RETAINING_WALL','DAM','TUNNEL'
  ];

  // Keyword → type mapping
  var KB = {
    house:['house','home','bungalow','villa','cottage','residential','dwelling'],
    skyscraper:['skyscraper','tower','high-rise','highrise','tall building','office tower','supertall'],
    iconic_bridge:['iconic','stylish bridge','bridge iconic','viewpoint bridge','cable stayed','cable-stayed bridge 700','700m bridge','landmark bridge'],
    suspension_bridge:['suspension','hang','catenary','main cable'],
    footover_bridge:['footover','pedestrian bridge','foot bridge','walkway bridge','over bridge','fob'],
    arch_bridge:['arch bridge','stone arch','masonry arch'],
    bridge:['bridge','span','viaduct','overpass','flyover'],
    eiffel_tower:['eiffel','paris tower','iron tower','lattice tower'],
    dome:['dome','pantheon','spherical roof','geodesic'],
    stadium:['stadium','arena','sport','colosseum','amphitheatre'],
    castle:['castle','fort','fortress','medieval','moat','tower wall'],
    pyramid:['pyramid','ancient','pharaoh','triangular monument'],
    frame:['frame','steel frame','concrete frame','portal','bay'],
    society:['society','complex','colony','township','housing complex','apartments'],
    truss:['truss','roof truss','lattice girder'],
    dam:['dam','reservoir','weir','water wall'],
  };

  function classify(text) {
    var t = text.toLowerCase();
    // Priority: iconic first
    if (/iconic|stylish.*bridge|bridge.*iconic|viewpoint.*bridge|bridge.*viewpoint|700m|cable.?stay/i.test(t)) return 'ICONIC_BRIDGE';
    if (/suspension|hang.*bridge|bridge.*hang/i.test(t)) return 'SUSPENSION_BRIDGE';
    if (/footover|foot.?over|pedestrian.?bridge|ped.?bridge/i.test(t)) return 'FOOTOVER_BRIDGE';
    if (/arch.?bridge|stone.?arch.?bridge/i.test(t)) return 'ARCH_BRIDGE';
    if (/eiffel|paris.?tower/i.test(t)) return 'EIFFEL_TOWER';
    if (/castle|fort(ress)?|medieval/i.test(t)) return 'CASTLE';
    if (/stadium|arena/i.test(t)) return 'STADIUM';
    if (/pyramid/i.test(t)) return 'PYRAMID';
    if (/dome|pantheon/i.test(t)) return 'DOME';
    if (/skyscraper|high.?rise|supertall/i.test(t)) return 'SKYSCRAPER';
    if (/society|colony|complex|township/i.test(t)) return 'SOCIETY';
    if (/dam\b|reservoir/i.test(t)) return 'DAM';
    if (/truss/i.test(t)) return 'TRUSS';
    if (/bridge/i.test(t)) return 'BRIDGE';
    if (/house|home|bungalow|villa/i.test(t)) return 'HOUSE';
    if (/frame|portal/i.test(t)) return 'PORTAL_FRAME';
    return null;
  }

  return {
    ready: false,
    trainingStatus: 'rule-based',

    init: async function() {
      _ready = true;
      _status = 'rule-based';
      this.ready = true;
      this.trainingStatus = _status;
      return true;
    },

    classify: function(text) {
      return classify(text);
    },

    getStatus: function() {
      return { ready: _ready, status: _status, classes: TYPES.length };
    },

    getContext: function() {
      var S = window.S || {};
      var objs = (S.objects||[]).length;
      return 'Project has ' + objs + ' elements. Mode: ' + (S.mode||'select') + '.';
    }
  };
})();

// Auto-init
ARCAI.init().then(function(){
  console.log('[ARCAI] Rule-based classifier ready, ' + ARCAI.getStatus().classes + ' types');
});
