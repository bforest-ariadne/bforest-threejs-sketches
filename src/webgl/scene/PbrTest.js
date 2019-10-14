const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicSSAO');
const query = require('../../util/query');
const defined = require('defined');
const { createMaterial, materialAssets } = require('../materials/createPbrMaterial');
const ParallaxOclusionMaterialModifier = require('../materialModifiers/ParallaxOclusionMaterialModifier');
const IceMaterial = require('../materials/IceMaterial');
const { SpotLight, PointLight } = require('../objects/lights');

const title = 'PBR Test';
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

class PbrTest extends SketchScene {
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
    testBox.position.set( 3.0, 2.0, -2.0 );
    testBox.receiveShadow = true;
    testBox.castShadow = true;
    testBox.name = 'testBox';
    global.box = testBox;
    this.add( testBox );

    let bufferGeometry;
    if ( smooth ) {
      // bufferGeometry = new THREE.BoxBufferGeometry(2, 2, 2, 9, 9, 9);
      bufferGeometry = new THREE.SphereBufferGeometry(1, 15, 15);
      instanceMaterial.flatShading = false;
    } else {
      bufferGeometry = new THREE.SphereBufferGeometry(1, 4, 4);
      // bufferGeometry = new THREE.BoxBufferGeometry(2, 2, 2, 9, 9, 9);
      instanceMaterial.flatShading = true;
    }

    bufferGeometry.addAttribute( 'uv2', bufferGeometry.attributes.uv.clone() );

    const positions = [];
    const scales = [];
    const radius = [];
    const rotationXYZ = [];
    let vector3 = new THREE.Vector3();
    let x, y, z;

    this.moveQ = new THREE.Quaternion( 0.5, 0.5, 0.5, 0.0 ).normalize();
    this.tmpQ = new THREE.Quaternion();
    this.currentQ = new THREE.Quaternion();

    for (let i = 0; i < this.N; ++i) {
      if ( this.useBufferGeo ) {
        // offsets
        vector3.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        vector3.multiplyScalar(Math.random() * 10);
        positions.push( vector3.x, vector3.y, vector3.z );

        // rotations
        rotationXYZ.push(
          THREE.Math.randFloat(-Math.PI, Math.PI) * 0.1,
          THREE.Math.randFloat(-Math.PI, Math.PI) * 0.1,
          THREE.Math.randFloat(-Math.PI, Math.PI) * 0.1
        );

        // scale
        x = y = z = Math.random() * 2;
        scales.push( x, y, z );

        // smooth radius
        radius.push(Math.min(x, Math.min(y, z)));
      } else {
        mesh = new THREE.Mesh(bufferGeometry, instanceMaterial);
        mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        mesh.position.multiplyScalar(Math.random() * 10);
        mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        mesh.scale.multiplyScalar(Math.random());
        object.add(mesh);
      }
    }

