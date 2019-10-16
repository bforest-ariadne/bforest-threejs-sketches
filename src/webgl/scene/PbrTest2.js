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
// const { BPoseObj, bPoseObjAssets } = require('../objects/bposeObj');
const { KernelSize } = require('postprocessing');

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

  assets.queue({
    url: 'assets/models/bpose1_draco.glb',
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
      envMapIntensity: 0.01,
      spotlightIntensity: 100,
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
          'threshold': 0.043,
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

    let env = assets.get('env');

    let gltf = assets.get('bpose');
    const bpose = gltf.scene.children[0];
    this.bpose = bpose;
    const bposeNormal = bpose.material.normalMap;
    const bposeAO = bpose.material.aoMap;
    const bposeThick = bpose.material.emissiveMap;

    this.useBufferGeo = true;
    this.N = 100;
    // const smooth = true;

    // const parallaxOclusionModifier = new ParallaxOclusionMaterialModifier();

    webgl.scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    // webgl.scene.background = env.cubeMap;
    webgl.renderer.setClearColor( webgl.scene.fog.color, 1);

    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;
    webgl.renderer.gammaFactor = 2.2;
    webgl.renderer.shadowMap.enabled = true;
    webgl.renderer.autoClear = false;
    webgl.renderer.physicallyCorrectLights = true;

    postProcessSetup( true );

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
      roughnessMap: bposeAO,
      // metalnessMap: assets.get('aorm'),
      normalMap: bposeNormal,
      // aoMap: assets.get('bpose_c'),
      // map: assets.get('c'),
      roughness: 0.3,
      metalness: 0,
      color: 0x454545,
      envMap: env.target.texture,
      thicknessScale: 10,
      thicknessAttenuation: 1,
      thicknessPower: 5
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

    // this.bpose = new BPoseObj();

    this.bpose.material = iceMaterial;
    this.bpose.material.envMap = env.target.texture;
    // this.bpose.rotation.z = Math.PI;
    this.bpose.position.set( 0, 2, 0 );

    this.orbitControls.target.set( 0, 3, 0);

    this.add( this.bpose );

    // let subjectGeo = new THREE.TorusBufferGeometry( 2, 0.5, 16, 100 );

    // const subject = new THREE.Mesh(
    //   subjectGeo,
    //   iceMaterial
    //   // instanceMaterial
    // );

    // subject.rotation.x = Math.PI / 2;
    // subject.geometry.addAttribute( 'uv2', subject.geometry.attributes.uv.clone() );
    // subject.material.flatShading = false;
    // // subject.position.set( 3.0, 2.0, -2.0 );
    // subject.receiveShadow = true;
    // subject.castShadow = true;
    // subject.name = 'subject';
    // global.box = subject;
    // this.add( subject );
    // this.subject = subject;
    // if ( webgl.dev ) window.subject = subject;

    // parallaxOclusionModifier.addGui( mesh, gui );

    // if ( defined( subjectMat, false ) ) {
    //   parallaxOclusionModifier.modifyMeshMaterial( subject );
    //   parallaxOclusionModifier.addGui( subject, gui );
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

    this.pointLight.position.y = ( Math.sin( now * 0.5 ) * 7 ) + 3;
    this.pointLight.position.z = ( Math.sin( now * 0.8 ) * 3 );
    this.pointLight.position.z = ( Math.sin( now * 0.6 ) * 3 );

    // this.subject.rotation.x += delta * 0.9;
    this.bpose.rotation.y += delta * 0.8;
    // this.subject.scale.z = Math.sin( now / 2 ) + 2;

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
    let f = gui.addFolder({
      title: `Scene: ${this.name}`,
      expanded: false
    });

    f.addInput( this.pars, 'envMapIntensity', {
      min: 0.0,
      max: 1.0,
      step: 0.01,
      label: 'env level'
    }).on( 'change', () => {
      this.adjustEnvIntensity();
    });

    f = gui.addFolder({
      title: `iceMat`,
      expanded: false
    });

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
