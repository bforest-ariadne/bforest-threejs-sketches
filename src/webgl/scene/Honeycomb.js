const SketchScene = require('./SketchScene');
const { gui, webgl, assets } = require('../../context');
const LiveShaderMaterial = require('shader-reload/three/LiveShaderMaterial');
const honeyShader = require('../shaders/honey.shader');
const query = require('../../util/query');
const basicBloom = require('../postProcessing/basicBloom');

const name = 'honeycomb';

// tell the preloader to include this asset
// we need to define this outside of our class, otherwise
// it won't get included in the preloader until *after* its done loading
const gltfKey = query.scene === name ? assets.queue({
  url: 'assets/models/honeycomb.gltf'
}) : {};

class Honeycomb extends SketchScene {
  constructor () {
    super(name);
  }

  init() {
    // webgl.initPost();
    console.log( 'init', this.name );
    this.controlsInit();
    basicBloom();

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

    for ( let child in gltfChildren ) this.add( gltfChildren[child] );

    if (gui && false) { // assume it can be falsey, e.g. if we strip dat-gui out of bundle
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
    super.update( dt, time );
    // This function gets propagated down from the WebGL app to all children
    this.rotation.y += dt * 0.1;
    this.material.uniforms.time.value = time;
  }

  onTouchStart (ev, pos) {
    // const [ x, y ] = pos;
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

  debug() {
    super.debug();
  }
}

Honeycomb.sceneName = name;

module.exports = Honeycomb;
