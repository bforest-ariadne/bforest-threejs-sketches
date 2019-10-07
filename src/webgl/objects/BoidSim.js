const { BirdGeometry } = require( '../geos/Bird.js' );
const glslify = require('glslify');
const path = require('path');

module.exports = class BoidSim {
  constructor( renderer, {
    separation = 20.0,
    alignment = 20.0,
    cohesion = 20.0,
    freedom = 0.75,
    predatorPosition = new THREE.Vector3(),
    centerPosition = new THREE.Vector3(),
    centerStrength = 1.0,
    width = 32,
    bounds = 800
  } = {} ) {
    this.predatorPosition = predatorPosition;
    this.centerPosition = centerPosition;
    this.centerStrength = centerStrength;
    const WIDTH = width;
    // const BIRDS = WIDTH * WIDTH;
    const BOUNDS = bounds;
    const BOUNDS_HALF = BOUNDS / 2;
    this.bounds = bounds;

    const initComputeRenderer = () => {
      this.gpuCompute = new THREE.GPUComputationRenderer( WIDTH, WIDTH, renderer );

      var dtPosition = this.gpuCompute.createTexture();
      var dtVelocity = this.gpuCompute.createTexture();
      fillPositionTexture( dtPosition );
      fillVelocityTexture( dtVelocity );

      const boidPositionShader = glslify(
        path.resolve(__dirname, '../shaders/boidPosition.frag')
      );
      const boidVelocityShader = glslify(
        path.resolve(__dirname, '../shaders/boidVelocity.frag')
      );

      this.velocityVariable = this.gpuCompute.addVariable(
        'textureVelocity',
        boidVelocityShader,
        dtVelocity
      );
      this.positionVariable = this.gpuCompute.addVariable(
        'texturePosition',
        boidPositionShader,
        dtPosition
      );

      this.gpuCompute.setVariableDependencies(
        this.velocityVariable,
        [ this.positionVariable, this.velocityVariable ]
      );
      this.gpuCompute.setVariableDependencies(
        this.positionVariable,
        [ this.positionVariable, this.velocityVariable ]
      );

      this.positionUniforms = this.positionVariable.material.uniforms;
      this.velocityUniforms = this.velocityVariable.material.uniforms;

      this.positionUniforms[ 'time' ] = { value: 0.0 };
      this.positionUniforms[ 'delta' ] = { value: 0.0 };
      this.velocityUniforms[ 'time' ] = { value: 1.0 };
      this.velocityUniforms[ 'delta' ] = { value: 0.0 };
      this.velocityUniforms[ 'testing' ] = { value: 1.0 };
      this.velocityUniforms[ 'separationDistance' ] = { value: 1.0 };
      this.velocityUniforms[ 'alignmentDistance' ] = { value: 1.0 };
      this.velocityUniforms[ 'cohesionDistance' ] = { value: 1.0 };
      this.velocityUniforms[ 'freedomFactor' ] = { value: 1.0 };
      this.velocityUniforms[ 'wind' ] = { type: 'v3v', value: new THREE.Vector3(0, 0, 0) };
      this.velocityUniforms[ 'predator' ] = { value: new THREE.Vector3() };
      this.velocityUniforms[ 'center' ] = { value: new THREE.Vector3() };
      this.velocityUniforms[ 'centerStrength' ] = { type: 'f', value: 1.0 };
      this.velocityUniforms[ 'scatter' ] = { type: 'f', value: 1.0 };
      this.velocityUniforms[ 'heightMap' ] = { type: 'uTex', value: new THREE.Texture() };
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
      var geometry = new BirdGeometry( WIDTH );

      // For Vertex and Fragment
      this.birdUniforms = {
        'color': { value: new THREE.Color( 0xff2200 ) },
        'texturePosition': { value: null },
        'textureVelocity': { value: null },
        'time': { value: 1.0 },
        'delta': { value: 0.0 }
      };

      // THREE.ShaderMaterial
      var material = new THREE.ShaderMaterial( {
        uniforms: this.birdUniforms,
        vertexShader: glslify(
          path.resolve(__dirname, '../shaders/bird.vert')
        ),
        fragmentShader: glslify(
          path.resolve(__dirname, '../shaders/bird.frag')
        ),
        side: THREE.DoubleSide

      } );

      var birdMesh = new THREE.Mesh( geometry, material );
      birdMesh.rotation.y = Math.PI / 2;
      birdMesh.matrixAutoUpdate = false;
      birdMesh.updateMatrix();

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
    this.velocityUniforms[ 'centerStrength' ].value = this.centerStrength;

    // mouseX = 10000;
    // mouseY = 10000;

    this.gpuCompute.compute();

    const positionTarget = this.gpuCompute.getCurrentRenderTarget( this.positionVariable );
    const velocityTarget = this.gpuCompute.getCurrentRenderTarget( this.positionVariable );

    this.birdUniforms[ 'texturePosition' ].value = positionTarget.texture;
    this.birdUniforms[ 'textureVelocity' ].value = velocityTarget.texture;
  }
};
