const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicSSAO');
const query = require('../../util/query');
const defined = require('defined');
const BoidSim = require('../objects/BoidSim');
const { createBirdInstanceGeometry } = require('../geos/Bird');

const name = 'boidtest';

// const textureCompression = webgl.mobile ? 'PVRTC' : 'DXT1';

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
    this.controls.distance = 1000;
    this.controls.position = [-387.5724404469007, 639.4741434068955, -686.0763950300969];

    // webgl.scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    // webgl.scene.background = env.cubeMap;
    // webgl.renderer.setClearColor( webgl.scene.fog.color, 1);

    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;
    webgl.renderer.gammaFactor = 2.2;
    webgl.renderer.shadowMap.enabled = true;
    webgl.renderer.autoClear = false;
    webgl.renderer.physicallyCorrectLights = true;
    webgl.camera.far = 5000;
    webgl.camera.updateProjectionMatrix();

    postProcessSetup( false );

    this.boidSim = new BoidSim( webgl.renderer, {
      width: this.pars.boids.width,
      bounds: this.pars.boids.bounds,
      centerStrength: 1
    } );
    // this.boidSim.birdMesh.matrixAutoUpdate = true;
    // this.boidSim.birdMesh.scale.multiplyScalar( 0.01 );

    this.add( this.boidSim.birdMesh );
    this.boidUniformUpdate();

    // this.testBird = new THREE.Mesh(
    //   createBirdInstanceGeometry( this.pars.boids.width ),
    //   new THREE.MeshNormalMaterial()
    // );
    // this.testBird.name = 'testBird';
    // this.add( this.testBird );


  }

  update (delta = 0, now = 0, frame = 0) {
    super.update();
    if ( defined( this.boidSim ) ) {
      // this.godGroup.getWorldPosition( this.godGroupWorldPos );
      this.boidSim.predatorPosition.copy( this.pars.boids.predatorPosition );
      // this.boidSim.centerPosition.set(
      //   this.godGroupWorldPos.x * 100,
      //   this.godGroupWorldPos.y * 100,
      //   this.godGroupWorldPos.z * 100
      // );
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
