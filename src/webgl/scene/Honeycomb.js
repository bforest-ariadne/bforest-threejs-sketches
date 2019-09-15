const { gui, webgl, assets } = require('../../context');
const createOrbitControls = require('orbit-controls');
const LiveShaderMaterial = require('shader-reload/three/LiveShaderMaterial');
const honeyShader = require('../shaders/honey.shader');
const assign = require('object-assign');

const tmpTarget = new THREE.Vector3();


// tell the preloader to include this asset
// we need to define this outside of our class, otherwise
// it won't get included in the preloader until *after* its done loading
const gltfKey = assets.queue({
  url: 'assets/models/honeycomb.gltf'
});

module.exports = class Honeycomb extends THREE.Object3D {
  constructor () {
    super();
    this.name = 'hcScene';

    this.debugGlobals = [];
    this.debugGlobalsLive = [];

    // set up a simple orbit controller
    this.controls = createOrbitControls({
      element: webgl.canvas,
      parent: window,
      distance: 4,
      zoom: false,
    });


    // now fetch the loaded resource
    const gltf = assets.get(gltfKey);

    this.material = new LiveShaderMaterial(honeyShader, {
      uniforms: {
        time: { value: 0 },
        colorA: { value: new THREE.Color('rgb(213,70,70)') },
        colorB: { value: new THREE.Color('rgb(223,191,86)') }
      }
    });

    const gltfChildren = [];

    // Replaces all meshes material with something basic
    gltf.scene.traverse(child => {
      if (child.isMesh) {
        child.material = this.material;

        // ThreeJS attaches something odd here on GLTF ipmport
        child.onBeforeRender = () => {};
        gltfChildren.push( child );
      }
    });

    for ( let child in gltfChildren ) this.add ( gltfChildren[child] ); 

    if (gui) { // assume it can be falsey, e.g. if we strip dat-gui out of bundle
      // attach dat.gui stuff here as usual
      const folder = gui.addFolder('honeycomb');
      const settings = {
        colorA: this.material.uniforms.colorA.value.getStyle(),
        colorB: this.material.uniforms.colorB.value.getStyle()
      };
      const update = () => {
        this.material.uniforms.colorA.value.setStyle(settings.colorA);
        this.material.uniforms.colorB.value.setStyle(settings.colorB);
      };
      folder.addColor(settings, 'colorA').onChange(update);
      folder.addColor(settings, 'colorB').onChange(update);
      folder.open();
    }
  }

  update (dt = 0, time = 0) {

    this.controls.update();

    // reposition to orbit controls
    webgl.camera.up.fromArray(this.controls.up);
    webgl.camera.position.fromArray(this.controls.position);
    
    // webgl.camera.position.set(0,0,4);


    tmpTarget.fromArray(this.controls.target);
    
    webgl.camera.lookAt(tmpTarget);
    // This function gets propagated down from the WebGL app to all children
    this.rotation.y += dt * 0.1;
    this.material.uniforms.time.value = time;
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
