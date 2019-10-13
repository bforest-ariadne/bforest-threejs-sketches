const { gui, webgl, assets } = require('../../context');
const createOrbitControls = require('orbit-controls');
const defined = require('defined');
const { toneMappingOptions } = require('../../util/constants');
if ( webgl.dev ) window.defined = defined;

let name = 'sketchScene';
const title = 'No Title';
let sketchCounter = 0;

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

    this.pars = {
      renderer: {
        exposure: 1,
        whitePoint: 1,
        toneMapping: toneMappingOptions.Uncharted2,
        gammaInput: true,
        gammaOutput: true,
        gammaFactor: 2.2,
        shadowMapEnabled: true,
        autoClear: false,
        physicallyCorrectLights: true
      }
    };
  }

  init() {
    webgl.renderer.gammaInput = this.pars.renderer.gammaInput;
    webgl.renderer.gammaOutput = this.pars.renderer.gammaOutput;
    webgl.renderer.gammaFactor = this.pars.renderer.gammaFactor;
    webgl.renderer.shadowMap.enabled = this.pars.renderer.shadowMapEnabled;
    webgl.renderer.autoClear = this.pars.renderer.autoClear;
    webgl.renderer.physicallyCorrectLights = this.pars.renderer.physicallyCorrectLights;
    webgl.renderer.toneMapping = this.pars.renderer.toneMapping;
    webgl.renderer.toneMappingExposure = this.pars.renderer.exposure;
    webgl.renderer.toneMappingWhitePoint = this.pars.renderer.whitePoint;
  }

  update (dt = 0, time = 0, frame = 0) {
    if ( defined( this.controls, this.orbitControls, false ) ) this.controlsUpdate();
    // if ( defined( this.mesh ) ) this.mesh.rotation.x += dt * 0.1;
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

  orbitControlsInit() {
    this.orbitControls = new THREE.OrbitControls( webgl.camera, webgl.viewport  );
  }

  controlsUpdate() {
    if ( defined( this.controls, false ) ) {
      this.controls.update();

      // reposition to orbit controls
      webgl.camera.up.fromArray(this.controls.up); 
      webgl.camera.position.fromArray(this.controls.position);
      tmpTarget.fromArray(this.controls.target);
      webgl.camera.lookAt(tmpTarget);
    } else if ( defined( this.orbitControls, false ) ) {
      this.orbitControls.update();
    }
  }

  glbToMaterial( key ) {
    let material;
    assets.get(key).scene.traverse(child => {
      if (child.isMesh && child.material) {
        material = child.material;
      }
    });
    return material;
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
    sketchCounter++;
    // Create anchor element.
    var a = document.createElement('a');

    // Create the text node for anchor element.
    var link = document.createTextNode(index);

    // Append the text node to anchor element.
    a.appendChild(link);

    // Set the title.
    a.title = title || `sketch${index}`;

    // Set the href property.
    let href = document.location.origin + document.location.pathname + document.location.search;
    if ( document.location.search.includes( 'scene=') ) href = href.slice( 0, href.lastIndexOf( 'scene=' ) );
    if ( !document.location.search.includes('?') ) href += '?';
    href += `scene=${name}`;
    a.href = href;

    return a;
  }
}

SketchScene.publish = false;
SketchScene.title = title;
SketchScene.sceneName = name;
SketchScene.queueAssets = () => {};

module.exports = SketchScene;
