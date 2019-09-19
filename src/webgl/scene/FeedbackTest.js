const SketchScene = require('./SketchScene');
const { webgl } = require('../../context');
const name = 'feedbacktest';

module.exports = class FeedbackTest extends SketchScene {
  constructor () {
    super(name);
  }
  init() {
    this.controlsInit();
    this.controls.distance = 20;
    this.controls.position = [ 0, 0, 20 ];

    webgl.scene.fog = new THREE.FogExp2(0x000000, 0.025);
    webgl.renderer.setClearColor( webgl.scene.fog.color, 1);

    // Lights.

    this.add(new THREE.AmbientLight(0xcccccc));
    this.add(new THREE.DirectionalLight(0xffffff));

    // Objects.

    const object = new THREE.Object3D();
    const geometry = new THREE.SphereBufferGeometry(1, 4, 4);

    let material, mesh;

    for (let i = 0; i < 100; ++i) {
      material = new THREE.MeshPhongMaterial({
        color: 0xffffff * Math.random(),
        flatShading: true
      });

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
    this.rotation.x += dt * 0.1;
  }
};
