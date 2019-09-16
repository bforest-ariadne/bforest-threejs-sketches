const SketchScene = require('./SketchScene');
const { gui, webgl, assets } = require('../../context');
// var GyroNorm = require('gyronorm/dist/gyronorm.complete.js');
const isMobile = require('../../util/isMobile.js');
// const { convertRange, clamp } = require('../../util/utils');
const Controls = require('../controls');
const query = require('../../util/query');
const name = 'bpose';

if ( query.scene.toLowerCase() === name ) {
  assets.queue({
    url: 'assets/models/bpose1_v1.glb',
    key: 'bpose'
  });
  assets.queue({
    url: 'assets/models/bpose1_NORM.jpg',
    key: 'normalmap',
    texture: true
  });
  assets.queue({
    url: 'assets/models/bpose1_AO.png',
    key: 'colormap',
    texture: true
  });
}

module.exports = class Bpose extends SketchScene {
  constructor () {
    super();

    this.name = name;
  }

  init() {
    const self = this;
    // now fetch the loaded resource
    const gltf = assets.get('bpose');
    const normalMap = assets.get('normalmap');
    const colorMap = assets.get('colormap');

    this.material = new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap
    });

    this.group = new THREE.Group();
    // this.group.position.set(0.38, -0.88, -1.18);
    this.group.rotation.set(0, -3.5, 0);

    this.add(this.group);
    if (webgl.dev) global.group = this.group;

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

    this.controlsInit();

    if (gui) { // assume it can be falsey, e.g. if we strip dat-gui out of bundle
      // attach dat.gui stuff here as usual
      // const folder = gui.addFolder('honeycomb');
      // folder.open();
    }
  }

  update (dt = 0, time = 0) {
    super.update();
  }
};
