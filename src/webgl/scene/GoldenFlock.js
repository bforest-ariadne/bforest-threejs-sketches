const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicBloom');
const query = require('../../util/query');
const defined = require('defined');
const BoidSim = require('../objects/BoidSim');

const name = 'goldenflock';

const title = 'Golden Flocking';

const queueAssets = () => {
  const cubePath = 'assets/textures/blueLagoonNight_256/';
  const cargoPath = 'https://files.cargocollective.com/c521688/';
  assets.queue({
    url: cubePath,
    cargoUrls: [
      `${cargoPath}px.hdr`,
      `${cargoPath}nx.hdr`,
      `${cargoPath}py.hdr`,
      `${cargoPath}ny.hdr`,
      `${cargoPath}pz.hdr`,
      `${cargoPath}nz.hdr`
    ],
    key: 'env',
    envMap: true,
    hdr: true,
    pbr: true
  });
  assets.queue({
    url: 'assets/materials/gold1_512.glb',
    cargoUrl: `${cargoPath}gold1_512.glb`,
    key: 'gold'
  });
};

if ( defined( query.scene ) && query.scene.toLowerCase() === name ) {
  queueAssets();
}

class GoldenFlock extends SketchScene {
  constructor () {
    super(name);
    this.public = true;
    this.animate = true;
    this.pars = {
      scene: {
        testShadow: false,
        envMapIntensity: 1
      },
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
    this.controls.position = [ 0, 0, 350 ];
    let env = assets.get('env');

    webgl.scene.background = new THREE.Color( 0x000000 );

    webgl.renderer.setClearColor( 0x000000, 1);

    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;
    webgl.renderer.gammaFactor = 2.2;
    webgl.renderer.shadowMap.enabled = true;
    webgl.renderer.autoClear = false;
    webgl.renderer.physicallyCorrectLights = true;
    webgl.renderer.toneMapping = THREE.Uncharted2ToneMapping;
    webgl.renderer.toneMappingExposure = 1;

    webgl.camera.fov = 75;
    webgl.camera.far = 5000;
    webgl.camera.updateProjectionMatrix();

    postProcessSetup( true );

    let boidMat;
    boidMat = this.glbToMaterial( 'gold' );
    // boidMat = createMaterial(env.target.texture);
    for ( let [ key, value ] of Object.entries( boidMat ) ) {
      if ( value instanceof THREE.Texture && value.name.includes('assets') ) {
      // console.log(value)
        value.minFilter = THREE.LinearMipMapLinearFilter;
        value.magFilter = THREE.LinearFilter;
        value.anisotrophy = 1;
        value.needsUpdate = true;
      }
    }
    boidMat.flatShading = true;
    boidMat.metalness = boidMat.roughness = 1;
    boidMat.envMap = env.target.texture;

    this.boidSim = new BoidSim( webgl.renderer, {
      width: this.pars.boids.width,
      bounds: this.pars.boids.bounds,
      centerStrength: 1,
      geometry: new THREE.BoxBufferGeometry( 10, 10, 20, 1, 1, 1 ),
      material: boidMat
    });
    this.boidSim.birdMesh.castShadow = true;
    this.add( this.boidSim.birdMesh );
    this.boidUniformUpdate();

    this.adjustEnvIntensity();
    this.setupGui();
  }

  update (delta = 0, now = 0, frame = 0) {
    super.update();
    if ( defined( this.boidSim ) ) {
      // this.log('delta, now, frame', delta, now, frame );
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

  setupGui() {
    if ( !webgl.dev ) return;
    let f = gui.addFolder({title: `Scene: ${this.name}`});

    f.addInput( this.pars.scene, 'envMapIntensity', {
      min: 0.0,
      max: 1.0,
      step: 0.01,
      label: 'env level'
    }).on( 'change', () => {
      this.adjustEnvIntensity();
    });
  }

  adjustEnvIntensity( value ) {
    if ( defined( value, false ) ) this.pars.scene.envMapIntensity = value;
    this.traverse( child => {
      if ( defined( child.material, false) && defined( child.material.envMap, false ) ) {
        child.material.envMapIntensity = this.pars.scene.envMapIntensity;
      }
    });
  }

  start() {
    this.animate = true;
    this.log('started scene');
  }

  stop() {
    this.animate = false;
    this.log('stopped scene');
  }

  onKeydown(ev) {
    if ( ev.keyCode === 32 && !ev.shiftKey ) {
      // this.animate = !this.animate;
      if ( this.animate ) {
        this.stop();
      } else {
        this.start();
      }
    }
  }
}

GoldenFlock.queueAssets = queueAssets;

GoldenFlock.title = title;
GoldenFlock.publish = true;
GoldenFlock.sceneName = name;

module.exports = GoldenFlock;
