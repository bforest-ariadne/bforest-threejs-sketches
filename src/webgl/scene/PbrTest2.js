const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicSSAO');
const query = require('../../util/query');
const defined = require('defined');
const { createMaterial, materialAssets } = require('../materials/createPbrMaterial');
const ParallaxOclusionMaterialModifier = require('../materialModifiers/ParallaxOclusionMaterialModifier');
const IceMaterial = require('../materials/IceMaterial');
const { SpotLight, PointLight } = require('../objects/lights');

const title = 'PBR Test2';
const name = title.replace(/\s/g, '').toLowerCase();
const queueAssets = () => {
  assets.queue({
    url: 'assets/textures/blueLagoonNight_256/',
    key: 'env',
    envMap: true,
    hdr: true,
    pbr: true
  });

  assets.queue({
    url: `assets/materials/marbleFloor.glb`,
    key: 'marbleFloor'
  });

  assets.queue({
    url: 'assets/materials/iron1.glb',
    key: 'iron2'
  });

  assets.queue({
    url: 'assets/textures/lavatile.jpg',
    key: 'lava',
    texture: true
  });

  assets.queue({
    url: 'assets/textures/cracked_z.png',
    key: 'cracked',
    texture: true
  });

  for ( let i in materialAssets ) {
    assets.queue( materialAssets[i] );
  }
};

if ( defined( query.scene ) && query.scene.toString().toLowerCase() === name ) {
  queueAssets();
}

