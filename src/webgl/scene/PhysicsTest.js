const SketchScene = require('./SketchScene');
const { webgl } = require('../../context');

const name = 'physicstest';

module.exports = class PhysicsTest extends SketchScene {
  constructor () {
    super();
    this.name = name;
  }
  init() {
    this.controlsInit();
    console.log('init', this.name );
    // this.add(new THREE.Mesh(
    //   new THREE.BoxGeometry(1, 1, 1),
    //   new THREE.MeshBasicMaterial({
    //     wireframe: true, color: 'yellow'
    //   })
    // ));

    const physics = webgl.physics;

    this.ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry( 10, 10, 5, 5 ),
      new THREE.MeshStandardMaterial()
    );
    this.ground.position.y = 0;
    this.add( this.ground );
    physics.aniMeshes.push( this.ground );

    this.box = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 0.3, 0.3, 0.3 ),
      new THREE.MeshStandardMaterial()
    );
    this.add( this.box );
    physics.meshes.push( this.box );

    this.ball = new THREE.Mesh(
      new THREE.SphereBufferGeometry( 0.1, 20, 20 ),
      new THREE.MeshStandardMaterial()
    );
    this.ball.position.y = 1;
    this.add( this.ball );
    physics.aniMeshes.push( this.ball );

  }
  update (dt = 0) {
    super.update();
    this.rotation.x += dt * 0.1;
  }
};
