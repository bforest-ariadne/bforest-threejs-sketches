const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicSSAO');
const query = require('../../util/query');
const defined = require('defined');
const BoidSim = require('../objects/BoidSim');
const { createBirdInstanceGeometry } = require('../geos/Bird');
const { SpotLight, PointLight } = require('../objects/lights');

const name = 'boidtest';


if ( defined( query.scene ) && query.scene.toLowerCase() === name ) {

}

module.exports = class BoidTest extends SketchScene {
  constructor () {
    super(name);
    this.animate = true;
    this.pars = {
      boids: {
        width: 32,
        bounds: 800,
        separation: 20.0,
        alignment: 20.0,
        cohesion: 20.0,
        freedom: 0.75,
        predatorPosition: new THREE.Vector3( 200, 200, 0 )
      }
    };
  }
  init() {
    this.controlsInit();
    this.controls.distance = 350;
    // this.controls.position = [-387.5724404469007, 639.4741434068955, -686.0763950300969];
    this.controls.position = [ 0, 0, 350 ];

    webgl.scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
    webgl.scene.background = new THREE.Color( 0x808080 );
    webgl.renderer.setClearColor( webgl.scene.fog.color, 1);

    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;
    webgl.renderer.gammaFactor = 2.2;
    webgl.renderer.shadowMap.enabled = true;
    webgl.renderer.autoClear = false;
    webgl.renderer.physicallyCorrectLights = true;

    webgl.camera.fov = 75;
    webgl.camera.far = 5000;
    webgl.camera.updateProjectionMatrix();

    postProcessSetup( false );

    this.spotLight = new SpotLight();
    this.spotLight.shadow.camera.far = 200;
    this.spotLight.distance = 500;
    this.spotLight.intensity = 50;
    // this.spotlight.mesh.material.blending = THREE.AdditiveBlending;
    this.spotLight.position.set( 0, 100, 0 );
    this.spotLight.mesh.material.size = 20;
    this.add( this.spotLight );

    this.ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry( 500, 500, 2, 2 ),
      new THREE.MeshStandardMaterial({
        metalness: 0,
        roughness: 1
      })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -50;
    this.ground.castShadow = false;
    this.ground.receiveShadow = true;
    this.add( this.ground );

    this.boidSim = new BoidSim( webgl.renderer, {
      width: this.pars.boids.width,
      bounds: this.pars.boids.bounds,
      centerStrength: 1
    } );

    this.boidSim.birdMesh.castShadow = true;

    this.add( this.boidSim.birdMesh );
    this.boidUniformUpdate();

    const testSphere = new THREE.Mesh(
      new THREE.SphereBufferGeometry( 20 ),
      new THREE.MeshNormalMaterial()
    );
    testSphere.name = 'testSphere';
    testSphere.castShadow = true;
    this.add( testSphere );
    window.testSphere = testSphere;

  }

  update (delta = 0, now = 0, frame = 0) {
    super.update();
    if ( defined( this.boidSim ) ) {
      if ( !this.animate ) return;
      this.boidSim.predatorPosition.copy( this.pars.boids.predatorPosition );

      this.boidSim.update( delta, now, frame );
    }
  }

  boidUniformUpdate() {
    this.boidSim.velocityUniforms[ 'separationDistance' ].value = this.pars.boids.separation;
    this.boidSim.velocityUniforms[ 'alignmentDistance' ].value = this.pars.boids.alignment;
    this.boidSim.velocityUniforms[ 'cohesionDistance' ].value = this.pars.boids.cohesion;
    this.boidSim.velocityUniforms[ 'freedomFactor' ].value = this.pars.boids.freedom;
  }

  onKeydown(ev) {
    if ( ev.keyCode === 32 && !ev.shiftKey ) {
      this.animate = !this.animate;
    }
  }
};