    if ( this.useBufferGeo ) {
      this.geometry = new THREE.InstancedBufferGeometry();
      this.geometry.copy( bufferGeometry );

      this.geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array(positions), 3 ) );
      this.geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array(scales), 3 ) );
      this.geometry.addAttribute( 'radius', new THREE.InstancedBufferAttribute( new Float32Array(radius), 1 ) );
      this.geometry.addAttribute( 'rotation', new THREE.InstancedBufferAttribute( new Float32Array(rotationXYZ), 3 ) );

      // modify material

      this.shaderUniforms = {
        time: {value: 0},
        speed: {value: 1}
        // radius: {value: 1},
      };

      const previousOnBeforeCompile = instanceMaterial.onBeforeCompile;

      instanceMaterial.onBeforeCompile = ( shader, renderer ) => {
        previousOnBeforeCompile( shader, renderer );

        shader.uniforms.time = this.shaderUniforms.time;
        shader.uniforms.speed = this.shaderUniforms.speed;

        shader.vertexShader = `
        uniform float time;
        uniform float speed;
      
        attribute vec3 offset;
        attribute vec4 orientation;
        attribute vec3 scale;
        attribute float radius;

        attribute vec3 rotation;

        mat4 rotationMatrix(vec3 axis, float angle)
        {
            axis = normalize(axis);
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0 - c;
      
            return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                        0.0,                                0.0,                                0.0,                                1.0);
        }
        
        mat4 rotateXYZ() {
          return rotationMatrix(vec3(1, 0, 0), rotation.x * time * speed) * rotationMatrix(vec3(0, 1, 0), rotation.y * time * speed) * rotationMatrix(vec3(0, 0, 1), rotation.z * time * speed) ;
        }
        
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          `#include <begin_vertex>`,
          /* glsl */`
          #include <begin_vertex>

          mat4 r = rotateXYZ();

        #if !defined(FLAT_SHADED)
          
          #ifdef STANDARD
            // re-compute normals for correct shadows and reflections
            // objectNormal = all(equal(p, transformed)) ? normal : normalize(position); 
            // transformedNormal = normalize(normalMatrix * normal);

            // vNormal = (vec4(transformedNormal, 1.0) * r).xyz;
          #endif
        #endif

        #if !defined(FLAT_SHADED) && defined(STANDARD)
          transformedNormal = objectNormal;
          transformedNormal = mat3( r ) * transformedNormal;
          transformedNormal = normalMatrix * transformedNormal;
          vNormal = normalize( transformedNormal );
        #endif
        
        transformed *= scale.x;
        transformed = ( r * vec4(transformed, 1.0)).xyz;
        transformed = transformed + offset; 
        `);
      };

      // custom depth material - required for instanced shadows
      var customDepthMaterial = new THREE.MeshDepthMaterial();
      customDepthMaterial.onBeforeCompile = instanceMaterial.onBeforeCompile;
      customDepthMaterial.depthPacking = THREE.RGBADepthPacking;

      mesh = new THREE.Mesh( this.geometry, instanceMaterial );
      mesh.name = 'instanced mesh';

      parallaxOclusionModifier.modifyMeshMaterial( mesh );

      mesh.customDepthMaterial = customDepthMaterial;
      mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
        material.onBeforeCompile = instanceMaterial.onBeforeCompile;
        material.side = instanceMaterial.side;
      };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      global.mesh = mesh;
      object.add( mesh );
    }

    this.add(object);
    object.scale.multiplyScalar(0.36);

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

    f.addInput( iceMaterial.uniforms.thicknessAmbient, 'value', {
      min: 0.0,
      max: 1,
      step: 0.01,
      label: 'thicknessAmbient'
    }).on( 'change', () => {
    });

    f.addInput( iceMaterial.uniforms.thicknessDistortion, 'value', {
      min: 0.0,
      max: 1,
      step: 0.01,
      label: 'thicknessDistortion'
    }).on( 'change', () => {
    });

    f.addInput( iceMaterial.uniforms.thicknessPower, 'value', {
      min: 0.0,
      max: 100,
      step: 1,
      label: 'thicknessPower'
    }).on( 'change', () => {
    });

    f.addInput( iceMaterial.uniforms.thicknessScale, 'value', {
      min: 0.0,
      max: 10,
      step: 0.01,
      label: 'thicknessScale'
    }).on( 'change', () => {
    });

    f.addInput( iceMaterial.uniforms.thicknessAttenuation, 'value', {
      min: 0.0,
      max: 1,
      step: 0.01,
      label: 'thicknessAttenuation'
    });

    f.addInput( iceMaterial, 'thicknessColorStyle', {
      label: 'thicknessColor'
    }).on( 'change', value => {
      // console.log('color val', value );
      // iceMaterial.uniforms.thicknessColor.value.fromArray( value.getComponents() );
    });

    parallaxOclusionModifier.addGui( mesh, gui );

    // if ( defined( testBoxMat, false ) ) {
    //   parallaxOclusionModifier.modifyMeshMaterial( testBox );
    //   parallaxOclusionModifier.addGui( testBox, gui );
    // }

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

  onResize() {
    if ( defined( this.shadowCameraHelper ) ) this.spotlightShadowMapViewer.updateForWindowResize();
  }

  onKeydown(ev) {
    if ( ev.keyCode === 32 && !ev.shiftKey ) {
      this.animate = !this.animate;
    }
  }
}

PbrTest.queueAssets = queueAssets;

PbrTest.title = title;
PbrTest.publish = false;
PbrTest.sceneName = name;

module.exports = PbrTest;