class PbrTest2 extends SketchScene {
  constructor () {
    super(name);
    this.animate = true;
  }
  init() {
    this.pars = {
      envMapIntensity: 0.12,
      spotlightIntensity: 100
      // parallaxMode: 'USE_OCLUSION_PARALLAX'
      // envMapIntensity: 0.2
    };
    this.controlsInit();
    this.controls.distance = 10;
    this.controls.position = [ 8, 2, -7.4 ];
    let env = assets.get('env');

    this.useBufferGeo = true;
    this.N = 100;
    const smooth = true;

    const parallaxOclusionModifier = new ParallaxOclusionMaterialModifier();

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

    let instanceMaterial;

    assets.get('iron2').scene.traverse(child => {
      if (child.isMesh && child.material) {
        instanceMaterial = child.material;
      }
    });

    instanceMaterial = createMaterial(env.target.texture);

    const object = new THREE.Object3D();
    this.object = object;
    let mesh;

    instanceMaterial.envMap = env.target.texture;
    instanceMaterial.needsUpdate = true;

    global.mat = instanceMaterial;

    // ground

    let marble1Mat;
    assets.get('marbleFloor').scene.traverse(child => {
      if (child.isMesh && child.material) {
        marble1Mat = child.material;
      }
    });

    marble1Mat.envMap = env.target.texture;
    marble1Mat.side = THREE.DoubleSide;
    marble1Mat.needsUpdate = true;

    const plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry( 40, 40, 40, 40 ),
      marble1Mat
    );
    plane.geometry.addAttribute( 'uv2', plane.geometry.attributes.uv.clone() );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -4;
    plane.receiveShadow = true;
    plane.name = 'ground';
    plane.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      material.side = THREE.DoubleSide;
    };
    this.add( plane );
    this.plane = plane;

    // spotlight
    const spotlight = new SpotLight( 0xffffff, 100, 0, Math.PI / 5, 0.3 );
    spotlight.position.set( 5, 12, 5 );
    spotlight.target.position.set( 0, 0, 0 );
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 2048;
    spotlight.shadow.mapSize.height = 2048;
    spotlight.shadow.camera.near = 1;
    spotlight.shadow.camera.far = 30;
    spotlight.distance = 30;
    spotlight.name = 'spotlight';
    this.add( spotlight );
    this.spotlight = spotlight;

    // this.lightHelper = new THREE.SpotLightHelper( spotlight );
    // this.add( this.lightHelper );

    // let testBoxMat = instanceMaterial.clone();

    let testPoint = new PointLight( 0xff0000, 1, 100 );
    testPoint.position.set( -1, 1, -3);
    global.testPoint = testPoint;
    this.add( testPoint );

    let pointLight = new PointLight();
    pointLight.castShadow = true;
    pointLight.position.set( 2, 2, -0.5 );

    this.add( pointLight );
    global.pointLight = pointLight;

    let iceMaterial = new IceMaterial({
      // roughnessMap: assets.get('lava'),
      thicknessMap: assets.get('cracked'),
      roughnessMap: assets.get('aorm'),
      metalnessMap: assets.get('aorm'),
      normalMap: assets.get('n'),
      aoMap: assets.get('aorm'),
      map: assets.get('c'),
      roughness: 1,
      metalness: 1,
      envMap: env.target.texture
    });
    global.iceMat = iceMaterial;
    this.iceMaterial = iceMaterial;

    const testBox = new THREE.Mesh(
      new THREE.BoxBufferGeometry( 2, 2, 2),
      iceMaterial
      // instanceMaterial
    );
    testBox.geometry.addAttribute( 'uv2', testBox.geometry.attributes.uv.clone() );
    testBox.material.flatShading = false;
    // testBox.position.set( 3.0, 2.0, -2.0 );
    testBox.receiveShadow = true;
    testBox.castShadow = true;
    testBox.name = 'testBox';
    global.box = testBox;
    this.add( testBox );


    // parallaxOclusionModifier.addGui( mesh, gui );

    // if ( defined( testBoxMat, false ) ) {
    //   parallaxOclusionModifier.modifyMeshMaterial( testBox );
    //   parallaxOclusionModifier.addGui( testBox, gui );
    // }
    this.setupGui();

    this.adjustEnvIntensity();
  }

  update (delta = 0, now = 0, frame = 0) {
    super.update();
    if ( defined( this.lightHelper ) ) this.lightHelper.update();
    if ( defined( this.shadowCameraHelper ) ) this.shadowCameraHelper.update();

    if ( !this.animate ) return;

    // this.iceMaterial.uniforms.time.value = now;

    this.object.rotation.x += delta * 0.2;
    this.object.rotation.y += delta * 0.3;

    if ( defined( this.shaderUniforms ) ) this.shaderUniforms.time.value = now * 8;
  }

  adjustEnvIntensity( value ) {
    if ( defined( value, false ) ) this.pars.envMapIntensity = value;
    this.traverse( child => {
      if ( defined( child.material, false) && defined( child.material.envMap, false ) ) {
        child.material.envMapIntensity = this.pars.envMapIntensity;
      }
    });
  }

  setupGui() {
    let f = gui.addFolder({title: `Scene: ${this.name}`});

    f.addInput( this.pars, 'spotlightIntensity', {
      min: 0.0,
      max: 200,
      step: 1,
      label: 'spotlight level'
    }).on( 'change', () => {
      this.spotlight.intensity = this.pars.spotlightIntensity;
    });

    f.addInput( this.pars, 'envMapIntensity', {
      min: 0.0,
      max: 1.0,
      step: 0.01,
      label: 'env level'
    }).on( 'change', () => {
      this.adjustEnvIntensity();
    });

    f = gui.addFolder({title: `iceMat`});

    f.addInput( this.iceMaterial.uniforms.thicknessAmbient, 'value', {
      min: 0.0,
      max: 1,
      step: 0.01,
      label: 'thicknessAmbient'
    }).on( 'change', () => {
    });

    f.addInput( this.iceMaterial.uniforms.thicknessDistortion, 'value', {
      min: 0.0,
      max: 1,
      step: 0.01,
      label: 'thicknessDistortion'
    }).on( 'change', () => {
    });

    f.addInput( this.iceMaterial.uniforms.thicknessPower, 'value', {
      min: 0.0,
      max: 100,
      step: 1,
      label: 'thicknessPower'
    }).on( 'change', () => {
    });

    f.addInput( this.iceMaterial.uniforms.thicknessScale, 'value', {
      min: 0.0,
      max: 10,
      step: 0.01,
      label: 'thicknessScale'
    }).on( 'change', () => {
    });

    f.addInput( this.iceMaterial.uniforms.thicknessAttenuation, 'value', {
      min: 0.0,
      max: 1,
      step: 0.01,
      label: 'thicknessAttenuation'
    });

    f.addInput( this.iceMaterial, 'thicknessColorStyle', {
      label: 'thicknessColor'
    }).on( 'change', value => {
      // console.log('color val', value );
      // this.iceMaterial.uniforms.thicknessColor.value.fromArray( value.getComponents() );
    });
  }

  onResize() {
    if ( defined( this.shadowCameraHelper ) ) this.spotlightShadowMapViewer.updateForWindowResize();
  }

  onKeydown(ev) {
    if ( ev.keyCode === 32 && !ev.shiftKey ) {
      this.animate = !this.animate;
    }
  }
}

PbrTest2.queueAssets = queueAssets;

PbrTest2.title = title;
PbrTest2.publish = false;
PbrTest2.sceneName = name;

module.exports = PbrTest2;
