const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicBloom');
const query = require('../../util/query');
const defined = require('defined');
const { merge } = require('merge-anything');
const BoidSim = require('../objects/BoidSim');
const { SpotLight, PointLight } = require('../objects/lights');
const Ground = require('../objects/ground');
// eslint-disable-next-line no-unused-vars
const { createMaterial, materialAssets } = require('../materials/createPbrMaterial');
const IceMaterial = require('../materials/IceMaterial');
const { toneMappingOptions } = require('../../util/constants');
const { KernelSize } = require('postprocessing');

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
  assets.queue({
    url: 'assets/materials/Plastic01_512.glb',
    cargoUrl: `${cargoPath}Plastic01_512.glb`,
    key: 'plastic'
  });

  for ( let i in materialAssets ) {
    assets.queue( materialAssets[i] );
  }
};

if ( defined( query.scene ) && query.scene.toString().toLowerCase() === name ) {
  queueAssets();
}

class BoidTest extends SketchScene {
  constructor () {
    super(name);
    this.animate = true;
    const pars = {
      scene: {
        envMapIntensity: 1
      },
      renderer: {
        exposure: 1,
        whitePoint: 5,
        toneMapping: toneMappingOptions.Uncharted2,
        gammaInput: false
      },
      'bloomEffect': {
        'dithering': true,
        'resolution': 360,
        'kernelSize': KernelSize.LARGE,
        'scale': 1,
        'opacity': 3.11,
        'luminance': {
          'filter': true,
          'threshold': 0.5,
          'smoothing': 0.42
        }
      },
      levels: {
        hue: 0,
        saturation: 0,
        brightness: 0,
        contrast: 0.2
      },
      boids: {
        width: webgl.gpuInfo.tierNum === 1 ? 16 : 32,
        separationDistance: 20.0,
        alignmentDistance: 20.0,
        cohesionDistance: 20.0,
        squashiness: 1.0,
        predator: new THREE.Vector3( 0, 800, 800 ),
        center: new THREE.Vector3(),
        centerStrength: 11,
        speedLimit: 9,
        bounds: 80
      },
      iceMat: {
        thicknessAmbient: 0,
        thicknessDistortion: 0.19,
        thicknessPower: 5.43,
        thicknessScale: 28,
        thicknessAttenuation: 0.15,
        thicknessRepeat: 1
      }
    };
    this.pars = merge( this.pars, pars );
    this.simFolders = [];
    this.postFolders = [];
  }
  init() {
    super.init();
    this.orbitControlsInit();
    this.orbitControls.enablePan = !webgl.mobile;
    webgl.camera.position.z = 350;
    // this.controlsInit();
    // this.controls.distance = 350;
    // this.controls.position = [ 0, 0, 350 ];
    let env = assets.get('env');

    // webgl.scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
    // webgl.scene.background = new THREE.Color( 0x000000 );
    webgl.scene.background = env.cubeMap;

    webgl.renderer.setClearColor( 0x000000, 1);

    webgl.camera.fov = 75;
    webgl.camera.far = 5000;
    webgl.camera.updateProjectionMatrix();

    postProcessSetup( true );

    this.setupCubeCamera();

    const invisibleMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.BackSide
    });

    const roomMat = createMaterial( env.target.texture );

    this.room = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 600, 600, 600 ),
      // createMaterial(env.target.texture)
      // createMaterial()
      [ roomMat, invisibleMat, invisibleMat, roomMat, invisibleMat, roomMat ]
      // new THREE.MeshStandardMaterial({
      //   side: THREE.BackSide,
      //   metalness: 0.4,
      //   roughness: 0.54,
      //   color: 0x222222
      // })
    );
    // this.room.material.side = THREE.BackSide;
    roomMat.side = THREE.BackSide;
    this.room.receiveShadow = true;
    this.add( this.room );

    this.pointLight = new PointLight({
      intensity: 10000,
      meshSize: 100,
      castShadow: true,
      shadowMapSize: 256,
      shadowCameraFar: 1000,
      shadowCameraNear: 50
    });
    this.add( this.pointLight );

    this.renderEnv();
    roomMat.envMap = this.env.texture;

    this.testSphere = new THREE.Mesh(
      new THREE.SphereBufferGeometry( 50, 8, 8 ),
      new THREE.MeshStandardMaterial({
        roughness: 0,
        metalness: 1,
        envMap: this.env.texture
      })
    );
    this.testSphere.position.x = 100;
    // this.add( this.testSphere );

    // boidGeo = geometry: new THREE.BoxBufferGeometry( 10, 10, 20 )
    let boidMat;
    // boidMat = this.glbToMaterial( 'gold' );
    // boidMat = createMaterial(env.target.texture);
    boidMat = this.glbToMaterial( 'plastic' );

    if ( webgl.dev ) window.boidMat = boidMat;
    this.iceMaterial = new IceMaterial({
      // roughnessMap: assets.get('aorm'),
      // metalnessMap: assets.get('aorm'),
      // normalMap: assets.get('n'),
      // aoMap: assets.get('aorm'),
      // map: assets.get('c'),
      roughnessMap: boidMat.roughnessMap,
      // metalnessMap: boidMat.metalnessMap,
      normalMap: boidMat.normalMap,
      // aoMap: boidMat.aoMap,
      map: boidMat.map,
      roughness: 1,
      metalness: 0,
      // envMap: env.target.texture
      envMap: this.env.texture
    });

    boidMat = this.iceMaterial;

    for ( let value of Object.values( boidMat ) ) {
      if ( value instanceof THREE.Texture ) {
        // dont modifiy env textures
        if ( value.mapping === THREE.CubeReflectionMapping ||
          value.mapping === THREE.CubeRefractionMapping ||
          value.mapping === THREE.CubeUVReflectionMapping ||
          value.mapping === THREE.CubeUVRefractionMapping ) continue;

        value.encoding = THREE.LinearEncoding;
        value.minFilter = THREE.LinearMipMapLinearFilter;
        value.magFilter = THREE.LinearFilter;
        value.anisotrophy = 1;
        value.needsUpdate = true;
      }
    }
    boidMat.flatShading = false;
    // boidMat.metalness = boidMat.roughness = 1;
    boidMat.roughness = 1;
    // boidMat.envMap = env.target.texture;

    let boidGeo;
    boidGeo = new THREE.CylinderBufferGeometry( 5, 5.0, 20, 32, 1 );
    boidGeo.rotateZ(Math.PI / 2);
    // boidGeo = new THREE.SphereBufferGeometry( 10, 16, 8 );
    // boidGeo = new THREE.BoxBufferGeometry( 20, 15, 2, 1, 1, 1 );
    // const normalMat = new THREE.MeshNormalMaterial();

    this.boidSim = new BoidSim( webgl.renderer, {
      width: this.pars.boids.width,
      bounds: this.pars.boids.bounds,
      centerStrength: this.pars.boids.centerStrength,
      // geometry: createBirdInstanceGeometry( this.pars.boids.width * this.pars.boids.width ),
      geometry: boidGeo,
      material: boidMat,
      useCustomDistance: true
    });
    this.boidSim.birdMesh.castShadow = true;
    this.boidSim.birdMesh.receiveShadow = true;
    this.add( this.boidSim.birdMesh );
    if ( webgl.dev ) window.birdMesh = this.boidSim.birdMesh;
    this.boidUniformUpdate();

    this.adjustEnvIntensity();
    this.iceMatUniformsUpdate();
    if ( webgl.gui ) this.setupGui();
  }

  update (delta = 0, now = 0, frame = 0) {
    super.update();
    if ( defined( this.boidSim ) ) {
      if ( !this.animate ) return;

      // this.boidSim.predatorPosition.copy( this.pars.boids.predatorPosition );

      this.boidSim.update( delta, now, frame );
    }
  }

  boidUniformUpdate() {
    for ( let [ key, value ] of Object.entries( this.pars.boids ) ) {
      if ( !this.boidSim.velocityUniforms.hasOwnProperty( key ) ) continue;
      if ( !this.boidSim.velocityUniforms[key].hasOwnProperty( 'type' ) ) continue;
      if ( this.boidSim.velocityUniforms[ key ].type !== 'f' ) continue;
      this.boidSim.velocityUniforms[ key ].value = value;
    }
    this.boidSim.predatorPosition.copy( this.pars.boids.predator );
    this.boidSim.centerPosition.copy( this.pars.boids.center );
    this.boidSim.birdUniforms.squashiness.value = this.pars.boids.squashiness;
  }

  iceMatUniformsUpdate() {
    for ( let [ key, value ] of Object.entries( this.pars.iceMat ) ) {
      if ( this.iceMaterial.uniforms[ key ].type !== 'f' ) continue;
      this.iceMaterial.uniforms[ key ].value = value;
    }
  }

  setupCubeCamera = () => {
    this.cubeCamera = new THREE.CubeCamera(1, 10000, 128 );
    this.cubeCamera.name = 'cubeCamera';
    // this.cubeCamera.position.y = 0.6;
    this.add( this.cubeCamera );
    this.env = this.cubeCamera.renderTarget.texture;
    this.pmremGenerator = new THREE.PMREMGenerator(
      this.cubeCamera.renderTarget.texture
    );
    this.pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(
      this.pmremGenerator.cubeLods
    );

    this.env.mapping = THREE.CubeReflectionMapping;
  }

  renderEnv() {
    // const sphereVisible = this.envSphere.visible;
    // this.envSphere.visible = true;
    const rendererClear = webgl.renderer.autoClear = true;
    webgl.renderer.autoClear = true;
    this.cubeCamera.update( webgl.renderer, webgl.scene );
    if ( defined( this.pmremGenerator ) ) {
      this.pmremGenerator.update(webgl.renderer);
    }
    if ( defined( this.pmremCubeUVPacker ) ) {
      this.pmremCubeUVPacker.update(webgl.renderer);
    }

    this.env = this.pmremCubeUVPacker.CubeUVRenderTarget;

    webgl.renderer.autoClear = rendererClear;
    // this.envSphere.visible = sphereVisible;
  }

  setupGui() {
    let sceneFolder = gui.addFolder({
      title: `Scene: ${this.name}`,
      expanded: false
    }).on( 'fold', e => {
      this.log( 'scene gui folder expanded', sceneFolder.expanded );
    });

    sceneFolder.addInput( this.pars.scene, 'envMapIntensity', {
      min: 0.0,
      max: 1.0,
      step: 0.01,
      label: 'env level'
    }).on( 'change', () => {
      this.adjustEnvIntensity();
    });

    const boidsFolder = gui.addFolder({
      title: `boids`,
      expanded: false
    }).on( 'fold', () => {
      this.simFolders.forEach( folder => {
        const element = folder.controller.view.element;
        element.style.display = boidsFolder.expanded ? '' : 'none';
      } );
    });
    window.boidsFolder = boidsFolder;

    const simFolder = gui.addFolder({
      title: `boid sim`,
      expanded: false
    });
    this.simFolders.push( simFolder );
    for ( let key of Object.keys( this.pars.boids ) ) {
      if ( key === 'width' ) continue;
      const uniform = defined(this.boidSim.velocityUniforms[key], false) || defined(this.boidSim.birdUniforms[key], false);
      if ( defined( uniform.type ) && uniform.type === 'f') {
        simFolder.addInput( this.pars.boids, key, {
          min: uniform.min,
          max: uniform.max,
          label: key
        }).on( 'change', () => {
          this.boidUniformUpdate();
        });
      }
    }

    const predatorFolder = gui.addFolder({
      title: `boid predator`,
      expanded: false
    });
    for ( let key of Object.keys( this.pars.boids.predator ) ) {
      const predatorRange = 800;
      predatorFolder.addInput( this.pars.boids.predator, key, {
        min: -predatorRange,
        max: predatorRange,
        label: `predator ${key}`
      }).on( 'change', () => {
        this.boidSim.predatorPosition.copy( this.pars.boids.predator );
      });
    }
    this.simFolders.push( predatorFolder );

    const centerFolder = gui.addFolder({
      title: `boid center`,
      expanded: false
    });
    this.simFolders.push( centerFolder );
    for ( let key of Object.keys( this.pars.boids.center ) ) {
      const centerRange = 100;
      centerFolder.addInput( this.pars.boids.center, key, {
        min: -centerRange,
        max: centerRange,
        label: `center ${key}`
      }).on( 'change', () => {
        this.boidSim.centerPosition.copy( this.pars.boids.center );
      });
    }

    const iceMatFolder = gui.addFolder({
      title: `iceMat`,
      expanded: false
    });
    for ( let key of Object.keys( this.pars.iceMat ) ) {
      const uniform = this.iceMaterial.uniforms[key];
      if ( uniform.type === 'f' ) {
        iceMatFolder.addInput( this.pars.iceMat, key, {
          min: uniform.min,
          max: uniform.max,
          label: key
        }).on( 'change', () => {
          this.iceMatUniformsUpdate();
        });
      } else if ( uniform.type === 'v2' ) {
        iceMatFolder.addInput( this.pars.iceMat, key, {
          min: uniform.min,
          max: uniform.max,
          label: key
        }).on( 'change', () => {
          uniform.value.x = this.pars.iceMat[key];
          uniform.value.y = this.pars.iceMat[key];
        });
      } else {
        iceMatFolder.addInput( this.pars.iceMat, key, {
          label: key
        });
      }
    }
    iceMatFolder.addInput( this.iceMaterial, 'thicknessColorStyle', {
      label: 'thicknessColor'
    });

    this.simFolders.forEach( folder => {
      const element = folder.controller.view.element;
      element.style.display = simFolder.expanded ? '' : 'none';
    } );
  }

  adjustEnvIntensity( value ) {
    if ( defined( value, false ) ) this.pars.scene.envMapIntensity = value;
    this.traverse( child => {
      const setEnvIntensity = ( material ) => {
        if ( defined( material.envMap, false ) ) {
          material.envMapIntensity = this.pars.scene.envMapIntensity;
        }
      };
      if ( !defined( child.material, false ) ) return;
      if ( child.material instanceof THREE.Material ) {
        setEnvIntensity( child.material );
      } else if ( child.material instanceof Array ) {
        child.material.forEach( setEnvIntensity );
      }
    });
  }

  onPageVisible( visible ) {
    this.log('page visible', visible );
    setTimeout( () => { this.animate = !visible; }, 100 );
    // this.animate = visible;
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
