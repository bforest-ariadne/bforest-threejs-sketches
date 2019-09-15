const { gui, webgl, assets } = require('../../context');
const createOrbitControls = require('orbit-controls');
const defined = require('defined');


const tmpTarget = new THREE.Vector3();

module.exports = class SketchScene extends THREE.Object3D {
  constructor () {
    super();
    this.name = 'sketchScene';

    this.debugGlobals = [];
    this.debugGlobalsLive = [];


    if (gui) { 
      // assume it can be falsey, e.g. if we strip dat-gui out of bundle
      // attach dat.gui stuff here as usual

    }

    this.init();
  }

  init() {
    this.controlsInit();
    this.add(new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        wireframe: true, color: 'white'
      })
    ));
  }

  update (dt = 0, time = 0) {

    if ( defined( this.controls ) ) this.controlsUpdate();
    this.rotation.x += dt * 0.1;
    // This function gets propagated down from the WebGL app to all children

  }

  controlsInit() {
    // set up a simple orbit controller
    this.controls = createOrbitControls({
      element: webgl.canvas,
      parent: window,
      distance: 4,
      zoom: false,
    });
  }

  controlsUpdate() {
    this.controls.update();

    // reposition to orbit controls
    webgl.camera.up.fromArray(this.controls.up);
    webgl.camera.position.fromArray(this.controls.position);
    tmpTarget.fromArray(this.controls.target);
    webgl.camera.lookAt(tmpTarget);
  }

  onTouchStart (ev, pos) {
    const [ x, y ] = pos;
    console.log('Touchstart / mousedown: (%d, %d)', x, y);
  }

  onTouchMove (ev, pos) {
  }

  onTouchEnd (ev, pos) {
  }

  debug() {
    // add debug globals as needed
    this.debugGlobals.forEach( debugGlobal => {
      global[debugGlobal] = this[debugGlobal];
    } );
    // add this scene to global as its name
    global[this.name] = this;
  }


};
