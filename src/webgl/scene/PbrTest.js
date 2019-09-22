const SketchScene = require('./SketchScene');
const { webgl, assets } = require('../../context');
const postProcessSetup = require('../postProcessing/basicTonemap');
const { createIronMaterial, ironAssets } = require('../materials/dammagedIron')
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

    const bufferGeometry = new THREE.SphereBufferGeometry(1, 4, 4);

    const positions = [];
    const orientations = [];
    const scales = [];
    let vector = new THREE.Vector4();
    let vector3 = new THREE.Vector3();
    let quat = new THREE.Quaternion();
    let euler = new THREE.Euler();
    let x, y, z, w;
    const cell = 1;
    const grid = 5;

    for (let i = 0; i < this.N; ++i) {
      if ( this.useBufferGeo ) {
        // offsets

        vector3.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        vector3.multiplyScalar(Math.random() * 10);
        positions.push( vector3.x, vector3.y, vector3.z );

        // orientations
        // x = Math.random() * 2;
        // y = Math.random() * 2;
        // z = Math.random() * 2;
        // w = Math.random() * 2;
        // vector.set( x, y, z, w );
        euler.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        quat.setFromEuler( euler );
        orientations.push( quat.x, quat.y, quat.z, quat.w );

        x = y = z = Math.random();
        scales.push( x, y, z );

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

      this.geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array(positions), 3 ) );
      this.geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array(orientations), 4 ).setDynamic( true ) );
      this.geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array(scales), 3 ) );

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
        vec3 applyQuaternionToVector( vec4 q, vec3 v ){
          return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
        }
        ` + shader.vertexShader;
        
        shader.vertexShader = shader.vertexShader.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
      
          // instanced
          transformed *= scale.x;
          vec3 vPosition = applyQuaternionToVector( orientation, transformed );
          transformed = vPosition + offset;
          
          `
        );
      };

      mesh = new THREE.Mesh( this.geometry, material );
      mesh.name = 'instanced mesh';
      object.add( mesh );
    }

    this.add(object);
  }

  update (dt = 0) {
    super.update();
    this.object.rotation.x += dt * 0.1;
  }
};
