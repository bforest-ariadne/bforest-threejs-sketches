const SketchScene = require('./SketchScene');
const { webgl, assets } = require('../../context');
// const basicFeedback = require('../postProcessing/basicFeedback');
// const basicDatamosh = require('../postProcessing/basicDatamosh');
const { createIronMaterial, ironAssets } = require('../materials/dammagedIron')
const postProcessSetup = require('../postProcessing/basicDatamosh');
const query = require('../../util/query');
const defined = require('defined');

const name = 'feedbacktest';

if ( defined( query.scene ) && query.scene.toLowerCase() === name ) {
  assets.queue({
    url: 'assets/textures/studio_small_02_1024/',
    key: 'env',
    envMap: true,
    hdr: true,
    pbr: true
  });

  for ( let i in ironAssets ) {
    assets.queue( ironAssets[i] );
  }
}

module.exports = class FeedbackTest extends SketchScene {
  constructor () {
    super(name);
  }
  init() {
    this.controlsInit();
    this.controls.distance = 20;
    this.controls.position = [ 0, 0, 20 ];

    let env = assets.get('env');

    webgl.scene.fog = new THREE.FogExp2(0x000000, 0.025);
    webgl.scene.background = env.cubeMap;
    webgl.renderer.setClearColor( webgl.scene.fog.color, 1);
    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;

    postProcessSetup();

    // Objects.

    const object = new THREE.Object3D();
    this.object = object;
    let material, mesh;
    material = createIronMaterial();
    material.envMap = env.target.texture;
    material.needsUpdate = true;


    const geometry = new THREE.SphereBufferGeometry(1, 4, 4);



    for (let i = 0; i < 100; ++i) {
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      mesh.position.multiplyScalar(Math.random() * 10);
      mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      mesh.scale.multiplyScalar(Math.random());
      object.add(mesh);
    }

    this.add(object);
  }
  update (dt = 0) {
    super.update();
    this.object.rotation.x += dt * 0.1;
  }
};
