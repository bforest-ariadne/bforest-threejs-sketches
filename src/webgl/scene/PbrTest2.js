const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicBloom');
const query = require('../../util/query');
const defined = require('defined');
const { merge } = require('merge-anything');
const { createMaterial, materialAssets } = require('../materials/createPbrMaterial');
// const ParallaxOclusionMaterialModifier = require('../materialModifiers/ParallaxOclusionMaterialModifier');
const IceMaterial = require('../materials/IceMaterial');
const { SpotLight, PointLight } = require('../objects/lights');
const CubeMapDebugger = require('../objects/cubeMapDebugger');
// const { BPoseObj, bPoseObjAssets } = require('../objects/bposeObj');
const { KernelSize } = require('postprocessing');

const title = 'PBR Test2';
const name = title.replace(/\s/g, '').toLowerCase();
const queueAssets = () => {
  assets.queue({
    url: 'assets/textures/studio_small_07_512/',
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

  assets.queue({
    url: 'assets/models/bpose1_lp_512.glb',
    key: 'bpose'
  });

  for ( let i in materialAssets ) {
    assets.queue( materialAssets[i] );
  }

  // for ( let i in bPoseObjAssets ) {
  //   assets.queue( bPoseObjAssets[i] );
  // }
};

if ( defined( query.scene ) && query.scene.toString().toLowerCase() === name ) {
  queueAssets();
}

class PbrTest2 extends SketchScene {
  constructor () {
    super(name);
    this.animate = true;
    const pars = {
      envMapIntensity: 1,
      lightProbeIntensity: 5,
      ambientLinked: false,
      showBackground: true,
      renderer: {
        exposure: 2
      },
      bloomEffect: {
        'dithering': true,
        'resolution': 360,
        'kernelSize': KernelSize.HUGE,
        'scale': 1,
        'opacity': 3.11,
        'luminance': {
          'filter': true,
          'threshold': 1,
          'smoothing': 0.272
        }
      }
      // parallaxMode: 'USE_OCLUSION_PARALLAX'
      // envMapIntensity: 0.2
    };
    this.pars = merge( this.pars, pars );
  }
  init() {
    super.init();
    // this.controlsInit();
    this.orbitControlsInit();
    this.orbitControls.enablePan = !webgl.mobile;
    webgl.camera.position.set( 10, 9, 13 );
    this.envTexture = null;

    let env = assets.get('env');
    this.env = env;

    let gltf = assets.get('bpose');
    const bpose = gltf.scene.children[0];
    this.bpose = bpose;
    const bposeNormal = bpose.material.normalMap;
    const bposeAO = bpose.material.map;
    const bposeThick = bpose.material.emissiveMap;

    this.useBufferGeo = true;
    this.N = 100;
    // const smooth = true;
    this.blackColor = new THREE.Color('black');
    // const parallaxOclusionModifier = new ParallaxOclusionMaterialModifier();

    webgl.scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    webgl.scene.background = this.pars.showBackground ? this.env.cubeMap : this.blackColor;
    webgl.renderer.setClearColor( webgl.scene.fog.color, 1);

    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;
    webgl.renderer.gammaFactor = 2.2;
    webgl.renderer.shadowMap.enabled = true;
    webgl.renderer.autoClear = false;
    webgl.renderer.physicallyCorrectLights = true;

    postProcessSetup( true );

    this.setupCubeCamera();

    let instanceMaterial;

    assets.get('iron2').scene.traverse(child => {
      if (child.isMesh && child.material) {
        instanceMaterial = child.material;
      }
    });

    instanceMaterial = createMaterial(env.target.texture);

    const object = new THREE.Object3D();
    this.object = object;
    // let mesh;

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

    marble1Mat.envMap = env.cubeMap;
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

    let testPoint = new PointLight({
      color: 0xff0000,
      decay: 1,
      distance: 100,
      meshSize: 5
    });
    this.pointLight = testPoint;
    // testPoint.position.set( -1, 1, -3);
    global.testPoint = testPoint;
    this.add( testPoint );

    // let pointLight = new PointLight();
    // pointLight.castShadow = true;
    // pointLight.position.set( 2, 0, -0.5 );

    // this.add( pointLight );
    // global.pointLight = pointLight;

    let iceMaterial = new IceMaterial({
      // roughnessMap: assets.get('lava'),
      thicknessMap: bposeThick,
      // roughnessMap: bposeAO,
      // metalnessMap: assets.get('aorm'),
      normalMap: bposeNormal,
      // aoMap: assets.get('bpose_c'),
      parallaxLayer1: assets.get('cracked'),
      parallaxScale1: 1.5,
      roughness: 0.28,
      metalness: 0.0,
      color: 0xffffff,
      envMap: this.envTexture,
      // envMap: env.target.texture,
      // envMap: this.envUv,
      thicknessScale: 10,
      thicknessDistortion: 0.47,
      thicknessAttenuation: 1,
      thicknessPower: 29,
      refractionRatio: 1.3
    });
    global.iceMat = iceMaterial;
    this.iceMaterial = iceMaterial;

    for ( let value of Object.values( iceMaterial ) ) {
      if ( value instanceof THREE.Texture ) {
        // dont modifiy env textures
        if ( value.mapping === THREE.CubeReflectionMapping ||
          value.mapping === THREE.CubeRefractionMapping ||
          value.mapping === THREE.CubeUVReflectionMapping ||
          value.mapping === THREE.CubeUVRefractionMapping ) continue;

        value.encoding = THREE.LinearEncoding;
        value.minFilter = THREE.LinearMipMapLinearFilter;
        value.magFilter = THREE.LinearFilter;
        value.wrapS = value.wrapT = THREE.RepeatWrapping;
        value.repeat.set( 1, 1 );
        value.anisotrophy = 1;
        value.needsUpdate = true;
      }
    }
    // this.iceMaterial.envMap.mapping = THREE.CubeRefractionMapping;

    // this.bpose = new BPoseObj();

    this.bpose.material = iceMaterial;
    this.bpose.position.set( 0, 2, 0 );
    this.add( this.bpose );

    this.renderEnv();
    this.orbitControls.target.set( 0, 3, 0);

    const debugCubeMaps = [this.env.target.texture];
    if ( defined( this.envUv ) ) debugCubeMaps.push( this.envUv.texture );

    this.cubeDebugger = new CubeMapDebugger( ...debugCubeMaps );
    this.cubeDebugger.visible = false;
    this.add( this.cubeDebugger );

    this.lightProbe = new THREE.LightProbe();
    this.lightProbe.copy( THREE.LightProbeGenerator.fromCubeCamera( webgl.renderer, this.cubeCamera ) );
    this.lightProbe.intensity = this.pars.lightProbeIntensity;
    this.add( this.lightProbe );

    this.setupGui();

    this.adjustEnvIntensity();
  }

  update (delta = 0, now = 0, frame = 0) {
    super.update();
    this.renderEnv();
    if ( defined( this.lightHelper ) ) this.lightHelper.update();
    if ( defined( this.shadowCameraHelper ) ) this.shadowCameraHelper.update();

    if ( !this.animate ) return;

    this.pointLight.position.y = ( Math.sin( now * 0.5 ) * 7 ) + 3;
    this.pointLight.position.z = ( Math.sin( now * 0.8 ) * 3 );
    this.pointLight.position.z = ( Math.sin( now * 0.6 ) * 3 );

    this.bpose.rotation.y += delta * 0.8;

    if ( defined( this.shaderUniforms ) ) this.shaderUniforms.time.value = now * 8;
  }

  renderEnv() {
    // console.log('frame', webgl.frameCount );
    this.bpose.visible = false;
    const sceneBg = webgl.scene.background;
    webgl.scene.background = this.env.cubeMap;
    this.pointLight.mesh.material.depthTest = false;
    this.pointLight.mesh.material.visible = false;
    this.cubeCamera.update( webgl.renderer, webgl.scene );
    if ( defined( this.pmremGenerator ) ) {
      this.pmremGenerator.update(webgl.renderer);
    }
    if ( defined( this.pmremCubeUVPacker ) ) {
      this.pmremCubeUVPacker.update(webgl.renderer);
      this.envUv = this.pmremCubeUVPacker.CubeUVRenderTarget;
    }

    this.pointLight.mesh.material.visible = true;
    this.pointLight.mesh.material.depthTest = true;
    this.bpose.visible = true;
    webgl.scene.background = sceneBg;
  }

  setupCubeCamera() {
    this.cubeCamera = new THREE.CubeCamera( 0.001, 100, 256 );
    this.add( this.cubeCamera );
    this.cubeCamera.renderTarget.texture.generateMipmaps = true;
    this.cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;

    this.envTexture = this.cubeCamera.renderTarget.texture;

    // this.pmremGenerator = new THREE.PMREMGenerator(
    //   this.cubeCamera.renderTarget.texture,
    //   32,
    //   128
    // );
    // this.pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(
    //   this.pmremGenerator.cubeLods
    // );
    // this.envUv = this.pmremCubeUVPacker.CubeUVRenderTarget.texture;
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
    let f = gui.addFolder({
      title: `Scene: ${this.name}`,
      expanded: false
    });

    const envPar = f.addInput( this.pars, 'envMapIntensity', {
      min: 0.0,
      max: 2.0,
      step: 0.01,
      label: 'env level'
    }).on( 'change', () => {
      this.adjustEnvIntensity();
      if ( this.pars.ambientLinked ) {
        this.pars.lightProbeIntensity = this.pars.envMapIntensity;
        this.lightProbe.intensity = this.pars.lightProbeIntensity;
      }
    });

    const probePar = f.addInput( this.pars, 'lightProbeIntensity', {
      min: 0.0,
      max: 10.0,
      step: 0.01,
      label: 'light probe'
    }).on( 'change', () => {
      this.lightProbe.intensity = this.pars.lightProbeIntensity;
      if ( this.pars.ambientLinked ) {
        this.pars.envMapIntensity = this.pars.lightProbeIntensity;
        this.adjustEnvIntensity();
      }
    });

    f.addInput( this.pars, 'ambientLinked');

    f.addInput( this.pars, 'showBackground').on( 'change', () => {
      webgl.scene.background = this.pars.showBackground ? this.env.cubeMap : this.blackColor;
    })

    f.on('change', () => {
      if ( this.pars.ambientLinked ) {
        envPar.refresh();
        probePar.refresh();
      }
    });

    f = gui.addFolder({
      title: `iceMat`,
      expanded: false
    });

    f.addInput( this.iceMaterial, 'useTranslucency' );

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

    f.addInput( this.iceMaterial.uniforms.diffuseColorInfluence, 'value', {
      min: 0.0,
      max: 1,
      step: 0.01,
      label: 'diffuseColorInfluence'
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
