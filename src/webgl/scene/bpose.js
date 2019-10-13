const SketchScene = require('./SketchScene');
const { gui, /* webgl, */ assets } = require('../../context');
const { BPoseObj, bPoseObjAssets } = require('../objects/bposeObj');
// const { convertRange, clamp } = require('../../util/utils');
const query = require('../../util/query');
const basicBloom = require('../postProcessing/basicBloom');
const defined = require('defined');

const name = 'bpose';/*  */

if ( defined( query.scene ) && query.scene.toString().toLowerCase() === name ) {
  for ( let i in bPoseObjAssets ) {
    assets.queue( bPoseObjAssets[i] );
  }
}
class Bpose extends SketchScene {
  constructor () {
    super(name);
  }

  init() {
    basicBloom();
    this.bpose = new BPoseObj();
    this.add( this.bpose );

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
}

Bpose.sceneName = name;

module.exports = Bpose;
