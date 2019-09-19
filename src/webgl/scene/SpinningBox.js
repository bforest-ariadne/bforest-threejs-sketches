const SketchScene = require('./SketchScene');
const name = 'spinningbox';

module.exports = class SpinningBox extends SketchScene {
  constructor () {
    super(name);
  }
  init() {
    this.controlsInit();
    console.log('init', this.name );
    this.add(new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        wireframe: true, color: 'yellow'
      })
    ));
  }
  update (dt = 0) {
    super.update();
    this.rotation.x += dt * 0.1;
  }
};
