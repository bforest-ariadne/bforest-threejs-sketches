const SketchScene = require('./SketchScene');
const { webgl, assets } = require('../../context');
// const basicFeedback = require('../postProcessing/basicFeedback');
// const basicDatamosh = require('../postProcessing/basicDatamosh');
const postProcessSetup = require('../postProcessing/basicDatamosh');
const query = require('../../util/query');
const defined = require('defined');

const name = 'feedbacktest';

const path = 'https://vanruesc.github.io/postprocessing/public/demo/textures/skies/space3/';
const format = '.jpg';
const names = [ 'px', 'nx', 'py', 'ny', 'pz', 'nz' ];
let urls = [];

for ( let i in names ) {
  urls[i] = names[i] + format;
}

var loader = new THREE.CubeTextureLoader();
loader.setPath( path );

var textureCube = loader.load( urls );

assets.queue({
  url: 'assets/textures/studio_small_02_1024/',
  key: 'env',
  envMap: true,
  hdr: true,
  pbr: true
});

assets.queue({
  url: 'assets/textures/iron1_bpr/Metal_DamagedIron_2k_metallic.jpg',
  key: 'iron_m',
  texture: true
});
assets.queue({
  url: 'assets/textures/iron1_bpr/Metal_DamagedIron_2k_n.jpg',
  key: 'iron_n',
  texture: true
});
assets.queue({
  url: 'assets/textures/iron1_bpr/Metal_DamagedIron_2k_roughness.jpg',
  key: 'iron_r',
  texture: true
});
assets.queue({
  url: 'assets/textures/iron1_bpr/Metal_DamagedIron_2k_ao.jpg',
  key: 'iron_a',
  texture: true
});
assets.queue({
  url: 'assets/textures/iron1_bpr/Metal_DamagedIron_2k_basecolor.jpg',
  key: 'iron_c',
  texture: true
});
assets.queue({
  url: 'assets/textures/iron1_bpr/Metal_DamagedIron_2k_h.jpg',
  key: 'iron_h',
  texture: true
});

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
    const geometry = new THREE.SphereBufferGeometry(1, 4, 4);

    let material, mesh;
    
    for (let i = 0; i < 100; ++i) {
      material = new THREE.MeshStandardMaterial({
        // color: 0xffffff * Math.random(),
        color: 0xffffff,
        roughness: 1.0,
        metalness: 1.0,
        // normalMap: crackedNormal,
        roughnessMap: assets.get('iron_r'),
        metalnessMap: assets.get('iron_m'),
        normalMap: assets.get('iron_n'),
        aoMap: assets.get('iron_a'),
        map: assets.get('iron_c'),
        displacement: assets.get('iron_h'),
        normalScale: new THREE.Vector2(0.1, 0.1),
        envMap: env.target.texture,
        flatShading: true
      });
      material.needsUpdate = true

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
