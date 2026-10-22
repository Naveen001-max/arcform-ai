// ═══════════════════════════════════════════════════
//  ARCFORM AI — ai/arcai-engine.js
//  TF.js MLP neural engine — vocab→128→64→32→N
// ═══════════════════════════════════════════════════

var ARCAI = (function(){

// ── VOCABULARY & EMBEDDINGS ───────────────────────────────────────────
// 300-word architectural/engineering vocabulary with semantic clusters
var VOCAB = {
  // Towers & Tall Structures
  eiffel:['tower','iron','paris','lattice','tapered','iconic'],
  burj:['tower','skyscraper','supertall','glass','dubai'],
  tower:['tall','vertical','floors','height','spire'],
  spire:['pointed','top','tower','needle','antenna'],
  pylon:['tower','cable','bridge','support','vertical'],
  mast:['tall','thin','antenna','vertical','steel'],
  minaret:['tower','mosque','circular','tapered','islamic'],
  obelisk:['stone','tapered','monument','square','ancient'],
  lighthouse:['tower','circular','tapered','coastal','beacon'],
  windmill:['tower','blades','circular','farm','energy'],
  chimney:['cylindrical','tall','smoke','industrial','brick'],
  silo:['cylindrical','storage','grain','vertical','farm'],

  // Bridges
  bridge:['span','cross','deck','support','load'],
  suspension:['cable','tower','deck','hang','span'],
  cable:['stay','diagonal','tower','deck'],
  arch:['curve','span','thrust','stone','roman'],
  truss:['triangle','steel','span','frame','lattice'],
  footover:['pedestrian','walkway','cross','road','foot'],
  viaduct:['multiple','arch','spans','valley','rail'],
  aqueduct:['water','arch','roman','stone','channel'],
  drawbridge:['movable','castle','medieval','lift'],

  // Buildings - Residential
  house:['walls','roof','windows','home','foundation'],
  bungalow:['single','storey','residential','small'],
  villa:['luxury','large','residential','garden'],
  cottage:['small','rural','stone','cozy','thatch'],
  mansion:['large','luxury','wings','grand','estate'],
  apartment:['floors','units','residential','urban'],
  society:['multiple','buildings','road','garden','complex'],
  township:['large','multiple','buildings','infrastructure'],
  colony:['residential','planned','roads','community'],

  // Buildings - Commercial/Institutional
  skyscraper:['tall','glass','steel','office','urban'],
  office:['commercial','floors','open','plan','business'],
  mall:['shopping','large','floors','retail','parking'],
  hotel:['rooms','floors','lobby','service','hospitality'],
  hospital:['floors','wings','medical','corridors','emergency'],
  school:['classrooms','floors','playground','education'],
  university:['campus','multiple','buildings','academic'],
  church:['nave','apse','tower','arch','religious'],
  mosque:['dome','minaret','arch','religious','courtyard'],
  temple:['columns','steps','sacred','stone','classical'],
  museum:['gallery','large','atrium','cultural','display'],
  library:['books','shelves','reading','quiet','academic'],
  stadium:['seating','field','roof','large','sport'],
  theater:['stage','seating','curved','acoustic','performance'],
  airport:['terminal','gates','large','span','roof'],
  station:['platform','roof','arched','transport','rail'],

  // Infrastructure
  dam:['water','concrete','massive','wall','reservoir'],
  wall:['vertical','barrier','masonry','support','boundary'],
  retaining:['earth','slope','wall','pressure','foundation'],
  tunnel:['underground','circular','arch','cut','bore'],
  road:['horizontal','slab','surface','transport','wide'],
  runway:['long','flat','aircraft','airport','concrete'],
  platform:['raised','flat','surface','support','edge'],

  // Industrial
  factory:['large','span','roof','industrial','production'],
  warehouse:['storage','large','span','loading','dock'],
  hangar:['aircraft','large','span','door','aviation'],
  powerplant:['industrial','towers','large','energy','cooling'],
  refinery:['tanks','pipes','industrial','complex','tall'],

  // Monuments & Special
  pyramid:['triangular','stone','ancient','massive','base'],
  colosseum:['circular','arched','tiers','roman','stone'],
  parthenon:['columns','classical','greek','temple','marble'],
  pantheon:['dome','circular','oculus','roman','columns'],
  palace:['grand','wings','ornate','royal','large'],
  castle:['towers','walls','moat','medieval','fortified'],
  fort:['walls','tower','military','fortified','strong'],

  // Structural elements
  column:['vertical','support','load','foundation','capital'],
  beam:['horizontal','span','load','floor','support'],
  slab:['flat','floor','concrete','horizontal','span'],
  foundation:['base','ground','load','underground','footing'],
  frame:['structure','columns','beams','grid','steel'],
  portal:['two','columns','beam','rigid','frame'],
  dome:['spherical','curved','roof','large','span'],
  vault:['arched','ceiling','masonry','curved','roman'],
  buttress:['support','wall','thrust','gothic','stone'],
  truss_elem:['triangle','frame','light','span','efficient'],
};

// ── STRUCTURAL KNOWLEDGE BASE ─────────────────────────────────────────
// Each entry: parametric generator function returning element array