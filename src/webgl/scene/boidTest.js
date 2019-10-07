const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicSSAO');
const query = require('../../util/query');
const defined = require('defined');
const BoidSim = require('../objects/BoidSim');

const name = 'boidtest';

// const textureCompression = webgl.mobile ? 'PVRTC' : 'DXT1';

if ( defined( query.scene ) && query.scene.toLowerCase() === name ) {

}

module.exports = class BoidTest extends SketchScene {
  constructor () {
    super(name);
    this.animate = true;
  }
  init() {
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

    this.boidSim = new BoidSim( webgl.renderer, {
      width: this.pars.boids.width,
      bounds: this.pars.boids.bounds,
      centerStrength: 5
    } );
    this.boidSim.birdMesh.matrixAutoUpdate = true;
    this.boidSim.birdMesh.scale.multiplyScalar( 0.01 );

    this.add( this.boidSim.birdMesh );

    this.controlsInit();
    this.controls.distance = 10;
    this.controls.position = [ 8, 2, -7.4 ];

    webgl.scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    // webgl.scene.background = env.cubeMap;
    webgl.renderer.setClearColor( webgl.scene.fog.color, 1);

    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;
    webgl.renderer.gammaFactor = 2.2;
    webgl.renderer.shadowMap.enabled = true;
    webgl.renderer.autoClear = false;
    webgl.renderer.physicallyCorrectLights = true;

    postProcessSetup( false );
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

  onKeydown(ev) {
    if ( ev.keyCode === 32 && !ev.shiftKey ) {
      this.animate = !this.animate;
    }
  }
};
