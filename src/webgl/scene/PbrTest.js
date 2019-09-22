const SketchScene = require('./SketchScene');
const { webgl, assets } = require('../../context');
const postProcessSetup = require('../postProcessing/basicTonemap');
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
  }
  init() {
    this.controlsInit();
    this.controls.distance = 20;
    this.controls.position = [ 0, 0, 20 ];
    let env = assets.get('env');

    this.useBufferGeo = true;
    this.N = 100;
    const smooth = false;

    webgl.scene.fog = new THREE.FogExp2(0x000000, 0.025);
    webgl.scene.background = env.cubeMap;
    webgl.renderer.setClearColor( webgl.scene.fog.color, 1);

    webgl.renderer.gammaInput = true;
    webgl.renderer.gammaOutput = true;

    postProcessSetup();

    // Objects.
    const object = new THREE.Object3D();
    this.object = object;
    let material, mesh;
    material = createIronMaterial();
    material.envMap = env.target.texture;
    material.needsUpdate = true;

    let bufferGeometry;
    if ( smooth ) {
      bufferGeometry = new THREE.BoxBufferGeometry(2, 2, 2, 9, 9, 9);
      material.flatShading = false;
    } else {
      bufferGeometry = new THREE.SphereBufferGeometry(1, 4, 4);
      material.flatShading = true;
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
        mesh = new THREE.Mesh(bufferGeometry, material);
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

      material.onBeforeCompile = shader => {
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

          #ifndef FLAT_SHADED
            vec3 signs = sign(position);
            float radius = radius - 0.001;
            vec3 box = scale - vec3(radius);
            box = vec3(max(0.0, box.x), max(0.0, box.y), max(0.0, box.z));
            vec3 p = signs * box;
        
            transformed = signs * box + normalize(position) * radius;
            
            // re-compute normals for correct shadows and reflections
            objectNormal = all(equal(p, transformed)) ? normal : normalize(position); 
            transformedNormal = normalize(normalMatrix * objectNormal);
            // vNormal = transformedNormal;

            vNormal = (vec4(transformedNormal, 1.0) * r).xyz;
          #endif

          #ifdef FLAT_SHADED
            transformed *= scale.x;
          #endif
          // vec3 vPosition = applyQuaternionToVector( orientation, transformed );
          transformed = (vec4(transformed, 1.0) * r).xyz;
          // transformed = vPosition + offset;
          transformed = transformed + offset;
          
          `
        );
      };

      mesh = new THREE.Mesh( this.geometry, material );
      mesh.name = 'instanced mesh';
      object.add( mesh );
    }

    this.add(object);
  }

  update (delta = 0, now = 0, frame = 0) {
    super.update();
    this.object.rotation.x += delta * 0.1;

    this.shaderUniforms.time.value = now;

    // let qDelta = delta * 0.2;

    // this.tmpQ.set( this.moveQ.x * qDelta, this.moveQ.y * qDelta, this.moveQ.z * qDelta, 1 ).normalize();
    // for ( let i = 0, il = this.orientationAttribute.count; i < il; i++ ) {
    //   this.currentQ.fromArray( this.orientationAttribute.array, ( i * 4 ) );
    //   this.currentQ.multiply( this.tmpQ );
    //   this.orientationAttribute.setXYZW( i, this.currentQ.x, this.currentQ.y, this.currentQ.z, this.currentQ.w );
    // }
    // this.orientationAttribute.needsUpdate = true;
  }
};
