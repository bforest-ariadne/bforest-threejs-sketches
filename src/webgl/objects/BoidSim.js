const { BirdGeometry, createBirdInstanceGeometry } = require( '../geos/Bird.js' );
const glslify = require('glslify');
const path = require('path');
const defined = require('defined');

module.exports = class BoidSim {
  constructor( renderer, {
    separation = 1.0,
    alignment = 1.0,
    cohesion = 1.0,
    squashiness = 0.0,
    predatorPosition = new THREE.Vector3(),
    centerPosition = new THREE.Vector3(),
    centerStrength = 5,
    speedLimit = 9,
    width = 32,
    bounds = 800,
    geometry = null,
    material = null,
    useCustomDepth = false,
    useCustomDistance = false
  } = {} ) {
    this.predatorPosition = predatorPosition;
    this.centerPosition = centerPosition;
    this.centerStrength = centerStrength;
    const WIDTH = width;
    const BIRDS = WIDTH * WIDTH;
    const BOUNDS = bounds;
    const BOUNDS_HALF = BOUNDS / 2;
    this.bounds = bounds;

    // load shader chunks
    const birdShaderPars = glslify(path.resolve(__dirname, `../shaders/birdChunkPars.vert`));
    const birdShaderBegin = glslify(path.resolve(__dirname, `../shaders/birdChunkBegin.vert`));
    const boidShaderPars = glslify(path.resolve(__dirname, `../shaders/boidChunkPars.vert`));
    const boidShaderBegin = glslify(path.resolve(__dirname, `../shaders/boidChunkBegin.vert`));
    const boidFragShaderPars = glslify(path.resolve(__dirname, `../shaders/boidChunkPars.frag`));
    const boidFragShaderTest = glslify(path.resolve(__dirname, `../shaders/boidChunkTest.frag`));
    const shaderPars = geometry === null ? birdShaderPars : boidShaderPars;
    const shaderBegin = geometry === null ? birdShaderBegin : boidShaderBegin;

    const initComputeRenderer = () => {
      this.gpuCompute = new THREE.GPUComputationRenderer( WIDTH, WIDTH, renderer );

      var dtPosition = this.gpuCompute.createTexture();
      var dtVelocity = this.gpuCompute.createTexture();
      fillPositionTexture( dtPosition );
      fillVelocityTexture( dtVelocity );

      this.velocityVariable = this.gpuCompute.addVariable( 'textureVelocity', glslify(
        path.resolve(__dirname, '../shaders/boidVelocity.frag')
      ), dtVelocity );
      this.positionVariable = this.gpuCompute.addVariable( 'texturePosition', glslify(
        path.resolve(__dirname, '../shaders/boidPosition.frag')
      ), dtPosition );

      this.gpuCompute.setVariableDependencies( this.velocityVariable, [ this.positionVariable, this.velocityVariable ] );
      this.gpuCompute.setVariableDependencies( this.positionVariable, [ this.positionVariable, this.velocityVariable ] );

      this.positionUniforms = this.positionVariable.material.uniforms;
      this.velocityUniforms = this.velocityVariable.material.uniforms;

      this.positionUniforms[ 'time' ] = { value: 0.0 };
      this.positionUniforms[ 'delta' ] = { value: 0.0 };
      this.velocityUniforms[ 'time' ] = { value: 1.0 };
      this.velocityUniforms[ 'delta' ] = { value: 0.0 };
      this.velocityUniforms[ 'testing' ] = { value: 1.0 };
      this.velocityUniforms[ 'separationDistance' ] = { value: separation, type: 'f', min: 0, max: 40 };
      this.velocityUniforms[ 'alignmentDistance' ] = { value: alignment, type: 'f', min: 0, max: 40 };
      this.velocityUniforms[ 'cohesionDistance' ] = { value: cohesion, type: 'f', min: 0, max: 40 };
      this.velocityUniforms[ 'predator' ] = { value: this.predatorPosition, type: 'v3' };
      this.velocityUniforms[ 'center' ] = { value: this.centerPosition, type: 'v3' };
      this.velocityUniforms[ 'centerStrength' ] = { value: this.centerStrength, type: 'f', min: 0, max: 100 };
      this.velocityUniforms[ 'speedLimit' ] = { value: speedLimit, type: 'f', min: 0, max: 100 };
      this.velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed( 2 );

      this.velocityVariable.wrapS = THREE.RepeatWrapping;
      this.velocityVariable.wrapT = THREE.RepeatWrapping;
      this.positionVariable.wrapS = THREE.RepeatWrapping;
      this.positionVariable.wrapT = THREE.RepeatWrapping;

      var error = this.gpuCompute.init();
      if ( error !== null ) {
        console.error( error );
      }
    };

    const initBirds = () => {
      // var geometry = new BirdGeometry( BIRDS );
      geometry = geometry === null ? createBirdInstanceGeometry( BIRDS ) : geometry;

      if ( !defined( geometry.isInstancedBufferGeometry, false ) ) {
        const referencesAttribute = createReferencesAttribute( BIRDS, geometry );

        let instanceGeo = new THREE.InstancedBufferGeometry();
        if ( geometry.index) instanceGeo.index = geometry.index;
        instanceGeo.attributes = geometry.attributes;
        geometry.addAttribute( 'reference', referencesAttribute );
        geometry = instanceGeo;
      }

      // For Vertex and Fragment
      this.birdUniforms = {
        'color': { value: new THREE.Color( 0xff2200 ), type: 'v3' },
        'texturePosition': { value: null, type: 't' },
        'textureVelocity': { value: null, type: 't' },
        'time': { value: 1.0 },
        'delta': { value: 0.0 },
        'squashiness': { value: 0.0, type: 'f', min: 0, max: 1 }
      };

      // THREE.ShaderMaterial
      var birdMat = new THREE.ShaderMaterial( {
        uniforms: this.birdUniforms,
        vertexShader: glslify(
          path.resolve(__dirname, '../shaders/bird.vert')
        ),
        fragmentShader: glslify(
          path.resolve(__dirname, '../shaders/bird.frag')
        ),
        side: THREE.DoubleSide

      } );

      var birdMesh = new THREE.Mesh( geometry, birdMat );
      // birdMesh.rotation.y = Math.PI / 2;
      birdMesh.matrixAutoUpdate = true;
      birdMesh.updateMatrix();

      if ( material !== null ) {
        birdMat = material;

        const previousOnBeforeCompile = birdMat.onBeforeCompile;

        birdMat.onBeforeCompile = ( shader, renderer ) => {
          previousOnBeforeCompile( shader, renderer );

          Object.assign( shader.uniforms, this.birdUniforms );
          shader.vertexShader = shaderPars + shader.vertexShader;

          shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`, shaderBegin );

          shader.fragmentShader = boidFragShaderPars + shader.fragmentShader;

          shader.fragmentShader = shader.fragmentShader.replace(
            `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
            boidFragShaderTest
          );
        };

        birdMesh = new THREE.Mesh( geometry, birdMat );
        // birdMesh.rotation.y = Math.PI / 2;
        birdMesh.matrixAutoUpdate = true;
        birdMesh.frustumCulled = false;
        birdMesh.updateMatrix();

        if ( useCustomDepth ) {
        // custom depth material - required for instanced shadows
          var customDepthMaterial = new THREE.MeshDepthMaterial();
          customDepthMaterial.onBeforeCompile = ( shader, renderer ) => {
            birdMat.onBeforeCompile( shader, renderer );
            shader.vertexShader = `
          #define MESH_DEPTH_SHADER
          ` + shader.vertexShader;
          };
          customDepthMaterial.depthPacking = THREE.RGBADepthPacking;
          birdMesh.customDepthMaterial = customDepthMaterial;
        }

        if ( useCustomDistance ) {
          // custom distance material - required for instanced pointlight shadows
          const customDistanceMaterial = new THREE.MeshDistanceMaterial();
          customDistanceMaterial.onBeforeCompile = ( shader, renderer ) => {
            birdMat.onBeforeCompile( shader, renderer );
            shader.vertexShader = `
         #define MESH_DEPTH_SHADER
         ` + shader.vertexShader;
          };
          customDistanceMaterial.depthPacking = THREE.RGBADepthPacking;
          birdMesh.customDistanceMaterial = customDistanceMaterial;
        }

        birdMesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
          material.onBeforeCompile = birdMat.onBeforeCompile;
          material.side = birdMat.side;
        };
      }

      // scene.add( birdMesh );
      this.birdMesh = birdMesh;
      this.birdMesh.name = 'birdMesh';
    };

    function fillPositionTexture( texture ) {
      var theArray = texture.image.data;

      for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
        var x = Math.random() * BOUNDS - BOUNDS_HALF;
        var y = Math.random() * BOUNDS - BOUNDS_HALF;
        var z = Math.random() * BOUNDS - BOUNDS_HALF;

        theArray[ k + 0 ] = x;
        theArray[ k + 1 ] = y;
        theArray[ k + 2 ] = z;
        theArray[ k + 3 ] = 1;
      }
    }

    function fillVelocityTexture( texture ) {
      var theArray = texture.image.data;

      for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
        var x = Math.random() - 0.5;
        var y = Math.random() - 0.5;
        var z = Math.random() - 0.5;

        theArray[ k + 0 ] = x * 10;
        theArray[ k + 1 ] = y * 10;
        theArray[ k + 2 ] = z * 10;
        theArray[ k + 3 ] = 1;
      }
    }

    function createReferencesAttribute( birds ) {
      let WIDTH = Math.sqrt( birds );
      var references = new Float32Array( birds * 2 );
    
      for ( let i = 0; i < birds; i++ ) {
        var x = ( i % WIDTH ) / WIDTH;
        var y = ~~( i / WIDTH ) / WIDTH;
        references[ i * 2 ] = x;
        references[ i * 2 + 1 ] = y;
      }
    
      return new THREE.InstancedBufferAttribute( references, 2 );
    }

    initComputeRenderer();
    initBirds();
  }

  update( delta, now, frameCount ) {
    this.positionUniforms[ 'time' ].value = now;
    this.positionUniforms[ 'delta' ].value = delta;
    this.velocityUniforms[ 'time' ].value = now;
    this.velocityUniforms[ 'delta' ].value = delta;
    this.birdUniforms[ 'time' ].value = now;
    this.birdUniforms[ 'delta' ].value = delta;

    // this.velocityUniforms[ "predator" ].value.set( 0.5 * mouseX / windowHalfX, - 0.5 * mouseY / windowHalfY, 0 );

    this.velocityUniforms[ 'predator' ].value.copy( this.predatorPosition );
    this.velocityUniforms[ 'center' ].value.copy( this.centerPosition );

    // mouseX = 10000;
    // mouseY = 10000;

    this.gpuCompute.compute();

    this.birdUniforms[ 'texturePosition' ].value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
    this.birdUniforms[ 'textureVelocity' ].value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;
  }
};
