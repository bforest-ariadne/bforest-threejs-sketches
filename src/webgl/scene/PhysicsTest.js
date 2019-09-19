const SketchScene = require('./SketchScene');
const { webgl } = require('../../context');
const basicSMAA = require('../postProcessing/basicSMAA');

const name = 'physicstest';

module.exports = class PhysicsTest extends SketchScene {
  constructor () {
    super( name );
    // this.name = name;
  }
  init() {
    webgl.initPhysics();
    this.controlsInit();
    this.controls.position = [ 0, 1, 5 ];
    basicSMAA();

    console.log('init', this.name );

    const physics = webgl.physics;
    this.R = 0.5;

    this.ball = new THREE.Mesh(
      new THREE.SphereBufferGeometry( 0.1, 20, 20 ),
      new THREE.MeshStandardMaterial()
    );
    this.ball.position.y = 1;
    this.add( this.ball );
    physics.aniMeshes.push( this.ball );

    this.ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry( 10, 10, 5, 5 ),
      new THREE.MeshStandardMaterial()
    );
    this.ground.position.y = 0;
    this.ground.rotation.x = -Math.PI / 2;
    this.add( this.ground );
    physics.aniMeshes.push( this.ground );

    this.box = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 0.3, 0.3, 0.3 ),
      new THREE.MeshStandardMaterial()
    );
    this.add( this.box );
    physics.meshes.push( this.box );

    const dLight = new THREE.DirectionalLight();
    dLight.position.set( -1, 1, 2 );
    this.add( dLight );
  }

  update (delta = 0, now = 0, frame = 0) {
    super.update();
    this.ball.position.set( this.R * Math.sin( now  ), 1, this.R * Math.cos( now ) );
    // this.rotation.x += dt * 0.1;
  }
};
