const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicBloom');
const query = require('../../util/query');
const defined = require('defined');
const BoidSim = require('../objects/BoidSim');
const { SpotLight, PointLight } = require('../objects/lights');
const Ground = require('../objects/ground');
// eslint-disable-next-line no-unused-vars
const { createMaterial, materialAssets } = require('../materials/createPbrMaterial');
const IceMaterial = require('../materials/IceMaterial');

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
        envMapIntensity: 0.02
      },
      boids: {
        width: webgl.gpuInfo.tierNum === 1 ? 16 : 32,
        bounds: 800,
        separation: 20.0,
        alignment: 20.0,
        cohesion: 20.0,
        freedom: 0.75,
        squashiness: 1.0,
        predatorPosition: new THREE.Vector3( 0, 0, 0 ),
        centerPosition: new THREE.Vector3(),
        centerStrength: 63,
        speedLimit: 9
      },
      iceMat: {
        thicknessAmbient: 0,
        thicknessDistortion: 0.19,
        thicknessPower: 30,
        thicknessScale: 10,
        thicknessAttenuation: 1,
        thicknessRepeat: 1,
        thicknessColor: 0xffffff
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
    // webgl.scene.background = env.cubeMap;

    webgl.renderer.setClearColor( 0x000000, 1);

    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;
    webgl.renderer.gammaFactor = 2.2;
    webgl.renderer.shadowMap.enabled = true;
    webgl.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    webgl.renderer.autoClear = false;
    webgl.renderer.physicallyCorrectLights = true;
    webgl.renderer.toneMapping = THREE.Uncharted2ToneMapping;
    webgl.renderer.toneMappingExposure = 1;

    webgl.camera.fov = 75;
    webgl.camera.far = 5000;
    webgl.camera.updateProjectionMatrix();

    postProcessSetup( true );

    this.room = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 400, 400, 400 ),
      new THREE.MeshStandardMaterial({ side: THREE.BackSide })
    );
    this.room.receiveShadow = true;
    this.add( this.room );

    // boidGeo = geometry: new THREE.BoxBufferGeometry( 10, 10, 20 )
    let boidMat;
    // boidMat = this.glbToMaterial( 'gold' );
    // boidMat = createMaterial(env.target.texture);
    this.iceMaterial = new IceMaterial({
      // roughnessMap: assets.get('lava'),
      // thicknessMap: assets.get('h'),
      roughnessMap: assets.get('aorm'),
      metalnessMap: assets.get('aorm'),
      normalMap: assets.get('n'),
      aoMap: assets.get('aorm'),
      map: assets.get('c'),
      roughness: 1,
      metalness: 1,
      envMap: env.target.texture
    });

    boidMat = this.iceMaterial;

    for ( let value of Object.values( boidMat ) ) {
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

    let boidGeo;
    // boidGeo = new THREE.CylinderBufferGeometry( 7, 7.0, 20, 32, 1 );
    // boidGeo.rotateZ(Math.PI / 2);
    // boidGeo = new THREE.SphereBufferGeometry( 10, 16, 8 );
    boidGeo = new THREE.BoxBufferGeometry( 20, 15, 2, 1, 1, 1 );
    // const normalMat = new THREE.MeshNormalMaterial();

    this.boidSim = new BoidSim( webgl.renderer, {
      width: this.pars.boids.width,
      bounds: this.pars.boids.bounds,
      centerStrength: this.pars.boids.centerStrength,
      // geometry: createBirdInstanceGeometry( this.pars.boids.width * this.pars.boids.width ),
      geometry: boidGeo,
      material: boidMat
    });
    this.boidSim.birdMesh.castShadow = true;
    this.boidSim.birdMesh.receiveShadow = true;
    this.add( this.boidSim.birdMesh );
    if ( webgl.dev ) window.birdMesh = this.boidSim.birdMesh;
    this.boidUniformUpdate();
    

    this.pointLight = new PointLight({
      intensity: 3000,
      meshSize: 100,
      castShadow: true,
      shadowMapSize: 256,
      shadowCameraFar: 1000,
      shadowCameraNear: 50
    });
    this.add( this.pointLight );

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
    this.iceMatUniformsUpdate();
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
    this.boidSim.velocityUniforms[ 'centerStrength' ].value = this.pars.boids.centerStrength;
    this.boidSim.velocityUniforms[ 'speedLimit' ].value = this.pars.boids.speedLimit;
  }

  iceMatUniformsUpdate() {
    for ( let [ key, value ] of Object.entries( this.pars.iceMat ) ) {
      if ( this.iceMaterial.uniforms[ key ].type !== 'f' ) continue;
      this.iceMaterial.uniforms[ key ].value = value;
    }
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
    f.expanded = false;

    f = gui.addFolder({title: `boid sim`});

    f.addInput( this.pars.boids, 'squashiness', {
      min: 0.0,
      max: 1.0,
      step: 0.01,
      label: 'squashiness'
    }).on( 'change', () => {
      this.boidSim.birdUniforms.squashiness.value = this.pars.boids.squashiness;
    });

    f.addInput( this.pars.boids, 'separation', {
      min: 0.0,
      max: 40.0,
      label: 'separation distance'
    }).on( 'change', () => {
      this.boidUniformUpdate();
    });

    f.addInput( this.pars.boids, 'cohesion', {
      min: 0.0,
      max: 40.0,
      label: 'cohesion distance'
    }).on( 'change', () => {
      this.boidUniformUpdate();
    });

    f.addInput( this.pars.boids, 'alignment', {
      min: 0.0,
      max: 40.0,
      label: 'alignment distance'
    }).on( 'change', () => {
      this.boidUniformUpdate();
    });

    f.addInput( this.pars.boids, 'centerStrength', {
      min: 0.0,
      max: 100.0,
      label: 'centerStrength'
    }).on( 'change', () => {
      this.boidUniformUpdate();
    });
    f.addInput( this.pars.boids, 'speedLimit', {
      min: 0.0,
      max: 100.0,
      label: 'speedLimit'
    }).on( 'change', () => {
      this.boidUniformUpdate();
    });
    f.expanded = false;

    f = gui.addFolder({title: `boid predator`});
    const predatorRange = 800;
    f.addInput( this.pars.boids.predatorPosition, 'x', {
      min: -predatorRange,
      max: predatorRange,
      label: 'predator x'
    }).on( 'change', () => {
      this.boidSim.predatorPosition.copy( this.pars.boids.predatorPosition );
    });

    f.addInput( this.pars.boids.predatorPosition, 'y', {
      min: -predatorRange,
      max: predatorRange,
      label: 'predator y'
    }).on( 'change', () => {
      this.boidSim.predatorPosition.copy( this.pars.boids.predatorPosition );
    });

    f.addInput( this.pars.boids.predatorPosition, 'z', {
      min: -predatorRange,
      max: predatorRange,
      label: 'predator z'
    }).on( 'change', () => {
      this.boidSim.predatorPosition.copy( this.pars.boids.predatorPosition );
    });
    f.expanded = false;

    f = gui.addFolder({title: `boid center`});
    const centerRange = 100;
    f.addInput( this.pars.boids.centerPosition, 'x', {
      min: -centerRange,
      max: centerRange,
      label: 'center x'
    }).on( 'change', () => {
      this.boidSim.centerPosition.copy( this.pars.boids.centerPosition );
    });

    f.addInput( this.pars.boids.centerPosition, 'y', {
      min: -centerRange,
      max: centerRange,
      label: 'center y'
    }).on( 'change', () => {
      this.boidSim.centerPosition.copy( this.pars.boids.centerPosition );
    });

    f.addInput( this.pars.boids.centerPosition, 'z', {
      min: -centerRange,
      max: centerRange,
      label: 'center z'
    }).on( 'change', () => {
      this.boidSim.centerPosition.copy( this.pars.boids.centerPosition );
    });
    f.expanded = false;

    f = gui.addFolder({title: `iceMat`});

    f.addInput( this.pars.iceMat, 'thicknessAmbient', {
      min: 0.0,
      max: 1,
      step: 0.01,
      label: 'thicknessAmbient'
    }).on( 'change', () => {
      this.iceMatUniformsUpdate();
    });

    f.addInput( this.pars.iceMat, 'thicknessDistortion', {
      min: 0.0,
      max: 1,
      step: 0.01,
      label: 'thicknessDistortion'
    }).on( 'change', () => {
    });

    f.addInput( this.pars.iceMat, 'thicknessPower', {
      min: 0.0,
      max: 100,
      step: 1,
      label: 'thicknessPower'
    }).on( 'change', () => {
    });

    f.addInput( this.pars.iceMat, 'thicknessScale', {
      min: 0.0,
      max: 10,
      step: 0.01,
      label: 'thicknessScale'
    }).on( 'change', () => {
    });

    f.addInput( this.pars.iceMat, 'thicknessAttenuation', {
      min: 0.0,
      max: 1,
      step: 0.01,
      label: 'thicknessAttenuation'
    });

    f.addInput( this.pars.iceMat, 'thicknessRepeat', {
      min: 0.0,
      max: 5,
      step: 0.01,
      label: 'thicknessRepeat'
    }).on( 'change', () => {
      this.iceMaterial.uniforms.thicknessRepeat.value.x = this.pars.iceMat.thicknessRepeat;
      this.iceMaterial.uniforms.thicknessRepeat.value.y = this.pars.iceMat.thicknessRepeat;
    });

    f.addInput( this.iceMaterial, 'thicknessColorStyle', {
      label: 'thicknessColor'
    });
    f.expanded = false;
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
