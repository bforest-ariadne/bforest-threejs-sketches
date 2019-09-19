const { gui, webgl } = require('../../context');
const createOrbitControls = require('orbit-controls');
const defined = require('defined');
const basicSMAA = require('../postProcessing/basicSMAA');

const name = 'sketchScene';

const tmpTarget = new THREE.Vector3();

module.exports = class SketchScene extends THREE.Object3D {
  constructor () {
    super();
    this.name = name;
    webgl.sceneObj = this;

    this.debugGlobals = [];
    this.debugGlobalsLive = [];

    if (gui) {
      // assume it can be falsey, e.g. if we strip dat-gui out of bundle
      // attach dat.gui stuff here as usual
    }

    // this.init();
  }

  init() {
    this.controlsInit();
    basicSMAA();
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        wireframe: true, color: 'white'
      })
    );
    this.add(this.mesh);
  }

  update (dt = 0, time = 0, frame = 0) {
    if ( defined( this.controls ) ) this.controlsUpdate();
    if ( defined( this.mesh ) ) this.mesh.rotation.x += dt * 0.1;
    this.debugLive();
    // This function gets propagated down from the WebGL app to all children
  }

  controlsInit() {
    // set up a simple orbit controller
    this.controls = createOrbitControls({
      element: webgl.viewport,
      parent: window,
      distance: 4,
      zoom: false
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
    // const [ x, y ] = pos;
    // console.log('Touchstart / mousedown: (%d, %d)', x, y);
  }

  onTouchMove (ev, pos) {
  }
  onTouchEnd (ev, pos) {
  }
  onMouseEnter(ev) {
  }
  onMouseLeave(ev) {
  }
  onMouseOver() {
  }

  onResize() {
  }

  debug() {
    // add debug globals as needed
    this.debugGlobals.forEach( debugGlobal => {
      global[debugGlobal] = this[debugGlobal];
    } );
    // add this scene to global as its name
    global[this.name] = this;
  }
  debugAdd( o ) {
    if ( typeof this[o] === 'object' ) this.debugGlobals.push(o);
    else if ( typeof this[o] === 'number' ) this.debugGlobalsLive.push(o);
  }

  debugLive() {
    // update changing debug globals that wont change on their own
    this.debugGlobalsLive.forEach( debugGlobal => {
      global[debugGlobal] = this[debugGlobal];
    } );
  }
};
