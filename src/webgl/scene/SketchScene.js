const { gui, webgl } = require('../../context');
const createOrbitControls = require('orbit-controls');
const defined = require('defined');
const basicSMAA = require('../postProcessing/basicSMAA');

let name = 'sketchScene';

const title = 'Basis Sketch Scene';

const tmpTarget = new THREE.Vector3();

class SketchScene extends THREE.Object3D {
  constructor ( sceneName ) {
    super();
    this.name = defined( sceneName, name );
    webgl.sceneObj = this;
    webgl.sceneName = this.name;

    this.dev = webgl.dev;
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
      zoom: true
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

  log() {
    // logging for debug only
    if ( this.dev ) {
      const css = 'background: #00ff00; color: #ff00ff';
      const text = ' ';
      let cssArray = ['%c '.concat(text), css];
      var args = Array.prototype.slice.call(arguments);
      let final = cssArray.concat(args);
      console.log.apply(this, final);
    }
  }

  static getSceneLink( index, name, title ) {
    // Create anchor element.
    var a = document.createElement('a');

    // Create the text node for anchor element.
    var link = document.createTextNode(index);

    // Append the text node to anchor element.
    a.appendChild(link);

    // Set the title.
    a.title = title;

    // Set the href property.
    let href = document.location.href.slice( 0, document.location.href.lastIndexOf( 'scene=' ) );
    href += `scene=${name}`;
    a.href = href;

    return a;
  }
}

SketchScene.publish = false;
SketchScene.title = title;

module.exports = SketchScene;
