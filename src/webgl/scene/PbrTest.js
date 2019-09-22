const SketchScene = require('./SketchScene');
const { webgl, assets, gui } = require('../../context');
const postProcessSetup = require('../postProcessing/basicSSAO');
const { createIronMaterial, ironAssets } = require('../materials/dammagedIron');
const query = require('../../util/query');
const defined = require('defined');

const name = 'pbrtest';

if ( defined( query.scene ) && query.scene.toLowerCase() === name ) {
  assets.queue({
    url: 'assets/textures/studio_small_02_1024/',
    key: 'env',
    envMap: true,
    hdr: true,
    pbr: true
  });

  for ( let i in ironAssets ) {
    assets.queue( ironAssets[i] );
  }
}

module.exports = class PbrTest extends SketchScene {
  constructor () {
    super(name);
    this.animate = true;
  }
  init() {
    this.pars = {
      envMapIntensity: 0.0
      // envMapIntensity: 0.2
    };
    this.controlsInit();
    this.controls.distance = 20;
    this.controls.position = [ 0, 0, 20 ];
    let env = assets.get('env');

    this.useBufferGeo = true;
    this.N = 100;
    const smooth = false;

    webgl.scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    // webgl.scene.background = env.cubeMap;
    webgl.renderer.setClearColor( webgl.scene.fog.color, 1);

    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;
    webgl.renderer.shadowMap.enabled = true;
    webgl.renderer.autoClear = false;

    postProcessSetup();

    // Objects.
    const object = new THREE.Object3D();
    this.object = object;
    let ironMaterial, mesh;
    ironMaterial = createIronMaterial();
    ironMaterial.envMap = env.target.texture;
    ironMaterial.needsUpdate = true;

    // ground

    const plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry( 80, 80),
      new THREE.MeshStandardMaterial({
        envMap: env.target.texture,
        metalness: 0,
        roughness: 0.6,
        side: THREE.DoubleSide
      })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -4;
    plane.receiveShadow = true;
    plane.name = 'ground';
    plane.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      material.side = THREE.DoubleSide;
    };
    this.add( plane );

    

    // spotlight
    const spotlight = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI / 5, 0.3 );
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

    // const testBox = new THREE.Mesh(
    //   new THREE.BoxBufferGeometry( 2, 2, 2),
    //   new THREE.MeshStandardMaterial({
    //     envMap: env.target.texture,
    //     metalness: 0,
    //     roughness: 0.6,
    //     color: '0x888888'
    //   })
    // );
    // testBox.position.y = -2;
    // testBox.receiveShadow = true;
    // testBox.castShadow = true;
    // this.add( testBox );

    // this.shadowCameraHelper = new THREE.CameraHelper( spotlight.shadow.camera );
    // this.add( this.shadowCameraHelper );

    this.add( new THREE.CameraHelper( spotlight.shadow.camera ) );

    this.spotlightShadowMapViewer = new THREE.ShadowMapViewer( spotlight );
    this.spotlightShadowMapViewer.size.set( 128, 128 );
    this.spotlightShadowMapViewer.position.set( 10, 70 );
    this.spotlightShadowMapViewer.update();
    webgl.on( 'afterRender', () => {
      if ( defined( this.spotlight.shadow.map ) ) this.spotlightShadowMapViewer.render( webgl.renderer );
    });

    let bufferGeometry;
    if ( smooth ) {
      bufferGeometry = new THREE.BoxBufferGeometry(2, 2, 2, 9, 9, 9);
      ironMaterial.flatShading = false;
    } else {
      bufferGeometry = new THREE.SphereBufferGeometry(1, 4, 4);
      // bufferGeometry = new THREE.BoxBufferGeometry(2, 2, 2, 9, 9, 9);
      ironMaterial.flatShading = true;
    }

    const positions = [];
    const orientations = [];
    const scales = [];
    const radius = [];
    const rotationXYZ = [];
    // let vector = new THREE.Vector4();
    let vector3 = new THREE.Vector3();
    let x, y, z;
    // let w;
    // const cell = 1;
    // const grid = 5;

    this.moveQ = new THREE.Quaternion( 0.5, 0.5, 0.5, 0.0 ).normalize();
    this.tmpQ = new THREE.Quaternion();
    this.currentQ = new THREE.Quaternion();

    for (let i = 0; i < this.N; ++i) {
      if ( this.useBufferGeo ) {
        // offsets

        vector3.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        vector3.multiplyScalar(Math.random() * 10);
        positions.push( vector3.x, vector3.y, vector3.z );

        // orientations
        // x = Math.random() * 2 - 1;
        // y = Math.random() * 2 - 1;
        // z = Math.random() * 2 - 1;
        // w = Math.random() * 2 - 1;
        // vector.set( x, y, z, w ).normalize();
        // orientations.push( vector.x, vector.y, vector.z, vector.w );

        // rotations

        rotationXYZ.push(
          THREE.Math.randFloat(-Math.PI, Math.PI) * 0.1,
          THREE.Math.randFloat(-Math.PI, Math.PI) * 0.1,
          THREE.Math.randFloat(-Math.PI, Math.PI) * 0.1
        );

        // scale

        x = y = z = Math.random();
        scales.push( x, y, z );

        // smooth radius

        radius.push(Math.min(x, Math.min(y, z)));
      } else {
        mesh = new THREE.Mesh(bufferGeometry, ironMaterial);
        mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        mesh.position.multiplyScalar(Math.random() * 10);
        mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        mesh.scale.multiplyScalar(Math.random());
        object.add(mesh);
      }
    }

    if ( this.useBufferGeo ) {
      this.log('userbuffergeo');
      this.geometry = new THREE.InstancedBufferGeometry();
      this.geometry.copy( bufferGeometry );

      this.orientationAttribute = new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ).setDynamic( true );

      this.geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array(positions), 3 ) );
      // this.geometry.addAttribute( 'orientation', this.orientationAttribute );
      this.geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array(scales), 3 ) );
      this.geometry.addAttribute( 'radius', new THREE.InstancedBufferAttribute( new Float32Array(radius), 1 ) );
      this.geometry.addAttribute( 'rotation', new THREE.InstancedBufferAttribute( new Float32Array(rotationXYZ), 3 ) );

      // modify material

      this.shaderUniforms = {
        time: {value: 0},
        speed: {value: 50}
      };

      ironMaterial.onBeforeCompile = shader => {
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
          return rotationMatrix(vec3(1, 0, 0), rotation.x * time) * rotationMatrix(vec3(0, 1, 0), rotation.y * time) * rotationMatrix(vec3(0, 0, 1), rotation.z * time) ;
        }
        vec3 applyQuaternionToVector( vec4 q, vec3 v ){
          return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
        }
        
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>

          mat4 r = rotateXYZ();

          #if !defined(FLAT_SHADED) && !defined(NORMAL)
            // vec3 signs = sign(position);
            // float radius = radius - 0.001;
            // vec3 box = scale - vec3(radius);
            // box = vec3(max(0.0, box.x), max(0.0, box.y), max(0.0, box.z));
            // vec3 p = signs * box;
        
            // transformed = signs * box + normalize(position) * radius;
            
            // #ifdef STANDARD
            //   // re-compute normals for correct shadows and reflections
            //   objectNormal = all(equal(p, transformed)) ? normal : normalize(position); 
            //   transformedNormal = normalize(normalMatrix * objectNormal);
            //   // vNormal = transformedNormal;

            //   vNormal = (vec4(transformedNormal, 1.0) * r).xyz;
            // #endif
          #endif

          #if !defined(FLAT_SHADED) && !defined(NORMAL)
            transformed *= scale.x;
          #endif
          // vec3 vPosition = applyQuaternionToVector( orientation, transformed );
          transformed = (vec4(transformed, 1.0) * r).xyz;
          // transformed = vPosition + offset;
          transformed = transformed + offset;
          
          `
        );
      };

      // custom depth material - required for instanced shadows
      var customDepthMaterial = new THREE.MeshDepthMaterial();
      customDepthMaterial.onBeforeCompile = ironMaterial.onBeforeCompile;
      customDepthMaterial.depthPacking = THREE.RGBADepthPacking;

      mesh = new THREE.Mesh( this.geometry, ironMaterial );
      mesh.name = 'instanced mesh';
      mesh.customDepthMaterial = customDepthMaterial;
      mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
        material.onBeforeCompile = ironMaterial.onBeforeCompile;
        material.side = ironMaterial.side;
      };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      object.add( mesh );
    }

    this.add(object);

    gui.addInput( this.pars, 'envMapIntensity', {
      min: 0.0,
      max: 1.0,
      step: 0.01,
      label: 'env level'
    }).on( 'change', () => {
      this.adjustEnvIntensity();
    });

    this.adjustEnvIntensity();
  }

  update (delta = 0, now = 0, frame = 0) {
    super.update();
    if ( defined( this.lightHelper ) ) this.lightHelper.update();
    if ( defined( this.shadowCameraHelper ) ) this.shadowCameraHelper.update();

    if ( !this.animate ) return;

    this.object.rotation.x += delta * 0.1;

    if ( defined( this.shaderUniforms ) ) this.shaderUniforms.time.value = now;

    // let qDelta = delta * 0.2;

    // this.tmpQ.set( this.moveQ.x * qDelta, this.moveQ.y * qDelta, this.moveQ.z * qDelta, 1 ).normalize();
    // for ( let i = 0, il = this.orientationAttribute.count; i < il; i++ ) {
    //   this.currentQ.fromArray( this.orientationAttribute.array, ( i * 4 ) );
    //   this.currentQ.multiply( this.tmpQ );
    //   this.orientationAttribute.setXYZW( i, this.currentQ.x, this.currentQ.y, this.currentQ.z, this.currentQ.w );
    // }
    // this.orientationAttribute.needsUpdate = true;
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
    this.spotlightShadowMapViewer.updateForWindowResize();
  }

  onKeydown(ev) {
    if ( ev.keyCode === 32 && !ev.shiftKey ) {
      this.animate = !this.animate;
    }
  }
};
