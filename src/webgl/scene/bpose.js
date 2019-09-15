const { gui, webgl, assets } = require('../../context');
var GyroNorm = require('gyronorm/dist/gyronorm.complete.js');
const isMobile = require('../../util/isMobile.js');
const { convertRange, clamp } = require('../../util/utils');
const Controls = require('../controls');
const query = require('../../util/query');
const name = 'bpose';


// tell the preloader to include this asset
// we need to define this outside of our class, otherwise
// it won't get included in the preloader until *after* its done loading


const bposeKey = query.scene === name ? assets.queue({
  url: 'assets/models/bpose1_v1.glb'
}) : {};

const normalKey = query.scene === name ? assets.queue({
  url: 'assets/models/bpose1_NORM.jpg',
  key: 'normalmap',
  texture: true
}) : {};

const colorKey = query.scene === name ? assets.queue({
  url: 'assets/models/bpose1_AO.png',
  key: 'colormap',
  texture: true
}) : {};

module.exports = class Bpose extends THREE.Object3D {
  constructor () {
    super();

    self = this;
    this.name = name;

    // now fetch the loaded resource
    const gltf = assets.get(bposeKey);
    const normalMap = assets.get('normalmap');
    const colorMap = assets.get('colormap');

    this.material = new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap
    });

    this.debugGlobals = [];
    this.debugGlobalsLive = [];

    this.group = new THREE.Group();
    // this.group.position.set(0.38, -0.88, -1.18);
    this.group.rotation.set(0, -3.5, 0);

    this.add(this.group);
    if (webgl.dev) global.group = this.group;

    this.dolly = new THREE.Group();
    this.dolly.name = 'dolly';

    this.dolly.add(webgl.camera);
    this.add(this.dolly);
    this.debugAdd( 'dolly' );

    this.controls = new Controls( this.dolly );
    this.debugAdd('controls');

    webgl.camera.position.set(-0.38, 0.8, 1.57);

    // Replaces all meshes material with something basic
    gltf.scene.traverse(child => {
      if (child.isMesh) {
        child.material = this.material;
        // ThreeJS attaches something odd here on GLTF ipmport
        child.onBeforeRender = () => {};
        child.scale.setScalar(0.2);
        
        self.bpose = child;
        self.group.add(child);
      }
    });

    const lamp = new THREE.DirectionalLight();
    lamp.position.set(-1, 0, 0);
    this.add(lamp);
  

    if (gui) { // assume it can be falsey, e.g. if we strip dat-gui out of bundle
      // attach dat.gui stuff here as usual
      const folder = gui.addFolder('honeycomb');
      folder.open();
    }

  }

  update (dt = 0, time = 0) {
    // This function gets propagated down from the WebGL app to all children
    // this.rotation.y += dt * 0.1;
    
    this.controls.update();

    this.debugLive();
  }

  onTouchStart (ev, pos) {
    const [ x, y ] = pos;
    // console.log('Touchstart / mousedown: (%d, %d)', x, y);
    // For example, raycasting is easy:
    const coords = new THREE.Vector2().set(
      pos[0] / webgl.width * 2 - 1,
      -pos[1] / webgl.height * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coords, webgl.camera);
    const hits = raycaster.intersectObject(this, true);
    console.log(hits.length > 0 ? `Hit ${hits[0].object.name}!` : 'No hit');

    pos[0] = ( pos[0] / 2 ) + ( ev.target.clientWidth / 2 );
    pos[1] = ( pos[1] / 2 ) + ( ev.target.clientHeight / 2 );

    if (isMobile) this.controls.controls.onTouchStart( ev, pos )
    
  }

  onTouchMove (ev, pos) {
    pos[0] = ( pos[0] / 2 ) + ( ev.target.clientWidth / 2 );
    pos[1] = ( pos[1] / 2 ) + ( ev.target.clientHeight / 2 );
    // console.log(ev);
    // console.log('position', pos );

    if (isMobile) this.controls.controls.onTouchMove( ev, pos )
    else this.controls.controls.onMouseMove( ev, pos )
  }

  onTouchEnd (ev, pos) {
    pos[0] = ( pos[0] / 2 ) + ( ev.target.clientWidth / 2 );
    pos[1] = ( pos[1] / 2 ) + ( ev.target.clientHeight / 2 );

    this.controls.controls.onTouchEnd( ev, pos );
  }

  onMouseEnter(ev) {
    this.controls.controls.onMouseDown( ev )


  }

  onMouseLeave(ev) {
    this.controls.controls.onMouseDown( ev );
  
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
    if ( typeof this[o] === 'object' ) this.debugGlobals.push(o)
    else if ( typeof this[o] === 'number' ) this.debugGlobalsLive.push(o);
  }

  debugLive() {
    // update changing debug globals that wont change on their own
    this.debugGlobalsLive.forEach( debugGlobal => {
      global[debugGlobal] = this[debugGlobal];
    } );
  }

};
