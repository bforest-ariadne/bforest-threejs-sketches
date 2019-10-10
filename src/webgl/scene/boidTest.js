const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicBloom');
const query = require('../../util/query');
const defined = require('defined');
const BoidSim = require('../objects/BoidSim');
const { SpotLight, PointLight } = require('../objects/lights');
const Ground = require('../objects/ground');
const { createMaterial, materialAssets } = require('../materials/createPbrMaterial');

// const { BirdGeometry, createBirdInstanceGeometry } = require( '../geos/Bird.js' );

const name = 'boidtest';

const title = 'Boid Sim Test';

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
  // assets.queue({
  //   url: 'assets/materials/gold1.glb',
  //   key: 'gold'
  // });

  for ( let i in materialAssets ) {
    assets.queue( materialAssets[i] );
  }
};

if ( defined( query.scene ) && query.scene.toLowerCase() === name ) {
  queueAssets();
}

class BoidTest extends SketchScene {
  constructor () {
    super(name);
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
    // this.controls.position = [-387.5724404469007, 639.4741434068955, -686.0763950300969];
    this.controls.position = [ 0, 0, 350 ];
    let env = assets.get('env');

    // webgl.scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
    webgl.scene.background = new THREE.Color( 0x000000 );
    webgl.scene.background = env.cubeMap;

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

    // boidGeo = geometry: new THREE.BoxBufferGeometry( 10, 10, 20 )
    let boidMat;
    // boidMat = this.glbToMaterial( 'gold' );
    boidMat = createMaterial(env.target.texture);
    for ( let [ key, value ] of Object.entries( boidMat ) ) {
      if ( value instanceof THREE.Texture && value.name.includes('assets') ) {
      // console.log(value)
        value.minFilter = THREE.LinearMipMapLinearFilter;
        value.magFilter = THREE.LinearFilter;
        value.anisotrophy = 1;
        value.needsUpdate = true;
      }
    }
    boidMat.flatShading = false;
    boidMat.metalness = boidMat.roughness = 1;
    boidMat.envMap = env.target.texture;

    const cScale = 30;
    const cylinderGeo = new THREE.CylinderBufferGeometry( 0.25 * cScale, 0.0 * cScale, 1 * cScale, 32, 1 );
    cylinderGeo.rotateZ(Math.PI / 2);
    const sphereGeo = new THREE.SphereBufferGeometry( 10, 16, 8 );
    const boxGeo = new THREE.BoxBufferGeometry( 20, 10, 10, 1, 1, 1 );
    const normalMat = new THREE.MeshNormalMaterial();

    this.boidSim = new BoidSim( webgl.renderer, {
      width: this.pars.boids.width,
      bounds: this.pars.boids.bounds,
      centerStrength: 1,
      // geometry: createBirdInstanceGeometry( this.pars.boids.width * this.pars.boids.width ),
      geometry: sphereGeo,
      material: boidMat
    });
    this.boidSim.birdMesh.castShadow = true;
    this.add( this.boidSim.birdMesh );
    if ( webgl.dev ) window.birdMesh = this.boidSim.birdMesh;
    this.boidUniformUpdate();

    if ( this.pars.scene.testShadow ) {
      this.spotLight = new SpotLight({
        intensity: 50,
        distance: 500,
        angle: 1,
        shadowCameraFar: 200,
        meshSize: 20,
        position: new THREE.Vector3( 0, 100, 0 )
      });
      this.add( this.spotLight );

      this.ground = new Ground({
        size: 500,
        height: -50
      });

      this.add( this.ground );

      const testSphere = new THREE.Mesh(
        new THREE.SphereBufferGeometry( 20 ),
        new THREE.MeshNormalMaterial()
      );
      testSphere.name = 'testSphere';
      testSphere.castShadow = true;
      this.add( testSphere );
      window.testSphere = testSphere;
    }
    this.adjustEnvIntensity();
    this.setupGui();
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

  setupGui() {
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

  onKeydown(ev) {
    if ( ev.keyCode === 32 && !ev.shiftKey ) {
      this.animate = !this.animate;
    }
  }
}
BoidTest.queueAssets = queueAssets;

BoidTest.title = title;
BoidTest.publish = false;
BoidTest.sceneName = name;

module.exports = BoidTest;
